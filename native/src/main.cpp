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
struct Game {
  nut::Board board{1,7919};
  enum class Scene{Menu,Board,Mine,Won,Lost};
  Scene scene=Scene::Menu;
  std::map<std::string,SDL_Texture*> images;
  int unlocked=1,selected=-1,down=-1;
  nut::Mine mine{};
  enum class MineTab {Dig,Equipment,Workshop};
  enum class MineMode {Dig,Scan,Blast,Lens,Collect};
  MineTab mineTab=MineTab::Dig;
  MineMode mineMode=MineMode::Dig;
  fs::path savePath;
  bool smoke=false,quitRequested=false;
  void load() {
    std::ifstream file(savePath);
    std::string signature;int level=1;
    if(!(file>>signature>>level))return;
    if(signature=="NUTBUSTER_NATIVE_PREVIEW_V1"){unlocked=std::clamp(level,1,1000);return;}
    if(signature=="NUTBUSTER_NATIVE_PREVIEW_V2"){
      nut::Mine loaded;
      if(loaded.load(file)){mine=loaded;unlocked=std::clamp(level,1,1000);}
    }
  }
  void save() {
    if(smoke)return;
    std::ofstream file(savePath,std::ios::trunc);
    file<<"NUTBUSTER_NATIVE_PREVIEW_V2 "<<unlocked<<"\n";
    mine.save(file);
  }
  void startLevel() {
    board.reset(unlocked,uint32_t(unlocked)*7919U);
    selected=-1;scene=Scene::Board;
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
    for(const char* nut:NUTS){
      std::string key=std::string("nuts/")+nut;
      if(!texture(r,root,key))return false;
    }
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
      if(within(x,y,324,238,376,66))startLevel();
      else if(within(x,y,324,332,376,66)&&unlocked>500)makeMine();
      else if(within(x,y,324,426,376,66))quitRequested=true;
      return;
    }
    if(scene==Scene::Won||scene==Scene::Lost){
      if(within(x,y,320,350,384,68)) { if(scene==Scene::Won)startLevel(); else scene=Scene::Menu; }
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
    if(scene==Scene::Board){
      int i=cellAt(x,y);if(i<0)return;
      if(selected>=0&&selected!=i)perform(selected,i);
      else selected=i;
    }
  }
  void perform(int a,int b){
    nut::Turn result=board.swap(a,b);
    selected=-1;
    if(!result.valid){selected=b;return;}
    if(result.won){unlocked=std::min(1000,unlocked+1);save();scene=Scene::Won;}
    else if(result.lost)scene=Scene::Lost;
  }
  void render(SDL_Renderer* r){
    fill(r,0,0,WIDTH,HEIGHT,{29,14,33,255});
    fill(r,0,0,WIDTH,102,{83,36,61,255});
    label(r,332,28,"NUTBUSTER",4);
    if(scene==Scene::Menu){
      label(r,292,155,"NATIVE WINDOWS / LINUX PREVIEW",2);
      button(r,324,238,376,66,"PLAY LEVEL "+std::to_string(unlocked));
      button(r,324,332,376,66,unlocked>500?"NUTVALE MINES":"MINES UNLOCK AT 500");
      button(r,324,426,376,66,"EXIT");
      label(r,160,590,"Native SDL3 rendering. No Chromium, Electron or WebView.",2);
      label(r,160,630,"Preview only: full design-book feature parity pending.",2);
      return;
    }
    if(scene==Scene::Won||scene==Scene::Lost){
      label(r,320,250,scene==Scene::Won?"LEVEL COMPLETE":"LEVEL ENDED",3);
      button(r,320,350,384,68,scene==Scene::Won?"NEXT LEVEL":"RETURN TO MENU");
      return;
    }
    button(r,24,20,145,46,"BACK");
    if(scene==Scene::Board){
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
      }
      label(r,204,715,"Drag adjacent nuts or click two tiles.",2);
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
}
int main(int argc,char** argv){
  std::string screenshot,fixtureFile;int previewStage=0;bool self=false,previewMine=false,previewBoard=false,smokeDig=false,previewEquip=false,previewRefinery=false;
  for(int i=1;i<argc;++i){
    std::string arg=argv[i];
    if(arg=="--self-test")self=true;
    else if(arg=="--verify-mine-fixtures"&&i+1<argc)fixtureFile=argv[++i];
    else if(arg=="--preview-mine")previewMine=true;
    else if(arg=="--smoke-mine-dig"){previewMine=true;smokeDig=true;}
    else if(arg=="--preview-equipment"){previewMine=true;previewEquip=true;}
    else if(arg=="--preview-refinery"){previewMine=true;previewRefinery=true;}
    else if(arg=="--preview-board")previewBoard=true;
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
    std::string boardReport,mineReport;
    bool boardOk=nut::selfTest(boardReport),mineOk=nut::mineSelfTest(mineReport);
    std::cout<<boardReport<<"\n"<<mineReport<<"\n";return boardOk&&mineOk?0:1;
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
  if(previewMine)game.makeMine();
  else if(previewStage>0){
    game.board.reset(previewStage,uint32_t(previewStage)*7919U);
    game.scene=Game::Scene::Board;
  }
  else if(previewBoard)game.startLevel();
  if(previewEquip)game.mineTab=Game::MineTab::Equipment;
  if(previewRefinery)game.mineTab=Game::MineTab::Workshop;
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
        game.down=(game.scene==Game::Scene::Board)?game.cellAt(event.button.x,event.button.y):-1;
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
