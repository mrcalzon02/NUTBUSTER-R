#!/usr/bin/env python3
"""Crop owner-produced Nutbuster sprite concept grids to named game assets.
Not a license claim. Keeps source PNGs untouched. Pillow required.
"""
from pathlib import Path
from PIL import Image
import hashlib, json, sys
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'assets'/'source'
DST=ROOT/'web'/'art'/'primary'
SHEETS={
 'glossy_nut_match_3_icon_set.png':(4,3,'nuts',['peanut','walnut','almond','cashew','hazelnut','pistachio','pecan','acorn','gold-acorn','rainbow-nut','cracked-walnut','peanut-shell']),
 'glossy_puzzle_game_icon_collection.png':(4,4,'blockers',['ice-1','ice-2','chain-1','chain-2','crate','metal-crate','peanut-butter','red-jelly','bomb','chest','open-chest','key','lock','coconut','rock','lava-rock']),
 'glossy_nut_power_up_icon_grid.png':(4,4,'powerups',['row-clear','column-clear','wrapped','rainbow','cross-clear','rocket','blue-rocket','swap','hammer','speed','star-nut','nut-burst','lightning','disco-nut','star-flower','golden-crown']),
 'glossy_nut_themed_game_icon_sprite_sheet.png':(4,4,'economy',['golden-nuts','shell-tokens','squirrel-bucks','golden-acorn','piggy-bank','energy','vip-crown','ticket','gift','treasure','wheel','mail','booster-sack','refresh','loot-bowl','calendar']),
 'glossy_caramel_puzzle_tile_asset_sheet.png':(6,4,'borders',['plain','top','right','bottom','left','corner-tr','corner-tl','corner-bl','corner-br','side-combined','top-alt','bottom-alt','left-alt','island','junction-a','junction-b','junction-c','junction-d','t-up','t-left','t-down','t-right','cross','single']),
}
def run():
 manifest={'schema':1,'priority':'primary-original-artwork','sheet_source':'owner-provided generated images','target_size':192,'sheets':{},'sprites':{}}
 for filename,(cols,rows,category,names) in SHEETS.items():
  path=SRC/filename
  if not path.exists():print('Missing '+str(path),file=sys.stderr);continue
  im=Image.open(path).convert('RGBA');sha=hashlib.sha256(path.read_bytes()).hexdigest();manifest['sheets'][filename]={'sha256':sha,'dimensions':list(im.size),'columns':cols,'rows':rows,'category':category}
  folder=DST/category;folder.mkdir(parents=True,exist_ok=True)
  for i,name in enumerate(names):
   x,y=i%cols,i//cols
   # Grid crop intentionally excludes gutter strips. User can refine individual bbox later.
   rect=(round(x*im.width/cols)+4,round(y*im.height/rows)+4,round((x+1)*im.width/cols)-4,round((y+1)*im.height/rows)-4)
   crop=im.crop(rect)
   alpha=crop.getchannel('A');bounds=alpha.point(lambda v:255 if v>=12 else 0).getbbox()
   if not bounds:raise ValueError(f'No visible pixels: {category}/{name}')
   crop=crop.crop(bounds);crop.thumbnail((179,179),Image.Resampling.LANCZOS)
   tile=Image.new('RGBA',(192,192),(0,0,0,0));tile.alpha_composite(crop,((192-crop.width)//2,(192-crop.height)//2))
   target=folder/(name+'.png');tile.save(target,optimize=True)
   manifest['sprites'][f'{category}/{name}']={'file':f'art/primary/{category}/{name}.png','sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'source':filename,'grid_index':i}
 mpath=DST/'manifest.json';mpath.parent.mkdir(parents=True,exist_ok=True);mpath.write_text(json.dumps(manifest,indent=2)+'\n');print('Prepared',len(manifest['sprites']),'primary sprites')
if __name__=='__main__':run()
