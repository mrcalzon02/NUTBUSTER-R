#!/usr/bin/env python3
"""One-time byte-preserving recovery of approved Nutvale art; never substitute generated PNGs."""
import base64
import hashlib
import io
import json
import os
from pathlib import Path
import struct
import urllib.request
import zipfile

ROOT=Path(__file__).resolve().parents[1]
REPOSITORY=os.environ.get("GITHUB_REPOSITORY","mrcalzon02/NUTBUSTER-R")
PARTS=["458278cfcb6874c22888f3c92e14c908f56048ce","4589722b626a4bfea492995c4e3033e1252d19de","3abf12be7ceb9b9e232df986cf5c9c38505a1c54","770d75d4173d63533c9c8f03d5fdcf971b51955c","ae59a9d8d000a1daa7c3ebf0e74ecf75730ff082","508f7ac224d483d8cb9ccae872b69fa024faa8b0","2e3aed351b07c89a509b84ffdcd1d1498ba85de6","5ad43fac4277e8b4027b90afe79c1138bb2bc202","917eba00dc6b82ed0003263cd914724c3104e9d3","7b525b413876cb9c208dbb5ad779a6b34480e4f7"]
ZIP_SHA256="b1c687844752f676628bf01f8f6cd02c1435a11aad9a918460cc3ada91e8ba5a"

def verify_png(data,width,height,name):
    if data[:8]!=bytes.fromhex("89504e470d0a1a0a"):
        raise ValueError(f"Not a PNG: {name}")
    if len(data)<45 or struct.unpack(">II",data[16:24])!=(width,height) or data[24:26]!=bytes([8,6]):
        raise ValueError(f"Bad PNG dimensions or format: {name}")
    if b"IEND" not in data[-32:]:
        raise ValueError(f"PNG missing trailer: {name}")

def main():
    token=os.environ["GH_TOKEN"]
    fragments=[]
    for index,sha in enumerate(PARTS):
        request=urllib.request.Request(
            f"https://api.github.com/repos/{REPOSITORY}/git/blobs/{sha}",
            headers={"Authorization":f"Bearer {token}","Accept":"application/vnd.github+json","User-Agent":"nutvale-verified-asset-restore"},
        )
        with urllib.request.urlopen(request, timeout=90) as response:
            blob=json.load(response)
        if blob["encoding"]!="base64":
            raise ValueError("Unexpected GitHub blob encoding")
        fragment=base64.b64decode(blob["content"]).decode("ascii")
        if len(fragment)!=(1400000 if index<9 else 1308848):
            raise ValueError("Original archive fragment has changed")
        fragments.append(fragment)
    archive=base64.b64decode("".join(fragments),validate=True)
    if hashlib.sha256(archive).hexdigest()!=ZIP_SHA256:
        raise ValueError("Original asset ZIP checksum mismatch")
    outputs={}
    with zipfile.ZipFile(io.BytesIO(archive)) as z:
        bad=z.testzip()
        if bad: raise ValueError("Damaged ZIP member: "+bad)
        manifest_name="web/art/nutvale/mining-tools/manifest.json"
        manifest_data=z.read(manifest_name)
        manifest=json.loads(manifest_data)
        if manifest["total"]!=86 or manifest["categories"]!={"pickaxes":44,"gloves":42}:
            raise ValueError("Wrong Nutvale art manifest")
        outputs[manifest_name]=manifest_data
        for sprite in manifest["sprites"]:
            name="web/"+sprite["path"]
            data=z.read(name)
            verify_png(data,192,192,name)
            if hashlib.sha256(data).hexdigest()!=sprite["sha256"]:
                raise ValueError("Sprite SHA-256 mismatch: "+name)
            outputs[name]=data
        for category in ("pickaxes","gloves"):
            atlas=manifest["atlases"][category]
            name="web/"+atlas["path"]
            data=z.read(name)
            verify_png(data,192*atlas["columns"],192*atlas["rows"],name)
            if hashlib.sha256(data).hexdigest()!=atlas["sha256"]:
                raise ValueError("Atlas SHA-256 mismatch: "+name)
            outputs[name]=data
        for category in ("pickaxes","gloves"):
            name=f"web/art/nutvale/mining-tools/preview-{category}.png"
            outputs[name]=z.read(name)
        qa=z.read("QA-REPORT.json")
        if json.loads(qa)["source_sha256"]!=manifest["source_sha256"]:
            raise ValueError("QA report does not match source atlas")
        outputs["docs/assets/nutvale-mining-tool-qa-report.json"]=qa+b"\n"
        source=z.read("assets/source/expansion/nutvale-mining-pickaxes-gloves-original.png")
        if hashlib.sha256(source).hexdigest()!=manifest["source_sha256"] or len(source)!=3158710:
            raise ValueError("Approved original sheet SHA-256 mismatch")
        lengths=[789678,789678,789678,789676]
        cursor=0
        for number,length in enumerate(lengths,1):
            name=f"assets/source/expansion/nutvale-mining-pickaxes-gloves-original.png.part-{number:02d}"
            outputs[name]=source[cursor:cursor+length]
            cursor+=length
    if len(outputs)!=96:
        raise ValueError(f"Unexpected asset recovery file count: {len(outputs)}")
    for name,data in outputs.items():
        path=ROOT/name
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_bytes(data)
    print("VERIFIED: 86 original sprites, two atlases, two previews, source sheet chunks, and original checksums restored")

if __name__=="__main__":
    main()
