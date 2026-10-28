#pragma once
#include "campaign.hpp"
#include "hold.hpp"
#include <array>
#include <cstdint>
#include <string>
#include <vector>
namespace nut {
struct Turn { bool valid=false; int cleared=0; bool won=false; bool lost=false; };
class Board {
public:
 explicit Board(int level=1,uint32_t seed=7919);
 void reset(int level,uint32_t seed);
 Turn swap(int a,int b);
 // Preview-only simulation API: no inventory or shop is claimed.
 bool applyHold(HoldKind kind,int index);
 int holdUses(HoldKind kind)const{return kind==HoldKind::Butter?butterUses_:kind==HoldKind::Jam?jamUses_:0;}
 int width()const{return w_;}
 int height()const{return h_;}
 int level()const{return level_;}
 int moves()const{return moves_;}
 int score()const{return score_;}
 int goal()const{return goal_;}
 int size()const{return int(cells_.size());}
 int tile(int i)const{return cells_.at(size_t(i)).type;}
 const StageCell& cell(int i)const{return cells_.at(size_t(i));}
 int pendingMatches()const;
 const Stage& stage()const{return campaignStage(level_);}
 int objectiveValue(int index)const;
 bool completed()const;
 std::string objectiveLabel(int index)const;
private:
 int w_=4,h_=5,level_=1,moves_=36,score_=0,goal_=3500,turns_=0;
 uint32_t seed_=7919;
 std::vector<StageCell> cells_;
 std::vector<bool> mask_;
 std::array<int,19> colors_{};
 int crackedIce_=0,crackedLocks_=0,crackedChests_=0,cleanedJam_=0;
 int butterUses_=0,jamUses_=0;
 int draw(int bound);
 std::vector<int> matched()const;
 bool adjacent(int a,int b)const;
 int settle();
 void damage(int i,int& removed);
 void gravity();
};
bool selfTest(std::string& report);
}
