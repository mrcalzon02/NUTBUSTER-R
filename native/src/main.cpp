#include "core.hpp"
#include "mine.hpp"
#include <ctime>
#include <cstdint>
#include <SDL3/SDL.h>
#include <array>
#include <algorithm>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <map>
#include <sstream>
#include <stdexcept>
#include <string>
#include <string_view>
#include <vector>
#include <utility>
#ifdef _WIN32
#ifndef NOMINMAX
#define NOMINMAX
#endif
#include <windows.h>
#endif

namespace fs=std::filesystem;
namespace {
constexpr int WIDTH=1024,HEIGHT=768;
constexpr std::array<const char*,19> NUTS={
  "peanut","walnut","almond","cashew","hazelnut","pistachio","gold-acorn",
  "beechnut","brazil-nut","candlenut","chestnut","coconut","ginkgo-nut",
  "hickory-nut","macadamia","pecan","pili-nut","pine-nut","tiger-nut"};
constexpr std::array<const char*,17> FINDS={
  "r2c1","r2c2","r2c4","r2c5","r2c3",
  "r2c6","r3c1","r3c2","r3c5","r4c2","r4c3","r3c4",
  "r3c3","r3c6","r4c4","r4c5","r4c6"};
void fill(SDL_Renderer* r,float x,float y,float w,float h,SDL_Color c){
  SDL_SetRenderDrawColor(r,c.r,c.g,c.b,c.a);
  SDL_FRect box{x,y,w,h};SDL_RenderFillRect(r,&box);
}
void label(SDL_Renderer* r,float x,float y,const std::string& str,int scale=2){
  SDL_SetRenderDrawColor(r,255,227,173,255);
  SDL_SetRenderScale(r,float(scale),float(scale));
  SDL_RenderDebugText(r,x/scale,y/scale,str.c_str());
  SDL_SetRenderScale(r,1.0f,1.0f);
}
void button(SDL_Renderer* r,int x,int y,int w,int h,const std::string& txt){
  fill(r,x,y,w,h,{110,58,78,255});
  fill(r,x+3,y+3,w-6,h-6,{64,31,58,255});
  label(r,float(x+16),float(y+h/2-8),txt,2);
}
bool within(float x,float y,float bx,float by,float w,float h){
  return x>=bx&&x<bx+w&&y>=by&&y<by+h;
}
// Both paths are on one volume. The existing committed draft is never
// truncated or deleted before the fully validated successor is installed.
bool replaceDraftFile(const fs::path& stage,const fs::path& destination){
#ifdef _WIN32
  return MoveFileExW(stage.c_str(),destination.c_str(),
    MOVEFILE_REPLACE_EXISTING|MOVEFILE_WRITE_THROUGH)!=0;
#else
  std::error_code error;
  fs::rename(stage,destination,error);
  return !error;
#endif
}
uint32_t h32(uint32_t x){x^=x>>16;x*=0x7feb352dU;x^=x>>15;x*=0x846ca68bU;return x^(x>>16);}
int roll(uint32_t seed,int x,int y,uint32_t salt){
  return int(h32(seed ^ (uint32_t(x+1)*15485863U) ^ (uint32_t(y+1)*32452843U) ^salt)%100);
}
// Native gem purchases require confirmation; starting hold stock is zero.
struct HoldStock {
  int butter=0,jam=0;
  int count(nut::HoldKind kind)const{
    return kind==nut::HoldKind::Butter?butter:kind==nut::HoldKind::Jam?jam:0;
  }
  bool use(nut::Board& board,nut::HoldKind kind,int target){
    int* quantity=kind==nut::HoldKind::Butter?&butter:
                  kind==nut::HoldKind::Jam?&jam:nullptr;
    if(!quantity||*quantity<=0||!board.applyHold(kind,target))return false;
    --*quantity;return true;
  }
  bool read(std::istream& input,bool eof=true){
    std::string tag;long long b=-1,j=-1;
    if(!(input>>tag>>b>>j)||tag!="HOLD_STOCK_V1"||
       b<0||j<0||b>999999||j>999999)return false;
    if(eof){input>>std::ws;if(input.peek()!=std::char_traits<char>::eof())return false;}
    butter=int(b);jam=int(j);return true;
  }
  bool write(std::ostream& output)const{
    if(butter<0||jam<0||butter>999999||jam>999999)return false;
    output<<"HOLD_STOCK_V1 "<<butter<<" "<<jam<<"\n";
    return bool(output);
  }
};
struct GemWallet {
  static constexpr int max=999999999;
  int gems=25; // mobile source starts with 25, not free booster stock
  void win(){gems=std::min(max,gems+10);} // mobile awards 10 per win
  bool buy(HoldStock& stock,nut::HoldKind kind){
    const int cost=kind==nut::HoldKind::Butter?15:kind==nut::HoldKind::Jam?30:0;
    int* count=kind==nut::HoldKind::Butter?&stock.butter:
               kind==nut::HoldKind::Jam?&stock.jam:nullptr;
    if(!count||!cost||gems<cost||*count>=999999)return false;
    gems-=cost;++*count;return true;
  }
  bool read(std::istream& in,bool eof=true){
    std::string tag;long long value=-1;
    if(!(in>>tag>>value)||tag!="GEM_WALLET_V1"||value<0||value>max)return false;
    if(eof){in>>std::ws;if(in.peek()!=std::char_traits<char>::eof())return false;}
    gems=int(value);return true;
  }
  bool write(std::ostream& out)const{
    if(gems<0||gems>max)return false;
    out<<"GEM_WALLET_V1 "<<gems<<"\n";return bool(out);
  }
};
// Native's JSON share format is the same V1 fields and tile semantics used by
// web/game.js. This bounded parser deliberately rejects unknown/duplicate keys,
// escaped keys, floats, negative tiles, and trailing content instead of accepting
// a permissive or partially interpreted custom board.
struct EditorShareJson {
  int version=-1,width=-1,height=-1;
  std::vector<int> tiles;
  std::string_view data;
  size_t at=0;
  void whitespace(){
    while(at<data.size()&&(data[at]==' '||data[at]=='\n'||
          data[at]=='\r'||data[at]=='\t'))++at;
  }
  bool take(char c){whitespace();if(at>=data.size()||data[at]!=c)return false;++at;return true;}
  bool key(std::string& name){
    if(!take('"'))return false;
    while(at<data.size()){
      const unsigned char c=static_cast<unsigned char>(data[at++]);
      if(c=='"')return !name.empty();
      if(c=='\\'||c<0x20||c>0x7e||name.size()>=16)return false;
      name.push_back(char(c));
    }
    return false;
  }
  bool number(int& value){
    whitespace();
    if(at>=data.size()||data[at]<'0'||data[at]>'9')return false;
    if(data[at]=='0'&&at+1<data.size()&&data[at+1]>='0'&&data[at+1]<='9')
      return false; // JSON does not permit leading-zero integer tokens.
    value=0;
    while(at<data.size()&&data[at]>='0'&&data[at]<='9'){
      if(value>100000)return false; // Bound integer size before arithmetic.
      value=value*10+(data[at++]-'0');
    }
    return value<=1000000;
  }
  bool tileArray(){
    if(!take('['))return false;
    if(take(']'))return true;
    while(true){
      whitespace();
      int tile=-1;
      if(data.substr(at,4)=="null")at+=4;
      else if(!number(tile))return false;
      if(tiles.size()>=256)return false;
      tiles.push_back(tile);
      if(take(']'))return true;
      if(!take(','))return false;
    }
  }
  bool parse(std::string_view input){
    data=input;at=0;
    if(!take('{')||take('}'))return false;
    std::array<bool,4> seen{false,false,false,false};
    while(true){
      std::string name;
      if(!key(name)||!take(':'))return false;
      int field=name=="version"?0:name=="width"?1:name=="height"?2:
        name=="tiles"?3:-1;
      if(field<0||seen[size_t(field)])return false;
      seen[size_t(field)]=true;
      if(field==3){if(!tileArray())return false;}
      else {
        int value=0;
        if(!number(value))return false;
        if(field==0)version=value;
        else if(field==1)width=value;
        else height=value;
      }
      if(take('}'))break;
      if(!take(','))return false;
    }
    whitespace();
    return at==data.size()&&
      std::all_of(seen.begin(),seen.end(),[](bool present){return present;});
  }
};
struct Game {
  nut::Board board{1,7919};
  nut::Board editorBoard{1,7919}; // Isolated real campaign engine board for editor.
  nut::Board playtestBoard{1,7919}; // Disposable clone, never saved or rewarded.
  enum class Scene{Menu,Campaign,Board,Editor,Playtest,Shop,Mine,Won,Lost};
  Scene scene=Scene::Menu;
  std::map<std::string,SDL_Texture*> images;
  int unlocked=1,selectedLevel=1,selected=-1,down=-1;
  nut::Mine mine{};
  HoldStock stock{};
  GemWallet wallet{};
  bool levelEditorUnlocked=false; // Earned by stage-1000 victory, not by reachability.
  int editorNut=0;
  bool editorDraftLoaded=false;
  std::string editorDraftStatus="NOT SAVED";
  static constexpr uint64_t EDITOR_AUTOSAVE_IDLE_MS=900;
  bool editorDirty=false;
  uint64_t editorClockMs=0,editorLastEditMs=0;
  struct EditorStroke{int index,before,after;};
  std::vector<EditorStroke> editorUndo,editorRedo; // Session-local; never mixed with campaign saves.
  int pendingPurchase=0; // confirmation required: 1 Butter, 2 Jam
  std::string shopNotice;
  enum class HoldMode{Swap,Butter,Jam};
  HoldMode holdMode=HoldMode::Swap;
  enum class MineTab {Dig,Equipment,Workshop};
  enum class MineMode {Dig,Scan,Blast,Lens,Collect};
  MineTab mineTab=MineTab::Dig;
  MineMode mineMode=MineMode::Dig;
  fs::path savePath;
  bool smoke=false,quitRequested=false;
  bool loadFrom(std::istream& file){
    std::string signature;int level=1;
    if(!(file>>signature>>level))return false;
    if(signature=="NUTBUSTER_NATIVE_PREVIEW_V1"){
      unlocked=std::clamp(level,1,1000);stock=HoldStock{};wallet=GemWallet{};
      levelEditorUnlocked=false;return true;
    }
    if(signature!="NUTBUSTER_NATIVE_PREVIEW_V2"&&
       signature!="NUTBUSTER_NATIVE_PREVIEW_V3"&&
       signature!="NUTBUSTER_NATIVE_PREVIEW_V4"&&
       signature!="NUTBUSTER_NATIVE_PREVIEW_V5")return false;
    nut::Mine loaded;
    if(!loaded.load(file))return false;
    HoldStock loadedStock;
    const bool v5=signature=="NUTBUSTER_NATIVE_PREVIEW_V5";
    const bool withWallet=v5||signature=="NUTBUSTER_NATIVE_PREVIEW_V4";
    if((withWallet||signature=="NUTBUSTER_NATIVE_PREVIEW_V3")&&
       !loadedStock.read(file,!withWallet))return false;
    GemWallet loadedWallet; // V1-V3 migrate with mobile's 25 starting gems
    if(withWallet&&!loadedWallet.read(file,!v5))return false;
    bool loadedEditor=false;
    if(v5){
      std::string tag;int earned=-1;
      if(!(file>>tag>>earned)||tag!="LEVEL_EDITOR_V1"||(earned!=0&&earned!=1))
        return false;
      file>>std::ws;
      if(file.peek()!=std::char_traits<char>::eof())return false;
      loadedEditor=earned==1;
    }
    // V1-V4 native saves lack explicit level-completion history. A reached
    // stage 1000 is not evidence of a win, so never migrate a false entitlement.
    mine=loaded;stock=loadedStock;wallet=loadedWallet;levelEditorUnlocked=loadedEditor;
    unlocked=std::clamp(level,1,1000);return true;
  }
  bool saveTo(std::ostream& file)const{
    file<<"NUTBUSTER_NATIVE_PREVIEW_V5 "<<unlocked<<"\n";
    if(!file||!mine.save(file)||!stock.write(file)||!wallet.write(file))return false;
    file<<"LEVEL_EDITOR_V1 "<<(levelEditorUnlocked?1:0)<<"\n";
    return bool(file);
  }
  void load(){
    if(savePath.empty())return;
    std::ifstream file(savePath);
    if(file&&!loadFrom(file))std::cerr<<"Invalid native preview progress file\n";
  }
  void save(){
    if(smoke||savePath.empty())return;
    std::ofstream file(savePath,std::ios::trunc);
    if(!file||!saveTo(file))std::cerr<<"Cannot persist native preview progress\n";
  }
  // A separate, versioned local draft never enters campaign progress V5.
  fs::path draftPath()const{return fs::path(savePath.string()+".custom-draft-v1");}
  bool saveEditorDraftTo(std::ostream& out)const{
    if(!levelEditorUnlocked)return false;
    const auto& b=editorBoard;
    out<<"NUTBUSTER_EDITOR_DRAFT_V1 "<<b.width()<<" "<<b.height()<<" "<<b.size()<<"\n";
    for(int i=0;i<b.size();++i){
      const int type=b.cell(i).exists()?b.tile(i):-1;
      if(b.cell(i).exists()&&(type<0||type>=19||type==12))return false;
      out<<type<<(i+1==b.size()?'\n':' ');
    }
    return bool(out);
  }
  bool loadEditorDraftFrom(std::istream& in){
    if(!levelEditorUnlocked)return false;
    const auto reject=[this](const char* reason){editorDraftStatus=reason;return false;};
    std::string format;int width=0,height=0,count=0;
    if(!(in>>format>>width>>height>>count)||format!="NUTBUSTER_EDITOR_DRAFT_V1")
      return reject("DRAFT REJECTED: INVALID FORMAT");
    nut::Board candidate(1,7919); // V1 inherits actual engine dimensions, void mask and objective
    if(width!=candidate.width()||height!=candidate.height()||count!=candidate.size())
      return reject("DRAFT REJECTED: INVALID BOARD DIMENSIONS");
    if(candidate.goal()<=0||candidate.moves()<=0)
      return reject("DRAFT REJECTED: MISSING ENGINE OBJECTIVE");
    std::vector<int> types(size_t(count),-2);
    for(int i=0;i<count;++i)if(!(in>>types[size_t(i)]))
      return reject("DRAFT REJECTED: INCOMPLETE TILES");
    in>>std::ws;
    if(in.peek()!=std::char_traits<char>::eof())
      return reject("DRAFT REJECTED: TRAILING DATA");
    if(std::all_of(types.begin(),types.end(),[](int type){return type==-1;}))
      return reject("DRAFT REJECTED: VOID-ONLY BOARD");
    for(int i=0;i<count;++i){
      const int type=types[size_t(i)];
      if(!candidate.cell(i).exists()){if(type!=-1)return reject("DRAFT REJECTED: VOID MASK");}
      else if(!candidate.paintCell(i,type))return reject("DRAFT REJECTED: INVALID NUT");
    }
    editorBoard=std::move(candidate); // all-or-nothing; never touch campaign board
    editorUndo.clear();editorRedo.clear(); // Loaded drafts start a fresh editing session.
    editorDirty=false; // Reload discards the pending autosave of the old draft.
    return true;
  }
  // A portable share file, not campaign progress, the automatic recovery file,
  // or the native whitespace V1 draft. Web uses null for engine void cells.
  fs::path editorSharePath()const{
    return savePath.parent_path()/"NUTBUSTER-custom-level-v1.json";
  }
  bool saveEditorJsonTo(std::ostream& out)const{
    std::ostringstream verifiedDraft;
    if(!saveEditorDraftTo(verifiedDraft))return false;
    const auto& b=editorBoard;
    out<<"{\"version\":1,\"width\":"<<b.width()<<",\"height\":"<<b.height()
       <<",\"tiles\":[";
    for(int i=0;i<b.size();++i){
      if(i)out<<',';
      if(!b.cell(i).exists())out<<"null";
      else out<<b.tile(i);
    }
    out<<"]}\n";
    return bool(out);
  }
  bool loadEditorJsonFrom(std::istream& in){
    if(!levelEditorUnlocked)return false;
    // Refuse unbounded files before building any in-memory board or mutating state.
    std::array<char,16385> bytes{};
    in.read(bytes.data(),std::streamsize(bytes.size()));
    const auto count=in.gcount();
    if(count<=0||count>16384||in.bad()){
      editorDraftStatus="JSON REJECTED: EMPTY OR TOO LARGE";return false;
    }
    EditorShareJson json;
    if(!json.parse(std::string_view(bytes.data(),size_t(count)))){
      editorDraftStatus="JSON REJECTED: INVALID V1 SCHEMA";return false;
    }
    if(json.version!=1){
      editorDraftStatus="JSON REJECTED: UNSUPPORTED VERSION";return false;
    }
    nut::Board expected(1,7919);
    if(json.width!=expected.width()||json.height!=expected.height()||
       json.tiles.size()!=size_t(expected.size())){
      editorDraftStatus="JSON REJECTED: INVALID BOARD DIMENSIONS";return false;
    }
    // The existing guarded V1 loader owns engine objective, void-mask, retired
    // nut and all-or-nothing board validation. Do not fork those game rules.
    std::ostringstream draft;
    draft<<"NUTBUSTER_EDITOR_DRAFT_V1 "<<json.width<<" "<<json.height<<" "
         <<json.tiles.size()<<"\n";
    for(size_t i=0;i<json.tiles.size();++i)
      draft<<json.tiles[i]<<(i+1==json.tiles.size()?'\n':' ');
    std::istringstream validated(draft.str());
    if(!loadEditorDraftFrom(validated))return false;
    markEditorEdited(); // Imported changes are pending until explicitly saved/auto-flushed.
    editorDraftStatus="IMPORTED JSON V1 - SAVE DRAFT";
    return true;
  }
  bool exportEditorJsonFile(const fs::path& target)const{
    if(!levelEditorUnlocked||smoke||savePath.empty()||target.empty())return false;
    const fs::path stage=fs::path(target.string()+".staging");
    {
      std::ofstream out(stage,std::ios::binary|std::ios::trunc);
      if(!out||!saveEditorJsonTo(out))return false;
      out.flush();if(!out)return false;
      out.close();if(!out)return false;
    }
    Game check;check.levelEditorUnlocked=true;
    std::ifstream input(stage,std::ios::binary);
    if(!input||!check.loadEditorJsonFrom(input))return false;
    // Windows MoveFileEx cannot replace a stage still held by our own reader.
    input.close();
    return replaceDraftFile(stage,target); // Do not truncate a previous good share.
  }
  bool importEditorJsonFile(const fs::path& source){
    if(!levelEditorUnlocked||smoke||savePath.empty()||source.empty())return false;
    // Preserve unsaved work as a native draft before replacing its in-memory board.
    if(editorDirty&&!flushEditorAutosave())return false;
    std::ifstream in(source,std::ios::binary);
    if(!in){editorDraftStatus="JSON IMPORT FAILED: FILE MISSING";return false;}
    return loadEditorJsonFrom(in);
  }
  fs::path draftStagePath()const{return fs::path(draftPath().string()+".staging");}
  fs::path draftBackupPath()const{return fs::path(draftPath().string()+".backup");}
  bool validDraftFile(const fs::path& path)const{
    std::ifstream in(path,std::ios::binary);
    if(!in)return false;
    Game check;
    check.levelEditorUnlocked=true;
    return check.loadEditorDraftFrom(in);
  }
  bool loadEditorDraft(){
    if(!levelEditorUnlocked||savePath.empty())return false;
    std::ifstream in(draftPath(),std::ios::binary);
    const bool primaryPresent=bool(in);
    if(in&&loadEditorDraftFrom(in)){
      editorDraftStatus="SAVED V1 DRAFT LOADED";
      return true;
    }
    std::ifstream backup(draftBackupPath(),std::ios::binary);
    const bool backupPresent=bool(backup);
    if(backup&&loadEditorDraftFrom(backup)){
      editorDraftStatus="RECOVERED LAST GOOD DRAFT - SAVE TO RESTORE";
      return true;
    }
    editorDraftStatus=primaryPresent||backupPresent?
      "DRAFT RECOVERY FAILED":"NO SAVED DRAFT";
    return false;
  }
  // Test-only interruption seam: stop after staging but before any committed
  // file changes. Production UI always calls the default non-injected path.
  bool saveEditorDraft(bool interruptBeforeReplace=false){
    if(!levelEditorUnlocked||smoke||savePath.empty())return false;
    const fs::path primary=draftPath(),stage=draftStagePath();
    {
      std::ofstream out(stage,std::ios::binary|std::ios::trunc);
      if(!out||!saveEditorDraftTo(out))return false;
      out.flush();
      if(!out)return false;
      out.close();
      if(!out)return false;
    }
    if(!validDraftFile(stage))return false;
    if(interruptBeforeReplace)return false;
    std::error_code error;
    if(fs::exists(primary,error)&&!error&&validDraftFile(primary)){
      // Copy current valid primary to a staged backup; an interrupted
      // backup rotation also leaves the previous last-good backup intact.
      const fs::path backup=draftBackupPath();
      const fs::path backupStage=fs::path(backup.string()+".staging");
      if(!fs::copy_file(primary,backupStage,fs::copy_options::overwrite_existing,error)||
         error||!validDraftFile(backupStage)||
         !replaceDraftFile(backupStage,backup))return false;
    }else if(error)return false;
    if(!replaceDraftFile(stage,primary))return false;
    editorDraftStatus=playableEditorDraft()?"SAVED V1 DRAFT":
      "SAVED V1 DRAFT - PLAYTEST NOT READY";
    editorDirty=false; // Only the successfully installed, validated draft is clean.
    return true;
  }
  void markEditorEdited(){
    editorDirty=true;
    editorLastEditMs=editorClockMs;
    editorDraftStatus="UNSAVED EDITS";
  }
  bool flushEditorAutosave(){
    if(!editorDirty)return true; // No initial or repeated no-op writes.
    if(!saveEditorDraft()){
      editorDraftStatus="DRAFT AUTOSAVE FAILED - RETRYING";
      return false; // Preserve dirty state for bounded retry or manual Save.
    }
    editorDraftStatus="AUTO"+editorDraftStatus;
    return true;
  }
  // Production passes SDL's monotonic ticks; tests pass explicit timestamps.
  // Failed attempts back off instead of hammering an unavailable disk at 60 FPS.
  void pollEditorAutosave(uint64_t nowMs){
    editorClockMs=nowMs;
    if(!editorDirty||nowMs<editorLastEditMs||
       nowMs-editorLastEditMs<EDITOR_AUTOSAVE_IDLE_MS)return;
    if(!flushEditorAutosave())editorLastEditMs=nowMs;
  }
  void onCampaignWin(){
    wallet.win();
    unlocked=std::max(unlocked,std::min(1000,selectedLevel+1));
    if(selectedLevel==1000)levelEditorUnlocked=true;
    save();scene=Scene::Won;
  }
  void startLevel() {
    board.reset(selectedLevel,uint32_t(selectedLevel)*7919U);
    selected=-1;holdMode=HoldMode::Swap;scene=Scene::Board;
  }
  bool openEditor(){
    if(!levelEditorUnlocked)return false;
    if(!editorDraftLoaded){editorDraftLoaded=true;loadEditorDraft();}
    selected=-1;scene=Scene::Editor;return true;
  }
  bool paintEditorCell(int i,int type){
    if(!levelEditorUnlocked||scene!=Scene::Editor||i<0||i>=editorBoard.size()||
       !editorBoard.cell(i).exists())return false;
    const int before=editorBoard.tile(i);
    if(before==type||!editorBoard.paintCell(i,type))return false;
    editorUndo.push_back({i,before,type});
    if(editorUndo.size()>100)editorUndo.erase(editorUndo.begin());
    editorRedo.clear();selected=i;markEditorEdited();
    return true;
  }
  bool stepEditorHistory(bool undo){
    if(!levelEditorUnlocked||scene!=Scene::Editor)return false;
    auto& from=undo?editorUndo:editorRedo;
    auto& to=undo?editorRedo:editorUndo;
    if(from.empty())return false;
    const EditorStroke stroke=from.back();
    if(stroke.index<0||stroke.index>=editorBoard.size()||
       !editorBoard.cell(stroke.index).exists()||
       editorBoard.tile(stroke.index)!=(undo?stroke.after:stroke.before)||
       !editorBoard.paintCell(stroke.index,undo?stroke.before:stroke.after))return false;
    from.pop_back();to.push_back(stroke);
    selected=stroke.index;markEditorEdited();
    return true;
  }
  // Validate a real scoring move using the same native Board::swap implementation.
  bool playableEditorDraft()const{
    if(editorBoard.pendingMatches())return false;
    for(int a=0;a<editorBoard.size();++a)for(int b:{a+1,a+editorBoard.width()}){
      if(b>=editorBoard.size())continue;
      nut::Board candidate=editorBoard;
      const auto move=candidate.swap(a,b);
      if(move.valid&&move.cleared>0)return true;
    }
    return false;
  }
  bool startEditorPlay(){
    if(!levelEditorUnlocked||scene!=Scene::Editor)return false;
    if(!playableEditorDraft()){
      editorDraftStatus="DRAFT NOT PLAYABLE: FIX MATCHES/MOVES";return false;
    }
    if(editorDirty&&!smoke&&!savePath.empty()&&!flushEditorAutosave())return false;
    playtestBoard=editorBoard;selected=-1;holdMode=HoldMode::Swap;
    scene=Scene::Playtest;return true;
  }
  void makeMine(){
    const std::time_t now=std::time(nullptr);
    std::tm today{};
#if defined(_WIN32)
    localtime_s(&today,&now);
#else
    localtime_r(&now,&today);
#endif
    const int dayValue=(today.tm_year+1900)*10000+(today.tm_mon+1)*100+today.tm_mday;
    mine.nextDay(dayValue);
    mineTab=MineTab::Dig;
    scene=Scene::Mine;
  }
  bool loadArt(SDL_Renderer* r,const fs::path& root){
    if(!texture(r,root,"maps/campaign-overview"))return false;
    for(const char* nut:NUTS){
      std::string key=std::string("nuts/")+nut;
      if(!texture(r,root,key))return false;
    }
    if(!texture(r,root,"hold/jam"))return false;
    for(int row=1;row<=4;++row)for(int col=1;col<=6;++col){
      std::string key="mine/r"+std::to_string(row)+"c"+std::to_string(col);
      if(!texture(r,root,key))return false;
    }
    for(const std::string& track:{"pickaxe","gloves"}){
      for(int tier=0;tier<40;++tier){
        std::string key="gear/"+track+"-"+(tier<10?"0":"")+std::to_string(tier);
        if(!texture(r,root,key))return false;
      }
    }
    for(const std::string& key:{"blocker/ice-1","blocker/ice-2","blocker/lock",
       "blocker/chain-1","blocker/chain-2","blocker/chest","blocker/crate","blocker/rock",
       "overlay/sticky-butter","overlay/bomb"}){
      if(!textureRGBA(r,root,key))return false;
    }
    return true;
  }
  bool textureRGBA(SDL_Renderer* r,const fs::path& root,const std::string& key){
    const fs::path file=root/(key+".rgba");
    std::ifstream input(file,std::ios::binary);
    uint32_t dims[2]{};
    if(!input.read(reinterpret_cast<char*>(dims),sizeof(dims)))return false;
    const uint64_t pixels=uint64_t(dims[0])*uint64_t(dims[1])*4U;
    if(dims[0]==0||dims[1]==0||dims[0]>4096||dims[1]>4096||
       fs::file_size(file)!=pixels+sizeof(dims))return false;
    std::vector<uint8_t> data(static_cast<size_t>(pixels));
    if(!input.read(reinterpret_cast<char*>(data.data()),std::streamsize(pixels)))return false;
    SDL_Surface* surface=SDL_CreateSurfaceFrom(int(dims[0]),int(dims[1]),
        SDL_PIXELFORMAT_RGBA32,data.data(),int(dims[0])*4);
    if(!surface)return false;
    SDL_Texture* texture=SDL_CreateTextureFromSurface(r,surface);
    SDL_DestroySurface(surface);
    if(!texture)return false;
    images[key]=texture;return true;
  }
  bool texture(SDL_Renderer* r,const fs::path& root,const std::string& key){
    auto path=root/(key+".bmp");
    SDL_Surface* s=SDL_LoadBMP(path.string().c_str());
    if(!s){std::cerr<<"Missing approved native sprite "<<path<<": "<<SDL_GetError()<<"\n";return false;}
    SDL_Texture* t=SDL_CreateTextureFromSurface(r,s);
    SDL_DestroySurface(s);
    if(!t){std::cerr<<"Cannot load "<<path<<": "<<SDL_GetError()<<"\n";return false;}
    images[key]=t;return true;
  }
  void sprite(SDL_Renderer* r,const std::string& name,float x,float y,float w,float h){
    auto it=images.find(name);
    if(it==images.end())return;
    SDL_FRect dst{x,y,w,h};
    SDL_RenderTexture(r,it->second,nullptr,&dst);
  }
  int cellAt(float x,float y,const nut::Board& canvas)const {
    int tile=std::min(74,490/canvas.height());
    int ox=(WIDTH-tile*canvas.width())/2,oy=215;
    if(!within(x,y,float(ox),float(oy),float(tile*canvas.width()),float(tile*canvas.height())))return -1;
    return int((y-oy)/tile)*canvas.width()+int((x-ox)/tile);
  }
  int cellAt(float x,float y)const{return cellAt(x,y,board);}
  void click(float x,float y){
    if(scene==Scene::Menu){
      if(within(x,y,324,238,376,66)){selectedLevel=std::clamp(selectedLevel,1,unlocked);scene=Scene::Campaign;}
      else if(within(x,y,324,332,376,66)&&unlocked>500)makeMine();
      else if(within(x,y,324,426,376,66))openEditor();
      else if(within(x,y,324,520,376,66))quitRequested=true;
      return;
    }
    if(scene==Scene::Shop){
      if(within(x,y,24,20,145,46)){
        pendingPurchase=0;shopNotice.clear();scene=Scene::Board;return;
      }
      if(within(x,y,190,270,300,85)){
        pendingPurchase=1;shopNotice="BUTTER: 15 GEMS";return;
      }
      if(within(x,y,534,270,300,85)){
        pendingPurchase=2;shopNotice="JAM: 30 GEMS";return;
      }
      if(within(x,y,320,480,384,62)){
        if(!pendingPurchase)return;
        const auto kind=pendingPurchase==1?nut::HoldKind::Butter:nut::HoldKind::Jam;
        const bool ok=wallet.buy(stock,kind);
        shopNotice=ok?"ONE HOLD PURCHASED":"INSUFFICIENT GEMS OR STOCK FULL";
        pendingPurchase=0;if(ok)save();return;
      }
      if(within(x,y,320,558,384,58)){
        pendingPurchase=0;shopNotice="PURCHASE CANCELLED";return;
      }
      return;
    }
    if(scene==Scene::Won||scene==Scene::Lost){
      if(within(x,y,320,350,384,68)) {
        if(scene==Scene::Won){selectedLevel=std::min(1000,std::min(unlocked,selectedLevel+1));startLevel();}
        else scene=Scene::Campaign;
      }
      return;
    }
    if(within(x,y,24,20,145,46)) {
      if(scene==Scene::Editor&&!flushEditorAutosave())return;
      scene=scene==Scene::Playtest?Scene::Editor:Scene::Menu;
      selected=-1;return;
    }
    if(scene==Scene::Mine){
      if(within(x,y,175,111,180,42)){mineTab=MineTab::Dig;return;}
      if(within(x,y,365,111,180,42)){mineTab=MineTab::Equipment;return;}
      if(within(x,y,555,111,180,42)){mineTab=MineTab::Workshop;return;}
      bool changed=false;
      if(mineTab==MineTab::Equipment){
        const std::array<std::string,5> upgrades{{"pickaxe","gloves","map","cart","refinery"}};
        for(size_t i=0;i<upgrades.size();++i){
          if(within(x,y,180,float(215+i*77),664,60))
            changed=mine.upgrade(upgrades[i])||changed;
        }
      } else if(mineTab==MineTab::Workshop){
        if(within(x,y,180,215,664,62))changed=mine.unload();
        else if(within(x,y,180,289,664,62))changed=mine.refine();
        else if(within(x,y,180,363,664,62))changed=mine.refine(true);
        else if(within(x,y,180,437,664,62))changed=mine.manufacture();
        else if(within(x,y,180,511,664,62))changed=mine.sell();
        else if(within(x,y,180,585,664,62))changed=mine.buyWrit();
      } else {
        if(within(x,y,74,185,126,37)){mineMode=MineMode::Dig;return;}
        if(within(x,y,206,185,126,37)){mineMode=MineMode::Scan;return;}
        if(within(x,y,338,185,126,37)){mineMode=MineMode::Blast;return;}
        if(within(x,y,470,185,126,37)){mineMode=MineMode::Lens;return;}
        if(within(x,y,602,185,126,37)){mineMode=MineMode::Collect;return;}
        if(within(x,y,780,185,152,37)){changed=mine.unload();}
        else {
          const int tile=std::min(72,440/mine.size());
          const int ox=(WIDTH-mine.size()*tile)/2,oy=245;
          if(within(x,y,float(ox),float(oy),float(tile*mine.size()),float(tile*mine.size()))){
            const int cx=int((x-ox)/tile),cy=int((y-oy)/tile);
            switch(mineMode){
              case MineMode::Dig:changed=mine.dig(cx,cy);break;
              case MineMode::Scan:changed=mine.survey(cx,cy);break;
              case MineMode::Blast:changed=mine.dig(cx,cy,true);break;
              case MineMode::Lens:changed=mine.survey(cx,cy,true);break;
              case MineMode::Collect:changed=mine.collect(cx,cy);break;
            }
          }
        }
      }
      if(changed)save();
      return;
    }
    if(scene==Scene::Campaign){
      const int before=selectedLevel;
      if(within(x,y,555,443,90,52))selectedLevel=std::max(1,selectedLevel-10);
      else if(within(x,y,650,443,90,52))selectedLevel=std::max(1,selectedLevel-1);
      else if(within(x,y,745,443,90,52))selectedLevel=std::min(unlocked,selectedLevel+1);
      else if(within(x,y,840,443,90,52))selectedLevel=std::min(unlocked,selectedLevel+10);
      else if(within(x,y,560,536,370,68))startLevel();
      else if(within(x,y,560,615,370,54))scene=Scene::Menu;
      if(before!=selectedLevel)selectedLevel=std::clamp(selectedLevel,1,unlocked);
      return;
    }
    if(scene==Scene::Editor){
      if(within(x,y,760,215,230,40)){
        editorDraftStatus=exportEditorJsonFile(editorSharePath())?
          "JSON EXPORTED - SHARE FILE READY":"JSON EXPORT FAILED";
        return;
      }
      if(within(x,y,760,265,230,40)){
        importEditorJsonFile(editorSharePath());return;
      }
      if(within(x,y,720,646,240,44)){startEditorPlay();return;}
      if(within(x,y,180,646,260,44)){
        if(!saveEditorDraft())editorDraftStatus="DRAFT SAVE FAILED";
        return;
      }
      if(within(x,y,452,646,260,44)){
        loadEditorDraft(); // preserve precise format/dimension/void warning on failure
        return;
      }
      if(within(x,y,180,713,260,44)){
        editorNut=(editorNut+18)%19;if(editorNut==12)editorNut=11;return;
      }
      if(within(x,y,452,713,260,44)){
        editorNut=(editorNut+1)%19;if(editorNut==12)editorNut=13;return;
      }
      if(within(x,y,720,713,110,44)){stepEditorHistory(true);return;}
      if(within(x,y,840,713,120,44)){stepEditorHistory(false);return;}
      const int i=cellAt(x,y,editorBoard);
      if(i>=0)paintEditorCell(i,editorNut);
      return;
    }
    if(scene==Scene::Playtest){
      if(within(x,y,775,114,185,46)){selected=-1;scene=Scene::Editor;return;}
      const int i=cellAt(x,y,playtestBoard);if(i<0)return;
      if(selected>=0&&selected!=i)perform(selected,i);
      else selected=i;
      return;
    }
    if(scene==Scene::Board){
      if(within(x,y,775,114,185,46)){
        pendingPurchase=0;shopNotice.clear();holdMode=HoldMode::Swap;
        selected=-1;scene=Scene::Shop;return;
      }
      if(within(x,y,180,713,260,44)){
        holdMode=(stock.butter>0&&holdMode!=HoldMode::Butter)?
          HoldMode::Butter:HoldMode::Swap;
        selected=-1;return;
      }
      if(within(x,y,452,713,260,44)){
        holdMode=(stock.jam>0&&holdMode!=HoldMode::Jam)?
          HoldMode::Jam:HoldMode::Swap;
        selected=-1;return;
      }
      const int i=cellAt(x,y);if(i<0)return;
      if(holdMode!=HoldMode::Swap){
        const nut::HoldKind kind=holdMode==HoldMode::Butter?
          nut::HoldKind::Butter:nut::HoldKind::Jam;
        if(stock.use(board,kind,i)){
          save();holdMode=HoldMode::Swap;selected=-1;
        }
        return;
      }
      if(selected>=0&&selected!=i)perform(selected,i);
      else selected=i;
    }
  }
  void perform(int a,int b){
    if(holdMode!=HoldMode::Swap)return;
    if(scene==Scene::Playtest){
      const nut::Turn result=playtestBoard.swap(a,b);
      selected=-1;if(!result.valid){selected=b;return;}
      if(result.won||result.lost){
        editorDraftStatus=result.won?"PLAYTEST COMPLETE - DRAFT UNCHANGED":"PLAYTEST LOST - DRAFT UNCHANGED";
        scene=Scene::Editor;
      }
      return;
    }
    nut::Turn result=board.swap(a,b);
    selected=-1;
    if(!result.valid){selected=b;return;}
    if(result.won)onCampaignWin();
    else if(result.lost)scene=Scene::Lost;
  }
  // Campaign play and editor paint the same native board with identical approved sprites and overlays.
  void renderBoardCells(SDL_Renderer* r,const nut::Board& canvas){
      const int tile=std::min(74,490/canvas.height());
      const int ox=(WIDTH-tile*canvas.width())/2,oy=215;
      for(int i=0;i<canvas.size();++i){
        const auto& c=canvas.cell(i);
        if(c.type<0)continue; // preserve actual authored board silhouette
        const int x=ox+(i%canvas.width())*tile,y=oy+(i/canvas.width())*tile;
        fill(r,x,y,tile-3,tile-3,i==selected?
          SDL_Color{209,166,80,255}:SDL_Color{58,35,56,255});
        sprite(r,std::string("nuts/")+NUTS.at(size_t(c.type)),x+5,y+5,tile-13,tile-13);
        if(c.chest>0)sprite(r,"blocker/chest",x+3,y+3,tile-9,tile-9);
        if(c.lock>0)sprite(r,"blocker/chain-1",x+3,y+3,tile-9,tile-9);
        if(c.ice>0)sprite(r,c.ice>2?"blocker/ice-2":"blocker/ice-1",x+3,y+3,tile-9,tile-9);
        if(c.jam>0)sprite(r,"overlay/sticky-butter",x+3,y+3,tile-9,tile-9);
        if(c.fuse>0)sprite(r,"overlay/bomb",x+3,y+3,tile-9,tile-9);
        if(c.ice>1||c.lock>1||c.chest>1)
          label(r,float(x+3),float(y+tile-18),
             "x"+std::to_string(std::max({c.ice,c.lock,c.chest})),1);
        if(c.hold>0){
          fill(r,x+tile-26,y+3,22,20,{51,31,85,255});
          label(r,float(x+tile-21),float(y+5),std::to_string(c.hold),1);
        }
      }
  }
  void render(SDL_Renderer* r){
    fill(r,0,0,WIDTH,HEIGHT,{29,14,33,255});
    fill(r,0,0,WIDTH,102,{83,36,61,255});
    label(r,332,28,"NUTBUSTER",4);
    if(scene==Scene::Menu){
      label(r,292,155,"NATIVE WINDOWS / LINUX PREVIEW",2);
      button(r,324,238,376,66,"CAMPAIGN");
      button(r,324,332,376,66,unlocked>500?"NUTVALE MINES":"MINES UNLOCK AT 500");
      button(r,324,426,376,66,levelEditorUnlocked?"LEVEL EDITOR":"EDITOR: CLEAR LEVEL 1000");
      button(r,324,520,376,66,"EXIT");
      label(r,160,590,"Native SDL3 rendering. No Chromium, Electron or WebView.",2);
      label(r,160,630,"Preview only: full design-book feature parity pending.",2);
      return;
    }
    if(scene==Scene::Campaign){
      const auto& target=nut::campaignStage(selectedLevel);
      label(r,120,121,"CAMPAIGN - 1000 AUTHORED STAGES",2);
      sprite(r,"maps/campaign-overview",76,177,448,465);
      fill(r,545,181,410,521,{54,26,49,255});
      label(r,575,215,"STAGE "+std::to_string(selectedLevel)+
        " / "+std::to_string(unlocked),2);
      std::string title=target.title;
      if(title.size()>36)title=title.substr(0,36);
      label(r,575,259,title,2);
      label(r,575,307,"MOVES "+std::to_string(target.moves),2);
      const std::array<std::string,6> goals{{"SCORE","COLLECT","ICE","LOCKS","CHESTS","BUTTER"}};
      for(int i=0;i<2;++i){
        const auto& g=target.goals[size_t(i)];
        if(g.kind==nut::GoalKind::None)continue;
        const int kind=int(g.kind);
        const std::string objective=goals.at(size_t(kind))+" "+std::to_string(g.target)+
          (g.kind==nut::GoalKind::Collect?" COLOR "+std::to_string(g.color):"");
        label(r,575,float(342+i*32),objective,2);
      }
      button(r,555,443,90,52,"-10");
      button(r,650,443,90,52,"-1");
      button(r,745,443,90,52,"+1");
      button(r,840,443,90,52,"+10");
      button(r,560,536,370,68,"PLAY THIS STAGE");
      button(r,560,615,370,54,"MAIN MENU");
      return;
    }
    if(scene==Scene::Won||scene==Scene::Lost){
      label(r,320,250,scene==Scene::Won?"LEVEL COMPLETE":"LEVEL ENDED",3);
      button(r,320,350,384,68,scene==Scene::Won?"NEXT LEVEL":"RETURN TO MENU");
      return;
    }
    button(r,24,20,145,46,"BACK");
    if(scene==Scene::Shop){
      label(r,280,125,"GRAVITY HOLD SHOP",3);
      label(r,325,185,"GEMS "+std::to_string(wallet.gems),3);
      button(r,190,270,300,85,"BUTTER 15 GEMS");
      button(r,534,270,300,85,"JAM 30 GEMS");
      sprite(r,"nuts/peanut",202,278,53,53);
      sprite(r,"hold/jam",545,278,53,53);
      label(r,195,375,"BUTTER 1 DROP / OWN "+std::to_string(stock.butter),2);
      label(r,538,375,"JAM 2 DROPS / OWN "+std::to_string(stock.jam),2);
      label(r,245,420,"HELD NUT MATCHES SCORE X3",2);
      if(pendingPurchase){
        label(r,258,453,"CONFIRM "+std::string(pendingPurchase==1?"BUTTER - 15":"JAM - 30")+" GEMS",2);
        button(r,320,480,384,62,"CONFIRM PURCHASE");
      }
      button(r,320,558,384,58,"CANCEL");
      if(!shopNotice.empty())label(r,245,640,shopNotice,2);
      label(r,185,690,"LOCAL GEMS ONLY / NO REAL-MONEY CHECKOUT",2);
      return;
    }
    if(scene==Scene::Board||scene==Scene::Playtest){
      const bool testing=scene==Scene::Playtest;
      const nut::Board& active=testing?playtestBoard:board;
      button(r,775,114,185,46,testing?"EXIT TEST":"HOLD SHOP");
      if(!testing)label(r,780,172,"GEMS "+std::to_string(wallet.gems),2);
      label(r,190,108,std::string(testing?"PLAY LEVEL":"LEVEL "+std::to_string(active.level()))+"  MOVES "+
                    std::to_string(active.moves()),2);
      std::string title=testing?"CUSTOM DRAFT - NO REWARDS":active.stage().title;
      if(title.size()>64)title=title.substr(0,64);
      label(r,190,132,title,2);
      for(int g=0;g<2;++g){
        const auto& objective=active.stage().goals[size_t(g)];
        if(objective.kind==nut::GoalKind::None)continue;
        label(r,190,160+g*20,active.objectiveLabel(g)+" "+
          std::to_string(active.objectiveValue(g))+"/"+std::to_string(objective.target),2);
      }
      renderBoardCells(r,active);
      if(testing){label(r,185,724,"MATCH NUTS - NO CAMPAIGN MOVES/REWARDS",2);}
      else {
      button(r,180,713,260,44,"BUTTER "+std::to_string(stock.butter));
      button(r,452,713,260,44,"JAM "+std::to_string(stock.jam));
      label(r,730,724,holdMode==HoldMode::Butter?"TAP NUT: 1 DROP":
          holdMode==HoldMode::Jam?"TAP NUT: 2 DROPS":
          stock.butter+stock.jam==0?"BUY IN HOLD SHOP":"DRAG TO SWAP",1);
      }
    } else if(scene==Scene::Editor){
      label(r,190,114,"LEVEL EDITOR - LOCAL DRAFT V1",2);
      label(r,190,147,editorDraftStatus+" / REAL ENGINE",2);
      renderBoardCells(r,editorBoard);
      button(r,760,215,230,40,"EXPORT JSON");
      button(r,760,265,230,40,"IMPORT JSON");
      label(r,761,314,"FILE: NUTBUSTER-custom-level-v1.json",1);
      button(r,180,646,260,44,"SAVE DRAFT");
      button(r,452,646,260,44,"RELOAD DRAFT");
      button(r,720,646,240,44,"PLAY LEVEL");
      button(r,180,713,260,44,"PREVIOUS NUT");
      button(r,452,713,260,44,"NEXT NUT");
      button(r,720,713,110,44,"UNDO");
      button(r,840,713,120,44,"REDO");
      sprite(r,std::string("nuts/")+NUTS.at(size_t(editorNut)),890,115,40,40);
      label(r,834,167,"NUT "+std::to_string(editorNut+1),1);
      label(r,720,184,"UNDO "+std::to_string(editorUndo.size())+" / REDO "+std::to_string(editorRedo.size()),1);
    } else if(scene==Scene::Mine){
      button(r,175,111,180,42,"EXCAVATE");
      button(r,365,111,180,42,"EQUIPMENT");
      button(r,555,111,180,42,"REFINERY");
      label(r,110,162,"N$ "+std::to_string(mine.dollars)+"  ORE "+std::to_string(mine.storedOre)+
        "  METAL "+std::to_string(mine.metal)+"  GOODS "+std::to_string(mine.goods)+
        "  WRITS "+std::to_string(mine.writs),2);
      if(mineTab==MineTab::Dig){
        label(r,85,715,"CART "+std::to_string(mine.cartOre)+"/"+std::to_string(mine.cartCapacity())+
          "   STRIKES "+std::to_string(mine.strikes)+"   SCANS "+std::to_string(mine.scans)+
          "   SITE "+std::to_string(mine.sites+1),2);
        button(r,74,185,126,37,"DIG");
        button(r,206,185,126,37,"SCAN");
        button(r,338,185,126,37,"BLAST");
        button(r,470,185,126,37,"LENS");
        button(r,602,185,126,37,"COLLECT");
        button(r,780,185,152,37,"UNLOAD");
        const int tile=std::min(72,440/mine.size());
        const int ox=(WIDTH-tile*mine.size())/2,oy=245;
        for(int y=0;y<mine.size();++y)for(int x=0;x<mine.size();++x){
          const int left=ox+x*tile,top=oy+y*tile;
          const auto t=mine.tile(x,y);
          fill(r,left,top,tile-3,tile-3,{58,35,56,255});
          sprite(r,"mine/"+mine.sprite(x,y),left+4,top+4,tile-11,tile-11);
          if(t.exposed>0)label(r,float(left+4),float(top+tile-19),"CART",1);
          else if(t.scanned&&!t.cleared())
            label(r,float(left+3),float(top+tile-19),t.ore>0?"ORE":"EMPTY",1);
        }
        label(r,90,738,"GEMS "+std::to_string(mine.gems)+" COAL "+std::to_string(mine.coal)+
          " FOSSILS "+std::to_string(mine.fossils)+" RELICS "+std::to_string(mine.relics)+
          " BLAST "+std::to_string(mine.blasts)+" LENS "+std::to_string(mine.lenses),1);
      }else if(mineTab==MineTab::Equipment){
        const std::array<std::string,5> names{{"pickaxe","gloves","map","cart","refinery"}};
        const std::array<int,5> tiers{{mine.pickTier,mine.gloveTier,mine.mineTier,mine.cartTier,mine.refineryTier}};
        for(int i=0;i<5;++i){
          const int price=mine.cost(names[size_t(i)]);
          std::string title=names[size_t(i)]+" TIER "+std::to_string(tiers[size_t(i)])+
             (price<0?" MAX":" UPGRADE N$"+std::to_string(price));
          const float top=float(215+i*77);
          fill(r,180,top,664,60,{110,58,78,255});
          fill(r,183,top+3,658,54,{64,31,58,255});
          const bool gear=i<2;
          label(r,gear?270.0f:196.0f,top+22,title,2);
          if(gear){
            const std::string key="gear/"+names[size_t(i)]+"-"+
                 (tiers[size_t(i)]<10?"0":"")+std::to_string(tiers[size_t(i)]);
            sprite(r,key,192,top+6,49,49);
          }
        }
        label(r,165,647,"Pickaxe 12 + 5/tier daily strikes; gloves +1 survey/tier.",2);
      }else{
        button(r,180,215,664,62,"UNLOAD CART   "+std::to_string(mine.cartOre)+" ORE");
        button(r,180,289,664,62,"REFINE "+std::to_string(mine.orePerMetal())+" ORE -> 1 METAL");
        button(r,180,363,664,62,"COAL REFINE -> 1 METAL");
        button(r,180,437,664,62,"CRAFT 2 METAL -> 1 GOODS");
        button(r,180,511,664,62,"SELL GOODS -> N$"+std::to_string(mine.saleValue()));
        button(r,180,585,664,62,"BUY WRIT -> N$180");
      }
    }
  }
};
// Test the production click path and save codec without granting runtime stock.
bool holdUiSelfTest(std::string& report){
  try{
    Game game;
    game.startLevel();
    if(game.stock.butter||game.stock.jam)throw std::runtime_error("invented starting stock");
    game.click(190,725);
    if(game.holdMode!=Game::HoldMode::Swap)throw std::runtime_error("empty stock selectable");
    int target=-1;
    for(int i=0;i<game.board.size();++i)
      if(game.board.cell(i).type>=0&&!game.board.cell(i).pinned()){
        target=i;break;
      }
    if(target<0)throw std::runtime_error("no valid test nut");
    const int tile=std::min(74,490/game.board.height());
    const int ox=(WIDTH-tile*game.board.width())/2,oy=215;
    const float cx=float(ox+(target%game.board.width())*tile+tile/2);
    const float cy=float(oy+(target/game.board.width())*tile+tile/2);
    game.stock.butter=1;game.stock.jam=2; // test fixture, not a production grant
    game.click(190,725);
    if(game.holdMode!=Game::HoldMode::Butter)throw std::runtime_error("butter selector");
    game.click(cx,cy);
    if(game.stock.butter!=0||game.board.cell(target).hold!=1||
       game.board.holdUses(nut::HoldKind::Butter)!=1||
       game.holdMode!=Game::HoldMode::Swap)throw std::runtime_error("butter debit");
    game.click(190,725);
    if(game.holdMode!=Game::HoldMode::Swap)throw std::runtime_error("empty stock reused");
    game.click(460,725);
    game.click(-1,-1);
    if(game.stock.jam!=2||game.holdMode!=Game::HoldMode::Jam)
      throw std::runtime_error("invalid click debited stock");
    game.click(cx,cy); // permitted Jam upgrade of an existing Butter hold
    if(game.stock.jam!=1||game.board.cell(target).hold!=2||
       game.board.holdUses(nut::HoldKind::Jam)!=1)
      throw std::runtime_error("Jam upgrade/debit");
    game.click(460,725);game.click(cx,cy);
    if(game.stock.jam!=1||game.board.cell(target).hold!=2||
       game.board.holdUses(nut::HoldKind::Jam)!=1)
      throw std::runtime_error("already-held nut double spent");
    if(game.stock.use(game.board,nut::HoldKind::Butter,-1)||game.stock.butter!=0)
      throw std::runtime_error("invalid target spent stock");
    game.stock.butter=4;game.stock.jam=7;game.wallet.gems=43;game.unlocked=23;
    std::stringstream saved;
    if(!game.saveTo(saved))throw std::runtime_error("V5 save");
    Game restored;
    if(!restored.loadFrom(saved)||restored.stock.butter!=4||
       restored.stock.jam!=7||restored.unlocked!=23||restored.wallet.gems!=43||
       restored.levelEditorUnlocked)
      throw std::runtime_error("V5 stock, wallet and locked editor roundtrip");
    std::stringstream legacy;
    legacy<<"NUTBUSTER_NATIVE_PREVIEW_V2 17\n";
    if(!game.mine.save(legacy))throw std::runtime_error("V2 fixture");
    Game migrated;
    if(!migrated.loadFrom(legacy)||migrated.unlocked!=17||
       migrated.stock.butter||migrated.stock.jam||migrated.wallet.gems!=25)
      throw std::runtime_error("V2 migration currency/stock");
    std::stringstream oldest("NUTBUSTER_NATIVE_PREVIEW_V1 9\n");
    Game v1;
    if(!v1.loadFrom(oldest)||v1.unlocked!=9||v1.stock.butter||v1.stock.jam||
       v1.wallet.gems!=25)throw std::runtime_error("V1 migration");
    std::stringstream v3;
    v3<<"NUTBUSTER_NATIVE_PREVIEW_V3 21\n";
    if(!game.mine.save(v3)||!game.stock.write(v3))
      throw std::runtime_error("V3 fixture");
    Game legacy3;
    if(!legacy3.loadFrom(v3)||legacy3.unlocked!=21||
       legacy3.stock.butter!=4||legacy3.stock.jam!=7||legacy3.wallet.gems!=25)
      throw std::runtime_error("V3 migration");
    std::stringstream corrupt;
    corrupt<<"NUTBUSTER_NATIVE_PREVIEW_V3 30\n";
    game.mine.save(corrupt);
    corrupt<<"HOLD_STOCK_V1 -1 9999999\n";
    Game rejected;
    if(rejected.loadFrom(corrupt)||rejected.unlocked!=1||
       rejected.stock.butter||rejected.stock.jam)
      throw std::runtime_error("corrupt stock accepted/partial load");
    report="PASS native Butter/Jam click, finite debit, V1-V3 migration and V5 wallet/stock persistence";
    return true;
  }catch(const std::exception& e){report=std::string("FAIL native hold UI: ")+e.what();return false;}
}
// Test the actual production shop click/confirm/cancel and purchase->board->save path.
bool shopUiSelfTest(std::string& report){
  try{
    Game g;g.startLevel();
    if(g.wallet.gems!=25||g.stock.butter||g.stock.jam)
      throw std::runtime_error("initial mobile-parity currency/zero stock");
    g.click(800,130);
    if(g.scene!=Game::Scene::Shop)throw std::runtime_error("shop entry");
    g.click(210,290);
    if(g.pendingPurchase!=1||g.wallet.gems!=25||g.stock.butter)
      throw std::runtime_error("selection charged without confirmation");
    g.click(350,580);
    if(g.pendingPurchase||g.wallet.gems!=25||g.stock.butter)
      throw std::runtime_error("cancel charged");
    g.click(210,290);g.click(350,505);
    if(g.wallet.gems!=10||g.stock.butter!=1||g.pendingPurchase)
      throw std::runtime_error("Butter confirmed debit");
    g.click(550,290);g.click(350,505);
    if(g.wallet.gems!=10||g.stock.jam||g.pendingPurchase)
      throw std::runtime_error("insufficient Jam purchase charged");
    g.wallet.win();g.wallet.win(); // 10 gems for each completed board on mobile
    g.click(550,290);g.click(350,505);
    if(g.wallet.gems!=0||g.stock.jam!=1||g.pendingPurchase)
      throw std::runtime_error("Jam confirmed debit");
    g.click(35,35);
    if(g.scene!=Game::Scene::Board)throw std::runtime_error("shop return");
    int target=-1;
    for(int i=0;i<g.board.size();++i)
      if(g.board.cell(i).type>=0&&!g.board.cell(i).pinned()){target=i;break;}
    if(target<0)throw std::runtime_error("no valid nut");
    const int tile=std::min(74,490/g.board.height());
    const int ox=(WIDTH-tile*g.board.width())/2,oy=215;
    g.click(190,725);
    if(g.holdMode!=Game::HoldMode::Butter)throw std::runtime_error("purchased hold not selectable");
    g.click(float(ox+(target%g.board.width())*tile+tile/2),
            float(oy+(target/g.board.width())*tile+tile/2));
    if(g.stock.butter||g.board.cell(target).hold!=1||g.wallet.gems)
      throw std::runtime_error("purchased hold not usable");
    std::stringstream save;
    if(!g.saveTo(save))throw std::runtime_error("purchased save failed");
    Game loaded;
    if(!loaded.loadFrom(save)||loaded.wallet.gems!=0||
       loaded.stock.butter!=0||loaded.stock.jam!=1)
      throw std::runtime_error("purchased inventory not restored");
    std::stringstream bad;
    bad<<"NUTBUSTER_NATIVE_PREVIEW_V4 30\n";
    if(!g.mine.save(bad)||!g.stock.write(bad))
      throw std::runtime_error("bad wallet fixture");
    bad<<"GEM_WALLET_V1 -1\n";
    Game rejected;
    if(rejected.loadFrom(bad)||rejected.unlocked!=1||
       rejected.wallet.gems!=25||rejected.stock.butter||rejected.stock.jam)
      throw std::runtime_error("corrupt wallet accepted or partially loaded");
    g.wallet.gems=GemWallet::max;g.wallet.win();
    if(g.wallet.gems!=GemWallet::max)
      throw std::runtime_error("gem win overflow");
    report="PASS native shop click/confirm/cancel, 15/30 gem debit, insufficiency, use and V5 persistence";
    return true;
  }catch(const std::exception& e){
    report=std::string("FAIL native hold shop: ")+e.what();return false;
  }
}
// Production win-handler/save-codec regression; no editor UI is claimed.
bool editorProgressionSelfTest(std::string& report){
  try{
    Game reached;
    reached.unlocked=999;reached.selectedLevel=999;
    reached.onCampaignWin();
    if(reached.unlocked!=1000||reached.levelEditorUnlocked)
      throw std::runtime_error("reaching the finale without winning granted editor");
    std::stringstream reachedSave;
    if(!reached.saveTo(reachedSave))throw std::runtime_error("reached-only save");
    Game reachedReload;
    if(!reachedReload.loadFrom(reachedSave)||reachedReload.levelEditorUnlocked)
      throw std::runtime_error("reached-only reload granted editor");
    reached.selectedLevel=1000;reached.onCampaignWin();
    if(!reached.levelEditorUnlocked||reached.unlocked!=1000)
      throw std::runtime_error("finale win did not award editor");
    std::stringstream wonSave;
    if(!reached.saveTo(wonSave))throw std::runtime_error("earned save");
    Game earnedReload;
    if(!earnedReload.loadFrom(wonSave)||!earnedReload.levelEditorUnlocked||
       earnedReload.unlocked!=1000)
      throw std::runtime_error("earned editor missing on reload");
    earnedReload.selectedLevel=7;earnedReload.onCampaignWin();
    if(!earnedReload.levelEditorUnlocked)
      throw std::runtime_error("replaying earlier level revoked editor");
    Game denied;
    denied.click(340,450);
    if(denied.scene!=Game::Scene::Menu||denied.openEditor())
      throw std::runtime_error("locked native editor entry");
    earnedReload.scene=Game::Scene::Menu;
    earnedReload.click(340,450);
    if(earnedReload.scene!=Game::Scene::Editor)throw std::runtime_error("won editor cannot enter");
    int idx=-1;
    for(int i=0;i<earnedReload.editorBoard.size();++i)
      if(earnedReload.editorBoard.cell(i).exists()){idx=i;break;}
    if(idx<0)throw std::runtime_error("no editor board cells");
    const int old=earnedReload.editorBoard.tile(idx),base=earnedReload.board.tile(idx);
    earnedReload.editorNut=(old+1)%19;
    if(earnedReload.editorNut==12)earnedReload.editorNut=13;
    const int tile=std::min(74,490/earnedReload.editorBoard.height());
    const int ox=(WIDTH-tile*earnedReload.editorBoard.width())/2;
    earnedReload.click(float(ox+(idx%earnedReload.editorBoard.width())*tile+tile/2),
                       float(215+(idx/earnedReload.editorBoard.width())*tile+tile/2));
    if(earnedReload.editorBoard.tile(idx)!=earnedReload.editorNut||earnedReload.board.tile(idx)!=base)
      throw std::runtime_error("real editor board paint or isolation");
    earnedReload.click(775,733); // Native Undo button.
    if(earnedReload.editorBoard.tile(idx)!=old||earnedReload.board.tile(idx)!=base||
       earnedReload.editorRedo.size()!=1)
      throw std::runtime_error("native editor Undo did not restore original tile");
    earnedReload.click(900,733); // Native Redo button.
    if(earnedReload.editorBoard.tile(idx)!=earnedReload.editorNut||
       !earnedReload.editorRedo.empty())
      throw std::runtime_error("native editor Redo did not reapply tile");
    earnedReload.click(775,733);
    earnedReload.click(float(ox+(idx%earnedReload.editorBoard.width())*tile+tile/2),
                       float(215+(idx/earnedReload.editorBoard.width())*tile+tile/2));
    if(earnedReload.editorBoard.tile(idx)!=earnedReload.editorNut||
       !earnedReload.editorRedo.empty())
      throw std::runtime_error("new paint must invalidate native editor Redo");
    earnedReload.click(900,733);
    if(earnedReload.editorBoard.tile(idx)!=earnedReload.editorNut)
      throw std::runtime_error("invalidated native Redo changed current draft");
    // The editor exit now persists pending edits. Exercise that path with a
    // real temporary draft file, not an unsaveable in-memory Game.
    earnedReload.savePath=fs::temp_directory_path()/
      ("nutbuster-editor-return-"+std::to_string(std::time(nullptr))+"-"+
       std::to_string(std::clock())+".progress");
    earnedReload.click(40,40);
    if(earnedReload.scene!=Game::Scene::Menu)throw std::runtime_error("editor return");
    earnedReload.click(340,450);
    if(earnedReload.scene!=Game::Scene::Editor||earnedReload.editorBoard.tile(idx)!=earnedReload.editorNut)
      throw std::runtime_error("editor draft lost after returning");
    Game returnRestart;
    returnRestart.levelEditorUnlocked=true;returnRestart.savePath=earnedReload.savePath;
    if(!returnRestart.loadEditorDraft()||
       returnRestart.editorBoard.tile(idx)!=earnedReload.editorNut)
      throw std::runtime_error("native editor Back flush did not survive restart");
    std::stringstream draft;
    if(!earnedReload.saveEditorDraftTo(draft))
      throw std::runtime_error("won user cannot serialize editor draft");
    Game newlyStarted;
    newlyStarted.levelEditorUnlocked=true;
    if(!newlyStarted.loadEditorDraftFrom(draft)||
       newlyStarted.editorBoard.tile(idx)!=earnedReload.editorNut||
       newlyStarted.board.tile(idx)!=base)
      throw std::runtime_error("editor draft stream restart or campaign isolation");
    std::stringstream damagedDraft;
    damagedDraft<<"NUTBUSTER_EDITOR_DRAFT_V1 "
      <<earnedReload.editorBoard.width()<<" "<<earnedReload.editorBoard.height()
      <<" "<<earnedReload.editorBoard.size()<<"\n";
    for(int k=0;k<earnedReload.editorBoard.size();++k)
      damagedDraft<<(k==idx?12:earnedReload.editorBoard.tile(k))<<" ";
    if(newlyStarted.loadEditorDraftFrom(damagedDraft)||
       newlyStarted.editorBoard.tile(idx)!=earnedReload.editorNut)
      throw std::runtime_error("retired nut draft was accepted or destroyed valid draft");
    std::stringstream wrongSize("NUTBUSTER_EDITOR_DRAFT_V1 9 10 90\n");
    std::stringstream truncated("NUTBUSTER_EDITOR_DRAFT_V1 4 5 20\n1 2\n");
    if(newlyStarted.loadEditorDraftFrom(wrongSize)||
       newlyStarted.editorDraftStatus!="DRAFT REJECTED: INVALID BOARD DIMENSIONS")
      throw std::runtime_error("invalid board size did not produce a warning");
    if(newlyStarted.loadEditorDraftFrom(truncated)||
       newlyStarted.editorDraftStatus!="DRAFT REJECTED: INCOMPLETE TILES")
      throw std::runtime_error("incomplete draft did not produce a warning");
    std::stringstream voidOnly;
    voidOnly<<"NUTBUSTER_EDITOR_DRAFT_V1 "<<newlyStarted.editorBoard.width()<<" "
      <<newlyStarted.editorBoard.height()<<" "<<newlyStarted.editorBoard.size()<<"\n";
    for(int k=0;k<newlyStarted.editorBoard.size();++k)voidOnly<<"-1 ";
    if(newlyStarted.loadEditorDraftFrom(voidOnly)||
       newlyStarted.editorDraftStatus!="DRAFT REJECTED: VOID-ONLY BOARD"||
       newlyStarted.editorBoard.tile(idx)!=earnedReload.editorNut)
      throw std::runtime_error("void-only draft was accepted or damaged current editor");
    // Exercise production Level Editor -> real Board::swap -> return without campaign effects.
    Game practice;
    practice.levelEditorUnlocked=true;
    if(!practice.openEditor()||!practice.startEditorPlay()||practice.scene!=Game::Scene::Playtest)
      throw std::runtime_error("valid native draft could not enter real playtest");
    const int first=practice.editorBoard.tile(idx),campaignScore=practice.board.score();
    const int initialMoves=practice.playtestBoard.moves(),initialGems=practice.wallet.gems;
    int from=-1,to=-1;
    for(int a=0;a<practice.playtestBoard.size()&&from<0;++a)
      for(int b:{a+1,a+practice.playtestBoard.width()}){
        if(b>=practice.playtestBoard.size())continue;
        nut::Board probe=practice.playtestBoard;
        const nut::Turn turn=probe.swap(a,b);
        if(turn.valid&&turn.cleared>0){from=a;to=b;break;}
      }
    if(from<0)throw std::runtime_error("native playtest has no scoring move");
    practice.perform(from,to);
    if(practice.playtestBoard.moves()>=initialMoves||practice.editorBoard.tile(idx)!=first||
       practice.board.score()!=campaignScore||practice.wallet.gems!=initialGems||
       practice.unlocked!=1||practice.scene==Game::Scene::Won||practice.scene==Game::Scene::Lost)
      throw std::runtime_error("playtest spent campaign resources or did not make real move");
    practice.click(40,40);
    if(practice.scene!=Game::Scene::Editor||practice.editorBoard.tile(idx)!=first)
      throw std::runtime_error("native playtest quit lost editable draft");
    Game lockedTest;
    if(lockedTest.startEditorPlay())throw std::runtime_error("locked native playtest permitted");
    Game lockedDraft;
    std::stringstream stolen(draft.str()),refusedWrite;
    if(lockedDraft.loadEditorDraftFrom(stolen)||lockedDraft.saveEditorDraftTo(refusedWrite))
      throw std::runtime_error("locked profile gained access to custom draft");
    Game diskAuthor;
    diskAuthor.levelEditorUnlocked=true;
    diskAuthor.savePath=fs::temp_directory_path()/
      ("nutbuster-editor-test-"+std::to_string(std::time(nullptr))+".progress");
    if(!diskAuthor.editorBoard.paintCell(idx,earnedReload.editorNut)||
       !diskAuthor.saveEditorDraft())
      throw std::runtime_error("author draft file save");
    if(fs::exists(diskAuthor.savePath))
      throw std::runtime_error("editor draft overwrote campaign progress file");
    Game diskRestart;
    diskRestart.levelEditorUnlocked=true;
    diskRestart.savePath=diskAuthor.savePath;
    if(!diskRestart.openEditor()||
       diskRestart.editorBoard.tile(idx)!=earnedReload.editorNut||
       diskRestart.board.tile(idx)!=base)
      throw std::runtime_error("native disk save/restart/open did not restore draft");
    const int firstSavedTile=earnedReload.editorNut;
    int secondSavedTile=(firstSavedTile+1)%19;
    if(secondSavedTile==12)secondSavedTile=13;
    if(!diskAuthor.editorBoard.paintCell(idx,secondSavedTile))
      throw std::runtime_error("cannot prepare interrupted replacement");
    if(diskAuthor.saveEditorDraft(true)||!fs::exists(diskAuthor.draftStagePath()))
      throw std::runtime_error("injected interruption failed to leave staging file");
    Game interruptedRestart;
    interruptedRestart.levelEditorUnlocked=true;
    interruptedRestart.savePath=diskAuthor.savePath;
    if(!interruptedRestart.loadEditorDraft()||
       interruptedRestart.editorBoard.tile(idx)!=firstSavedTile)
      throw std::runtime_error("interrupted draft write destroyed previous valid save");
    if(!diskAuthor.saveEditorDraft())
      throw std::runtime_error("subsequent valid draft replacement failed");
    Game secondRestart;
    secondRestart.levelEditorUnlocked=true;
    secondRestart.savePath=diskAuthor.savePath;
    if(!secondRestart.loadEditorDraft()||
       secondRestart.editorBoard.tile(idx)!=secondSavedTile)
      throw std::runtime_error("atomic replacement did not survive restart");
    Game lastGood;
    lastGood.levelEditorUnlocked=true;
    {
      std::ifstream backup(diskAuthor.draftBackupPath(),std::ios::binary);
      if(!backup||!lastGood.loadEditorDraftFrom(backup)||
         lastGood.editorBoard.tile(idx)!=firstSavedTile)
        throw std::runtime_error("last-good draft backup was not preserved");
    }
    {
      std::ofstream corrupt(diskAuthor.draftPath(),std::ios::trunc);
      corrupt<<"NUTBUSTER_EDITOR_DRAFT_V1 broken and incomplete\\n";
      if(!corrupt)throw std::runtime_error("cannot inject corrupt primary");
    }
    Game recovered;
    recovered.levelEditorUnlocked=true;
    recovered.savePath=diskAuthor.savePath;
    if(!recovered.loadEditorDraft()||
       recovered.editorBoard.tile(idx)!=firstSavedTile||
       recovered.editorDraftStatus!="RECOVERED LAST GOOD DRAFT - SAVE TO RESTORE"||
       recovered.board.tile(idx)!=base)
      throw std::runtime_error("corrupt draft did not recover last good version");
    {
      std::ofstream corruptBackup(diskAuthor.draftBackupPath(),std::ios::trunc);
      corruptBackup<<"CORRUPT BACKUP\\n";
    }
    Game rejectBoth;
    rejectBoth.levelEditorUnlocked=true;
    rejectBoth.savePath=diskAuthor.savePath;
    const int originalInMemory=rejectBoth.editorBoard.tile(idx);
    if(rejectBoth.loadEditorDraft()||
       rejectBoth.editorDraftStatus!="DRAFT RECOVERY FAILED"||
       rejectBoth.editorBoard.tile(idx)!=originalInMemory)
      throw std::runtime_error("two corrupt draft files were wrongly accepted");
    if(fs::exists(diskAuthor.savePath))
      throw std::runtime_error("draft recovery wrote campaign progress");
    std::error_code draftCleanupError;
    for(const fs::path& path:{diskAuthor.draftPath(),diskAuthor.draftStagePath(),
        diskAuthor.draftBackupPath(),
        fs::path(diskAuthor.draftBackupPath().string()+".staging"),
        earnedReload.draftPath(),earnedReload.draftStagePath(),
        earnedReload.draftBackupPath(),
        fs::path(earnedReload.draftBackupPath().string()+".staging")}){
      fs::remove(path,draftCleanupError);
      if(draftCleanupError)throw std::runtime_error("could not clean native draft test file");
    }
    std::stringstream legacyV4;
    legacyV4<<"NUTBUSTER_NATIVE_PREVIEW_V4 1000\n";
    if(!reached.mine.save(legacyV4)||!reached.stock.write(legacyV4)||
       !reached.wallet.write(legacyV4))
      throw std::runtime_error("legacy V4 fixture");
    Game legacy;
    legacy.levelEditorUnlocked=true;
    if(!legacy.loadFrom(legacyV4)||legacy.unlocked!=1000||legacy.levelEditorUnlocked)
      throw std::runtime_error("legacy V4 reached state invented a win");
    std::string invalid=wonSave.str();
    const auto token=invalid.find("LEVEL_EDITOR_V1 1");
    if(token==std::string::npos)throw std::runtime_error("missing entitlement trailer");
    invalid.replace(token,std::string("LEVEL_EDITOR_V1 1").size(),"LEVEL_EDITOR_V1 2");
    std::stringstream damaged(invalid);
    Game preserved;
    preserved.unlocked=23;preserved.levelEditorUnlocked=true;
    if(preserved.loadFrom(damaged)||preserved.unlocked!=23||
       !preserved.levelEditorUnlocked)
      throw std::runtime_error("corrupt V5 entitlement accepted or partially loaded");
    report="PASS native editor entitlement, paint Undo/Redo, redo invalidation, real Play Level/quit isolation, V1 draft stream/disk restart, atomic interrupted-write recovery, last-good backup, corrupt primary and backup rejection, V4 migration, V5 progression";
    return true;
  }catch(const std::exception& e){
    report=std::string("FAIL native editor progression: ")+e.what();return false;
  }
}

bool editorAutosaveSelfTest(std::string& report){
  try{
    Game g;
    g.levelEditorUnlocked=true;
    g.savePath=fs::temp_directory_path()/
      ("nutbuster-autosave-"+std::to_string(std::time(nullptr))+"-"+
       std::to_string(std::clock())+".progress");
    if(!g.openEditor())throw std::runtime_error("earned editor failed to open");
    int idx=-1;
    for(int i=0;i<g.editorBoard.size();++i)
      if(g.editorBoard.cell(i).exists()){idx=i;break;}
    if(idx<0)throw std::runtime_error("missing editor tile");
    const int baseline=g.editorBoard.tile(idx);
    const auto next=[](int nut){int n=(nut+1)%19;return n==12?13:n;};
    const int first=next(baseline),second=next(first),third=next(second);
    g.pollEditorAutosave(1000);
    g.pollEditorAutosave(1000+2*Game::EDITOR_AUTOSAVE_IDLE_MS);
    if(g.editorDirty||fs::exists(g.draftPath())||fs::exists(g.savePath))
      throw std::runtime_error("untouched editor unexpectedly persisted a file");
    // This sentinel stands in for ordinary campaign progress; autosave must
    // never read, modify or replace the campaign progression container.
    {
      std::ofstream progress(g.savePath,std::ios::binary);
      progress<<"CAMPAIGN_SENTINEL\n";
      if(!progress)throw std::runtime_error("campaign sentinel fixture");
    }
    g.pollEditorAutosave(3000);
    if(!g.paintEditorCell(idx,first)||!g.editorDirty)
      throw std::runtime_error("paint failed to schedule an autosave");
    g.pollEditorAutosave(3000+Game::EDITOR_AUTOSAVE_IDLE_MS-1);
    if(fs::exists(g.draftPath())||!g.editorDirty)
      throw std::runtime_error("debounce persisted before idle deadline");
    g.pollEditorAutosave(3000+Game::EDITOR_AUTOSAVE_IDLE_MS);
    if(g.editorDirty||!fs::exists(g.draftPath())||
       g.editorDraftStatus.find("AUTOSAVED V1 DRAFT")!=0)
      throw std::runtime_error("first painted draft did not autosave");
    Game restarted;
    restarted.levelEditorUnlocked=true;restarted.savePath=g.savePath;
    if(!restarted.openEditor()||restarted.editorBoard.tile(idx)!=first||
       restarted.editorDirty||restarted.board.tile(idx)!=baseline)
      throw std::runtime_error("autopersisted painted draft did not survive restart");
    // Undo and Redo use exactly the same dirty schedule as a fresh paint.
    g.pollEditorAutosave(5000);
    if(!g.stepEditorHistory(true)||g.editorBoard.tile(idx)!=baseline||!g.editorDirty)
      throw std::runtime_error("undo failed to schedule autosave");
    g.pollEditorAutosave(5000+Game::EDITOR_AUTOSAVE_IDLE_MS);
    Game undone;undone.levelEditorUnlocked=true;undone.savePath=g.savePath;
    if(!undone.loadEditorDraft()||undone.editorBoard.tile(idx)!=baseline)
      throw std::runtime_error("autosaved undo did not survive restart");
    g.pollEditorAutosave(7000);
    if(!g.stepEditorHistory(false)||g.editorBoard.tile(idx)!=first||!g.editorDirty)
      throw std::runtime_error("redo failed to schedule autosave");
    g.pollEditorAutosave(7000+Game::EDITOR_AUTOSAVE_IDLE_MS);
    Game redone;redone.levelEditorUnlocked=true;redone.savePath=g.savePath;
    if(!redone.loadEditorDraft()||redone.editorBoard.tile(idx)!=first)
      throw std::runtime_error("autosaved redo did not survive restart");
    // Two quick paints must coalesce into one final replacement; an earlier
    // deadline cannot write the intermediate draft when a later edit occurs.
    g.pollEditorAutosave(9000);
    if(!g.paintEditorCell(idx,second))
      throw std::runtime_error("first burst paint failed");
    g.pollEditorAutosave(9000+Game::EDITOR_AUTOSAVE_IDLE_MS-10);
    if(!g.paintEditorCell(idx,third))
      throw std::runtime_error("second burst paint failed");
    g.pollEditorAutosave(9000+Game::EDITOR_AUTOSAVE_IDLE_MS);
    Game early;early.levelEditorUnlocked=true;early.savePath=g.savePath;
    if(!early.loadEditorDraft()||early.editorBoard.tile(idx)!=first||
       !g.editorDirty)
      throw std::runtime_error("editing burst saved before last idle deadline");
    g.pollEditorAutosave(9000+2*Game::EDITOR_AUTOSAVE_IDLE_MS-10);
    Game latest;latest.levelEditorUnlocked=true;latest.savePath=g.savePath;
    if(!latest.loadEditorDraft()||latest.editorBoard.tile(idx)!=third||
       g.editorDirty)
      throw std::runtime_error("coalesced autosave failed to persist final paint");
    // Manual Save clears the timer; idle polling may not rotate backups again.
    g.pollEditorAutosave(12000);
    if(!g.paintEditorCell(idx,second)||!g.saveEditorDraft()||g.editorDirty)
      throw std::runtime_error("manual save failed to cancel autosave");
    const fs::path backup=g.draftBackupPath();
    const auto lastWrite=fs::last_write_time(backup);
    g.pollEditorAutosave(15000);
    if(fs::last_write_time(backup)!=lastWrite)
      throw std::runtime_error("idle polling rewrote an already saved draft");
    // Recovery after autosaved/edit-saved corruption still uses last-good.
    {
      std::ofstream corrupt(g.draftPath(),std::ios::binary|std::ios::trunc);
      corrupt<<"BROKEN PRIMARY\n";
      if(!corrupt)throw std::runtime_error("could not inject corrupt autosave");
    }
    Game recovered;recovered.levelEditorUnlocked=true;recovered.savePath=g.savePath;
    if(!recovered.openEditor()||recovered.editorBoard.tile(idx)!=third||
       recovered.editorDraftStatus!="RECOVERED LAST GOOD DRAFT - SAVE TO RESTORE")
      throw std::runtime_error("autosave corrupt-primary recovery failed");
    // Exit before the idle deadline flushes immediately without losing edits.
    recovered.pollEditorAutosave(20000);
    if(!recovered.paintEditorCell(idx,first))
      throw std::runtime_error("exit-pending paint failed");
    recovered.click(40,40); // Real editor back button.
    Game exited;exited.levelEditorUnlocked=true;exited.savePath=g.savePath;
    if(recovered.scene!=Game::Scene::Menu||recovered.editorDirty||
       !exited.loadEditorDraft()||exited.editorBoard.tile(idx)!=first)
      throw std::runtime_error("editor exit lost pending autosave");
    {
      std::ifstream progress(g.savePath,std::ios::binary);
      std::string sentinel;
      std::getline(progress,sentinel);
      if(sentinel!="CAMPAIGN_SENTINEL")
        throw std::runtime_error("editor autosave modified campaign progress");
    }
    // Failed writes retain the dirty flag, with bounded retry after the idle
    // interval; they never silently claim the edit was committed.
    Game unavailable;unavailable.levelEditorUnlocked=true;
    if(!unavailable.openEditor())throw std::runtime_error("failure fixture editor");
    unavailable.pollEditorAutosave(1000);
    if(!unavailable.paintEditorCell(idx,first))
      throw std::runtime_error("failure fixture edit");
    unavailable.pollEditorAutosave(1000+Game::EDITOR_AUTOSAVE_IDLE_MS);
    if(!unavailable.editorDirty||
       unavailable.editorDraftStatus!="DRAFT AUTOSAVE FAILED - RETRYING")
      throw std::runtime_error("failed autosave was falsely marked clean");
    unavailable.savePath=fs::path(g.savePath.string()+".retry");
    unavailable.pollEditorAutosave(1000+2*Game::EDITOR_AUTOSAVE_IDLE_MS-1);
    if(fs::exists(unavailable.draftPath()))
      throw std::runtime_error("failed autosave retried before backoff");
    unavailable.pollEditorAutosave(1000+2*Game::EDITOR_AUTOSAVE_IDLE_MS);
    if(unavailable.editorDirty||!fs::exists(unavailable.draftPath()))
      throw std::runtime_error("failed autosave did not retry after backoff");
    std::error_code cleanupError;
    for(const auto& p:{g.draftPath(),g.draftStagePath(),g.draftBackupPath(),
         fs::path(g.draftBackupPath().string()+".staging"),g.savePath,
         unavailable.draftPath(),unavailable.draftStagePath(),
         unavailable.draftBackupPath()}){
      fs::remove(p,cleanupError);
      if(cleanupError)throw std::runtime_error("autosave test cleanup failed");
    }
    report="PASS native editor no-edit/debounce, real paint/undo/redo/relaunch, "
           "burst coalescing, manual Save cancellation, corrupt-primary recovery, "
           "immediate exit flush, bounded failed-write retry and campaign isolation";
    return true;
  }catch(const std::exception& e){
    report=std::string("FAIL native editor autosave: ")+e.what();return false;
  }
}
bool editorJsonShareSelfTest(std::string& report){
  try{
    Game author;
    author.levelEditorUnlocked=true;
    author.savePath=fs::temp_directory_path()/
      ("nutbuster-json-share-"+std::to_string(std::time(nullptr))+"-"+
       std::to_string(std::clock())+".progress");
    const fs::path share=author.editorSharePath();
    // Test against a unique temporary directory-independent filename, never
    // the real user's pref-path share file.
    const fs::path fixture=fs::path(author.savePath.string()+".custom-share.json");
    const fs::path staged=fs::path(fixture.string()+".staging");
    int idx=-1;
    for(int i=0;i<author.editorBoard.size();++i)
      if(author.editorBoard.cell(i).exists()){idx=i;break;}
    if(idx<0)throw std::runtime_error("missing authored nut");
    const int baseline=author.editorBoard.tile(idx);
    int changed=(baseline+1)%19;if(changed==12)changed=13;
    if(!author.editorBoard.paintCell(idx,changed))
      throw std::runtime_error("cannot paint exported sample");
    std::ostringstream json;
    if(!author.saveEditorJsonTo(json))throw std::runtime_error("JSON writer failed");
    const std::string good=json.str();
    if(good.find("{\"version\":1,\"width\":")!=0||
       good.find("\"tiles\":[")==std::string::npos)
      throw std::runtime_error("share JSON fields diverged from web V1");
    Game imported;imported.levelEditorUnlocked=true;
    std::istringstream input(good);
    if(!imported.loadEditorJsonFrom(input)||imported.editorBoard.tile(idx)!=changed||
       imported.board.tile(idx)!=baseline||!imported.editorDirty||
       imported.editorDraftStatus!="IMPORTED JSON V1 - SAVE DRAFT")
      throw std::runtime_error("web-compatible JSON did not round-trip");
    for(int i=0;i<author.editorBoard.size();++i)
      if(author.editorBoard.cell(i).exists()!=imported.editorBoard.cell(i).exists()||
         (author.editorBoard.cell(i).exists()&&
          author.editorBoard.tile(i)!=imported.editorBoard.tile(i)))
        throw std::runtime_error("JSON import changed real tile/void geometry");
    // JSON object key order is not significant, including ordinary whitespace.
    std::ostringstream reversed;
    reversed<<"{ \"tiles\": [";
    for(int i=0;i<author.editorBoard.size();++i){
      if(i)reversed<<", ";
      if(!author.editorBoard.cell(i).exists())reversed<<"null";
      else reversed<<author.editorBoard.tile(i);
    }
    reversed<<"], \"height\": "<<author.editorBoard.height()
            <<", \"version\": 1, \"width\": "<<author.editorBoard.width()<<" }";
    std::istringstream shuffled(reversed.str());
    if(!imported.loadEditorJsonFrom(shuffled)||imported.editorBoard.tile(idx)!=changed)
      throw std::runtime_error("reordered standards-compliant JSON rejected");
    auto reject=[&](const std::string& payload,const char* reason){
      std::istringstream bad(payload);
      const size_t undoSize=imported.editorUndo.size();
      if(imported.loadEditorJsonFrom(bad)||imported.editorBoard.tile(idx)!=changed||
         imported.board.tile(idx)!=baseline||imported.editorUndo.size()!=undoSize||
         imported.editorDraftStatus.find("REJECTED")==std::string::npos)
        throw std::runtime_error(reason);
    };
    auto substituted=[](std::string value,const std::string& old,const std::string& next){
      const auto at=value.find(old);
      if(at==std::string::npos)throw std::runtime_error("missing JSON fixture field");
      value.replace(at,old.size(),next);return value;
    };
    reject(substituted(good,"\"version\":1","\"version\":2"),"new version accepted");
    reject(substituted(good,"\"width\":"+std::to_string(author.editorBoard.width()),
        "\"width\":999"),"wrong size accepted");
    reject(substituted(good,"\"tiles\":[","\"tiles\":[] , \"unused\":1, \"fake\":["),
      "unknown or invalid tile schema accepted");
    reject(substituted(good,"\"version\":1","\"version\":1,\"version\":1"),
      "duplicate property accepted");
    reject(good+"junk","trailing bytes accepted");
    reject("{\"version\":1,\"width\":5,\"height\":4,\"tiles\":[null,]}",
      "trailing tile comma accepted");
    reject(std::string(16385,'x'),"oversized JSON accepted");
    std::ostringstream invalidNut;
    invalidNut<<"{\"version\":1,\"width\":"<<author.editorBoard.width()
              <<",\"height\":"<<author.editorBoard.height()<<",\"tiles\":[";
    for(int i=0;i<author.editorBoard.size();++i){
      if(i)invalidNut<<',';
      if(i==idx)invalidNut<<12;
      else if(!author.editorBoard.cell(i).exists())invalidNut<<"null";
      else invalidNut<<author.editorBoard.tile(i);
    }
    invalidNut<<"]}";
    reject(invalidNut.str(),"retired nut accepted");
    Game locked;
    std::istringstream lockedInput(good);std::ostringstream lockedOutput;
    if(locked.loadEditorJsonFrom(lockedInput)||locked.saveEditorJsonTo(lockedOutput))
      throw std::runtime_error("locked profile imported or exported");
    {
      std::ofstream campaign(author.savePath,std::ios::binary);
      campaign<<"CAMPAIGN_SENTINEL\n";
    }
    if(!author.exportEditorJsonFile(fixture)||!fs::exists(fixture)||
       fs::exists(staged)||share==fixture)
      throw std::runtime_error("atomic share file export failed");
    Game disk;disk.levelEditorUnlocked=true;disk.savePath=author.savePath;
    if(!disk.importEditorJsonFile(fixture)||disk.editorBoard.tile(idx)!=changed||
       !disk.editorDirty||!disk.saveEditorDraft())
      throw std::runtime_error("on-disk import/save failed");
    Game restored;restored.levelEditorUnlocked=true;restored.savePath=author.savePath;
    if(!restored.loadEditorDraft()||restored.editorBoard.tile(idx)!=changed||
       restored.board.tile(idx)!=baseline)
      throw std::runtime_error("imported share did not persist as independent draft");
    // Rejected share must not replace the valid draft or campaign sentinel.
    {
      std::ofstream corrupt(fixture,std::ios::binary|std::ios::trunc);
      corrupt<<"{\"version\":2}\n";
    }
    if(restored.importEditorJsonFile(fixture)||
       restored.editorBoard.tile(idx)!=changed)
      throw std::runtime_error("bad disk import destroyed existing draft");
    {
      std::ifstream campaign(author.savePath,std::ios::binary);
      std::string sentinel;std::getline(campaign,sentinel);
      if(sentinel!="CAMPAIGN_SENTINEL")
        throw std::runtime_error("JSON sharing overwrote official campaign progress");
    }
    std::error_code error;
    for(const fs::path& p:{fixture,staged,author.savePath,disk.draftPath(),
        disk.draftStagePath(),disk.draftBackupPath()}){
      fs::remove(p,error);
      if(error)throw std::runtime_error("JSON fixture cleanup failed");
    }
    report="PASS native desktop Web V1 JSON export/import, reordered keys, "
           "strict dimensions/version/tiles/nuts, atomic file round-trip, "
           "relaunch draft and official campaign isolation";
    return true;
  }catch(const std::exception& e){
    report=std::string("FAIL native editor JSON share: ")+e.what();return false;
  }
}

}
int main(int argc,char** argv){
  std::string screenshot,fixtureFile;int previewStage=0;bool self=false,previewMine=false,previewBoard=false,previewCampaign=false,smokeDig=false,smokeShop=false,previewEquip=false,previewRefinery=false;
  for(int i=1;i<argc;++i){
    std::string arg=argv[i];
    if(arg=="--self-test")self=true;
    else if(arg=="--smoke-hold-shop")smokeShop=true;
    else if(arg=="--verify-mine-fixtures"&&i+1<argc)fixtureFile=argv[++i];
    else if(arg=="--preview-mine")previewMine=true;
    else if(arg=="--smoke-mine-dig"){previewMine=true;smokeDig=true;}
    else if(arg=="--preview-equipment"){previewMine=true;previewEquip=true;}
    else if(arg=="--preview-refinery"){previewMine=true;previewRefinery=true;}
    else if(arg=="--preview-board")previewBoard=true;
    else if(arg=="--preview-campaign")previewCampaign=true;
    else if(arg=="--preview-stage"&&i+1<argc){
      try{previewStage=std::stoi(argv[++i]);}
      catch(...){std::cerr<<"Invalid native preview stage number\n";return 2;}
      if(previewStage<1||previewStage>1000){std::cerr<<"Stage must be 1..1000\n";return 2;}
    }
    else if(arg=="--smoke-render"&&i+1<argc)screenshot=argv[++i];
  }
  const fs::path data=fs::absolute(fs::path(argv[0])).parent_path()/"data";
  std::ifstream campaignFile(data/"campaign.tsv");
  std::string campaignError;
  if(!campaignFile||!nut::loadCampaign(campaignFile,campaignError)){
    std::cerr<<"Required authored NUTBUSTER campaign data unavailable: "<<campaignError<<"\n";
    return 4;
  }
  if(self){
    std::string boardReport,mineReport,holdReport,shopReport,editorReport;
    bool boardOk=nut::selfTest(boardReport),mineOk=nut::mineSelfTest(mineReport);
    bool holdOk=holdUiSelfTest(holdReport),shopOk=shopUiSelfTest(shopReport);
    bool editorOk=editorProgressionSelfTest(editorReport);
    std::string autosaveReport,jsonReport;
    bool autosaveOk=editorAutosaveSelfTest(autosaveReport);
    bool jsonOk=editorJsonShareSelfTest(jsonReport);
    std::cout<<boardReport<<"\n"<<mineReport<<"\n"<<holdReport<<"\n"
             <<shopReport<<"\n"<<editorReport<<"\n"<<autosaveReport<<"\n"<<jsonReport<<"\n";
    return boardOk&&mineOk&&holdOk&&shopOk&&editorOk&&autosaveOk&&jsonOk?0:1;
  }
  if(!fixtureFile.empty()){
    std::ifstream fixtures(fixtureFile);
    std::string report;
    bool ok=fixtures&&nut::verifyMineFixtures(fixtures,report);
    std::cout<<report<<"\n";return ok?0:1;
  }
  if(!SDL_Init(SDL_INIT_VIDEO)){std::cerr<<SDL_GetError()<<"\n";return 1;}
  SDL_Window* win=SDL_CreateWindow("NUTBUSTER Native Desktop Preview",WIDTH,HEIGHT,
     screenshot.empty()?0:SDL_WINDOW_HIDDEN);
  if(!win){std::cerr<<SDL_GetError()<<"\n";SDL_Quit();return 1;}
  SDL_Renderer* renderer=SDL_CreateRenderer(win,screenshot.empty()?nullptr:"software");
  if(!renderer){std::cerr<<SDL_GetError()<<"\n";SDL_DestroyWindow(win);SDL_Quit();return 1;}
  Game game;game.smoke=!screenshot.empty();
  char* pref=SDL_GetPrefPath("mrcalzon02","NUTBUSTER-Native-Preview");
  if(pref){game.savePath=fs::path(pref)/"progress.txt";SDL_free(pref);}
  if(!game.smoke&& !game.savePath.empty())game.load();
  if(!game.loadArt(renderer,data)){SDL_DestroyRenderer(renderer);SDL_DestroyWindow(win);SDL_Quit();return 2;}
  if(previewCampaign)game.scene=Game::Scene::Campaign;
  else if(previewMine)game.makeMine();
  else if(previewStage>0){
    game.board.reset(previewStage,uint32_t(previewStage)*7919U);
    game.scene=Game::Scene::Board;
  }
  else if(previewBoard)game.startLevel();
  if(previewEquip)game.mineTab=Game::MineTab::Equipment;
  if(previewRefinery)game.mineTab=Game::MineTab::Workshop;
  // Exercise real production shop click targets, save/reload, and a held nut
  // before capturing the approved-art SDL3 shop frame. Never grant stock in
  // the shipping path; this deterministic smoke fixture runs only on request.
  if(smokeShop){
    game.startLevel();
    game.click(800,130); // Board -> shop
    game.click(210,290); // Butter selection (no charge yet)
    if(game.scene!=Game::Scene::Shop||game.pendingPurchase!=1||
       game.wallet.gems!=25||game.stock.butter)
      {std::cerr<<"Native hold shop selection smoke failed\n";return 3;}
    game.click(350,505); // Confirm 15-gem purchase
    game.click(350,505); // Repeat must not purchase a second item
    if(game.pendingPurchase||game.wallet.gems!=10||game.stock.butter!=1)
      {std::cerr<<"Native hold shop confirmation smoke failed\n";return 3;}
    std::stringstream saved;
    Game restored;
    if(!game.saveTo(saved)||!restored.loadFrom(saved)||
       restored.wallet.gems!=10||restored.stock.butter!=1)
      {std::cerr<<"Native hold shop purchase reload smoke failed\n";return 3;}
    restored.startLevel();
    int target=-1;
    for(int i=0;i<restored.board.size();++i)
      if(restored.board.cell(i).type>=0&&!restored.board.cell(i).pinned())
        {target=i;break;}
    if(target<0){std::cerr<<"No usable held nut in smoke board\n";return 3;}
    const int tile=std::min(74,490/restored.board.height());
    const int ox=(WIDTH-tile*restored.board.width())/2,oy=215;
    restored.click(190,725); // Select owned Butter
    restored.click(float(ox+(target%restored.board.width())*tile+tile/2),
                   float(oy+(target/restored.board.width())*tile+tile/2));
    if(restored.stock.butter||restored.board.cell(target).hold!=1||
       restored.board.holdUses(nut::HoldKind::Butter)!=1||
       restored.wallet.gems!=10)
      {std::cerr<<"Native hold shop purchased-item use smoke failed\n";return 3;}
    std::stringstream consumed;
    Game afterUse;
    if(!restored.saveTo(consumed)||!afterUse.loadFrom(consumed)||
       afterUse.stock.butter||afterUse.wallet.gems!=10)
      {std::cerr<<"Native hold shop consumed-stock reload smoke failed\n";return 3;}
    std::cout<<"PASS native SDL3 shop selection, single confirmed purchase, "
                "V4 reload, purchased held-nut use and consumed-stock reload\n";
    // Leave the original Game in its real Shop scene for SDL3 screenshot.
  }
  if(smokeDig){
    bool sampled=false;
    const int tile=std::min(72,440/game.mine.size());
    const int ox=(WIDTH-tile*game.mine.size())/2,oy=245;
    for(int y=0;y<game.mine.size()&&!sampled;++y)
      for(int x=0;x<game.mine.size()&&!sampled;++x){
        if(game.mine.tile(x,y).ore==0)continue;
        const auto target=game.mine.tile(x,y);
        const int before=game.mine.strikes;
        for(int hit=0;hit<target.hardness;++hit)
          game.click(float(ox+x*tile+tile/2),float(oy+y*tile+tile/2));
        sampled=game.mine.tile(x,y).cleared() && game.mine.strikes==before-target.hardness;
        if(sampled)std::cout<<"Functional SDL3 mine click: "<<x<<","<<y
                             <<" sprite="<<game.mine.sprite(x,y)<<" consumed="<<target.hardness<<"\n";
      }
    if(!sampled){
      std::cerr<<"Functional SDL3 mine-click smoke failed\n";
      for(auto& image:game.images)SDL_DestroyTexture(image.second);
      SDL_DestroyRenderer(renderer);SDL_DestroyWindow(win);SDL_Quit();
      return 3;
    }
  }
  bool running=true;
  while(running){
    game.pollEditorAutosave(SDL_GetTicks());
    SDL_Event event;
    while(SDL_PollEvent(&event)){
      if(event.type==SDL_EVENT_QUIT){
        if(!game.flushEditorAutosave())
          std::cerr<<"Native editor draft autosave failed during quit\n";
        running=false;
      }
      if(event.type==SDL_EVENT_KEY_DOWN&&event.key.key==SDLK_ESCAPE){
        if(game.scene!=Game::Scene::Editor||game.flushEditorAutosave()){
          game.scene=game.scene==Game::Scene::Playtest?Game::Scene::Editor:Game::Scene::Menu;
          game.selected=-1;
        }
      }
      if(event.type==SDL_EVENT_MOUSE_BUTTON_DOWN&&event.button.button==SDL_BUTTON_LEFT){
        game.down=(game.scene==Game::Scene::Playtest)?game.cellAt(event.button.x,event.button.y,game.playtestBoard):
          (game.scene==Game::Scene::Board&&game.holdMode==Game::HoldMode::Swap)?game.cellAt(event.button.x,event.button.y):-1;
      }
      if(event.type==SDL_EVENT_MOUSE_BUTTON_UP&&event.button.button==SDL_BUTTON_LEFT){
        const int up=(game.scene==Game::Scene::Playtest)?game.cellAt(event.button.x,event.button.y,game.playtestBoard):
          (game.scene==Game::Scene::Board)?game.cellAt(event.button.x,event.button.y):-1;
        if(game.down>=0&&up>=0&&game.down!=up)game.perform(game.down,up);
        else game.click(event.button.x,event.button.y);
        game.down=-1;
      }
    }
    if(game.quitRequested)running=false;
    game.render(renderer);
    if(!screenshot.empty()){
      SDL_Surface* surface=SDL_RenderReadPixels(renderer,nullptr);
      if(!surface||!SDL_SaveBMP(surface,screenshot.c_str())){
        std::cerr<<"SDL native screenshot failed: "<<SDL_GetError()<<"\n";
        if(surface)SDL_DestroySurface(surface);
        running=false;break;
      }
      SDL_DestroySurface(surface);
      std::cout<<"Native frame captured: "<<screenshot<<"\n";
      break;
    }
    SDL_RenderPresent(renderer);
    SDL_Delay(16);
  }
  if(!game.flushEditorAutosave())
    std::cerr<<"Native editor draft remains unsaved after quit\n";
  for(auto& entry:game.images)SDL_DestroyTexture(entry.second);
  SDL_DestroyRenderer(renderer);
  SDL_DestroyWindow(win);
  SDL_Quit();return 0;
}
