# Woodland Companion Pets

The approved woodland pet art contains ten creatures: Hazel the Squirrel, Thistle the Bunny, Pip the Chipmunk, Ember the Fox, Willow the Fawn, Bandit the Raccoon, Moonbeam the Owl, Bramble the Hedgehog, Moss the Turtle, and Skye the Bluebird. Portraits, idle, cheer, rest, and magical-effect poses are sliced from the original atlas. The seven colored pawprints on its bottom row are different grades of companion feed; star medals, hearts, acorns, and a kennel are preserved as supplemental UI assets.

## Golden Nut feed market

| Feed | Nut price | Bond gain | Fullness gain | Gem chance | Gem gift |
|---|---:|---:|---:|---:|---:|
| Bronze | 25 | 3 | 6 | 4% | 1 |
| Silver | 60 | 6 | 10 | 8% | 1 |
| Gold | 120 | 10 | 17 | 12% | 2 |
| Blue | 210 | 15 | 24 | 16% | 2 |
| Green | 330 | 21 | 32 | 20% | 3 |
| Violet | 500 | 29 | 42 | 24% | 4 |
| Red (Ruby) | 750 | 40 | 55 | 28% | 5 |

Purchase stock with the existing saved `coins` value, then feed the currently selected pet to consume one unit. Bond and fullness are per-pet and persist in the `nutbuster.v1` save; earned gem gifts are credited to the existing `gems` wallet. Independent pity counter guarantees a gift after eight consecutive giftless feedings. Companions never die, vanish, become unavailable, or require real-money purchases. Fullness decreases very slowly (one point per hour; no penalties other than a lower meter) and never blocks feeding. The pet selection and transactions are deterministic except for documented reward chances.

## Assets and QA

`assets/source/a_colorful_high_quality_cartoon_3d_illustration.png` is the canonical source from this conversation; ZIP and source are backed up in Google Drive's Woodland Companion Pets folder. `web/art/companions/{idle,cheer,rest,portrait,magic}/<pet>.png` and `web/art/companions/ui/{feed-*,star-*,heart,acorn-*,kennel}.png` are sized RGBA sprites. The generated pose crops are supplementary and may need hand-cleanup of overlapping edges in the original crowded sheet; **portraits and feed tokens** are the active menu assets.

Run `node tests/companions.test.js`. UI checks should cover Android 360×800 through desktop widths, eight-feed pity, insufficient Golden Nuts, selecting all ten companions, stock persistence, and no loss on invalid actions. Committing these sources does not prove an APK has been rebuilt.
