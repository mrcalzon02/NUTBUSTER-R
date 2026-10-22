#!/usr/bin/env python3
"""Slice Nutbuster's 4x4 tile STATUS overlays, not whole-special-nut sprites.

Usage: python3 tools/slice_tile_overlays.py
Requires Pillow. Writes transparent 192x192 art and an auditable manifest.
Bomb's fuse spark overlaps the row boundary, so its warm pixels use a
custom overflow crop without pulling the storm artwork from above.
"""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/source/expansion/nut-tile-overlays-4x4.png'
OUTPUT = ROOT / 'web/art/primary/overlays'
NAMES = (
    'fire', 'frost', 'lightning', 'water',
    'nature-vines', 'poison', 'radiance', 'shadow',
    'crystal', 'magma', 'storm', 'arcane',
    'sticky-butter', 'chain-lock', 'bomb', 'void-rock',
)
OPACITY = {name: .78 for name in NAMES}
OPACITY.update({'sticky-butter': .72, 'chain-lock': .66, 'bomb': .66})
SIZE = (192, 192)

def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def source_crop(source: Image.Image, index: int, name: str):
    col, row = index % 4, index // 4
    x0, x1 = round(source.width * col/4), round(source.width * (col + 1)/4)
    y0, y1 = round(source.height * row/4), round(source.height * (row + 1)/4)
    if name == 'bomb':
        # Only the lit fuse's warm sparks cross upward into the storm tile.
        top = max(0, y0-35)
        cropped = source.crop((x0, top, x1, y1))
        px = cropped.load()
        for y in range(y0-top):
            feather = min(1, (y + 1)/9)
            for x in range(cropped.width):
                r,g,b,a = px[x,y]
                warm = ((r > g * 1.12) and (r > b * 1.23) and (r > 100)) or (r > 170 and g > 95 and b < 125)
                px[x,y] = (r,g,b,round(a*feather) if warm else 0)
        source_rect = (x0, top, x1, y1)
    else:
        cropped = source.crop((x0,y0,x1,y1))
        source_rect = (x0,y0,x1,y1)
    mask = cropped.getchannel('A').point(lambda a: 255 if a > 8 else 0)
    bbox = mask.getbbox()
    if not bbox: raise ValueError('Empty sprite: '+name)
    left,top,right,bottom = bbox
    trimmed = (
        max(0,left-6), max(0,top-6),
        min(cropped.width,right+6), min(cropped.height,bottom+6)
    )
    return cropped.crop(trimmed), list(source_rect), list(trimmed)

def main():
    source = Image.open(SOURCE).convert('RGBA')
    if source.width < 800 or source.height < 800:
        raise ValueError('Unexpected small overlay atlas')
    OUTPUT.mkdir(parents=True,exist_ok=True)
    manifest = {
        'schema': 2, 'role': 'nut-tile-overlays-only',
        'source': SOURCE.relative_to(ROOT).as_posix(),
        'source_sha256': sha(SOURCE), 'source_size': list(source.size),
        'layout': [4,4], 'sprite_size': list(SIZE),
        'processing': 'tools/slice_tile_overlays.py',
        'whole_nut_special_art': 'Preserved independently; these assets are transparent overlaid tile statuses, not ordinary match pieces.',
        'sprites': {},
    }
    for index,name in enumerate(NAMES):
        original,rect,bbox=source_crop(source,index,name)
        opacity=OPACITY[name]
        a=original.getchannel('A').point(lambda x:round(x*opacity))
        original.putalpha(a)
        fit=ImageOps.contain(original,(182,182),method=Image.Resampling.LANCZOS)
        sprite=Image.new('RGBA',SIZE)
        sprite.alpha_composite(fit,((SIZE[0]-fit.width)//2,(SIZE[1]-fit.height)//2))
        if sprite.getchannel('A').getextrema()[1] >= 220:
            raise ValueError('Overlay too opaque: '+name)
        p=OUTPUT/(name+'.png')
        sprite.save(p,optimize=True)
        # No visible pixels may be cut off at the actual sprite border.
        aa=sprite.getchannel('A')
        if aa.crop((0,0,192,1)).getbbox() or aa.crop((0,191,192,192)).getbbox() or aa.crop((0,0,1,192)).getbbox() or aa.crop((191,0,192,192)).getbbox():
            raise ValueError('Clipped overlay edge: '+name)
        manifest['sprites'][name]={
            'path':f'art/primary/overlays/{name}.png',
            'raw_path':f'raw_trimmed/{name}.png',
            'grid_index':index, 'source_rect':rect,
            'trimmed_rect':bbox, 'output_pixels':[192,192],
            'opacity_multiplier':opacity,'sha256':sha(p),
            'source_sha256':hashlib.sha256(_encode_png(original)).hexdigest(),
            'special_crop':'warm-spark overflow above row boundary' if name=='bomb' else 'grid-cell alpha-trim',
        }
    (OUTPUT/'manifest.json').write_text(json.dumps(manifest,sort_keys=True,indent=2)+'\n',encoding='utf-8')
    print('Sliced 16 RGBA 192x192 status overlays; original whole-nut art untouched.')

def _encode_png(image):
    from io import BytesIO
    output=BytesIO();image.save(output,format="PNG",optimize=True);return output.getvalue()

if __name__=='__main__':main()
