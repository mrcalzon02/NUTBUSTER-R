#pragma once
#include <array>
#include <cstdint>
#include <iosfwd>
#include <string>

namespace nut {
struct Mineral {
  const char* name;
  const char* sprite;
  int coal,metal,gems,fossils,relics,blasts,lenses;
};
struct MineTile {
  int hardness=1,ore=0,kind=-1,deposit=-1,hits=0,exposed=0;
  bool scanned=false;
  bool cleared()const{return hits>=hardness;}
};
class Mine {
public:
  static constexpr int limit=9,maxMoney=999999999;
  explicit Mine(uint32_t seed=4099,int tier=0);
  int size()const{return 4+mineTier;}
  int count()const{return size()*size();}
  MineTile tile(int x,int y)const;
  const Mineral* mineral(int x,int y)const;
  std::string sprite(int x,int y)const;
  bool dig(int x,int y,bool blast=false);
  bool survey(int x,int y,bool powered=false);
  bool collect(int x,int y);
  bool unload();
  bool refine(bool coalBoost=false);
  bool manufacture();
  bool sell();
  bool buyWrit();
  bool upgrade(const std::string& track);
  void nextDay(int day);
  bool save(std::ostream& out)const;
  bool load(std::istream& in);
  int cartCapacity()const;
  int orePerMetal()const;
  int saleValue()const;
  int cost(const std::string& track)const;
  int dailyStrikes()const{return 12+5*pickTier;}
  int dailyScans()const{return gloveTier;}
  int strikes=12,scans=0,cartOre=0,storedOre=0,metal=0,goods=0,dollars=0,writs=0;
  int coal=0,gems=0,fossils=0,relics=0,blasts=0,lenses=0;
  int mineTier=0,cartTier=0,refineryTier=0,pickTier=0,gloveTier=0,sites=0;
  int day=0;
  uint32_t seed=4099;
private:
  std::array<MineTile,81> cells_{};
  void rollAll();
  MineTile create(int x,int y)const;
  void advanceSite();
  bool valid(int x,int y)const;
  MineTile& cell(int x,int y){return cells_[y*limit+x];}
  const MineTile& cell(int x,int y)const{return cells_[y*limit+x];}
};
bool mineSelfTest(std::string& report);
bool verifyMineFixtures(std::istream& in,std::string& report);
}
