# Nutvale Mines — Approved Currency, Writ and Manufactured-Goods Art

**Implemented on `main`.** The art-selection pass deliberately discarded all duplicate ore, rock, ingot and extraneous crate images. The approved source selection comprises **36 production sprites** in `web/art/nutvale/mining-economy/`:

- **18 currency images**: coins, medallions, bags and currency chests.
- **13 Prospector’s Writ images**: seven parchment seals and six framed deeds.
- **5 produced-goods crates**: bottles, mining supplies, cloth, sacks/scrolls and golden luxury.

Every rendered sprite is a separate **192×192 transparent PNG** with inset padding and verified non-clipped edges; assets are committed as binary Git blobs, not references to a Drive ZIP. The manifest at `web/art/nutvale/mining-economy/manifest.json` contains source names, source bounds and **SHA-256 per PNG**. `tests/nutvale-economy-art.test.js` enforces every committed file and hash. The accepted art was originally staged in the [lossless source package in NUTBUSTER Drive](https://drive.google.com/file/d/1RUhB8di71Q1le8njcaw4cTlp_s4ZrEuH/view?usp=drivesdk). The rejected sheets themselves are deliberately **not installed as runtime atlases**.

## Actual in-game mapping

The asset mapping module is `web/nutvale-economy-art.js`, loaded before `web/nutvale-mines-ui.js`. Every image is used in the real mining interface with an emoji fallback only if PNG loading fails.

The Equipment screen uses the current **N$ balance** to select the coin artwork and shows the current **refinery upgrade** with its produced-goods crate image. The Refinery screen displays the current crate image on the goods counter and the Manufacture action; different refinery levels visually represent increasing production sophistication. The Sell action shows currency. The Writ Office uses the current Writ count to select the parchment or framed certificate appearance; buying another Writ updates that count immediately.

**Important invariant:** these are **visual variants of the established economy**, not 18 currencies, 13 mechanical Writ rarities or five separate inventory ledgers. Ore → metal → goods → N$ and N$ → Writs, including costs, storage, sell rates and progress gates, are still owned by `web/nutvale-mines.js`. Manufacturing continues to consume two metal per goods crate, and Writs cost N$180. The five crate appearances apply to the six existing refinery tiers; the final two tiers share the approved golden crate art rather than fabricating a sixth crate.

## Transfer integrity repair

The initial ZIP binary importer was corrupting overlapping DEFLATE back-references. The authoritative importer was corrected, and a full ZIP CRC32 check is now enforced before commit. Every binary was then re-imported losslessly and the corrected manifest was read back from GitHub.

Run `node tests/nutvale-economy-art.test.js` plus the existing `tests/nutvale-mines-40-tier.test.js` and `tests/nutvale-mines-ui-flow.test.js`. Android screenshot/UI tests and production release packaging are still separate release gates.
