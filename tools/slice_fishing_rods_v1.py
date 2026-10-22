"""Reproduce 16 isolated rod sprites from source atlas. Requires Pillow, NumPy and SciPy."""
from pathlib import Path
from PIL import Image, ImageOps
from scipy.ndimage import label, distance_transform_edt
import numpy as np
SOURCE=Path("assets/source/expansion/fishing-rods-16-source.png")
OUTPUT=Path("web/art/fishing/rods/v1")
NAMES=["woodland","brass","gilded","carbon","verdant","coral","industrial","royal-blue","pirate","glacier","storm","magma","sovereign","astral","prismatic","confection"]
def main():
 im=Image.open(SOURCE).convert("RGBA"); rgba=np.asarray(im); alpha=rgba[:,:,3]
 labels,_=label(alpha>=128,structure=np.ones((3,3),int))
 areas=np.bincount(labels.ravel()); centers=[]
 for idx in range(1,len(areas)):
  if areas[idx]<=10000:continue
  y,x=np.nonzero(labels==idx)
  centers.append((idx,x.mean(),y.mean()))
 assert len(centers)==16, "Unexpected atlas components: review manually"
 centers.sort(key=lambda c:c[2])
 ordered=[]
 for row in range(0,16,4): ordered+=sorted(centers[row:row+4],key=lambda c:c[1])
 nearest=distance_transform_edt(labels==0,return_distances=False,return_indices=True)
 owners=labels[tuple(nearest)]
 OUTPUT.mkdir(parents=True,exist_ok=True)
 for name,(idx,_,_) in zip(NAMES,ordered):
  keep=(owners==idx)&(alpha>0); yy,xx=np.nonzero(keep)
  x0=max(0,int(xx.min())-14); y0=max(0,int(yy.min())-14)
  x1=min(im.width,int(xx.max())+15); y1=min(im.height,int(yy.max())+15)
  a=np.zeros((y1-y0,x1-x0,4),dtype=np.uint8); sub=keep[y0:y1,x0:x1]
  a[sub]=rgba[y0:y1,x0:x1][sub]
  crop=Image.fromarray(a,"RGBA"); sprite=Image.new("RGBA",(512,512))
  fit=ImageOps.contain(crop,(478,478),Image.Resampling.LANCZOS)
  sprite.alpha_composite(fit,((512-fit.width)//2,(512-fit.height)//2))
  sprite.save(OUTPUT/(name+".png"),optimize=True)
if __name__=="__main__":main()
