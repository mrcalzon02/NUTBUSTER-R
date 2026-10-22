# NUTBUSTER — Sound and Music Integration

The user-designated Drive audio folder is [Sounds / NUTBUSTER](https://drive.google.com/drive/folders/1IwvPgWwzabBliPODifPDdT61WqJhfmxu). **Drive is the source archive, not a runtime dependency.** All 24 audio assets are bundled under `web/audio/` and described in `assets/audio/catalog.json`. Original file names and Drive IDs are retained in the catalog. No Google account or network connection is needed to play.

## Playback

- `web/audio.js` owns three separate HTML5 Audio channels: looped music (at 28%), voiced announcer (at 90%, ducks music to 11%), and occasional grunts (at 38%).
- Every triggered announcer clip varies playback rate by up to ±9%; every grunt/reaction by up to ±11%. Pitch preservation is disabled on both channels so compatible browsers change both tone and duration. Consecutive voice lines differ by at least 6.48 percentage points in playback rate, and consecutive grunts by at least 7.92 points. The selected rate is written to both `defaultPlaybackRate` and `playbackRate` and reapplied at `loadedmetadata`/`playing` if the media engine resets it while loading. Music remains 1.0×.
- `web/sfx.js` adds low-latency, synthesised local Web Audio effects for match pops, cracked shells, ice hits, chains, chests, boosters, transports, rewards, interface confirmations and fishing. Individual nuts in a cascade produce staggered pops, capped at 32 voices to protect low-end devices. The effects channel has its own toggle and volume; an unsupported or unavailable AudioContext disables effects gracefully without disabling the announcer.
- Eight more user-provided clips are now included: What a Deal, Look Out, NUTSPLOsion, HECKPACKAGE, Nutsselence, Nut Destruction, Nutravaganza and BUSTED.
- Music and voice can be switched independently, with controls on Home and during gameplay; preferences are stored locally.
- Audio starts only following a user gesture. Failed/blocked media playback is handled gracefully without stopping the puzzle.
- Trigger mapping: game start `nutbuster-soft`, level victory `unbelievable-performance`, last-move failure `that-was-close`, 2+ cascades `magnificent-nuts`, 4+ cascades `they-just-keep-coming`, 6+ cascades `nutbuster-exclamation`, 5+ clears `ooh-thats-a-big-one`, normal matches rotate grunt reactions; shop packages `enormous-package`, VIP `premium-nuts-for-everyone`, daily reward and life refill `satisfaction-guaranteed`, treasure chest `nutbuster-exclamation`, pig smashing `oh-my`.
- Captions remain visible independently of audible playback. Game audio does **not** use device text-to-speech, stream third-party music, or send user interactions externally.

## Music compatibility and size

`Bubbly Whistle.mp3` (original 3.49 MB, 144 seconds) is retained unchanged in Drive. Its runtime copy has been transcoded to a 56 kbps, 44.1 kHz, two-channel MP3 (~1 MB), avoiding new codecs on Android API 26 and keeping the APK smaller. `ffprobe` validates source duration and the deployable copy. Only the deployable copy is stored in the game repository.

## Acceptance gates

Run `node tests/engine.test.js`, `node tests/ui-smoke.test.js`, and `node tests/audio.test.js`. The audio test checks channel isolation, toggles, music ducking, per-trigger rate bounds, disabled pitch preservation, recovery from simulated Android-style media load resets, consecutive audible-rate variation, music stability, all cataloged SHA-256 digests and the availability of every one of the 24 files.

Device tests still needed: verify playback and volume ducking on an actual Android API 26 device, current Android phone/tablet, and desktop, check audio-focus interruptions, background pause/resume, speaker output, and speech clarity against music. The repository tests do **not** prove Android APK installation or physical playback.

For public distribution, keep a documented record of the license or owner authorization for every source recording, particularly the music master.
