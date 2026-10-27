#include "campaign.hpp"
#include <algorithm>
#include <array>
#include <sstream>
#include <stdexcept>
#include <cctype>
namespace nut {
namespace {
std::array<Stage,1001> book{};
bool ready=false;
int nibble(char ch){
 if(ch>='0'&&ch<='9')return ch-'0';
 if(ch>='a'&&ch<='f')return ch-'a'+10;
 throw std::runtime_error("Invalid stage title encoding");
}
std::string decode(const std::string& src){
 if(src.size()%2)throw std::runtime_error("Odd-length stage title encoding");
 std::string out;out.reserve(src.size()/2);
 for(size_t i=0;i<src.size();i+=2)out.push_back(char(nibble(src[i])*16+nibble(src[i+1])));
 return out;
}
bool cellsRead(const std::string& encoded,int count,std::vector<StageCell>& out){
 std::istringstream list(encoded);std::string item;
 while(std::getline(list,item,',')){
  std::replace(item.begin(),item.end(),':',' ');
  StageCell cell;std::istringstream row(item);
  if(!(row>>cell.type>>cell.ice>>cell.lock>>cell.chest>>cell.jam>>cell.fuse))return false;
  std::string surplus;if(row>>surplus)return false;
  if(cell.type< -1||cell.type>18||cell.ice<0||cell.lock<0||cell.chest<0||
     cell.jam<0||cell.fuse<0||cell.ice>10||cell.lock>10||cell.chest>10||
     cell.jam>10||cell.fuse>50)return false;
  if(cell.type<0&&(cell.ice||cell.lock||cell.chest||cell.jam||cell.fuse))return false;
  out.push_back(cell);
 }
 return int(out.size())==count;
}
bool rosterRead(const std::string& text,std::vector<int>& roster){
 std::istringstream list(text);std::string v;
 while(std::getline(list,v,',')){
  if(v.empty()||!std::all_of(v.begin(),v.end(),[](char c){return std::isdigit((unsigned char)c);}))return false;
  int value=std::stoi(v);
  if(value<0||value>=19||std::find(roster.begin(),roster.end(),value)!=roster.end())return false;
  roster.push_back(value);
 }
 return roster.size()>=3&&roster.size()<=12;
}
bool parse(std::istringstream& row,Stage& stage){
 int kinds[2],targets[2],colors[2];
 std::string roster,cells,title,extra;
 if(!(row>>stage.level>>stage.width>>stage.height>>stage.moves>>stage.scoreGoal
      >>kinds[0]>>targets[0]>>colors[0]>>kinds[1]>>targets[1]>>colors[1]
      >>roster>>cells>>title)||(row>>extra))return false;
 if(stage.level<1||stage.level>1000||stage.width<4||stage.width>8||
    stage.height!=stage.width+1||stage.moves<1||stage.moves>99||
    stage.scoreGoal<1||!rosterRead(roster,stage.roster)||
    !cellsRead(cells,stage.width*stage.height,stage.cells))return false;
 for(int j=0;j<2;++j){
  if(kinds[j]<-1||kinds[j]>5)return false;
  stage.goals[j].kind=static_cast<GoalKind>(kinds[j]);
  stage.goals[j].target=targets[j];stage.goals[j].color=colors[j];
  if(kinds[j]==-1){if(targets[j]!=0||colors[j]!=-1)return false;continue;}
  if(targets[j]<1||targets[j]>2000000000)return false;
  if(kinds[j]==1){
   if(colors[j]<0||colors[j]>=19)return false;
  }else if(colors[j]!=-1)return false;
 }
 if(stage.goals[0].kind==GoalKind::None)return false;
 for(const auto& c:stage.cells)
  if(c.exists()&&std::find(stage.roster.begin(),stage.roster.end(),c.type)==stage.roster.end())return false;
 stage.title=decode(title);
 return !stage.title.empty();
}
}
bool loadCampaign(std::istream& in,std::string& error){
 ready=false;
 std::array<Stage,1001> fresh{};
 std::string line;
 if(!std::getline(in,line)||line!="NUTBUSTER_CAMPAIGN_V1 1000"){
  error="Native campaign export has incorrect version/count";return false;
 }
 try{
  for(int id=1;id<=1000;++id){
   if(!std::getline(in,line)||line.size()<4||line.substr(0,2)!="L "){
    error="Missing native authored stage "+std::to_string(id);return false;
   }
   std::istringstream row(line.substr(2));
   if(!parse(row,fresh[id])||fresh[id].level!=id){
    error="Malformed native authored stage "+std::to_string(id);return false;
   }
  }
  if(std::getline(in,line)&&!line.empty()){
   error="Extra unrecognized campaign rows";return false;
  }
 }catch(const std::exception& e){error=e.what();return false;}
 book=std::move(fresh);
 ready=true;error="Loaded 1000 authoritative campaign layouts/objectives";
 return true;
}
const Stage& campaignStage(int level){
 if(!ready||level<1||level>1000)throw std::runtime_error("Native authored campaign unavailable");
 return book.at(size_t(level));
}
bool campaignReady(){return ready;}
}
