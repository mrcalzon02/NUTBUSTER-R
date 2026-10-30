#!/usr/bin/env python3
"""Install user-recorded Nutvale Diva voice pack from GitHub-tracked Drive transfer shards.
No network, TTS, or external packages needed. Original and Auditor voices remain unchanged.
"""
from pathlib import Path
import hashlib
import io
import json
import sys
import zipfile

ROOT = Path(__file__).resolve().parent.parent
PARTS_DIR = ROOT / "assets/audio/diva-parts"
TARGET_DIR = ROOT / "web/audio/announcers/diva"
SOURCE_SHA256 = "f88f415a2345332796755ec5a245698d5f65f577b18586a9d97ad22ad1673d1c"

def install():
    parts = sorted(PARTS_DIR.glob("part-*.bin"))
    if len(parts) != 13:
        raise ValueError(f"Expected 13 verified Drive transfer parts, found {len(parts)}")
    payload = b"".join(path.read_bytes() for path in parts)
    digest = hashlib.sha256(payload).hexdigest()
    if digest != SOURCE_SHA256:
        raise ValueError(f"Nutvale Diva original archive SHA256 mismatch: {digest}")
    with zipfile.ZipFile(io.BytesIO(payload)) as archive:
        mfpath = "web/audio/announcers/diva/manifest.json"
        manifest = json.loads(archive.read(mfpath))
        clips = manifest["clips"]
        if len(clips) != 93 or len(set(clips)) != 93:
            raise ValueError("Expected exactly 93 unique script event keys")
        names = set(archive.namelist())
        verified = {}
        for key, info in clips.items():
            if not key or any(x not in "abcdefghijklmnopqrstuvwxyz0123456789-" for x in key):
                raise ValueError(f"Invalid recorded event ID {key!r}")
            name = f"web/audio/announcers/diva/{key}.mp3"
            if name not in names:
                raise ValueError(f"Missing Diva recording: {key}")
            data = archive.read(name)
            if not data.startswith(b"ID3") and data[:2] not in (b"\\xff\\xfb", b"\\xff\\xf3"):
                raise ValueError(f"Not an MP3: {key}")
            if hashlib.sha256(data).hexdigest() != info["sha256"]:
                raise ValueError(f"Wrong recording checksum: {key}")
            verified[key] = data
        TARGET_DIR.mkdir(parents=True, exist_ok=True)
        for key, data in verified.items():
            (TARGET_DIR / f"{key}.mp3").write_bytes(data)
        (TARGET_DIR / "manifest.json").write_bytes(archive.read(mfpath))
        print(f"PASS: installed {len(verified)} verified, locally recorded Nutvale Diva MP3s")
    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(install())
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        raise SystemExit(1)
