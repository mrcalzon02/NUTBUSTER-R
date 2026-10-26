#include "mine.hpp"
#include <algorithm>
#include <array>
#include <cmath>
#include <istream>
#include <limits>
#include <ostream>
#include <sstream>
#include <stdexcept>
namespace nut {
namespace {
constexpr std::array<Mineral,17> finds{{
 {"Coal seam","r2c1",1,0,0,0,0,0,0},
 {"Dense coal","r2c2",2,0,0,0,0,0,0},
 {"Copper ore","r2c4",0,1,0,0,0,0,0},
 {"Silver ore","r2c5",0,1,0,0,0,0,0},
 {"Gold ore","r2c3",0,2,0,0,0,0,0},
 {"Sapphire","r2c6",0,0,1,0,0,0,0},
 {"Amethyst","r3c1",0,0,1,0,0,0,0},
 {"Emerald","r3c2",0,0,1,0,0,0,0},
 {"Ruby","r3c5",0,0,2,0,0,0,0},
 {"Sapphire cluster","r4c2",0,0,2,0,0,0,0},
 {"Amethyst cluster","r4c3",0,0,2,0,0,0,0},
 {"Ancient fossil","r3c4",0,0,0,1,0,0,0},
 {"Crystal geode","r3c3",0,0,2,0,0,0,0},
 {"Molten rock","r3c6",0,0,0,0,0,1,0},
 {"Ancient prism","r4c4",0,0,0,0,1,0,0},
 {"Blasting firestone","r4c5",0,0,0,0,0,2,0},
 {"Prismatic relic","r4c6",0,0,0,0,1,0,1}
}};
constexpr std::array<std::array<int,4>,6> odds{{
 {{45,40,12,3}},{{50,35,11,4}},{{55,29,11,5}},
 {{60,25,9,6}},{{65,20,9,6}},{{70,16,8,6}}
}};
constexpr std::array<int,6> carts{{10,20,30,45,60,80}};
constexpr std::array<int,6> rates{{4,4,3,3,2,2}};
constexpr std::array<int,6> sales{{300,340,380,430,480,550}};
constexpr std::array<int,6> mineCost{{0,250,600,1150,1900,3000}};
constexpr std::array<int,6> cartCost{{0,120,300,580,960,1540}};
constexpr std::array<int,6> refineCost{{0,300,700,1300,2200,3500}};
constexpr std::array<int,4> ordinary{{0,1,2,3}};
constexpr std::array<int,8> rich{{4,5,6,7,8,9,10,11}};
constexpr std::array<int,5> crystal{{12,13,14,15,16}};
uint32_t hash32(uint32_t v) {
 v^=v>>16;v*=0x7feb352dU;v^=v>>15;v*=0x846ca68bU;return v^(v>>16);
}
uint32_t roll(uint32_t seed,int x,int y,uint32_t salt) {
 return hash32(seed ^ (uint32_t(x+1)*15485863U) ^ (uint32_t(y+1)*32452843U) ^ salt)%100;
}
int bounded(int n){return std::clamp(n,0,Mine::maxMoney);}
bool add(int& dst,int amount){
 if(amount<0||dst>Mine::maxMoney-amount)return false;
 dst+=amount;return true;
}
int pickCost(int tier,bool glove){
 if(tier<1||tier>39)return -1;
 const int t=tier-1;
 const double raw=(glove?140.0:160.0)+(glove?48.0:52.0)*t+(glove?3.0:3.5)*t*t;
 return int(std::floor(raw/10.0+0.5))*10;
}
}
Mine::Mine(uint32_t initialSeed,int tier):mineTier(std::clamp(tier,0,5)),seed(initialSeed?initialSeed:4099){rollAll();}
bool Mine::valid(int x,int y)const{return x>=0&&y>=0&&x<size()&&y<size();}
MineTile Mine::create(int x,int y)const {
 MineTile t;
 int chance=int(roll(seed,x,y,0x248fd19dU));
 const int thresholds[4]={odds[mineTier][0],odds[mineTier][1],odds[mineTier][2],odds[mineTier][3]};
 for(int k=0;k<4;++k){chance-=thresholds[k];if(chance<0){t.kind=k;break;}}
 t.ore=(t.kind==0?0:t.kind==1?1:t.kind==2?2:4);
 const int hardness=int(roll(seed,x,y,0x74220a3bU));
 t.hardness=hardness<55?1:hardness<90?2:3;
 const uint32_t deposit=roll(seed,x,y,0x6ad39f11U);
 switch(t.kind){
 case 0:t.deposit=-1;break;
 case 1:t.deposit=ordinary[deposit%ordinary.size()];break;
 case 2:t.deposit=rich[deposit%rich.size()];break;
 case 3:t.deposit=crystal[deposit%crystal.size()];break;
 }
 return t;
}
void Mine::rollAll() {
 for(auto& t:cells_)t=MineTile{};
 for(int y=0;y<size();++y)for(int x=0;x<size();++x)cell(x,y)=create(x,y);
}
MineTile Mine::tile(int x,int y)const {
 if(!valid(x,y))throw std::out_of_range("Mine cell outside map");
 return cell(x,y);
}
const Mineral* Mine::mineral(int x,int y)const{
 if(!valid(x,y))return nullptr;
 const auto& t=cell(x,y);
 return t.cleared()&&t.deposit>=0?&finds[size_t(t.deposit)]:nullptr;
}
std::string Mine::sprite(int x,int y)const {
 if(!valid(x,y))return "r4c1";
 const auto& t=cell(x,y);
 if(!t.cleared())return t.hits==0?"r1c1":t.hits==1?"r1c4":"r1c5";
 return t.deposit<0?"r4c1":finds[size_t(t.deposit)].sprite;
}
int Mine::cartCapacity()const{return carts[cartTier];}
int Mine::orePerMetal()const{return rates[refineryTier];}
int Mine::saleValue()const{return sales[refineryTier];}
void Mine::advanceSite(){
 for(int y=0;y<size();++y)for(int x=0;x<size();++x)
  if(!cell(x,y).cleared()||cell(x,y).exposed)return;
 ++sites;
 seed=hash32(seed+uint32_t(sites)*15485863U+0x2f9187U);
 if(!seed)seed=113;
 rollAll();
}
bool Mine::dig(int x,int y,bool blast){
 if(!valid(x,y))return false;
 auto& t=cell(x,y);
 if(t.cleared()||(blast?blasts<=0:strikes<=0))return false;
 if(blast)--blasts;else --strikes;
 t.hits=std::min(t.hardness,t.hits+(blast?2:1));
 if(t.cleared()){
  if(t.ore){
   if(cartOre<=cartCapacity()-t.ore)cartOre+=t.ore;
   else t.exposed=t.ore;
  }
  if(t.deposit>=0){
   const auto& f=finds[size_t(t.deposit)];
   add(coal,f.coal);add(metal,f.metal);add(gems,f.gems);
   add(fossils,f.fossils);add(relics,f.relics);add(blasts,f.blasts);add(lenses,f.lenses);
  }
  advanceSite();
 }
 return true;
}
bool Mine::survey(int x,int y,bool powered){
 if(!valid(x,y))return false;
 auto& t=cell(x,y);
 if(t.cleared()||t.scanned||(powered?lenses<=0:scans<=0))return false;
 if(powered)--lenses;else --scans;
 t.scanned=true;return true;
}
bool Mine::collect(int x,int y) {
 if(!valid(x,y))return false;
 auto& t=cell(x,y);
 if(t.exposed<=0||cartOre>cartCapacity()-t.exposed)return false;
 cartOre+=t.exposed;t.exposed=0;advanceSite();return true;
}
bool Mine::unload(){
 if(cartOre<=0||storedOre>maxMoney-cartOre)return false;
 storedOre+=cartOre;cartOre=0;return true;
}
bool Mine::refine(bool coalBoost){
 const int rate=coalBoost?std::max(1,(orePerMetal()+1)/2):orePerMetal();
 if(storedOre<rate||metal>=maxMoney||(coalBoost&&coal<1))return false;
 storedOre-=rate;++metal;if(coalBoost)--coal;return true;
}
bool Mine::manufacture(){
 if(metal<2||goods>=maxMoney)return false;
 metal-=2;++goods;return true;
}
bool Mine::sell(){
 if(goods<1||dollars>maxMoney-saleValue())return false;
 --goods;dollars+=saleValue();return true;
}
bool Mine::buyWrit(){
 if(dollars<180||writs>=maxMoney)return false;
 dollars-=180;++writs;return true;
}
int Mine::cost(const std::string& track)const{
 if(track=="pickaxe")return pickCost(pickTier+1,false);
 if(track=="gloves")return pickCost(gloveTier+1,true);
 if(track=="map")return mineTier<5?mineCost[mineTier+1]:-1;
 if(track=="cart")return cartTier<5?cartCost[cartTier+1]:-1;
 if(track=="refinery")return refineryTier<5?refineCost[refineryTier+1]:-1;
 return -1;
}
bool Mine::upgrade(const std::string& track){
 const int amount=cost(track);
 if(amount<=0||dollars<amount)return false;
 if(track=="pickaxe"){++pickTier;strikes=std::min(dailyStrikes(),strikes+5);}
 else if(track=="gloves"){++gloveTier;scans=std::min(dailyScans(),scans+1);}
 else if(track=="map"){
  ++mineTier;
  for(int y=0;y<size();++y)for(int x=0;x<size();++x)
   if(cell(x,y).kind<0)cell(x,y)=create(x,y);
 } else if(track=="cart")++cartTier;
 else if(track=="refinery")++refineryTier;
 else return false;
 dollars-=amount;return true;
}
void Mine::nextDay(int value){
 if(value<=0)return;
 if(day==0){day=value;return;}
 if(value>day){day=value;strikes=dailyStrikes();scans=dailyScans();}
}
bool Mine::save(std::ostream& out)const{
 out<<"MINE_V2 "<<seed<<" "<<sites<<" "<<day<<" "
 <<mineTier<<" "<<cartTier<<" "<<refineryTier<<" "<<pickTier<<" "<<gloveTier<<" "
 <<strikes<<" "<<scans<<" "<<cartOre<<" "<<storedOre<<" "<<metal<<" "<<goods<<" "
 <<dollars<<" "<<writs<<" "<<coal<<" "<<gems<<" "<<fossils<<" "<<relics<<" "<<blasts<<" "<<lenses<<"\n";
 for(const auto& t:cells_)
  out<<t.kind<<" "<<t.deposit<<" "<<t.ore<<" "<<t.hardness<<" "<<t.hits<<" "<<t.exposed<<" "<<int(t.scanned)<<"\n";
 return bool(out);
}
bool Mine::load(std::istream& in) {
 std::string header;
 Mine staged;
 if(!(in>>header)||header!="MINE_V2")return false;
 uint64_t value=0;
 if(!(in>>value)||value==0||value>UINT32_MAX)return false;staged.seed=uint32_t(value);
 int* fields[]={&staged.sites,&staged.day,&staged.mineTier,&staged.cartTier,&staged.refineryTier,
 &staged.pickTier,&staged.gloveTier,&staged.strikes,&staged.scans,&staged.cartOre,&staged.storedOre,
 &staged.metal,&staged.goods,&staged.dollars,&staged.writs,&staged.coal,&staged.gems,
 &staged.fossils,&staged.relics,&staged.blasts,&staged.lenses};
 for(auto* f:fields)if(!(in>>*f)||*f<0||*f>maxMoney)return false;
 if(staged.mineTier>5||staged.cartTier>5||staged.refineryTier>5||
 staged.pickTier>39||staged.gloveTier>39||staged.strikes>staged.dailyStrikes()||
 staged.scans>staged.dailyScans())return false;
 for(auto& t:staged.cells_){
  int scanned=0;
  if(!(in>>t.kind>>t.deposit>>t.ore>>t.hardness>>t.hits>>t.exposed>>scanned))return false;
  if(t.kind< -1||t.kind>3||t.deposit< -1||t.deposit>=int(finds.size())||
   t.ore<0||t.ore>4||t.hardness<1||t.hardness>3||
   t.hits<0||t.hits>t.hardness||t.exposed<0||t.exposed>4||
   scanned<0||scanned>1)return false;
  t.scanned=scanned!=0;
 }
 for(int y=0;y<staged.size();++y)for(int x=0;x<staged.size();++x)
  if(staged.cell(x,y).kind<0)return false;
 *this=staged;return true;
}
bool verifyMineFixtures(std::istream& in,std::string& report){
 std::string marker;unsigned seed=0;int tier=0,x=0,y=0,kind=0,ore=0,hard=0,deposit=0;
 int cases=0;
 while(in>>marker>>seed>>tier>>x>>y>>kind>>ore>>hard>>deposit){
  if(marker!="T"||tier<0||tier>5||x<0||y<0||x>=4+tier||y>=4+tier)
    {report="FAIL mine fixture format";return false;}
  Mine m(seed,tier);
  auto t=m.tile(x,y);
  if(t.kind!=kind||t.ore!=ore||t.hardness!=hard||t.deposit!=deposit){
   report="FAIL mine fixture seed "+std::to_string(seed)+" tier "+std::to_string(tier)+" tile "+std::to_string(x)+","+std::to_string(y);
   return false;
  }
  ++cases;
 }
 if(cases<30){report="FAIL too few fixtures";return false;}
 report="PASS "+std::to_string(cases)+" JS/native mineral, ore and hardness fixtures";
 return true;
}
bool mineSelfTest(std::string& report) {
 try{
  Mine a(4099),b(4099);
  for(int y=0;y<4;++y)for(int x=0;x<4;++x)
   if(a.tile(x,y).kind!=b.tile(x,y).kind||a.tile(x,y).hardness!=b.tile(x,y).hardness)
    throw std::runtime_error("seed not deterministic");
  if(a.dig(-1,0)||a.survey(50,0)||a.collect(0,50))throw std::runtime_error("invalid coordinate accepted");
  if(!a.dig(0,0)||a.strikes!=11)throw std::runtime_error("strike not charged");
  if(a.survey(1,1))throw std::runtime_error("free scan on baseline gloves");
  a.dollars=4000;
  if(!a.upgrade("gloves")||a.scans!=1||!a.survey(1,1)||a.survey(1,1))
   throw std::runtime_error("survey upgrade, debit or repeat scan failed");
  if(!a.upgrade("pickaxe")||a.strikes!=16)throw std::runtime_error("pick upgrade");
  if(!a.upgrade("map")||a.size()!=5)throw std::runtime_error("map upgrade");
  a.cartOre=8;a.storedOre=0;
  if(!a.unload()||a.storedOre!=8||!a.refine()||a.metal!=1)
   throw std::runtime_error("refine pipeline");
  a.metal=2;
  if(!a.manufacture()||a.goods!=1||!a.sell())throw std::runtime_error("goods sale");
  if(!a.buyWrit())throw std::runtime_error("writ debit");
  a.blasts=1;
  if(!a.dig(4,4,true)||a.blasts!=0)throw std::runtime_error("blast charge debit");
  std::ostringstream os;
  if(!a.save(os))throw std::runtime_error("save");
  Mine restored;
  std::istringstream is(os.str());
  if(!restored.load(is)||restored.tile(4,4).hits!=a.tile(4,4).hits||
   restored.dollars!=a.dollars||restored.scans!=a.scans)
    throw std::runtime_error("state save/reload");
  Mine rejected=restored;
  std::istringstream invalid("MINE_V2 broken");
  if(rejected.load(invalid)||rejected.dollars!=restored.dollars)throw std::runtime_error("invalid save mutated state");
  const int prev=restored.strikes;
  restored.nextDay(20261026);restored.nextDay(20261027);
  if(restored.strikes<=prev)throw std::runtime_error("daily refill");
  report="PASS native mining geology, scans, blasts, cart, refinery, sale, writs, upgrades and save/reload";
  return true;
 }catch(const std::exception& e){report=std::string("FAIL native mining: ")+e.what();return false;}
}
}
