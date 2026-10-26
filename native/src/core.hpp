#pragma once
#include <cstdint>
#include <string>
#include <vector>

namespace nut {
struct Turn { bool valid=false; int cleared=0; bool won=false; bool lost=false; };
class Board {
public:
  explicit Board(int level=1, uint32_t seed=7919);
  void reset(int level,uint32_t seed);
  Turn swap(int a,int b);
  int width() const { return w_; }
  int height() const { return h_; }
  int level() const { return level_; }
  int moves() const { return moves_; }
  int score() const { return score_; }
  int goal() const { return goal_; }
  int size() const { return static_cast<int>(cells_.size()); }
  int tile(int i) const { return cells_.at(i); }
  int pendingMatches() const;
private:
  int w_=4,h_=5,level_=1,moves_=36,score_=0,goal_=3500;
  uint32_t seed_=7919;
  std::vector<int> cells_;
  int draw(int bound);
  std::vector<int> matched() const;
  int settle();
};
bool selfTest(std::string& result);
}
