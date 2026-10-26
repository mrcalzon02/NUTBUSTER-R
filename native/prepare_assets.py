#!/usr/bin/env python3
"""Convert committed approved art to SDL3-core-readable BMP without replacing art."""
from pathlib import Path
import json
import struct
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "native" / "generated-assets" / "data"
NUTS = ["peanut","walnut","almond","cashew","hazelnut","pistachio","gold-acorn",
        "beechnut","brazil-nut","candlenut","chestnut","coconut","ginkgo-nut",
        "hickory-nut","macadamia","pecan","pili-nut","pine-nut","tiger-nut"]
def transform(src: Path, dest: Path) -> None:
    if not src.is_file():
        raise SystemExit(f"Native build BLOCKED: approved asset missing: {src}")
    dest.parent.mkdir(parents=True,exist_ok=True)
    with Image.open(src) as image:
        if min(image.size)<16:
            raise SystemExit(f"Native build BLOCKED: approved image is too small: {src}")
        # SDL3 core's BMP loader preserves source pixels but transparent PNGs
        # need compositing onto the dark native tile background.
        rgba=image.convert("RGBA")
        background=Image.new("RGB",rgba.size,(38,22,45))
        background.paste(rgba,mask=rgba.getchannel("A"))
        background.save(dest,"BMP")
def rgba(source: Path, destination: Path) -> None:
    """Preserve every pixel and its alpha; SDL3 core receives raw RGBA."""
    if not source.is_file():
        raise SystemExit("Missing approved UI overlay: "+str(source))
    destination.parent.mkdir(parents=True,exist_ok=True)
    with Image.open(source) as original:
        image=original.convert("RGBA")
        if max(image.size)>4096 or min(image.size)<16:
            raise SystemExit("Unsupported approved overlay dimensions: "+str(source))
        destination.write_bytes(struct.pack("<II",*image.size)+image.tobytes())

def main() -> None:
    transform(ROOT/"web"/"art"/"maps"/"campaign-overview.webp",
              OUT/"maps"/"campaign-overview.bmp")
    for nut in NUTS:
        transform(ROOT/"web"/"art"/"primary"/"nuts"/(nut+".png"),
                  OUT/"nuts"/(nut+".bmp"))
    for row in range(1,5):
        for col in range(1,7):
            key=f"r{row}c{col}"
            transform(ROOT/"web"/"art"/"nutvale"/"mining-ore"/(key+".png"),
                      OUT/"mine"/(key+".bmp"))
    # Read the *authoritative* playable 40-tier equipment atlas, not a hand-picked
    # or inferred mapping. Non-progression BONUS sprites aren't gear tiers.
    source=(ROOT/"web"/"nutvale-mining-gear.js").read_text(encoding="utf-8")
    prefix="const ART=Object.freeze("
    start=source.find(prefix)
    end=source.find(");",start+len(prefix))
    if start<0 or end<0:
        raise SystemExit("Approved mining gear catalog not found")
    catalog=json.loads(source[start+len(prefix):end])
    if set(catalog)!={"pickaxe","gloves"}:
        raise SystemExit("Native gear catalog unexpected tracks")
    for track,kind in (("pickaxe","pickaxes"),("gloves","gloves")):
        rows=catalog[track]
        if len(rows)!=40:
            raise SystemExit(f"Expected exactly 40 approved {track} tiers")
        for tier,entry in enumerate(rows):
            src=ROOT/"web"/entry["image"]
            if not src.resolve().is_relative_to((ROOT/"web"/"art"/"nutvale"/"mining-tools"/kind).resolve()):
                raise SystemExit("Refusing non-approved gear source: "+str(src))
            transform(src,OUT/"gear"/(f"{track}-{tier:02}.bmp"))
    blockers=("ice-1","ice-2","lock","chain-1","chain-2","chest","crate","rock")
    overlays=("sticky-butter","bomb")
    for name in blockers:
        rgba(ROOT/"web"/"art"/"primary"/"blockers"/(name+".png"),
             OUT/"blocker"/(name+".rgba"))
    for name in overlays:
        rgba(ROOT/"web"/"art"/"primary"/"overlays"/(name+".png"),
             OUT/"overlay"/(name+".rgba"))
    print(f"Native SDL3 sprites: {len(NUTS)+24+80} existing BMP assets and {len(blockers)+len(overlays)} faithful-alpha blocker/overlay assets.")
if __name__=="__main__":
    main()
