#!/usr/bin/env python3
"""Produce prerecorded Nutvale Auditor MP3s with the CC0 Mira neural voice.

Authoring-only: no model, TTS engine or network access is needed in the game.
Source: https://huggingface.co/BTimber/piper-en_US-mira (CC0-1.0 weights)
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request
import wave
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
MODEL_REPO = 'https://huggingface.co/BTimber/piper-en_US-mira'
REV = 'a8196d6'
MODEL = 'en_US-mira-tokens2.onnx'
MODEL_SHA256 = '5ade04032d8d04a6d1d01db9f74ab3c122af9c60ca75503280c6a3ce2930b42f'
PREVIEW = ('nutbuster', 'win', 'close', 'nutsplosion', 'fish-legendary', 'look-out')


def sha(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def lines_from_game(root: Path) -> dict[str, str]:
    src = root / 'web' / 'announcer-lines.js'
    p = subprocess.run(['node', '-e',
        'process.stdout.write(JSON.stringify(require(process.argv[1]).auditor))',
        str(src.resolve())], capture_output=True, text=True, check=True)
    lines = json.loads(p.stdout)
    if len(lines) != 93 or any(not re.fullmatch(r'[a-z0-9-]+', key) or not isinstance(value, str) or not value.strip()
                               for key, value in lines.items()):
        raise ValueError('Unexpected announcer script: expected 93 safe nonempty event keys')
    return lines


def acquire_model(cache: Path, download: bool) -> Path:
    cache.mkdir(parents=True, exist_ok=True)
    for name in (MODEL, MODEL + '.json'):
        target = cache / name
        if not target.is_file():
            if not download:
                raise RuntimeError(f'Missing {target}; add --download-model (requires internet access)')
            url = f'{MODEL_REPO}/resolve/{REV}/{name}'
            part = target.with_suffix(target.suffix + '.part')
            try:
                with urllib.request.urlopen(url, timeout=120) as source, part.open('wb') as out:
                    shutil.copyfileobj(source, out)
                part.replace(target)
            finally:
                part.unlink(missing_ok=True)
    onnx = cache / MODEL
    if sha(onnx) != MODEL_SHA256:
        raise RuntimeError('Mira weight SHA-256 mismatch; refusing unverified voice')
    config = json.loads((cache / (MODEL + '.json')).read_text(encoding='utf8'))
    if config.get('espeak', {}).get('voice') != 'en' or config.get('audio', {}).get('sample_rate') != 22050:
        raise RuntimeError("Incompatible Mira configuration: requires eSpeak voice 'en' and 22050 Hz")
    return onnx


def render(root: Path, cache: Path, dest: Path, *, full: bool, download: bool,
           piper: str = 'piper', ffmpeg: str = 'ffmpeg') -> Path:
    for program in ('node', piper, ffmpeg):
        if shutil.which(program) is None:
            raise RuntimeError(f'Cannot render: executable not found: {program}')
    lines = lines_from_game(root)
    model = acquire_model(cache, download)
    keys = list(lines) if full else list(PREVIEW)
    dest.mkdir(parents=True, exist_ok=True)
    name = f'nutvale-auditor-mira-cc0-{len(keys)}-clips.zip'
    archive_path = dest / name
    if archive_path.exists():
        raise RuntimeError(f'Previous take exists; refusing to overwrite: {archive_path}')
    manifest = {
        'schema': 1, 'announcer': 'auditor', 'voice': 'mira-cc0',
        'weights_license': 'CC0-1.0 (publisher declaration)',
        'source': MODEL_REPO, 'revision': REV, 'model_sha256': MODEL_SHA256,
        'base_training': 'LJSpeech public domain (publisher declaration)',
        'emotive_teacher': 'ChatterBox Turbo MIT (publisher declaration)',
        'runtime': 'Piper authoring only; no voice model or TTS engine inside game',
        'complete': full, 'count': len(keys), 'files': [],
    }
    try:
        with tempfile.TemporaryDirectory(prefix='nutbuster-mira-') as tmp:
            stage = Path(tmp)
            with ZipFile(archive_path, 'w', ZIP_DEFLATED) as archive:
                for index, key in enumerate(keys, 1):
                    wav, mp3 = stage / (key + '.wav'), stage / (key + '.mp3')
                    proc = subprocess.run([piper, '--model', str(model), '--output_file', str(wav)],
                                          input=lines[key] + '\n', text=True, capture_output=True)
                    if proc.returncode or not wav.exists():
                        raise RuntimeError(f'Mira synthesis failed: {key}: {proc.stderr[-500:]}')
                    with wave.open(str(wav), 'rb') as audio:
                        if audio.getnframes() < audio.getframerate() // 8:
                            raise RuntimeError(f'Truncated audio for {key}')
                    subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y',
                        '-i', str(wav), '-af', 'highpass=f=70,loudnorm=I=-17:TP=-2:LRA=11',
                        '-ar', '22050', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '96k', str(mp3)],
                        check=True)
                    if not mp3.is_file() or mp3.stat().st_size < 1000:
                        raise RuntimeError(f'Invalid MP3 for {key}')
                    rel = 'web/audio/announcers/auditor/' + key + '.mp3'
                    archive.write(mp3, rel)
                    manifest['files'].append({'key': key, 'path': rel, 'sha256': sha(mp3), 'text': lines[key]})
                    print(f'[{index}/{len(keys)}] {key}', flush=True)
                if full:
                    archive.writestr('web/audio/announcers/auditor/manifest.json',
                                     json.dumps(manifest, indent=2) + '\n')
                archive.writestr('assets/audio/auditor-mira-cc0-provenance.json',
                                 json.dumps(manifest, indent=2) + '\n')
    except BaseException:
        archive_path.unlink(missing_ok=True)
        raise
    return archive_path


def install(archive: Path, root: Path, backup_dir: Path) -> None:
    """Install an entire validated 93-clip bank, preserving any existing bank in a ZIP."""
    expected = set(lines_from_game(root))
    target = root / 'web/audio/announcers/auditor'
    target.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(archive) as z:
        manifest = json.loads(z.read('web/audio/announcers/auditor/manifest.json'))
        records = manifest['files']
        if (manifest['voice'], manifest['complete'], len(records)) != ('mira-cc0', True, 93):
            raise RuntimeError('Only a complete Mira-CC0 bank can be installed')
        if set(rec['key'] for rec in records) != expected:
            raise RuntimeError('Rendered keys are inconsistent with current game scripts')
        for rec in records:
            rel = 'web/audio/announcers/auditor/' + rec['key'] + '.mp3'
            if rec['path'] != rel or hashlib.sha256(z.read(rel)).hexdigest() != rec['sha256']:
                raise RuntimeError('Mira MP3 integrity check failed for ' + rec['key'])
        with tempfile.TemporaryDirectory(prefix='nutbuster-mira-install-', dir=str(target.parent)) as tmp:
            staging = Path(tmp) / 'auditor'
            staging.mkdir()
            for rec in records:
                (staging / (rec['key'] + '.mp3')).write_bytes(z.read(rec['path']))
            (staging / 'manifest.json').write_bytes(z.read('web/audio/announcers/auditor/manifest.json'))
            if target.exists():
                backup_dir.mkdir(parents=True, exist_ok=True)
                import datetime
                stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
                backup = backup_dir / ('auditor-before-mira-' + stamp + '.zip')
                with ZipFile(backup, 'x', ZIP_DEFLATED) as old:
                    for old_file in target.rglob('*'):
                        if old_file.is_file():
                            old.write(old_file, old_file.relative_to(target.parent))
                shutil.rmtree(target)
            staging.replace(target)
    print(f'Installed 93 Mira recordings in {target}; originals, if any, backed up under {backup_dir}')


def main() -> int:
    parser = argparse.ArgumentParser(description='Render CC0 Mira into prerecorded NUTBUSTER MP3s')
    parser.add_argument('--all', action='store_true', help='Render all 93; default: six-line audition')
    parser.add_argument('--download-model', action='store_true', help='Fetch pinned 63.5 MB Mira model once')
    parser.add_argument('--install', action='store_true', help='Install the full MP3 bank into web/audio/')
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--cache', type=Path, default=Path.home() / '.cache/nutbuster-mira')
    parser.add_argument('--out', type=Path, default=Path('dist/voice-candidates'))
    args = parser.parse_args()
    if args.install and not args.all:
        parser.error('--install requires --all (previews are never installed)')
    try:
        output = render(args.root, args.cache, args.out, full=args.all, download=args.download_model)
        print('Rendered: ', output)
        if args.install:
            install(output, args.root, args.out / 'backups')
        return 0
    except (OSError, RuntimeError, ValueError, subprocess.CalledProcessError, KeyError) as ex:
        print('NOT RENDERED OR INSTALLED:', ex, file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
