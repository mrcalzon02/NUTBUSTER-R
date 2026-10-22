from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
from scipy.ndimage import distance_transform_edt
import numpy as np, cv2, json, hashlib, shutil, zipfile, math, sys, os
source_dir=Path(sys.argv[1] if len(sys.argv)>1 else os.environ.get('NUTRA_FISH_SOURCE_DIR','.'))
root=Path(sys.argv[2] if len(sys.argv)>2 else 'nutravaganza_fish_batch10');root.mkdir(exist_ok=True)
sets=[
('set01','glossy_fantasy_fish_sprite_collection.png',['Azure Darter','Copper Fin','Ribbon Koi','Moss Trout','Constellation Gar','Sunline Perch','Sapphire Catfish','Amethyst Snapper'],2,4),
('set02','glossy_fantasy_fish_icon_collection.png',['Gilded Ridge','Cobalt Whisker','Rose Current','Comet Guppy','Sawtooth Pike','Moon Scale','Blue Streak','Royal Fanfish'],2,4),
('set03','fantasy_fish_sprite_collection.png',['Emerald Paddlefish','Candyline Minnow','Tiger Jaw','Sakura Koi','Frost Darter','Violet Catfish','Teal Disc','Amber Whisker'],2,4),
('set04','eight_fantasy_fish_sprite_atlas.png',['Opal Runner','Sunburst Discus','Scarlet Trout','Lumen Eel','Golden Pumpkinfish','Peacock Tail','Speckle Cat','Jade Riverfish'],2,4),
('set05','glossy_fantasy_fish_sprite_sheet.png',['Midnight Darter','Vermilion Fanfish','Leopard Whisker','Emerald Bass','Pearl Shiner','Rusty Catfish','Prismatic Gourami','Sunspot Trout'],2,4),
('set06','eight_vibrant_fantasy_fish_sprites.png',['Verdigris Perch','Royal Silkfin','Crystal Flash','Tangerine Shad','Ember Maw','Turquoise Bass','Painted Trout','Lunar Longfin'],2,4),
('set07','glossy_freshwater_fish_sticker_sheet.png',['Blazing Crown','Banded Catfish','Silver Courier','Blush Trout','Emerald Drum','Gold Ribbon Koi','Violet Whisker','Rose Reef'],2,4),
('set08','vibrant_fantasy_fish_sprite_atlas.png',['Sunset Koi','Diamond Puffer','Green Reef Bass','Scarlet Stripe','Copper Crown','Crystal Runner','Jade Longnose','Royal Ink Koi'],2,4),
('set09','eight_fantasy_fish_game_icons.png',['Dandelion Bluegill','Ruby Shiner','Tin Fin Minnow','Sunset Paddle','Ocean Crown','Ember Spotted Cat','Violet Disc','Royal Koi Tail'],4,2)]
from re import sub
slug=lambda name:sub('[^a-z0-9]+','-',name.lower()).strip('-')
manifest={'schema':2,'sets':[],'items':[],'quarantined':[],'note':'Nine accessible unique source sheets. Original tenth filename overwritten during generation.'}
(root/'sprites').mkdir(exist_ok=True)
(root/'sources').mkdir(exist_ok=True)

def paste_checker_sheet(records,title,dark=False):
    T=176;H=204; sheet=Image.new('RGB',(4*T,2*H),(31,34,42) if dark else (239,242,244));d=ImageDraw.Draw(sheet)
    for i,info in enumerate(records):
        x=(i%4)*T;y=(i//4)*H
        for yy in range(0,176,16):
          for xx in range(0,176,16):
           cl=(48 if (xx//16+yy//16)%2 else 72) if dark else (221 if (xx//16+yy//16)%2 else 246)
           d.rectangle((x+xx,y+yy,x+xx+15,y+yy+15),fill=(cl,cl,cl))
        if info['status']=='passed':
          img=Image.open(root/info['path']).convert('RGBA');img.thumbnail((160,160))
          sheet.paste(img,(x+(176-img.width)//2,y+(176-img.height)//2),img)
        else:
          d.text((x+20,y+70),'ON HOLD',fill='red')
        d.text((x+5,y+180),info['name'][:24],fill='white' if dark else 'black')
    return sheet

for sid,src,names,cols,rows in sets:
  im=Image.open(source_dir/src).convert('RGBA');a=np.asarray(im)
  h,w=a.shape[:2]
  assert len(names)==cols*rows
  shutil.copy2(source_dir/src,root/'sources'/src)
  # High-opacity connected components distinguish fish bodies even if their low-opacity glows meet.
  # Lower threshold can join separate fish through fringe colors. Inspect 245 instead.
  _,labels,stats,centroids=None,None,None,None
  nc,lab,stats,cent=cv2.connectedComponentsWithStats((a[:,:,3]>=245).astype('uint8'),8)
  selected=[j for j in range(1,nc) if stats[j,4]>5500]
  # Slot assignment by majority mass within center area of visual cell, rather than alpha bounding-box truncation.
  candidates={}
  for j in selected:
    cx,cy=cent[j]; idx=min(rows-1,int(cy/(h/rows)))*cols+min(cols-1,int(cx/(w/cols)))
    candidates.setdefault(idx,[]).append(j)
  # Some fins pull centroids into adjacent row; search alternate by geometric overlap.
  for idx in range(cols*rows):
    if idx in candidates:continue
    rr,cc=divmod(idx,cols); cx=(cc+.5)*(w/cols); cy=(rr+.5)*(h/rows)
    choices=sorted(selected,key=lambda j:(cent[j,0]-cx)**2+(cent[j,1]-cy)**2)
    for j in choices:
      owner=next((k for k,v in candidates.items() if j in v),None)
      if owner is None:candidates[idx]=[j];break
  records=[]
  for idx,name in enumerate(names):
    rr,cc=divmod(idx,cols);cell=(round(cc*w/cols),round(rr*h/rows),round((cc+1)*w/cols),round((rr+1)*h/rows))
    ids=candidates.get(idx,[])
    # Multiple disconnected cores can be part of same fish but adjacent enough; use the largest as seed.
    if ids: ids=sorted(ids,key=lambda j:stats[j,4],reverse=True)
    if not ids:
      status='quarantined';reason='No independently identifiable opaque body';
      record={'id':f'fish-{sid}-{slug(name)}','name':name,'status':status,'reason':reason,'set':sid,'slot':idx}
      manifest['quarantined'].append(record);records.append(record);continue
    main=ids[0]
    # seed owner labels high-alpha connected components. Nearby transparent antialiasing assigned
    # to nearest intact opaque component without cutting alpha holes through fish bodies.
    # keep only main core plus tiny touching fragments nearer this core than any other intact core.
    seed=(lab==main)
    distances,ix=distance_transform_edt(~seed,return_indices=True)
    other_major=np.zeros_like(seed,dtype=bool)
    for other in selected:
       if other!=main:other_major |= (lab==other)
    # For all source alpha, pixels closest to main core than any other opaque core.
    # Use full nearest-label map for stable ownership with no rectangular crop seam.
    if idx==0:
      _,near_indices=distance_transform_edt(~np.isin(lab,selected),return_indices=True)
      nearest=lab[tuple(near_indices)]
    mask=(a[:,:,3]>0)&(nearest==main)
    # avoid whole companion fish bleed if a merged high-opacity component is shared across cells:
    # detect core bbox overlaps >1 grid center zone (heuristic: oversized relative to fish expected slot)
    bx,by,bw,bh,area=stats[main]
    if (bw>w/cols*1.22 or bh>h/rows*1.7):
      reason='Merged fish body cannot be isolated without cutting a neighbor'
      record={'id':f'fish-{sid}-{slug(name)}','name':name,'status':'quarantined','reason':reason,'set':sid,'slot':idx}
      manifest['quarantined'].append(record);records.append(record);continue
    yy,xx=np.nonzero(mask)
    if len(xx)<5000:
      reason='Insufficient complete-object pixels'
      record={'id':f'fish-{sid}-{slug(name)}','name':name,'status':'quarantined','reason':reason,'set':sid,'slot':idx}
      manifest['quarantined'].append(record);records.append(record);continue
    pad=12;x0=max(0,int(xx.min())-pad);x1=min(w,int(xx.max())+pad+1);y0=max(0,int(yy.min())-pad);y1=min(h,int(yy.max())+pad+1)
    raw=np.zeros((y1-y0,x1-x0,4),dtype=np.uint8)
    rawmask=mask[y0:y1,x0:x1]
    raw[rawmask]=a[y0:y1,x0:x1][rawmask]
    # RGB and alpha from original unchanged; transparent holes match original unless object merged.
    assert np.array_equal(raw[rawmask],a[y0:y1,x0:x1][rawmask])
    src_img=Image.fromarray(raw,'RGBA')
    # Normalize 384px for game and 512px for hi-res review master; source retained as source PNG.
    game=Image.new('RGBA',(384,384));fit=ImageOps.contain(src_img,(360,360),Image.Resampling.LANCZOS)
    game.alpha_composite(fit,((384-fit.width)//2,(384-fit.height)//2))
    nameid=f'fish-{sid}-{slug(name)}'
    path=f'sprites/{nameid}.png';game.save(root/path,optimize=True)
    alpha=np.asarray(game)[:,:,3]
    assert np.all(alpha[0,:]==0) and np.all(alpha[-1,:]==0) and np.all(alpha[:,0]==0) and np.all(alpha[:,-1]==0)
    record={'id':nameid,'name':name,'status':'passed','set':sid,'slot':idx,'source':src,'path':path,'source_bbox':[x0,y0,x1,y1], 'git_blob_sha':hashlib.sha1(b'blob '+str((root/path).stat().st_size).encode()+b'\0'+(root/path).read_bytes()).hexdigest()}
    records.append(record);manifest['items'].append(record)
  (root/f'{sid}-light.png').parent.mkdir(exist_ok=True)
  paste_checker_sheet(records,sid).save(root/f'{sid}-light.png')
  paste_checker_sheet(records,sid,True).save(root/f'{sid}-dark.png')
  manifest['sets'].append({'id':sid,'source':src,'expected':8,'passed':sum(r['status']=='passed' for r in records),'quarantined':sum(r['status']!='passed' for r in records),'review_light':f'{sid}-light.png','review_dark':f'{sid}-dark.png'})
(root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
# Multi-sheet visual QA
overview=Image.new('RGB',(704*3,408*3),(245,245,245));d=ImageDraw.Draw(overview)
for i,s in enumerate(manifest['sets']):
 p=Image.open(root/s['review_light']);x=i%3*704;y=i//3*408;overview.paste(p,(x,y));d.rectangle((x,y,x+200,y+21),fill='white');d.text((x+5,y+4),s['id'],fill='black')
overview.save(root/'QA-overview.jpg',quality=86)
# package separate art and manifest
with zipfile.ZipFile(str(root.resolve())+'_review.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in root.rglob('*'):
  if p.is_file():z.write(p,p.relative_to(root.parent))
print(json.dumps({'sets':manifest['sets'],'total_passed':len(manifest['items']),'quarantined':len(manifest['quarantined'])},indent=2))