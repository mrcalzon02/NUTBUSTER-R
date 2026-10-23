#!/usr/bin/env python3
"""Deterministically slice 44 Nutvale pickaxes and 42 survey gloves without clipping.
Usage: python tools/slice_nutvale_mining_tools.py [source-png] [output-directory]
Pillow, NumPy and SciPy required. Input is an owner-generated transparent atlas.
"""
from pathlib import Path
import hashlib, json, sys
from PIL import Image, ImageOps, ImageDraw
import numpy as np
from scipy.ndimage import label, distance_transform_edt

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'assets/source/expansion/nutvale-mining-pickaxes-gloves-original.png'
OUTPUT=ROOT/'web/art/nutvale/mining-tools'
EXPECTED_SHA='feadd3e5ff57bd67dea318dec737e1c3d7daff2babdad46ec635a7006f487fed'
ROWS=(11,11,11,11,14,14,14)
Y=(0,145,290,436,582,717,858,1024)
NAMES={
 'pickaxes':('iron-prospector acorn-bronze blossom-oak pinecone-copper ropebound-steel daisy-wreathed froststeel gilded-crescent flamecrest-gold amethyst-sickle azure-edge '
 'riverstone-iron sapphire-shard ruby-blaze glacier-shadow honeygold mossbound-amber thorn-garnet strawberry-frosting caramel-drizzle heart-cupcake prism-star '
 'violet-skull astral-comet opal-sunrise amber-crown arcane-wraith bloodmoon-crystal silver-sunstone spring-blossom lionheart-gold sunburst-royal golden-dawn '
 'ocean-lantern starfall-amethyst tideglass-cyan forest-prism ruby-ice molten-star winter-berry holly-star brass-anthem deepsea-orb moonlit-silver').split(),
 'gloves':('russet-leather apprentice-leather autumn-leaves verdant-wool acorn-gardener frostfur-forager oak-traveler winter-stone copper-clockwork brass-clockwork sapphire-royal solar-gilt orchid-bloom holly-blossom '
 'pink-confection rainbow-icing confetti-star candy-party violet-nebula spectral-skull starlight-void golden-cabochon silver-sunburst arcane-geode industrial-gear glacier-mechanist sunstone-alchemist sunflower-garden '
 'lava-fissure flameheart riveted-steel winter-rune shadow-amethyst aether-machinery fresh-spring woodland-hide golden-gears pumpkin-gold holiday-holly fur-trapper harvest-petal jackolantern').split()
}
assert len(NAMES['pickaxes'])==44 and len(NAMES['gloves'])==42

def digest(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()

def main(source=SOURCE,output=OUTPUT):
 source=Path(source);output=Path(output)
 if not source.is_file():raise FileNotFoundError('Install original Nutvale mining icon atlas: '+str(source))
 if digest(source)!=EXPECTED_SHA:raise ValueError('Source SHA mismatch; inspect atlas before slicing')
 im=Image.open(source).convert('RGBA')
 if im.size!=(1536,1024):raise ValueError('Expected 1536x1024 RGBA atlas')
 rgba=np.asarray(im);alpha=rgba[:,:,3]
 if alpha[0,0]!=0:raise ValueError('Atlas must have transparent background')
 seeds=np.zeros(alpha.shape,dtype=np.uint16);centers=[]
 for row,count in enumerate(ROWS):
  y0,y1=Y[row],Y[row+1]
  groups,n=label(alpha[y0:y1]>=128,structure=np.ones((3,3),int))
  area=np.bincount(groups.ravel())
  major=[j for j in range(1,n+1) if area[j]>=3000]
  if len(major)!=count:raise ValueError(f'Row {row}: {len(major)} opaque objects, expected {count}')
  major.sort(key=lambda j:np.where(groups==j)[1].mean())
  for col,group in enumerate(major):
   yy,xx=np.where(groups==group);idx=len(centers)+1
   seeds[y0:y1][groups==group]=idx
   centers.append((idx,row,col,int(len(xx)),[int(xx.min()),int(yy.min()+y0),int(xx.max()+1),int(yy.max()+y0+1)]))
 dist,near=distance_transform_edt(seeds==0,return_indices=True)
 owner=seeds[tuple(near)]
 present=(alpha>=7)&(dist<=24)
 output.mkdir(parents=True,exist_ok=True)
 names=[('pickaxes',x) for x in NAMES['pickaxes']]+[('gloves',x) for x in NAMES['gloves']]
 results=[]
 for (category,name),(idx,row,col,area,core) in zip(names,centers):
  keep=present&(owner==idx)
  yy,xx=np.where(keep&(alpha>=12))
  if len(xx)<5000:raise ValueError('Sprite fragmented: '+name)
  x0=max(0,int(xx.min())-8);y0=max(0,int(yy.min())-8)
  x1=min(1536,int(xx.max())+9);y1=min(1024,int(yy.max())+9)
  rgb=np.zeros((y1-y0,x1-x0,4),dtype=np.uint8)
  mask=keep[y0:y1,x0:x1];rgb[mask]=rgba[y0:y1,x0:x1][mask]
  fitted=ImageOps.contain(Image.fromarray(rgb,'RGBA'),(176,176),method=Image.Resampling.LANCZOS)
  icon=Image.new('RGBA',(192,192))
  icon.alpha_composite(fitted,((192-fitted.width)//2,(192-fitted.height)//2))
  out=output/category/(name+'.png');out.parent.mkdir(parents=True,exist_ok=True)
  icon.save(out,optimize=True)
  a=np.asarray(icon.getchannel('A'))
  if int((a>=128).sum())<3000:raise ValueError('Empty icon: '+name)
  if a[:3].max() or a[-3:].max() or a[:,:3].max() or a[:,-3:].max():raise ValueError('Cropped icon: '+name)
  results.append({'id':name,'name':name.replace('-',' ').title(),'category':category,
   'path':'art/nutvale/mining-tools/'+category+'/'+name+'.png',
   'source_row':row,'source_column':col,'source_bbox':[x0,y0,x1,y1],
   'core_bbox':core,'source_core_pixels':area,'output_opaque_pixels':int((a>=128).sum()),
   'width':192,'height':192,'alpha':'straight-RGBA','sha256':digest(out),'size_bytes':out.stat().st_size})
 atlases={}
 for category,cols in [('pickaxes',11),('gloves',14)]:
  group=[r for r in results if r['category']==category]
  row_count=(len(group)+cols-1)//cols
  atlas=Image.new('RGBA',(192*cols,192*row_count))
  for i,r in enumerate(group):
   atlas.alpha_composite(Image.open(output/category/(r['id']+'.png')).convert('RGBA'),((i%cols)*192,(i//cols)*192))
  dest=output/('atlas-'+category+'.png');atlas.save(dest,optimize=True)
  atlases[category]={'path':'art/nutvale/mining-tools/'+dest.name,'columns':cols,'rows':row_count,'tile':[192,192],'sha256':digest(dest)}
  # Inspection-only preview. Checkerboard is NOT baked into production sprites.
  tile=112;preview=Image.new('RGB',(cols*tile,row_count*tile),(240,240,240));d=ImageDraw.Draw(preview)
  for i,r in enumerate(group):
   ox=i%cols*tile;oy=i//cols*tile
   for y in range(oy,oy+tile,16):
    for x in range(ox,ox+tile,16):
     shade=235 if ((x-ox)//16+(y-oy)//16)%2 else 254
     d.rectangle((x,y,x+15,y+15),fill=(shade,shade,shade))
   item=Image.open(output/category/(r['id']+'.png')).convert('RGBA')
   item.thumbnail((108,108),Image.Resampling.LANCZOS)
   preview.paste(item,(ox+(tile-item.width)//2,oy+(tile-item.height)//2),item)
  preview.save(output/('preview-'+category+'.png'),optimize=True)
 if len(results)!=86 or len(set(r['sha256'] for r in results))!=86:raise ValueError('Missing or duplicate icons')
 report={'schema':2,'role':'nutvale-mines-pickaxe-and-survey-glove-visuals',
  'usage':'visual variants only; gameplay progression must follow Nutvale Mines design lock',
  'source':'assets/source/expansion/nutvale-mining-pickaxes-gloves-original.png',
  'source_sha256':digest(source),'source_dimensions':[1536,1024],
  'layout':{'columns_per_row':list(ROWS),'row_cuts':list(Y)},
  'icon_dimensions':[192,192],
  'alpha_method':'8-connected opaque cores + nearest-core alpha assignment',
  'slicer':'tools/slice_nutvale_mining_tools.py',
  'total':86,'categories':{'pickaxes':44,'gloves':42},
  'atlases':atlases,'sprites':results}
 (output/'manifest.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
 print('PASS: 44 pickaxes + 42 gloves; 86 transparent PNGs + two RGBA atlases')

if __name__=='__main__':
 main(Path(sys.argv[1]) if len(sys.argv)>1 else SOURCE,
      Path(sys.argv[2]) if len(sys.argv)>2 else OUTPUT)
