#pragma once
#include "campaign.hpp"
#include <algorithm>
#include <functional>
#include <stdexcept>
#include <vector>

namespace nut {
// The mobile engine's butter_hold and jam_hold are measured in *gravity
// resolutions*, not player turns. The hold is a nut payload, never a tile layer.
enum class HoldKind { Butter = 1, Jam = 2 };

inline int holdDrops(HoldKind kind) {
 return kind==HoldKind::Butter?1:kind==HoldKind::Jam?2:0;
}

inline bool applyHoldToCells(std::vector<StageCell>& cells,
                             const std::vector<bool>& mask,
                             int index,HoldKind kind,bool finished=false) {
 const int drops=holdDrops(kind);
 if(finished||!drops||index<0||index>=int(cells.size())||
    mask.size()!=cells.size()||!mask[size_t(index)])return false;
 auto& c=cells[size_t(index)];
 if(c.type<0||c.pinned()||c.hold>=drops)return false;
 c.hold=drops;
 return true;
}

// The extra 120 points are added to the ordinary 60 points for each
// matched held nut: 180 total (3x), at the source cascade multiplier.
inline int heldMatchBonus(const std::vector<StageCell>& cells,
                          const std::vector<int>& matched,int loop) {
 int held=0;
 for(int index:matched)
  if(index>=0&&index<int(cells.size())&&cells[size_t(index)].hold>0)
   ++held;
 return held*120*std::min(loop,6);
}

// Only type + hold travel. Ice, chains, chests, jam and fuses remain on
// their authored cells. Voids and occupied pinned/held nuts split gravity.
inline void gravityWithHolds(std::vector<StageCell>& cells,
                             const std::vector<bool>& mask,
                             int width,int height,
                             const std::vector<int>& roster,
                             const std::function<int(int)>& draw) {
 if(width<=0||height<=0||int(cells.size())!=width*height||
    mask.size()!=cells.size()||roster.empty())
  throw std::invalid_argument("Invalid native hold gravity board");
 bool didDrop=false;
 for(size_t i=0;i<cells.size();++i)
  if(mask[i]&&cells[i].type==-2)didDrop=true;
 for(int x=0;x<width;++x) {
  int y=height-1;
  while(y>=0) {
   while(y>=0&&!mask[size_t(y*width+x)])--y;
   if(y<0)break;
   const int bottom=y;
   while(y>=0&&mask[size_t(y*width+x)])--y;
   const int top=y+1;
   int end=bottom;
   auto compact=[&](int first,int last) {
    if(first>last)return;
    struct Payload {int type,hold;};
    std::vector<Payload> survivors;
    for(int q=last;q>=first;--q) {
     const auto& c=cells[size_t(q*width+x)];
     if(c.type>=0)survivors.push_back({c.type,c.hold});
    }
    int n=0;
    for(int q=last;q>=first;--q,++n) {
     auto& c=cells[size_t(q*width+x)];
     if(n<int(survivors.size())) {
      c.type=survivors[size_t(n)].type;
      c.hold=survivors[size_t(n)].hold;
     } else {
      const int chosen=draw(int(roster.size()));
      if(chosen<0||chosen>=int(roster.size()))
       throw std::out_of_range("Native hold gravity roster draw");
      c.type=roster[size_t(chosen)];
      c.hold=0;
     }
    }
   };
   for(int at=bottom;at>=top-1;--at) {
    if(at==top-1||
       (cells[size_t(at*width+x)].type>=0&&
        (cells[size_t(at*width+x)].pinned()||
         cells[size_t(at*width+x)].hold>0))) {
     compact(at+1,end);
     end=at-1;
    }
   }
  }
 }
 // No vacancy: no drop consumed, including a nonmatching swap.
 if(didDrop)
  for(size_t i=0;i<cells.size();++i)
   if(mask[i]&&cells[i].hold>0)--cells[i].hold;
}
} // namespace nut
