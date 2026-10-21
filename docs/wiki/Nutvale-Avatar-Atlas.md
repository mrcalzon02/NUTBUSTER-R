# Nutvale Avatar Atlas — preservation, identity and deployment gate

**Canonical player character: human auburn-haired heroine; NEVER a squirrel.** Keep the same face, curly updo, warm eyes and whimsical painterly fantasy style across outfit collections. Squirrels are pets and world motifs, not the player avatar.

## Verified art inventory

| Group | Individually sliced | Google Drive | GitHub |
|---|---:|---:|---:|
| Character outfit tiers | 40 | 40 | 40 |
| Seasonal / event outfits | 20 | 20 | 20 |
| Goth / emo / alternative outfits | 20 | 20 | 0 (transfer blocked) |
| **Total** | **80** | **80** | **60** |

**Google Drive master staging folder:** https://drive.google.com/drive/folders/1_h3GG6UcV1f8iBaSuUJ19nSI-dQPm2jB

The Drive folder preserves all 80 individual WebP files in progression, seasonal and goth directories as well as the complete ZIP archive. GitHub's initial source-art subset lives under web/art/avatars and is enumerated in web/art/avatars/manifest.json. Goth source art is preserved in the Drive staging folder pending a permitted repository transfer; the files are not claimed present on GitHub.

## Integration policy

- The 60 GitHub WebPs are now wired into the live Homestead wardrobe through `web/avatar-art.js` and `web/game.js`, loaded by `web/index.html`. The compact UI shows the same human protagonist in the estate and wardrobe, with a mobile-scale illustration, permanent seasonal archive, campaign-gated outfit choices, and local save persistence. Legacy emoji-era persona IDs survive as separately selectable prestige titles; old saves receive an earned illustrated outfit when the mapping is valid.
- Forty progression outfits are tied to actual campaign clears, not the campaign's highest unlocked marker.
- Seasonal outfits are deliberately fake-limited: enticing theatrical FOMO presentation but a permanent archive/catch-up route; ownership never expires.
- Alternative gothic fashion variants must preserve the same human protagonist and established concept-sheet art direction.
- Do not alter existing emoji avatar IDs without backward-compatible save migration.
- Keep images optimized for offline Android, Windows, and Linux builds. Never depend on hosted Google Drive URLs during gameplay.
- Always verify physical remote assets and app rendering before release claims.

## Outstanding

Finish the twenty goth binary GitHub transfers within connector and content-safety limits; those images are still Drive-only. The 60-asset illustrated wardrobe and avatar preview are implemented. Run `node tests/avatar-art.test.js` and `node tests/homestead-ui.test.js`; then validate actual Android and desktop layouts and release packaging.
