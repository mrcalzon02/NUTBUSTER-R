#!/usr/bin/env python3
"""Synthetic packaging regression for Mira. This NEVER claims voice-quality verification."""
import hashlib
import json
import sys
import tempfile
import wave
from pathlib import Path
from unittest import mock

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
import render_mira_cc0 as m

with tempfile.TemporaryDirectory(prefix='mira-render-test-') as tmp:
    root=Path(tmp)
    (root/'web').mkdir()
    keys=m.lines_from_game(ROOT)
    assert len(keys)==93
    (root/'web/announcer-lines.js').write_text(
        'module.exports={auditor:'+json.dumps(keys)+'};',encoding='utf-8')
    cache=root/'cache'
    cache.mkdir()
    (cache/m.MODEL).write_bytes(b'test-only dummy ONNX weights')
    (cache/(m.MODEL+'.json')).write_text(
        '{"espeak":{"voice":"en"},"audio":{"sample_rate":22050}}',encoding='utf-8')
    digest=hashlib.sha256((cache/m.MODEL).read_bytes()).hexdigest()

    actual_run=m.subprocess.run
    def simulated_run(argv, **kwargs):
        if argv[0]=='node':
            return actual_run(argv,**kwargs)
        if '--output_file' in argv:
            wav=Path(argv[argv.index('--output_file')+1])
            with wave.open(str(wav),'wb') as recording:
                recording.setnchannels(1)
                recording.setsampwidth(2)
                recording.setframerate(22050)
                recording.writeframes(b'\0\0'*4500)
        elif '-codec:a' in argv:
            Path(argv[-1]).write_bytes(b'ID3'+b'\0'*2048)
        else:
            raise AssertionError('Unexpected renderer command: '+repr(argv))
        return type('Result',(),{'returncode':0,'stderr':''})()

    with mock.patch.object(m,'MODEL_SHA256',digest), \
         mock.patch.object(m.subprocess,'run',side_effect=simulated_run), \
         mock.patch.object(m.shutil,'which',side_effect=lambda name:'/usr/bin/'+name):
        preview=m.render(root,cache,root/'dist',full=False,download=False)
        with m.ZipFile(preview) as z:
            assert len([x for x in z.namelist() if x.endswith('.mp3')])==6
            assert 'web/audio/announcers/auditor/manifest.json' not in z.namelist()

        pack=m.render(root,cache,root/'dist',full=True,download=False)
        with m.ZipFile(pack) as z:
            assert len([x for x in z.namelist() if x.endswith('.mp3')])==93
            manifest=json.loads(z.read('web/audio/announcers/auditor/manifest.json'))
            assert manifest['voice']=='mira-cc0'
            assert {x['key'] for x in manifest['files']}==set(keys)

        m.install(pack,root,root/'backup')
        assert len(list((root/'web/audio/announcers/auditor').glob('*.mp3')))==93
        try:
            m.render(root,cache,root/'dist',full=True,download=False)
        except RuntimeError as error:
            assert 'overwrite' in str(error)
        else:
            raise AssertionError('The existing recordings archive was overwritten')
        m.install(pack,root,root/'backup')
        assert len(list((root/'backup').glob('*.zip')))==1

print('PASS: Mira 6/93 pack structure, checksums, installation, archival, no overwrites')
