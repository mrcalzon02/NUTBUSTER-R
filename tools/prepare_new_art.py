#!/usr/bin/env python3
"""Slice the three owner-provided Nutbuster sheets into transparent, named sprites.

Designed to be deterministic, non-destructive and Pillow-only. Retains source
SHA-256 and source crop rectangles in the manifest for audit and regeneration.
The source sheets are *different compositions*: menu row 4 has six columns;
FX include elongated line-clears, so uniform 5x4 slicing is incorrect.
"""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'assets' / 'source' / 'additions'
OUT = ROOT / 'web' / 'art' / 'additions'

SHEETS = [
    ('menu-icons.png', 'ui', [
        ['title-acorn', 'home', 'play', 'pause', 'settings'],
        ['campaign-map', 'store', 'gift', 'treasure', 'vip-crown'],
        ['sound-on', 'sound-off', 'music-on', 'music-off', 'back'],
        ['next', 'restart', 'help', 'trophy', 'timer', 'life'],
    ], [0, 285, 552, 790, 1086]),
    ('economy-icons.png', 'economy', [
        ['acorn-pile', 'prismatic-acorn', 'shell-coins', 'squirrel-cash', 'achievement-medal'],
        ['premium-ticket', 'locked-chest', 'open-lootbox', 'booster-pack', 'piggy-bank'],
        ['energy-heart', 'hourglass', 'timed-chest', 'squirrel-pass', 'vip-shield'],
        ['daily-calendar', 'mystery-gift', 'level-badge', 'friends-gift', 'grand-bundle'],
    ], [0, 282, 548, 805, 1086]),
]

FX = [
  ('sparkle-burst', (0,48,241,358), (256,256)),
  ('match-burst', (224,56,471,367), (256,256)),
  ('shell-supernova', (418,16,734,383), (256,256)),
  ('shell-fragments', (698,48,968,385), (256,256)),
  ('coin-shower', (960,54,1211,349), (256,256)),
  ('golden-acorn-glow', (1206,36,1448,374), (256,256)),
  ('ice-shatter', (0,351,235,694), (256,256)),
  ('chain-break', (219,352,493,699), (256,256)),
  ('chest-pop', (476,368,731,693), (256,256)),
  ('horizontal-clear', (666,430,1023,671), (512,256)),
  ('vertical-clear', (953,306,1210,711), (256,512)),
  ('rainbow-pulse', (1179,348,1448,695), (256,256)),
  ('shell-ring', (0,689,263,1040), (256,256)),
  ('focus-ring', (234,688,492,1053), (256,256)),
  ('time-boost', (472,683,740,1054), (256,256)),
  ('royal-boost', (722,700,979,1044), (256,256)),
  ('rocket-impact', (955,685,1225,1058), (256,256)),
  ('confetti', (1190,691,1448,1062), (256,256)),
]

def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def segmented_rects(width: int, ycuts: list[int], names: list[list[str]]):
    # Image composition is hand-laid out. Horizontal sprite counts vary by row.
    for y, row in enumerate(names):
        xs = [round(i * width / len(row)) for i in range(len(row)+1)]
        for x, name in enumerate(row):
            yield name, (xs[x], ycuts[y], xs[x+1], ycuts[y+1])

def make_sprite(im:Image.Image, rect:tuple, canvas:tuple, dst:Path) -> dict:
    crop = im.crop(rect)
    # Remove barely-visible halo residue, retaining smooth partial alpha.
    alpha = crop.getchannel('A')
    alpha = alpha.point(lambda v: 0 if v < 7 else v)
    crop.putalpha(alpha)
    bbox = alpha.getbbox()
    if not bbox:
        raise ValueError(f'Empty sprite from {rect}')
    piece = crop.crop(bbox)
    maxsize = (canvas[0] - 12, canvas[1] - 12)
    piece.thumbnail(maxsize, Image.Resampling.LANCZOS)
    final = Image.new('RGBA', canvas)
    xy = ((canvas[0]-piece.width)//2, (canvas[1]-piece.height)//2)
    final.alpha_composite(piece,xy)
    dst.parent.mkdir(parents=True, exist_ok=True)
    final.save(dst, format='PNG', optimize=True)
    alpha_data=final.getchannel('A')
    if alpha_data.getextrema()[1] == 0:
        raise ValueError(f'Fully transparent sprite: {dst}')
    return {'path': 'art/additions/' + dst.relative_to(OUT).as_posix(),
            'sha256':file_sha(dst),'source_rect':list(rect),
            'output_pixels':list(canvas),'visible_pixels':list(bbox),
            'alpha_mode':'RGBA'}

def run() -> None:
    manifest = {'schema':1, 'role':'supplementary-icons-and-fx',
        'owner_generated_primary_art_priority':'web/art/primary',
        'sheets': {}, 'sprites': {}}
    for sheet, category, rows, ycuts in SHEETS:
        path=SRC/sheet
        im=Image.open(path).convert('RGBA')
        manifest['sheets'][sheet]={'source_sha256':file_sha(path),'dimensions':list(im.size),
            'layout':[len(row) for row in rows], 'category':category}
        for name,rect in segmented_rects(im.width, ycuts, rows):
            manifest['sprites'][f'{category}/{name}'] = {
                'source':sheet, **make_sprite(im,rect,(256,256), OUT/category/(name+'.png'))}
    sheet = 'effects.png'; path=SRC/sheet; im=Image.open(path).convert('RGBA')
    manifest['sheets'][sheet]={'source_sha256':file_sha(path),'dimensions':list(im.size),
        'layout':'custom-masks-overlapping-vfx', 'category':'effects'}
    for name, rect, canvas in FX:
        manifest['sprites'][f'effects/{name}']={
            'source':sheet, **make_sprite(im,rect,canvas, OUT/'effects'/(name+'.png'))}
    target=OUT/'manifest.json';target.parent.mkdir(exist_ok=True,parents=True)
    target.write_text(json.dumps(manifest,indent=2,sort_keys=True)+'\n')
    print('Wrote',len(manifest['sprites']),'sprites; categories:',
       {k:sum(s.startswith(k+'/') for s in manifest['sprites']) for k in ['ui','economy','effects']})

if __name__=='__main__':run()
