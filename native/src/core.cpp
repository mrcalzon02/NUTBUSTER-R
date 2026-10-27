#include "core.hpp"
#include <algorithm>
#include <array>
#include <cmath>
#include <set>
#include <stdexcept>
#include <string>

namespace nut {
Board::Board(int level,uint32_t seed){reset(level,seed);}
int Board::draw(int bound){
 seed_^=seed_<<13;seed_^=seed_>>17;seed_^=seed_<<5;
 return int((double(seed_)/4294967296.0)*bound); // JS xorshift float selection
}
void Board::reset(int level,uint32_t seed){
 const auto& authored=campaignStage(std::clamp(level,1,1000));
 level_=authored.level;w_=authored.width;h_=authored.height;
 moves_=authored.moves;goal_=authored.scoreGoal;score_=0;turns_=0;
 seed_=seed?seed:uint32_t(level_)*7919U;
 cells_=authored.cells;
 mask_.clear();mask_.reserve(cells_.size());
 for(const auto& c:cells_)mask_.push_back(c.exists());
 colors_.fill(0);crackedIce_=0;crackedLocks_=0;crackedChests_=0;cleanedJam_=0;
}
bool Board::adjacent(int a,int b)const{
 if(a<0||b<0||a>=size()||b>=size()||a==b)return false;
 if(!mask_[size_t(a)]||!mask_[size_t(b)])return false;
 if(cells_[size_t(a)].pinned()||cells_[size_t(b)].pinned())return false;
 return std::abs(a%w_-b%w_)+std::abs(a/w_-b/w_)==1;
}
std::vector<int> Board::matched()const{
 std::vector<int> hit;
 auto type=[&](int i){const auto& c=cells_[size_t(i)];return c.pinned()?-1:c.type;};
 for(int y=0;y<h_;++y)
  for(int x=0;x<w_;){
   int end=x+1,first=type(y*w_+x);
   while(end<w_&&first>=0&&type(y*w_+end)==first)++end;
   if(end-x>=3)for(int i=x;i<end;++i)hit.push_back(y*w_+i);
   x=end;
  }
 for(int x=0;x<w_;++x)
  for(int y=0;y<h_;){
   int end=y+1,first=type(y*w_+x);
   while(end<h_&&first>=0&&type(end*w_+x)==first)++end;
   if(end-y>=3)for(int i=y;i<end;++i)hit.push_back(i*w_+x);
   y=end;
  }
 std::sort(hit.begin(),hit.end());
 hit.erase(std::unique(hit.begin(),hit.end()),hit.end());
 return hit;
}
int Board::pendingMatches()const{return int(matched().size());}
void Board::damage(int i,int& removed){
 auto& c=cells_[size_t(i)];
 if(c.type<0)return;
 if(c.jam>0){--c.jam;++cleanedJam_;return;}
 if(c.ice>0){--c.ice;++crackedIce_;return;}
 if(c.lock>0){--c.lock;++crackedLocks_;return;}
 if(c.chest>0){--c.chest;++crackedChests_;return;}
 if(c.fuse>0){c.fuse=0;return;}
 ++colors_[size_t(c.type)];c.type=-2;++removed; // -1=void, -2=cleared position
}
void Board::gravity(){
 const auto& roster=stage().roster;
 // Retain map holes and pinned blocker layers. Movable type identities fall
 // through contiguous column spans bounded by fixed blockers.
 for(int x=0;x<w_;++x){
  int y=h_-1;
  while(y>=0){
   while(y>=0&&!mask_[size_t(y*w_+x)])--y;
   if(y<0)break;
   int bottom=y;
   while(y>=0&&mask_[size_t(y*w_+x)])--y;
   const int top=y+1;
   int end=bottom;
   auto compact=[&](int first,int last){
    if(first>last)return;
    std::vector<int> survivors;
    for(int q=last;q>=first;--q){
     const int t=cells_[size_t(q*w_+x)].type;
     if(t>=0)survivors.push_back(t);
    }
    int offset=0;
    for(int q=last;q>=first;--q,++offset){
     auto& cell=cells_[size_t(q*w_+x)];
     cell.type=offset<int(survivors.size())?survivors[size_t(offset)]:roster[size_t(draw(int(roster.size())))];
    }
   };
   for(int at=bottom;at>=top-1;--at){
    if(at==top-1||cells_[size_t(at*w_+x)].pinned()){
     compact(at+1,end);end=at-1;
    }
   }
  }
 }
}
int Board::settle(){
 int total=0;
 for(int loop=1;loop<=60;++loop){
  auto matchedCells=matched();if(matchedCells.empty())break;
  std::set<int> hit(matchedCells.begin(),matchedCells.end());
  for(int i:matchedCells){
   const int row=i/w_;
   for(int j:{i-1,i+1,i-w_,i+w_}){
    if(j<0||j>=size())continue;
    if(std::abs(j-i)==1&&j/w_!=row)continue;
    if(mask_[size_t(j)]&&cells_[size_t(j)].pinned())hit.insert(j);
   }
  }
  int removed=0;
  for(int i:hit)damage(i,removed);
  total+=removed;
  score_+=int(hit.size())*60*std::min(loop,6);
  gravity();
 }
 return total;
}
int Board::objectiveValue(int index)const{
 if(index<0||index>=2)throw std::out_of_range("Goal index");
 const auto& goal=stage().goals[size_t(index)];
 switch(goal.kind){
 case GoalKind::None:return 0;
 case GoalKind::Score:return score_;
 case GoalKind::Collect:return colors_[size_t(goal.color)];
 case GoalKind::Ice:return crackedIce_;
 case GoalKind::Locks:return crackedLocks_;
 case GoalKind::Chests:return crackedChests_;
 case GoalKind::Jam:return cleanedJam_;
 }
 return 0;
}
std::string Board::objectiveLabel(int index)const{
 const auto& goal=stage().goals.at(size_t(index));
 switch(goal.kind){
 case GoalKind::Score:return "SCORE";
 case GoalKind::Collect:return "COLLECT NUT "+std::to_string(goal.color);
 case GoalKind::Ice:return "BREAK ICE";
 case GoalKind::Locks:return "BREAK LOCKS";
 case GoalKind::Chests:return "OPEN CHESTS";
 case GoalKind::Jam:return "SCRUB BUTTER";
 case GoalKind::None:return "";
 }
 return "";
}
bool Board::completed()const{
 for(int i=0;i<2;++i){
  const auto& goal=stage().goals[size_t(i)];
  if(goal.kind!=GoalKind::None&&objectiveValue(i)<goal.target)return false;
 }
 return true;
}
Turn Board::swap(int a,int b){
 if(moves_<=0||completed()||!adjacent(a,b))return {};
 std::swap(cells_[size_t(a)].type,cells_[size_t(b)].type);
 --moves_;++turns_;
 const int removed=settle();
 // Source game bombs and sticky butter advance each turn. More elaborate
 // elemental/board-feature effects remain a separate parity milestone.
 if(!completed()){
  for(auto& c:cells_){
   if(c.fuse>0&&!--c.fuse)moves_=std::max(0,moves_-2);
  }
 }
 if(!completed()&&turns_%3==0){
  const auto& cfg=stage();
  const bool hasJam=std::any_of(cells_.begin(),cells_.end(),[](const StageCell& c){return c.jam>0;});
  if(hasJam){
   for(int i=0;i<size();++i){
    if(cells_[size_t(i)].jam<=0)continue;
    std::vector<int> eligible;
    for(int j:{i-w_,i+w_,i-1,i+1}){
     if(j<0||j>=size()||(std::abs(j-i)==1&&j/w_!=i/w_))continue;
     if(mask_[size_t(j)]&&cells_[size_t(j)].jam==0)eligible.push_back(j);
    }
    if(!eligible.empty()){cells_[size_t(eligible[size_t(draw(int(eligible.size())))])].jam=1;break;}
   }
  }
  (void)cfg;
 }
 return {true,removed,completed(),moves_<=0&&!completed()};
}
bool selfTest(std::string& report){
 try{
  if(!campaignReady())throw std::runtime_error("authored stages not loaded");
  int legal=0;
  for(int level=1;level<=1000;++level){
   const auto& cfg=campaignStage(level);
   Board b(level,uint32_t(level)*7919U);
   if(b.width()!=cfg.width||b.height()!=cfg.height||b.moves()!=cfg.moves||
      b.goal()!=cfg.scoreGoal||b.pendingMatches()!=0)
    throw std::runtime_error("stage layout/moves/score parity level "+std::to_string(level));
   for(int i=0;i<b.size();++i){
    auto a=b.cell(i),source=cfg.cells[size_t(i)];
    if(a.type!=source.type||a.ice!=source.ice||a.lock!=source.lock||
       a.chest!=source.chest||a.jam!=source.jam||a.fuse!=source.fuse)
     throw std::runtime_error("seeded cell drift at level "+std::to_string(level));
   }
   if(b.swap(0,b.size()-1).valid)throw std::runtime_error("invalid distant swap");
   int pairA=-1,pairB=-1;
   for(int i=0;i<b.size()&&pairA<0;++i){
    for(int j:{i+1,i+b.width()}){
     if(j>=b.size()||b.cell(i).type<0||b.cell(j).type<0||
        b.cell(i).pinned()||b.cell(j).pinned()||
        std::abs(i/b.width()-j/b.width())+std::abs(i%b.width()-j%b.width())!=1)continue;
     pairA=i;pairB=j;break;
    }
   }
   if(pairA<0)throw std::runtime_error("stage without playable adjacent cells");
   int before=b.moves();const Turn turn=b.swap(pairA,pairB);
   if(!turn.valid||b.moves()>before-1||b.pendingMatches()!=0)
    throw std::runtime_error("native turn/matching invariant level "+std::to_string(level));
   ++legal;
  }
  report="PASS 1000 source-authored native stages, seeded cell types/layers, objectives, valid move and gravity";
  return true;
 }catch(const std::exception& e){report=std::string("FAIL native campaign: ")+e.what();return false;}
}
}
