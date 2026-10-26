#!/usr/bin/env python3
"""Convert committed approved art to SDL3-core-readable BMP without replacing art."""
from pathlib import Path
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
def main() -> None:
    for nut in NUTS:
        transform(ROOT/"web"/"art"/"primary"/"nuts"/(nut+".png"),
                  OUT/"nuts"/(nut+".bmp"))
    for row in range(1,5):
        for col in range(1,7):
            key=f"r{row}c{col}"
            transform(ROOT/"web"/"art"/"nutvale"/"mining-ore"/(key+".png"),
                      OUT/"mine"/(key+".bmp"))
    print(f"Native SDL3 BMP sprite copies: {len(NUTS)+24} approved images.")
if __name__=="__main__":
    main()
