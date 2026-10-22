# NUTBUSTER — Sound and Music Integration

The user-designated Drive audio folder is [Sounds / NUTBUSTER](https://drive.google.com/drive/folders/1IwvPgWwzabBliPODifPDdT61WqJhfmxu). **Drive is the source archive, not a runtime dependency.** All 24 audio assets are bundled under `web/audio/` and described in `assets/audio/catalog.json`. Original file names and Drive IDs are retained in the catalog. No Google account or network connection is needed to play.

## Playback

- `web/audio.js` owns three separate HTML5 Audio channels: looped music (at 28%), voiced announcer (at 90%, ducks music to 11%), and occasional grunts (at 38%).
- Every triggered announcer clip varies playback rate by up to ±9%; every grunt/reaction by up to ±11%. Pitch preservation is disabled on both channels so compatible browsers change both tone and duration. Consecutive voice lines differ by at least 6.48 percentage points in playback rate, and consecutive grunts by at least 7.92 points. The selected rate is written to both `defaultPlaybackRate` and `playbackRate` and reapplied at `loadedmetadata`/`playing` if the media engine resets it while loading. Music remains 1.0×.
- `web/sfx.js` adds low-latency, synthesised local Web Audio effects for match pops, cracked shells, ice hits, chains, chests, boosters, transports, rewards, interface confirmations and fishing. Individual nuts in a cascade produce staggered pops, capped at 32 voices to protect low-end devices. The effects channel has its own toggle and volume; an unsupported or unavailable AudioContext disables effects gracefully without disabling the announcer.
- Eight more user-provided clips are now included: What a Deal, Look Out, NUTSPLOsion, HECKPACKAGE, Nutsselence, Nut Destruction, Nutravaganza and BUSTED.
- Announcer, music, and gameplay effects are independently switchable on Home/in-game menus. Voice, music, reaction, and effect volumes are independently adjustable under Settings; preferences are stored locally.
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
- Captions remain visible independently of audible playback. Game audio does **not** use device text-to-speech, stream third-party music, or send user interactions externally.

## Music compatibility and size

`Bubbly Whistle.mp3` (original 3.49 MB, 144 seconds) is retained unchanged in Drive. Its runtime copy has been transcoded to a 56 kbps, 44.1 kHz, two-channel MP3 (~1 MB), avoiding new codecs on Android API 26 and keeping the APK smaller. `ffprobe` validates source duration and the deployable copy. Only the deployable copy is stored in the game repository.

## Acceptance gates

Run `node tests/engine.test.js`, `node tests/ui-smoke.test.js`, `node tests/audio.test.js`, and `node tests/sfx.test.js`. The audio tests cover independent synthesis controls and bounded per-nut burst generation, alongside channel isolation, toggles, music ducking, per-trigger rate bounds, disabled pitch preservation, recovery from simulated Android-style media load resets, consecutive audible-rate variation, music stability, all cataloged SHA-256 digests and the availability of every one of the 24 files.

Device tests still needed: verify playback and volume ducking on an actual Android API 26 device, current Android phone/tablet, and desktop, check audio-focus interruptions, background pause/resume, speaker output, and speech clarity against music. The repository tests do **not** prove Android APK installation or physical playback.

For public distribution, keep a documented record of the license or owner authorization for every source recording, particularly the music master.
