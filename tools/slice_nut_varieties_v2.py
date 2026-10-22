#!/usr/bin/env python3
"""Regenerate Nutbuster expansion v2 nut sprites from the artwork source.

Uses only Pillow, which is already used for the existing art pipeline.
Run: python tools/slice_nut_varieties_v2.py
Check without writes: python tools/slice_nut_varieties_v2.py --check
"""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
from PIL import Image
import sys

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'assets/source/expansion/nut-varieties-v2.png'
DEST=ROOT/'web/art/primary/nuts'
MANIFEST=DEST/'expansion-v2-manifest.json'


def sha(path:Path)->str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(check=False):
    manifest=json.loads(MANIFEST.read_text())
    if sha(SOURCE)!=manifest['source_sha256']:
        raise ValueError('Source art was changed; reauthor manifest before regenerating')
    img=Image.open(SOURCE).convert('RGBA')
    if img.size!=tuple(manifest['source_dimensions']):
        raise ValueError('Unexpected source image dimensions')
    for name,entry in manifest['sprites'].items():
        x0,y0,x1,y1=entry['source_bbox']
        # Each of the 12 figures has its own transparent gap and bbox.
        # Padding stays inside the source rather than bleeding from neighbors.
        pad=5
        crop=img.crop((max(0,x0-pad),max(0,y0-pad),min(img.width,x1+pad),min(img.height,y1+pad)))
        alpha=crop.getchannel('A')
        alpha=alpha.point(lambda a: 0 if a<7 else a)
        crop.putalpha(alpha)
        bbox=alpha.getbbox()
        if not bbox:raise ValueError('Blank input sprite: '+name)
        crop=crop.crop(bbox)
        crop.thumbnail((170,170),Image.Resampling.LANCZOS)
        tile=Image.new('RGBA',(192,192))
        tile.alpha_composite(crop,((192-crop.width)//2,(192-crop.height)//2))
        bounds=tile.getchannel('A').getbbox()
        if not bounds or min(bounds[0],bounds[1],192-bounds[2],192-bounds[3])<8:
            raise ValueError('Empty or edge-clipped tile: '+name)
        out=DEST/(name+'.png')
        if check:
            if not out.exists():raise ValueError('Missing '+str(out))
            existing=Image.open(out).convert('RGBA')
            if existing.size!=tile.size or existing.tobytes()!=tile.tobytes():
                raise ValueError('Sprite differs from generated source: '+name)
            if sha(out)!=entry['sha256']:raise ValueError('Unexpected committed sprite digest: '+name)
        else:
            tile.save(out,format='PNG',optimize=True)
            if sha(out)!=entry['sha256']:raise ValueError('Manifest digest mismatch: '+name)
    print(('Verified' if check else 'Generated'),len(manifest['sprites']),'nut sprites')


if __name__=='__main__':run('--check' in sys.argv)
