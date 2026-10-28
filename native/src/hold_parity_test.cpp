#include "hold.hpp"
#include <fstream>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

namespace {
std::vector<std::string> split(const std::string& text,char delimiter) {
 std::vector<std::string> out;
 std::istringstream input(text);
 std::string token;
 while(std::getline(input,token,delimiter))out.push_back(token);
 return out;
}
std::vector<nut::StageCell> parseCells(const std::string& text) {
 std::vector<nut::StageCell> result;
 for(const auto& item:split(text,',')) {
  nut::StageCell c;
  if(item=="X"){result.push_back(c);continue;}
  const auto parts=split(item,':');
  if(parts.size()!=7)throw std::runtime_error("Malformed hold fixture cell");
  c.type=std::stoi(parts[0]);
  c.ice=std::stoi(parts[1]);c.lock=std::stoi(parts[2]);
  c.chest=std::stoi(parts[3]);c.jam=std::stoi(parts[4]);
  c.fuse=std::stoi(parts[5]);c.hold=std::stoi(parts[6]);
  result.push_back(c);
 }
 return result;
}
std::string encode(const std::vector<nut::StageCell>& cells,
                   const std::vector<bool>& mask) {
 std::ostringstream out;
 for(size_t i=0;i<cells.size();++i) {
  if(i)out<<',';
  if(!mask[i]){out<<'X';continue;}
  const auto& c=cells[i];
  out<<c.type<<':'<<c.ice<<':'<<c.lock<<':'<<c.chest<<':'
     <<c.jam<<':'<<c.fuse<<':'<<c.hold;
 }
 return out.str();
}
nut::HoldKind kind(const std::string& value) {
 if(value=="butter_hold")return nut::HoldKind::Butter;
 if(value=="jam_hold")return nut::HoldKind::Jam;
 return static_cast<nut::HoldKind>(0);
}
void check(const std::vector<std::string>& fields) {
 if(fields.size()!=15||fields[0]!="CASE")
  throw std::runtime_error("Malformed hold fixture record");
 const std::string& name=fields[1];
 const int w=std::stoi(fields[2]),h=std::stoi(fields[3]);
 const int target=std::stoi(fields[5]),finished=std::stoi(fields[6]);
 const int second=std::stoi(fields[7]),valid=std::stoi(fields[9]);
 const int uses=std::stoi(fields[10]),bonus=std::stoi(fields[14]);
 auto cells=parseCells(fields[8]);
 if(w<=0||h<=0||int(cells.size())!=w*h)
  throw std::runtime_error(name+": invalid fixture dimensions");
 std::vector<bool> mask;
 for(const auto& c:cells)mask.push_back(c.type!=-1);
 const bool applied=nut::applyHoldToCells(cells,mask,target,kind(fields[4]),finished!=0);
 if(int(applied)!=valid||int(applied)!=uses)
  throw std::runtime_error(name+": invalid hold application or booster consumption");
 std::vector<int> matched;
 if(!fields[13].empty())
  for(const auto& i:split(fields[13],','))matched.push_back(std::stoi(i));
 if(nut::heldMatchBonus(cells,matched,1)!=bonus)
  throw std::runtime_error(name+": held-nut triple-score mismatch");
 const std::vector<int> roster{0,1,2,3};
 const auto draw=[](int){return 0;};
 nut::gravityWithHolds(cells,mask,w,h,roster,draw);
 if(encode(cells,mask)!=fields[11])
  throw std::runtime_error(name+": first gravity/drop does not match JS");
 if(second>=0) {
  if(second>=int(cells.size())||!mask[size_t(second)])
   throw std::runtime_error(name+": invalid second vacancy");
  cells[size_t(second)].type=-2;
  cells[size_t(second)].hold=0;
  nut::gravityWithHolds(cells,mask,w,h,roster,draw);
 }
 if(encode(cells,mask)!=fields[12])
  throw std::runtime_error(name+": second gravity/drop does not match JS");
}
}
int main(int argc,char** argv) {
 try {
  if(argc!=2)throw std::runtime_error("Usage: nutbuster-hold-parity-test fixtures.txt");
  std::ifstream file(argv[1]);
  if(!file)throw std::runtime_error("Cannot read authoritative JS hold fixtures");
  std::string line;int count=0;
  while(std::getline(file,line)) {
   if(line.empty()||line[0]=='#')continue;
   check(split(line,'|'));
   ++count;
  }
  if(count!=15)throw std::runtime_error("Expected 15 JS held-nut fixture scenarios");
  std::cout<<"PASS "<<count<<" JS->C++ held-nut fixtures: 1/2 gravity drops, "
           <<"voids, anchors, refill, scoring, invalid use and simultaneous holds\n";
  return 0;
 }catch(const std::exception& e){
  std::cerr<<"FAIL native hold parity: "<<e.what()<<"\n";
  return 1;
 }
}
