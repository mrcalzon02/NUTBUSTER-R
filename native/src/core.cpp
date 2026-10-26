#include "core.hpp"
#include <algorithm>
#include <array>
#include <cmath>
#include <stdexcept>

namespace nut {
Board::Board(int level,uint32_t seed) { reset(level,seed); }
int Board::draw(int bound) {
  seed_^=seed_<<13;seed_^=seed_>>17;seed_^=seed_<<5;
  return static_cast<int>(seed_%static_cast<uint32_t>(bound));
}
void Board::reset(int level,uint32_t seed) {
  level_=std::clamp(level,1,1000);
  w_=level_<=10?4:level_<=30?5:level_<=70?6:level_<=140?7:8;
  h_=w_+1;
  moves_=std::max(12,36-level_/37);
  score_=0;
  // Temporary desktop preview score objective, not a claim of full JS design-book parity.
  goal_=3500+level_*110;
  seed_=seed?seed:7919;
  cells_.assign(w_*h_,0);
  const int colors=std::clamp(3+(level_-1)/100,3,7);
  for(int y=0;y<h_;++y) for(int x=0;x<w_;++x) {
    std::array<int,7> valid{};int n=0;
    for(int t=0;t<colors;++t) {
      if(x>=2&&cells_[y*w_+x-1]==t&&cells_[y*w_+x-2]==t) continue;
      if(y>=2&&cells_[(y-1)*w_+x]==t&&cells_[(y-2)*w_+x]==t) continue;
      valid[n++]=t;
    }
    cells_[y*w_+x]=valid[draw(n)];
  }
}
std::vector<int> Board::matched() const {
  std::vector<int> found;
  for(int y=0;y<h_;++y) {
    for(int x=0;x<w_;) {
      int end=x+1;
      while(end<w_&&cells_[y*w_+x]>=0&&cells_[y*w_+end]==cells_[y*w_+x]) ++end;
      if(end-x>=3) for(int k=x;k<end;++k) found.push_back(y*w_+k);
      x=end;
    }
  }
  for(int x=0;x<w_;++x) {
    for(int y=0;y<h_;) {
      int end=y+1;
      while(end<h_&&cells_[y*w_+x]>=0&&cells_[end*w_+x]==cells_[y*w_+x]) ++end;
      if(end-y>=3) for(int k=y;k<end;++k) found.push_back(k*w_+x);
      y=end;
    }
  }
  std::sort(found.begin(),found.end());
  found.erase(std::unique(found.begin(),found.end()),found.end());
  return found;
}
int Board::pendingMatches() const { return static_cast<int>(matched().size()); }
int Board::settle() {
  int cleared=0;
  for(int combo=0;combo<60;++combo) {
    auto hits=matched();
    if(hits.empty()) break;
    cleared+=static_cast<int>(hits.size());
    score_+=static_cast<int>(hits.size())*100*(combo+1);
    for(int i:hits) cells_[i]=-1;
    for(int x=0;x<w_;++x) {
      int dest=h_-1;
      for(int y=h_-1;y>=0;--y) {
        int t=cells_[y*w_+x];
        if(t>=0) cells_[dest--*w_+x]=t;
      }
      while(dest>=0) cells_[dest--*w_+x]=draw(std::clamp(3+(level_-1)/100,3,7));
    }
  }
  return cleared;
}
Turn Board::swap(int a,int b) {
  if(a<0||b<0||a>=size()||b>=size()||a==b||moves_<=0||score_>=goal_) return {};
  int dx=std::abs(a%w_-b%w_),dy=std::abs(a/w_-b/w_);
  if(dx+dy!=1) return {};
  std::swap(cells_[a],cells_[b]);
  --moves_; // Matching and non-matching adjacent swaps consume exactly one move.
  int cleared=settle();
  return {true,cleared,score_>=goal_,moves_<=0&&score_<goal_};
}
bool selfTest(std::string& out) {
  try {
    for(int level:{1,10,11,30,31,70,71,140,141,500,1000}) {
      for(uint32_t seed=1;seed<=150;++seed) {
        Board b(level,seed);
        if(b.pendingMatches()!=0) throw std::runtime_error("unexpected starting match");
        if(b.size()!=b.width()*b.height()) throw std::runtime_error("invalid board");
        if(b.swap(0,b.size()-1).valid) throw std::runtime_error("invalid distant swap");
        int moves=b.moves();
        if(!b.swap(0,1).valid||b.moves()!=moves-1||b.pendingMatches()!=0)
          throw std::runtime_error("legal swap, move cost, or cascade error");
      }
    }
    out="PASS: 1650 deterministic native boards, legal/illegal swaps, gravity and cascade";
    return true;
  } catch(const std::exception& e) {
    out=std::string("FAIL: ")+e.what();return false;
  }
}
}
