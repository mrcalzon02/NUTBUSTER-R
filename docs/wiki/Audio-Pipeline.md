# NUTBUSTER — Sound and Music Integration

The user-designated Drive audio folder is [Sounds / NUTBUSTER](https://drive.google.com/drive/folders/1IwvPgWwzabBliPODifPDdT61WqJhfmxu). **Drive is the source archive, not a runtime dependency.** All 41 audio assets are bundled under `web/audio/` and described in `assets/audio/catalog.json`. Original file names and Drive IDs are retained in the catalog. No Google account or network connection is needed to play.

## Playback

- `web/audio.js` owns three separate HTML5 Audio channels: looped music (at 28%), voiced announcer (at 90%, ducks music to 11%), and occasional grunts (at 38%).
- Every triggered announcer clip varies playback rate by up to ±9%; every grunt/reaction by up to ±11%. Pitch preservation is disabled on both channels so compatible browsers change both tone and duration. Consecutive voice lines differ by at least 6.48 percentage points in playback rate, and consecutive grunts by at least 7.92 points. The selected rate is written to both `defaultPlaybackRate` and `playbackRate` and reapplied at `loadedmetadata`/`playing` if the media engine resets it while loading. Music remains 1.0×.
- `web/sfx.js` prioritizes 17 owner-licensed local MP3 effects curated from Drive's shared Sounds folder for UI clicks, match pops, shells, ice, locks, chests, power-ups, hazards, coins, and completion. The original Web Audio synthesizer stays as a fallback, including when eight recorded effects are already playing. Individual nuts still receive independent staggered pops, capped at 32 per cascade. Gameplay effects retain separate volume and mute controls.
- Eight more user-provided clips are now included: What a Deal, Look Out, NUTSPLOsion, HECKPACKAGE, Nutsselence, Nut Destruction, Nutravaganza and BUSTED.
- Announcer, music, and gameplay effects are independently switchable on Home/in-game menus. Voice, music, reaction, and effect volumes are independently adjustable under Settings; preferences are stored locally.
- The **Audio & Settings** page now offers two selectable announcers with a preview button. `announcerVoice` defaults to `original` and persists in the existing offline save. Switching to the dry Nutvale Auditor preserves original voice assets and updates visible captions to the Auditor's actual spoken wording. `web/announcer-lines.js` contains 93 approved alternate-script entries; 19 pre-existing voice event keys are currently triggered in gameplay. The other 74 require their new gameplay hooks. The planned female Nutvale Diva is not selectable until her new original audio is produced.
- Synthesized effects get a slight per-trigger pitch/speed variation. Normal match grunts play after ordinary successful clears, **not on every button press**.
- Audio starts only following a user gesture. Failed/blocked media playback is handled gracefully without stopping the puzzle.
## Trigger assignments

| Game event | Announcer | Local gameplay effect |
| --- | --- | --- |
| Game start, standard victory, every fifth level victory, defeat | Nutbuster (soft), Unbelievable Performance, Nutravaganza, That Was Close | Start/select, victory, failure |
| Ordinary nut clear, 5+ cleared, 12+ cleared | Grunt, Ooh That's a Big One, Nut Destruction | One pitch-varied pop per nut, capped at 32 per cascade |
| Two cascades, large two-cascade clear, three cascades, four/five cascades, six or more | Magnificent Nuts, Nutsselence, They Just Keep Coming, NUTSPLOsion, BUSTED | Fresh individual nut pops for every wave |
| Special combo, timed acorn detonation | Nut Destruction, Look Out | Blocker/hazard and combo effects |
| Ice layers, chain damage, chests, jam, fuse, portals/conveyors, reshuffle | No extra voice | Ice hit, chain, chest, crack/hazard, portal/transport, shuffle |
| Booster, hold item, swaps, invalid move, tile selection | No extra voice | Booster/chain/shuffle, swap, invalid, select |
| Shop checkout: selected large offers / other offers | HECKPACKAGE / What a Deal | Coin/checkout effect |
| Daily reward, chest, pig smash, other reward claims | Satisfaction Guaranteed, Nutbuster!, Oh My and existing premium/package lines | Coin, chest, crack and reward visual FX |
| Fish cast, tracking, reel, caught, escaped, kept/sold; aquarium upgrades | No extra voice | Cast, UI/reel, caught, escaped, place/coin |
| Homestead build, renovation, placed decor, pet selection | No extra voice | Place/build |

*The names NUTSPLOsion and Nut Destruction refer to authored **announcer lines**, not recorded collision sounds. Collision, blocker, and fishing effects are synthesized locally; replacing them with authored recordings later requires an explicit asset catalog entry and an engine hookup. The sound system must continue working without Google Drive or a network connection.*
- Captions remain visible independently of audible playback. The **original** announcer plays owner-provided MP3s; the selectable **Nutvale Auditor** synthesizes its approved lines using the installed **offline English** Android TextToSpeech engine, or an explicitly local browser speech voice. No remotely synthesized fallback, streaming music, or external interaction upload is authorized.

## Music compatibility and size

`Bubbly Whistle.mp3` (original 3.49 MB, 144 seconds) is retained unchanged in Drive. Its runtime copy has been transcoded to a 56 kbps, 44.1 kHz, two-channel MP3 (~1 MB), avoiding new codecs on Android API 26 and keeping the APK smaller. `ffprobe` validates source duration and the deployable copy. Only the deployable copy is stored in the game repository.

## Acceptance gates

Run `node tests/engine.test.js`, `node tests/ui-smoke.test.js`, `node tests/audio.test.js`, and `node tests/sfx.test.js`, and `node tests/sfx-samples.test.js`. The audio tests cover independent synthesis controls and bounded per-nut burst generation, alongside channel isolation, toggles, music ducking, per-trigger rate bounds, disabled pitch preservation, recovery from simulated Android-style media load resets, consecutive audible-rate variation, music stability, all cataloged SHA-256 digests and the availability of every one of the 41 files.

Device tests still needed: verify original playback and volume ducking on an actual Android API 26 device, current Android phone/tablet, and desktop; **explicitly test Auditor local English voice detection, speech and caption alignment, no-network mode, preview, rapid announcer switching, pause/resume, and music ducking**. Check audio-focus interruptions and speech clarity against music. The repository tests do **not** prove Android APK installation or physical playback.

For public distribution, keep a documented record of the license or owner authorization for every source recording, particularly the music master.

## Curated effects and Beckenburg PSX assessment (2026-10-22)

The shared [Sounds library](https://drive.google.com/drive/folders/15_nLObkdUim_51DMVtxHEdqfHQLUdnfA) includes directly playable MP3 effects. Seventeen were selected and copied to Nutbuster's `web/audio/sfx/` directory. The original files remain on Drive. Their filenames, Drive IDs, decoded durations, sizes and SHA-256 hashes are recorded in `assets/audio/catalog.json`, kind `sfx`. The owner confirms rights to use these sounds in-game. `.aup3` authoring sessions and `.uasset` game-engine packages are not runtime audio and were not copied.

Beckenburg's library separately has `PS1_Horror_SFX_Vol1.zip.zip` (20 unnamed WAV clips lasting 6–26 seconds) and `psx-horror-ui-free-assets.zip` (sprites, themes and fonts, **no sounds**). These long horror sounds are poor replacements for brief puzzle-input cues. The PSX Mega Pack commercial-use license must not be confused with licensing for the separate audio archive. No Beckenburg files or code were changed. Its recordings remain candidates for rare dramatic events after their actual sound and context can be identified; they are **not** automatically bundled into Nutbuster.
