#pragma once
#include <array>
#include <iosfwd>
#include <string>
#include <vector>
namespace nut {
enum class GoalKind : int {None=-1,Score=0,Collect=1,Ice=2,Locks=3,Chests=4,Jam=5};
struct Goal {
 GoalKind kind=GoalKind::None;
 int target=0,color=-1;
};
struct StageCell {
 int type=-1,ice=0,lock=0,chest=0,jam=0,fuse=0;
 bool exists()const{return type>=0;}
 bool pinned()const{return ice>0||lock>0||chest>0;}
};
struct Stage {
 int level=0,width=0,height=0,moves=0,scoreGoal=0;
 std::array<Goal,2> goals{};
 std::vector<int> roster;
 std::vector<StageCell> cells;
 std::string title;
};
bool loadCampaign(std::istream& in,std::string& error);
const Stage& campaignStage(int level);
bool campaignReady();
}
