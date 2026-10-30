# Nutvale Diva — original recording pack
Owner-recorded one-take MP3 (2026-10-30), sliced into 93 per-event MP3s, then transferred via private Google Drive to GitHub's Git blob API in 13 transport shards.

Authoritative original source (retained in owner Drive): https://drive.google.com/file/d/1HvTjubFZYmEVMcWfugvI3koYvxrrEv9B/view
Approved 93-clip archive (owner Drive): https://drive.google.com/file/d/1YRivN3T4lp2Lo3t2Jp4pXHzDLK8OeUFA/view

Run `python3 tools/install_diva_from_chunks.py` to install and SHA256-verify the 93 files under `web/audio/announcers/diva/`. No network access is used during app runtime. The build pipeline installs them before packaging and commits the complete MP3 set to main. All original announcer clips and the Auditor remain intact.

Mapping uses order of the voice-actor recording script and silent pauses. Some lines contain minor improvisation per the owner; do not auto-substitute different voices for unmapped lines. Recording QA is advisory rather than a release-blocking aesthetic check.
