#!/usr/bin/env python3
"""Slice the approved 5-column × 3-row Nutbuster elemental sheet only.

Preserves the source artwork, removes near-transparent residuals, trims each
cell and centers every icon on a 192 px transparent RGBA canvas. NEVER touches
the rejected compressed 8×5 artwork.
"""
from __future__ import annotations
from PIL import Image
import json,hashlib
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'assets/source/expansion/elemental-nuts-3x5.png'
DEST=ROOT/'web/art/primary/nuts/elemental'
NAMES=[
 ['fire','ice','water','earth','wind'],
 ['lightning','nature','poison','radiance','shadow'],
 ['crystal','magma','frost','storm','arcane'],
]
# Clean, near-zero-alpha seams in the original artist's 1536×1024 sheet.
XCUTS=[[0,316,614,921,1217,1536],[0,312,627,917,1225,1536],[0,307,613,909,1221,1536]]
YCUTS=[0,344,676,1024]

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def run():
 if not SOURCE.exists(): raise FileNotFoundError('Download the approved original 3x5 source from Google Drive: '+ 'https://drive.google.com/file/d/13lBWifXqDQuD34WjVLLi-IjkQcBR07UZ/view')
 im=Image.open(SOURCE).convert('RGBA')
 if im.size!=(1536,1024):raise ValueError(f'Unexpected source dimensions: {im.size}')
 DEST.mkdir(parents=True,exist_ok=True)
 manifest={'schema':1,'collection':'elemental-nuts','role':'art-and-rules-preview','enabled_for_gameplay':False,
           'source':'assets/source/expansion/elemental-nuts-3x5.png',
           'source_dimensions':[1536,1024],'source_sha256':sha(SOURCE),
           'sprite_dimensions':[192,192],'layout':[5,5,5],'sprites':{}}
 for row in range(3):
  for col,name in enumerate(NAMES[row]):
   rect=(XCUTS[row][col],YCUTS[row],XCUTS[row][col+1],YCUTS[row+1]); tile=im.crop(rect)
   alpha=tile.getchannel('A').point(lambda x:0 if x<18 else x)
   tile.putalpha(alpha)
   bbox=alpha.point(lambda v:255 if v>=24 else 0).getbbox()
   if not bbox:raise ValueError('Empty '+name)
   obj=tile.crop(bbox)
   obj.thumbnail((174,174),Image.Resampling.LANCZOS)
   canvas=Image.new('RGBA',(192,192))
   xy=((192-obj.width)//2,(192-obj.height)//2)
   canvas.alpha_composite(obj,xy)
   edge=canvas.getchannel('A')
   if not edge.getbbox() or max(edge.crop((0,0,192,9)).getextrema()[1],edge.crop((0,183,192,192)).getextrema()[1],edge.crop((0,0,9,192)).getextrema()[1],edge.crop((183,0,192,192)).getextrema()[1])>0:
    raise ValueError('Invalid margin: '+name)
   path=DEST/(name+'.png');canvas.save(path,optimize=True)
   manifest['sprites'][name]={'path':f'art/primary/nuts/elemental/{name}.png','dimensions':[192,192],
     'alpha_mode':'RGBA','sha256':sha(path),'source_rect':list(rect)}
 out=DEST/'manifest.json';out.write_text(json.dumps(manifest,indent=2,sort_keys=True)+'\n')
 return manifest
if __name__=='__main__':
 r=run();print('Validated',len(r['sprites']),'transparent 192px sprites from approved 3×5 sheet')
