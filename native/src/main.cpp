#include "core.hpp"
#include "mine.hpp"
#include <ctime>
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
#include <vector>

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
  bool read(std::istream& in){
    std::string tag;long long value=-1;
    if(!(in>>tag>>value)||tag!="GEM_WALLET_V1"||value<0||value>max)return false;
    in>>std::ws;if(in.peek()!=std::char_traits<char>::eof())return false;
    gems=int(value);return true;
  }
  bool write(std::ostream& out)const{
    if(gems<0||gems>max)return false;
    out<<"GEM_WALLET_V1 "<<gems<<"\n";return bool(out);
  }
};
struct Game {
  nut::Board board{1,7919};
  enum class Scene{Menu,Campaign,Board,Shop,Mine,Won,Lost};
  Scene scene=Scene::Menu;
  std::map<std::string,SDL_Texture*> images;
  int unlocked=1,selectedLevel=1,selected=-1,down=-1;
  nut::Mine mine{};
  HoldStock stock{};
  GemWallet wallet{};
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
      unlocked=std::clamp(level,1,1000);stock=HoldStock{};wallet=GemWallet{};return true;
    }
    if(signature!="NUTBUSTER_NATIVE_PREVIEW_V2"&&
       signature!="NUTBUSTER_NATIVE_PREVIEW_V3"&&
       signature!="NUTBUSTER_NATIVE_PREVIEW_V4")return false;
    nut::Mine loaded;
    if(!loaded.load(file))return false;
    HoldStock loadedStock;
    const bool v4=signature=="NUTBUSTER_NATIVE_PREVIEW_V4";
    if((v4||signature=="NUTBUSTER_NATIVE_PREVIEW_V3")&&
       !loadedStock.read(file,!v4))return false;
    GemWallet loadedWallet; // V1-V3 migrate once with mobile's 25 starting gems
    if(v4&&!loadedWallet.read(file))return false;
    mine=loaded;stock=loadedStock;wallet=loadedWallet;
    unlocked=std::clamp(level,1,1000);return true;
  }
  bool saveTo(std::ostream& file)const{
    file<<"NUTBUSTER_NATIVE_PREVIEW_V4 "<<unlocked<<"\n";
    return bool(file)&&mine.save(file)&&stock.write(file)&&wallet.write(file);
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
  void startLevel() {
    board.reset(selectedLevel,uint32_t(selectedLevel)*7919U);
    selected=-1;holdMode=HoldMode::Swap;scene=Scene::Board;
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
  int cellAt(float x,float y)const {
    int tile=std::min(74,490/board.height());
    int ox=(WIDTH-tile*board.width())/2,oy=215;
    if(!within(x,y,float(ox),float(oy),float(tile*board.width()),float(tile*board.height())))return -1;
    return int((y-oy)/tile)*board.width()+int((x-ox)/tile);
  }
  void click(float x,float y){
    if(scene==Scene::Menu){
      if(within(x,y,324,238,376,66)){selectedLevel=std::clamp(selectedLevel,1,unlocked);scene=Scene::Campaign;}
      else if(within(x,y,324,332,376,66)&&unlocked>500)makeMine();
      else if(within(x,y,324,426,376,66))quitRequested=true;
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
    if(within(x,y,24,20,145,46)) {scene=Scene::Menu;selected=-1;return;}
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
    nut::Turn result=board.swap(a,b);
    selected=-1;
    if(!result.valid){selected=b;return;}
    if(result.won){wallet.win();unlocked=std::max(unlocked,std::min(1000,selectedLevel+1));save();scene=Scene::Won;}
    else if(result.lost)scene=Scene::Lost;
  }
  void render(SDL_Renderer* r){
    fill(r,0,0,WIDTH,HEIGHT,{29,14,33,255});
    fill(r,0,0,WIDTH,102,{83,36,61,255});
    label(r,332,28,"NUTBUSTER",4);
    if(scene==Scene::Menu){
      label(r,292,155,"NATIVE WINDOWS / LINUX PREVIEW",2);
      button(r,324,238,376,66,"CAMPAIGN");
      button(r,324,332,376,66,unlocked>500?"NUTVALE MINES":"MINES UNLOCK AT 500");
      button(r,324,426,376,66,"EXIT");
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
    if(scene==Scene::Board){
      button(r,775,114,185,46,"HOLD SHOP");
      label(r,780,172,"GEMS "+std::to_string(wallet.gems),2);
      label(r,190,108,"LEVEL "+std::to_string(board.level())+"  MOVES "+
                    std::to_string(board.moves()),2);
      std::string title=board.stage().title;
      if(title.size()>64)title=title.substr(0,64);
      label(r,190,132,title,2);
      for(int g=0;g<2;++g){
        const auto& objective=board.stage().goals[size_t(g)];
        if(objective.kind==nut::GoalKind::None)continue;
        label(r,190,160+g*20,board.objectiveLabel(g)+" "+
          std::to_string(board.objectiveValue(g))+"/"+std::to_string(objective.target),2);
      }
      const int tile=std::min(74,490/board.height());
      const int ox=(WIDTH-tile*board.width())/2,oy=215;
      for(int i=0;i<board.size();++i){
        const auto& c=board.cell(i);
        if(c.type<0)continue; // preserve actual authored board silhouette
        const int x=ox+(i%board.width())*tile,y=oy+(i/board.width())*tile;
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
      button(r,180,713,260,44,"BUTTER "+std::to_string(stock.butter));
      button(r,452,713,260,44,"JAM "+std::to_string(stock.jam));
      label(r,730,724,holdMode==HoldMode::Butter?"TAP NUT: 1 DROP":
          holdMode==HoldMode::Jam?"TAP NUT: 2 DROPS":
          stock.butter+stock.jam==0?"BUY IN HOLD SHOP":"DRAG TO SWAP",1);
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
    if(!game.saveTo(saved))throw std::runtime_error("V4 save");
    Game restored;
    if(!restored.loadFrom(saved)||restored.stock.butter!=4||
       restored.stock.jam!=7||restored.unlocked!=23||restored.wallet.gems!=43)
      throw std::runtime_error("V4 stock and gem wallet roundtrip");
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
    report="PASS native Butter/Jam click, finite debit, V1-V3 migration and V4 wallet/stock persistence";
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
    report="PASS native shop click/confirm/cancel, 15/30 gem debit, insufficiency, use and V4 persistence";
    return true;
  }catch(const std::exception& e){
    report=std::string("FAIL native hold shop: ")+e.what();return false;
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
    std::string boardReport,mineReport,holdReport,shopReport;
    bool boardOk=nut::selfTest(boardReport),mineOk=nut::mineSelfTest(mineReport);
    bool holdOk=holdUiSelfTest(holdReport),shopOk=shopUiSelfTest(shopReport);
    std::cout<<boardReport<<"\n"<<mineReport<<"\n"<<holdReport<<"\n"<<shopReport<<"\n";
    return boardOk&&mineOk&&holdOk&&shopOk?0:1;
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
    SDL_Event event;
    while(SDL_PollEvent(&event)){
      if(event.type==SDL_EVENT_QUIT)running=false;
      if(event.type==SDL_EVENT_KEY_DOWN&&event.key.key==SDLK_ESCAPE)game.scene=Game::Scene::Menu;
      if(event.type==SDL_EVENT_MOUSE_BUTTON_DOWN&&event.button.button==SDL_BUTTON_LEFT){
        game.down=(game.scene==Game::Scene::Board&&game.holdMode==Game::HoldMode::Swap)?game.cellAt(event.button.x,event.button.y):-1;
      }
      if(event.type==SDL_EVENT_MOUSE_BUTTON_UP&&event.button.button==SDL_BUTTON_LEFT){
        const int up=(game.scene==Game::Scene::Board)?game.cellAt(event.button.x,event.button.y):-1;
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
  for(auto& entry:game.images)SDL_DestroyTexture(entry.second);
  SDL_DestroyRenderer(renderer);
  SDL_DestroyWindow(win);
  SDL_Quit();return 0;
}
