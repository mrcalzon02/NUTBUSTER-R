#include "core.hpp"
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
struct Rock {int hits=0,hard=1,ore=0,mineral=-1;};
struct Game {
  nut::Board board{1,7919};
  enum class Scene{Menu,Board,Mine,Won,Lost};
  Scene scene=Scene::Menu;
  std::map<std::string,SDL_Texture*> images;
  int unlocked=1,selected=-1,down=-1,mineStrikes=12,mineOre=0,mineGems=0;
  std::array<Rock,16> rocks{};
  fs::path savePath;
  bool smoke=false,quitRequested=false;
  void load() {
    std::ifstream file(savePath);
    std::string signature;int level=1;
    if(file>>signature>>level && signature=="NUTBUSTER_NATIVE_PREVIEW_V1")
      unlocked=std::clamp(level,1,1000);
  }
  void save() {
    if(smoke)return;
    std::ofstream file(savePath,std::ios::trunc);
    file<<"NUTBUSTER_NATIVE_PREVIEW_V1 "<<unlocked<<"\n";
  }
  void startLevel() {
    board.reset(unlocked,uint32_t(unlocked)*7919U);
    selected=-1;scene=Scene::Board;
  }
  void makeMine(){
    for(int y=0;y<4;++y)for(int x=0;x<4;++x){
      Rock& t=rocks[y*4+x];t={};
      const int chance=roll(4099,x,y,0x248fd19dU);
      const int hardness=roll(4099,x,y,0x74220a3bU);
      t.hard=hardness<55?1:hardness<90?2:3;
      const int pick=roll(4099,x,y,0x6ad39f11U);
      if(chance<45){t.ore=0;t.mineral=-1;}
      else if(chance<85){t.ore=1;t.mineral=pick%4;}
      else if(chance<97){t.ore=2;t.mineral=4+pick%8;}
      else {t.ore=4;t.mineral=12+pick%5;}
    }
    mineStrikes=12;mineOre=0;mineGems=0;scene=Scene::Mine;
  }
  std::string rockSprite(const Rock& t)const{
    if(t.hits<t.hard)return t.hits==0?"r1c1":t.hits==1?"r1c4":"r1c5";
    return t.mineral<0?"r4c1":FINDS.at(size_t(t.mineral));
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
    return true;
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
    int tile=std::min(80,480/board.width());
    int ox=(WIDTH-tile*board.width())/2,oy=166;
    if(!within(x,y,float(ox),float(oy),float(tile*board.width()),float(tile*board.height())))return -1;
    return int((y-oy)/tile)*board.width()+int((x-ox)/tile);
  }
  void click(float x,float y){
    if(scene==Scene::Menu){
      if(within(x,y,324,238,376,66))startLevel();
      else if(within(x,y,324,332,376,66)&&unlocked>=500)makeMine();
      else if(within(x,y,324,426,376,66))quitRequested=true;
      return;
    }
    if(scene==Scene::Won||scene==Scene::Lost){
      if(within(x,y,320,350,384,68)) { if(scene==Scene::Won)startLevel(); else scene=Scene::Menu; }
      return;
    }
    if(within(x,y,24,20,145,46)) {scene=Scene::Menu;selected=-1;return;}
    if(scene==Scene::Mine){
      if(mineStrikes<=0)return;
      const int tile=103,ox=(WIDTH-4*tile)/2,oy=176;
      if(!within(x,y,float(ox),float(oy),412,412))return;
      const int i=int((y-oy)/tile)*4+int((x-ox)/tile);
      Rock& rock=rocks[size_t(i)];
      if(rock.hits>=rock.hard)return;
      --mineStrikes;++rock.hits;
      if(rock.hits==rock.hard){
        mineOre+=rock.ore;
        if(rock.mineral>=5&&rock.mineral<=10)++mineGems;
      }
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
      button(r,324,332,376,66,unlocked>=500?"NUTVALE MINES":"MINES UNLOCK AT 500");
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
      label(r,220,115,"LEVEL "+std::to_string(board.level())+"   MOVES "+std::to_string(board.moves()),2);
      label(r,220,142,"SCORE "+std::to_string(board.score())+" / "+std::to_string(board.goal()),2);
      const int tile=std::min(80,480/board.width());
      const int ox=(WIDTH-tile*board.width())/2,oy=166;
      for(int i=0;i<board.size();++i){
        int x=ox+(i%board.width())*tile,y=oy+(i/board.width())*tile;
        fill(r,x,y,tile-3,tile-3,i==selected?SDL_Color{209,166,80,255}:SDL_Color{58,35,56,255});
        sprite(r,std::string("nuts/")+NUTS.at(size_t(board.tile(i))),x+5,y+5,tile-13,tile-13);
      }
      label(r,220,700,"Drag one tile onto its neighbor, or click two tiles.",2);
    } else if(scene==Scene::Mine){
      label(r,250,115,"NUTVALE MINES - APPROVED ORE ATLAS",2);
      label(r,250,142,"STRIKES "+std::to_string(mineStrikes)+"   ORE "+std::to_string(mineOre)+"   GEMS "+std::to_string(mineGems),2);
      const int tile=103,ox=(WIDTH-4*tile)/2,oy=176;
      for(int i=0;i<16;++i){
        int x=ox+(i%4)*tile,y=oy+(i/4)*tile;
        fill(r,x,y,tile-4,tile-4,{58,35,56,255});
        sprite(r,"mine/"+rockSprite(rocks[size_t(i)]),x+5,y+5,tile-14,tile-14);
      }
      label(r,220,660,"Native mine interaction preview. Refinery/cart/equipment not ported.",2);
    }
  }
};
}
int main(int argc,char** argv){
  std::string screenshot;bool self=false,previewMine=false,previewBoard=false;
  for(int i=1;i<argc;++i){
    std::string arg=argv[i];
    if(arg=="--self-test")self=true;
    else if(arg=="--preview-mine")previewMine=true;
    else if(arg=="--preview-board")previewBoard=true;
    else if(arg=="--smoke-render"&&i+1<argc)screenshot=argv[++i];
  }
  if(self){std::string result;bool good=nut::selfTest(result);std::cout<<result<<"\n";return good?0:1;}
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
  const fs::path data=fs::path(SDL_GetBasePath())/"data";
  if(!game.loadArt(renderer,data)){SDL_DestroyRenderer(renderer);SDL_DestroyWindow(win);SDL_Quit();return 2;}
  if(previewMine)game.makeMine();
  else if(previewBoard)game.startLevel();
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
