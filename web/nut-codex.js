/* Central, inspectable index of live mechanics versus elemental art previews. */
(function(root){'use strict';
const ENTRIES=[
  {
    "id": "peanut",
    "name": "Peanut",
    "group": "nuts",
    "live": true,
    "art": "art/primary/nuts/peanut.png",
    "effect": "Ordinary match piece. Align three or more of the same nut to score and hit an overlaid blocker.",
    "rule": "Part of the campaign color pool; a new variety joins each chapter."
  },
  {
    "id": "walnut",
    "name": "Walnut",
    "group": "nuts",
    "live": true,
    "art": "art/primary/nuts/walnut.png",
    "effect": "Ordinary match piece. Align three or more of the same nut to score and hit an overlaid blocker.",
    "rule": "Part of the campaign color pool; a new variety joins each chapter."
  },
  {
    "id": "almond",
    "name": "Almond",
    "group": "nuts",
    "live": true,
    "art": "art/primary/nuts/almond.png",
    "effect": "Ordinary match piece. Align three or more of the same nut to score and hit an overlaid blocker.",
    "rule": "Part of the campaign color pool; a new variety joins each chapter."
  },
  {
    "id": "cashew",
    "name": "Cashew",
    "group": "nuts",
    "live": true,
    "art": "art/primary/nuts/cashew.png",
    "effect": "Ordinary match piece. Align three or more of the same nut to score and hit an overlaid blocker.",
    "rule": "Part of the campaign color pool; a new variety joins each chapter."
  },
  {
    "id": "hazelnut",
    "name": "Hazelnut",
    "group": "nuts",
    "live": true,
    "art": "art/primary/nuts/hazelnut.png",
    "effect": "Ordinary match piece. Align three or more of the same nut to score and hit an overlaid blocker.",
    "rule": "Part of the campaign color pool; a new variety joins each chapter."
  },
  {
    "id": "pistachio",
    "name": "Pistachio",
    "group": "nuts",
    "live": true,
    "art": "art/primary/nuts/pistachio.png",
    "effect": "Ordinary match piece. Align three or more of the same nut to score and hit an overlaid blocker.",
    "rule": "Part of the campaign color pool; a new variety joins each chapter."
  },
  {
    "id": "gold-acorn",
    "name": "Gold Acorn",
    "group": "nuts",
    "live": true,
    "art": "art/primary/nuts/gold-acorn.png",
    "effect": "Ordinary match piece. Align three or more of the same nut to score and hit an overlaid blocker.",
    "rule": "Part of the campaign color pool; a new variety joins each chapter."
  },
  {
    "id": "pecan",
    "name": "Pecan",
    "group": "nuts",
    "live": true,
    "art": "art/primary/nuts/pecan.png",
    "effect": "Ordinary match nut. Match three or more to score and hit any overlaid obstacle.",
    "rule": "Introduced at level 80; rotates with other unlocked varieties. Ordinary match nut; no elemental power."
  },
  {
    "id": "brazil-nut",
    "name": "Brazil Nut",
    "group": "nuts",
    "live": true,
    "art": "art/primary/nuts/brazil-nut.png",
    "effect": "Ordinary match nut. Match three or more to score and hit any overlaid obstacle.",
    "rule": "Introduced at level 126; rotates with other unlocked varieties. Ordinary match nut; no elemental power."
  },
  {
    "id": "chestnut",
    "name": "Chestnut",
    "group": "nuts",
    "live": true,
    "art": "art/primary/nuts/chestnut.png",
    "effect": "Ordinary match nut. Match three or more to score and hit any overlaid obstacle.",
    "rule": "Introduced at level 172; rotates with other unlocked varieties. Ordinary match nut; no elemental power."
  },
  {
    "id": "macadamia",
    "name": "Macadamia",
    "group": "nuts",
    "live": true,
    "art": "art/primary/nuts/macadamia.png",
    "effect": "Ordinary match nut. Match three or more to score and hit any overlaid obstacle.",
    "rule": "Introduced at level 218; rotates with other unlocked varieties. Ordinary match nut; no elemental power."
  },
  {
    "id": "pine-nut",
    "name": "Pine Nut",
    "group": "nuts",
    "live": true,
    "art": "art/primary/nuts/pine-nut.png",
    "effect": "Ordinary match nut. Match three or more to score and hit any overlaid obstacle.",
    "rule": "Introduced at level 264; rotates with other unlocked varieties. Ordinary match nut; no elemental power."
  },
  {
    "id": "coconut",
    "name": "Coconut",
    "group": "nuts",
    "live": true,
    "art": "art/primary/nuts/coconut.png",
    "effect": "Ordinary match nut. Match three or more to score and hit any overlaid obstacle.",
    "rule": "Introduced at level 15; rotates with other unlocked varieties. Ordinary match nut; no elemental power."
  },
  {
    "id": "hickory-nut",
    "name": "Hickory Nut",
    "group": "nuts",
    "live": true,
    "art": "art/primary/nuts/hickory-nut.png",
    "effect": "Ordinary match nut. Match three or more to score and hit any overlaid obstacle.",
    "rule": "Introduced at level 310; rotates with other unlocked varieties. Ordinary match nut; no elemental power."
  },
  {
    "id": "beechnut",
    "name": "Beechnut",
    "group": "nuts",
    "live": true,
    "art": "art/primary/nuts/beechnut.png",
    "effect": "Ordinary match nut. Match three or more to score and hit any overlaid obstacle.",
    "rule": "Introduced at level 356; rotates with other unlocked varieties. Ordinary match nut; no elemental power."
  },
  {
    "id": "pili-nut",
    "name": "Pili Nut",
    "group": "nuts",
    "live": true,
    "art": "art/primary/nuts/pili-nut.png",
    "effect": "Ordinary match nut. Match three or more to score and hit any overlaid obstacle.",
    "rule": "Introduced at level 402; rotates with other unlocked varieties. Ordinary match nut; no elemental power."
  },
  {
    "id": "candlenut",
    "name": "Candlenut",
    "group": "nuts",
    "live": true,
    "art": "art/primary/nuts/candlenut.png",
    "effect": "Ordinary match nut. Match three or more to score and hit any overlaid obstacle.",
    "rule": "Introduced at level 448; rotates with other unlocked varieties. Ordinary match nut; no elemental power."
  },
  {
    "id": "tiger-nut",
    "name": "Tiger Nut",
    "group": "nuts",
    "live": true,
    "art": "art/primary/nuts/tiger-nut.png",
    "effect": "Ordinary match nut. Match three or more to score and hit any overlaid obstacle.",
    "rule": "Introduced at level 35; rotates with other unlocked varieties. Ordinary match nut; no elemental power."
  },
  {
    "id": "fire",
    "name": "Fire Nut",
    "group": "elemental",
    "live": true,
    "art": "art/primary/nuts/elemental/fire.png",
    "effect": "On activation, burns one surface layer from the four orthogonal neighbors.",
    "rule": "LIVE: Attached to an expansion nut without changing its match color; triggers only when the actual nut is destroyed, never when a shield is cracked. Actual destruction can chain powers."
  },
  {
    "id": "ice",
    "name": "Ice Nut",
    "group": "elemental",
    "live": true,
    "art": "art/primary/nuts/elemental/ice.png",
    "effect": "On activation, freezes two adjacent movable nuts for one player turn.",
    "rule": "LIVE: Attached to an expansion nut without changing its match color; triggers only when the actual nut is destroyed, never when a shield is cracked. Actual destruction can chain powers."
  },
  {
    "id": "water",
    "name": "Water Nut",
    "group": "elemental",
    "live": true,
    "art": "art/primary/nuts/elemental/water.png",
    "effect": "On activation, washes sticky butter from every cell in its row.",
    "rule": "LIVE: Attached to an expansion nut without changing its match color; triggers only when the actual nut is destroyed, never when a shield is cracked. Actual destruction can chain powers."
  },
  {
    "id": "earth",
    "name": "Earth Nut",
    "group": "elemental",
    "live": true,
    "art": "art/primary/nuts/elemental/earth.png",
    "effect": "On activation, crushes one surface layer on the three nearest cells in its column.",
    "rule": "LIVE: Attached to an expansion nut without changing its match color; triggers only when the actual nut is destroyed, never when a shield is cracked. Actual destruction can chain powers."
  },
  {
    "id": "wind",
    "name": "Wind Nut",
    "group": "elemental",
    "live": true,
    "art": "art/primary/nuts/elemental/wind.png",
    "effect": "On activation, rotates the nearest three movable nut payloads once, leaving fixed hazards in place.",
    "rule": "LIVE: Attached to an expansion nut without changing its match color; triggers only when the actual nut is destroyed, never when a shield is cracked. Actual destruction can chain powers."
  },
  {
    "id": "lightning",
    "name": "Lightning Nut",
    "group": "elemental",
    "live": true,
    "art": "art/primary/nuts/elemental/lightning.png",
    "effect": "On activation, chains to three distinct nuts of its own underlying color.",
    "rule": "LIVE: Attached to an expansion nut without changing its match color; triggers only when the actual nut is destroyed, never when a shield is cracked. Actual destruction can chain powers."
  },
  {
    "id": "nature",
    "name": "Nature Nut",
    "group": "elemental",
    "live": true,
    "art": "art/primary/nuts/elemental/nature.png",
    "effect": "On activation, removes one adjacent sticky layer and grows one extra move if butter was removed.",
    "rule": "LIVE: Attached to an expansion nut without changing its match color; triggers only when the actual nut is destroyed, never when a shield is cracked. Actual destruction can chain powers."
  },
  {
    "id": "poison",
    "name": "Poison Nut",
    "group": "elemental",
    "live": true,
    "art": "art/primary/nuts/elemental/poison.png",
    "effect": "On activation, marks two adjacent empty-of-butter cells; the marks turn sticky after the next move.",
    "rule": "LIVE: Attached to an expansion nut without changing its match color; triggers only when the actual nut is destroyed, never when a shield is cracked. Actual destruction can chain powers."
  },
  {
    "id": "radiance",
    "name": "Radiance Nut",
    "group": "elemental",
    "live": true,
    "art": "art/primary/nuts/elemental/radiance.png",
    "effect": "On activation, cleanses the nearest three hostile statuses, prioritizing sticky butter then chains.",
    "rule": "LIVE: Attached to an expansion nut without changing its match color; triggers only when the actual nut is destroyed, never when a shield is cracked. Actual destruction can chain powers."
  },
  {
    "id": "shadow",
    "name": "Shadow Nut",
    "group": "elemental",
    "live": true,
    "art": "art/primary/nuts/elemental/shadow.png",
    "effect": "On activation, makes one marked tile temporarily untargetable to automatic effects for a turn; marked tile remains visible.",
    "rule": "LIVE: Attached to an expansion nut without changing its match color; triggers only when the actual nut is destroyed, never when a shield is cracked. Actual destruction can chain powers."
  },
  {
    "id": "crystal",
    "name": "Crystal Nut",
    "group": "elemental",
    "live": true,
    "art": "art/primary/nuts/elemental/crystal.png",
    "effect": "On activation, stores one combo charge; the next scoring cascade consumes it for a second bonus pulse.",
    "rule": "LIVE: Attached to an expansion nut without changing its match color; triggers only when the actual nut is destroyed, never when a shield is cracked. Actual destruction can chain powers."
  },
  {
    "id": "magma",
    "name": "Magma Nut",
    "group": "elemental",
    "live": true,
    "art": "art/primary/nuts/elemental/magma.png",
    "effect": "On activation, strikes its column, then strikes surviving blockers in that column once more after gravity.",
    "rule": "LIVE: Attached to an expansion nut without changing its match color; triggers only when the actual nut is destroyed, never when a shield is cracked. Actual destruction can chain powers."
  },
  {
    "id": "frost",
    "name": "Frost Nut",
    "group": "elemental",
    "live": true,
    "art": "art/primary/nuts/elemental/frost.png",
    "effect": "On activation, creates a visible one-hit ice shell on a nearby unshielded nut.",
    "rule": "LIVE: Attached to an expansion nut without changing its match color; triggers only when the actual nut is destroyed, never when a shield is cracked. Actual destruction can chain powers."
  },
  {
    "id": "storm",
    "name": "Storm Nut",
    "group": "elemental",
    "live": true,
    "art": "art/primary/nuts/elemental/storm.png",
    "effect": "On activation, forks to up to five nuts, prioritizing distinct rows and columns.",
    "rule": "LIVE: Attached to an expansion nut without changing its match color; triggers only when the actual nut is destroyed, never when a shield is cracked. Actual destruction can chain powers."
  },
  {
    "id": "arcane",
    "name": "Arcane Nut",
    "group": "elemental",
    "live": true,
    "art": "art/primary/nuts/elemental/arcane.png",
    "effect": "On activation, recolors two adjacent ordinary nuts to the activated nut's underlying match color.",
    "rule": "LIVE: Attached to an expansion nut without changing its match color; triggers only when the actual nut is destroyed, never when a shield is cracked. Actual destruction can chain powers."
  },
  {
    "id": "line-h",
    "name": "Row Rocket",
    "group": "specials",
    "live": true,
    "art": null,
    "symbol": "↔",
    "effect": "Match four horizontally; the resulting rocket hits an entire occupied row.",
    "rule": "In the current engine. Hit priority: butter → ice → chain → chest → timer → nut."
  },
  {
    "id": "line-v",
    "name": "Column Rocket",
    "group": "specials",
    "live": true,
    "art": null,
    "symbol": "↕",
    "effect": "Match four vertically; the resulting rocket hits an entire occupied column.",
    "rule": "In the current engine. Hit priority: butter → ice → chain → chest → timer → nut."
  },
  {
    "id": "blast",
    "name": "Shell Bomb",
    "group": "specials",
    "live": true,
    "art": null,
    "symbol": "💥",
    "effect": "Intersecting T/L matches create a 3×3 blast. Combining two expands the area.",
    "rule": "In the current engine. Hit priority: butter → ice → chain → chest → timer → nut."
  },
  {
    "id": "rainbow",
    "name": "Rainbow Nut",
    "group": "specials",
    "live": true,
    "art": null,
    "symbol": "🌈",
    "effect": "Match five or more; swap the rainbow with a nut to hit every nut of that color. Pairing two affects the board.",
    "rule": "In the current engine. Hit priority: butter → ice → chain → chest → timer → nut."
  },
  {
    "id": "ice",
    "name": "Ice Shield",
    "group": "blockers",
    "live": true,
    "art": "art/primary/overlays/frost.png",
    "symbol": "🧊",
    "effect": "Translucent ice reveals the ordinary nut underneath. The cell stays pinned. Harder stages may use 3–5 layers; each strike removes exactly one and the badge displays remaining hits.",
    "rule": "In the current engine. Hit priority: butter → ice → chain → chest → timer → nut."
  },
  {
    "id": "chain",
    "name": "Chain Shield / Lock",
    "group": "blockers",
    "live": true,
    "art": "art/primary/overlays/chain-lock.png",
    "symbol": "⛓️",
    "effect": "The translucent chain shows the underlying walnut. A stronger chain may take multiple hits; its counter tracks remaining layers. Strike the chain or use Master Key to remove every layer.",
    "rule": "In the current engine. Hit priority: butter → ice → chain → chest → timer → nut."
  },
  {
    "id": "chest",
    "name": "Treasure Chest",
    "group": "blockers",
    "live": true,
    "art": "art/primary/blockers/chest.png",
    "symbol": "🧰",
    "effect": "The chest pins the underlying nut. Harder stages can require 3–5 strikes; the badge shows remaining layers. Opening every layer frees the nut.",
    "rule": "In the current engine. Hit priority: butter → ice → chain → chest → timer → nut."
  },
  {
    "id": "crate",
    "name": "Crate",
    "group": "blockers",
    "live": false,
    "art": "art/primary/blockers/crate.png",
    "symbol": "📦",
    "effect": "Artwork is prepared, but no crate occupancy or clearing rule is active.",
    "rule": "ART ONLY — no live mechanic."
  },
  {
    "id": "rock",
    "name": "Rock",
    "group": "blockers",
    "live": false,
    "art": "art/primary/blockers/rock.png",
    "symbol": "🪨",
    "effect": "Artwork is prepared, but no rock occupancy or clearing rule is active.",
    "rule": "ART ONLY — no live mechanic."
  },
  {
    "id": "void",
    "name": "Empty / Void Cell",
    "group": "board",
    "live": true,
    "art": null,
    "symbol": "◼",
    "effect": "A hole has no nut, cannot be swapped into, and splits gravity into separate falling segments.",
    "rule": "In the current engine. Hit priority: butter → ice → chain → chest → timer → nut."
  },
  {
    "id": "jam",
    "name": "Sticky Peanut Butter",
    "group": "hazards",
    "live": true,
    "art": "art/primary/overlays/sticky-butter.png",
    "symbol": "🍯",
    "effect": "A match or tool removes sticky butter before damaging another shield. Starting at level 110, one sticky layer spreads to a neighbor every third move.",
    "rule": "In the current engine. Hit priority: butter → ice → chain → chest → timer → nut."
  },
  {
    "id": "fuse",
    "name": "Timed Acorn",
    "group": "hazards",
    "live": true,
    "art": "art/primary/overlays/bomb.png",
    "symbol": "💣",
    "effect": "Countdown starts in the Highlands. Each move reduces the timer; expiry removes TWO moves once. Clearing its tile defuses it.",
    "rule": "In the current engine. Hit priority: butter → ice → chain → chest → timer → nut."
  },
  {
    "id": "hold",
    "name": "Gravity Hold",
    "group": "hazards",
    "live": true,
    "art": null,
    "symbol": "⏳",
    "effect": "Butter Hold lasts one actual gravity drop; Jam Hold lasts two. Matching held nuts earns an extra scoring bonus. Holds do not tick down on empty turns.",
    "rule": "In the current engine. Hit priority: butter → ice → chain → chest → timer → nut."
  },
  {
    "id": "conveyor",
    "name": "Conveyor",
    "group": "board",
    "live": true,
    "art": null,
    "symbol": "›",
    "effect": "From level 125, transports only free nuts every second turn. Whole-piece ice, locked walnuts and chests split belts into shorter independent lanes. Sticky butter remains attached to board tiles.",
    "rule": "In the current engine. Hit priority: butter → ice → chain → chest → timer → nut."
  },
  {
    "id": "portal",
    "name": "Portal",
    "group": "board",
    "live": true,
    "art": null,
    "symbol": "◎",
    "effect": "From level 164, swaps free nut payloads between two marked portals. If either end contains a locked walnut, chest or ice block, that portal cycle is skipped.",
    "rule": "In the current engine. Hit priority: butter → ice → chain → chest → timer → nut."
  },
  {
    "id": "wind",
    "name": "Wind Tunnel",
    "group": "board",
    "live": true,
    "art": null,
    "symbol": "↕",
    "effect": "From level 301, rotates free nut payloads in vertical lanes. A locked walnut, ice block or chest divides the wind into separate movable segments.",
    "rule": "In the current engine. Hit priority: butter → ice → chain → chest → timer → nut."
  },
  {
    "id": "hammer",
    "name": "Hammer",
    "group": "boosters",
    "live": true,
    "symbol": "✦",
    "effect": "Breaks every protective layer and then the nut in one selected cell.",
    "rule": "Inventory power. All powers are obtainable without real payment."
  },
  {
    "id": "row",
    "name": "Row Rocket",
    "group": "boosters",
    "live": true,
    "symbol": "✦",
    "effect": "Hits all occupied cells of the chosen row once.",
    "rule": "Inventory power. All powers are obtainable without real payment."
  },
  {
    "id": "column",
    "name": "Column Rocket",
    "group": "boosters",
    "live": true,
    "symbol": "✦",
    "effect": "Hits all occupied cells of the chosen column once.",
    "rule": "Inventory power. All powers are obtainable without real payment."
  },
  {
    "id": "cross",
    "name": "Crossfire",
    "group": "boosters",
    "live": true,
    "symbol": "✦",
    "effect": "Hits the chosen row AND column once.",
    "rule": "Inventory power. All powers are obtainable without real payment."
  },
  {
    "id": "blast",
    "name": "Shell Bomb Tool",
    "group": "boosters",
    "live": true,
    "symbol": "✦",
    "effect": "Hits a 3×3 area once.",
    "rule": "Inventory power. All powers are obtainable without real payment."
  },
  {
    "id": "color",
    "name": "Color Pop",
    "group": "boosters",
    "live": true,
    "symbol": "✦",
    "effect": "Hits all nuts matching the selected color once.",
    "rule": "Inventory power. All powers are obtainable without real payment."
  },
  {
    "id": "shuffle",
    "name": "Shuffle",
    "group": "boosters",
    "live": true,
    "symbol": "✦",
    "effect": "Rearranges ordinary payloads while leaving blockers in place.",
    "rule": "Inventory power. All powers are obtainable without real payment."
  },
  {
    "id": "extra",
    "name": "+5 Moves",
    "group": "boosters",
    "live": true,
    "symbol": "✦",
    "effect": "Adds five moves; works even after running out.",
    "rule": "Inventory power. All powers are obtainable without real payment."
  },
  {
    "id": "drill",
    "name": "Deep Drill",
    "group": "boosters",
    "live": true,
    "symbol": "✦",
    "effect": "Hits the chosen column three times, allowing layered damage.",
    "rule": "Inventory power. All powers are obtainable without real payment."
  },
  {
    "id": "unlock",
    "name": "Master Key",
    "group": "boosters",
    "live": true,
    "symbol": "✦",
    "effect": "Removes all chains everywhere, even beneath peanut butter.",
    "rule": "Inventory power. All powers are obtainable without real payment."
  },
  {
    "id": "butter_hold",
    "name": "Butter Hold",
    "group": "boosters",
    "live": true,
    "symbol": "✦",
    "effect": "Protects a nut from one gravity-drop movement; charges a held match.",
    "rule": "Inventory power. All powers are obtainable without real payment."
  },
  {
    "id": "jam_hold",
    "name": "Jam Hold",
    "group": "boosters",
    "live": true,
    "symbol": "✦",
    "effect": "Protects a nut from two gravity-drop movements; charges a held match.",
    "rule": "Inventory power. All powers are obtainable without real payment."
  }
];
// Original whole-nut replacement art and the new square-attached effects are distinct.
ENTRIES.push(...[
  {
    "id": "tile-arcane",
    "name": "Arcane Tile Aura",
    "group": "tile-effects",
    "live": false,
    "art": "art/primary/overlays/arcane.png",
    "effect": "Purple runic ring; no board-cell arcane rule exists.",
    "rule": "ART READY / RULE NOT ENABLED · tile overlay art cannot move or change whole-piece blockers on its own."
  },
  {
    "id": "tile-poison",
    "name": "Poison Tile Aura",
    "group": "tile-effects",
    "live": false,
    "art": "art/primary/overlays/poison.png",
    "effect": "Green poison glow on a board square; no poisoning rule is active.",
    "rule": "ART READY / RULE NOT ENABLED · tile overlay art cannot move or change whole-piece blockers on its own."
  },
  {
    "id": "tile-frost",
    "name": "Frost Tile Aura",
    "group": "tile-effects",
    "live": true,
    "art": "art/primary/overlays/frost.png",
    "effect": "LIVE: A pinned frosted tile with visible underlying nut, and one or two required hits.",
    "rule": "IN GAME: pinned tile status; rendered as translucent art above its nut."
  },
  {
    "id": "tile-radiance",
    "name": "Radiance Tile Aura",
    "group": "tile-effects",
    "live": false,
    "art": "art/primary/overlays/radiance.png",
    "effect": "Sunburst tile overlay; not yet a live cleansing status.",
    "rule": "ART READY / RULE NOT ENABLED · tile overlay art cannot move or change whole-piece blockers on its own."
  },
  {
    "id": "tile-bomb",
    "name": "Timed Acorn Overlay",
    "group": "tile-effects",
    "live": true,
    "art": "art/primary/overlays/bomb.png",
    "effect": "LIVE: This square has a ticking acorn; its timer decreases per move and expiry costs two moves. A hit defuses it.",
    "rule": "TILE STATUS · square-attached, drawn transparently over the underlying nut."
  },
  {
    "id": "tile-void-rock",
    "name": "Void-Rock Tile Aura",
    "group": "tile-effects",
    "live": false,
    "art": "art/primary/overlays/void-rock.png",
    "effect": "PREVIEW ONLY: Rock-ring art for a possible tile status, not the current empty holes or whole-piece rock blockers.",
    "rule": "ART READY / RULE NOT ENABLED · tile overlay art cannot move or change whole-piece blockers on its own."
  },
  {
    "id": "tile-sticky-butter",
    "name": "Sticky Peanut Butter Overlay",
    "group": "tile-effects",
    "live": true,
    "art": "art/primary/overlays/sticky-butter.png",
    "effect": "LIVE: The board square has sticky peanut butter, which absorbs a hit before other protection and can spread every third move.",
    "rule": "TILE STATUS · square-attached, drawn transparently over the underlying nut."
  },
  {
    "id": "tile-nature-vines",
    "name": "Nature Vines",
    "group": "tile-effects",
    "live": false,
    "art": "art/primary/overlays/nature-vines.png",
    "effect": "Green vines attached to a square; no live vine-tile rule exists.",
    "rule": "ART READY / RULE NOT ENABLED · tile overlay art cannot move or change whole-piece blockers on its own."
  },
  {
    "id": "tile-shadow",
    "name": "Shadow Tile Aura",
    "group": "tile-effects",
    "live": false,
    "art": "art/primary/overlays/shadow.png",
    "effect": "Shadow swirl status art; not yet a playable square effect.",
    "rule": "ART READY / RULE NOT ENABLED · tile overlay art cannot move or change whole-piece blockers on its own."
  },
  {
    "id": "tile-fire",
    "name": "Fire Tile Aura",
    "group": "tile-effects",
    "live": false,
    "art": "art/primary/overlays/fire.png",
    "effect": "Warm glow ring applied to a board square; no tile-burning rule is active.",
    "rule": "ART READY / RULE NOT ENABLED · tile overlay art cannot move or change whole-piece blockers on its own."
  },
  {
    "id": "tile-water",
    "name": "Water Tile Aura",
    "group": "tile-effects",
    "live": false,
    "art": "art/primary/overlays/water.png",
    "effect": "Water swirl overlay; no tile-water status rule is active.",
    "rule": "ART READY / RULE NOT ENABLED · tile overlay art cannot move or change whole-piece blockers on its own."
  },
  {
    "id": "tile-storm",
    "name": "Storm Tile Aura",
    "group": "tile-effects",
    "live": false,
    "art": "art/primary/overlays/storm.png",
    "effect": "Storm-cloud ring; no active storm-tile rule exists.",
    "rule": "ART READY / RULE NOT ENABLED · tile overlay art cannot move or change whole-piece blockers on its own."
  },
  {
    "id": "tile-chain-lock",
    "name": "Tile Chain-Lock Overlay",
    "group": "tile-effects",
    "live": true,
    "art": "art/primary/overlays/chain-lock.png",
    "effect": "LIVE: A pinned chained tile with its underlying nut visible; the lock must be broken before movement.",
    "rule": "IN GAME: pinned tile status; rendered as translucent art above its nut."
  },
  {
    "id": "tile-lightning",
    "name": "Lightning Tile Aura",
    "group": "tile-effects",
    "live": false,
    "art": "art/primary/overlays/lightning.png",
    "effect": "Electric ring marking a square; tile-level lightning behavior is not implemented.",
    "rule": "ART READY / RULE NOT ENABLED · tile overlay art cannot move or change whole-piece blockers on its own."
  },
  {
    "id": "tile-magma",
    "name": "Magma Tile Aura",
    "group": "tile-effects",
    "live": false,
    "art": "art/primary/overlays/magma.png",
    "effect": "Rock-and-lava ring; no tile-level magma mechanic is enabled.",
    "rule": "ART READY / RULE NOT ENABLED · tile overlay art cannot move or change whole-piece blockers on its own."
  },
  {
    "id": "tile-crystal",
    "name": "Crystal Tile Aura",
    "group": "tile-effects",
    "live": false,
    "art": "art/primary/overlays/crystal.png",
    "effect": "Crystal ring marking a square; no live tile-charge rule exists.",
    "rule": "ART READY / RULE NOT ENABLED · tile overlay art cannot move or change whole-piece blockers on its own."
  }
]);
// Keep the Nutdex aligned with the engine's authoritative live effects.
const ACTIVE_OVERLAY_DETAILS=Object.freeze({
 'tile-arcane':['At level 285, a two-turn rune transmutes its nut to the next active roster color.','LIVE · Turn-based transmutation; matching rules remain unchanged.'],
 'tile-poison':['At level 115, a two-turn poison mark becomes sticky butter. Poison Nuts can mark two neighbors.','LIVE · Poison sits on the tile, not on a traveling nut.'],
 'tile-radiance':['At level 365, a two-turn glow cleanses up to three nearby butter, poison, chain or ice hazards.','LIVE · Purification and protection removal.'],
 'tile-nature-vines':['At level 155, roots anchor one nut for two turns, then recolor one adjacent free nut to match it.','LIVE · Plant, hold, then grow a matching neighbor.'],
 'tile-shadow':['At level 245, a two-turn ward absorbs one hit, including a booster strike, then fades.','LIVE · Temporary protective shadow, fixed to its square.'],
 'tile-fire':['At level 45, a burning tile counts down two turns, then hits itself and up to four neighboring tiles.','LIVE · Delayed surface-layer burn; can destroy elemental nuts.'],
 'tile-water':['At level 325, a two-turn wave removes butter, poison and fire across its row.','LIVE · Cleanses square-attached hazards, not ordinary nut identities.'],
 'tile-storm':['At level 525, a two-turn storm strikes up to four closest nuts.','LIVE · Scheduled multi-target storm damage.'],
 'tile-lightning':['At level 425, a charged tile zaps the three nearest nuts of its matching color after two turns.','LIVE · Matching-color electric chain damage.'],
 'tile-magma':['At level 625, two-turn magma strikes every occupied nut in its column.','LIVE · Delayed column pressure.'],
 'tile-crystal':['At level 195, a crystal tile charges the next scoring cascade and gives its nut two held gravity drops.','LIVE · Delayed scoring and hold effect.'],
 'tile-void-rock':['At level 745, a pulsing void-rock rune becomes a two-hit immovable stone seal after two turns.','LIVE · Fixed shield; damage both layers to free the nut for matching.']
});
const POWER_LEDGER=typeof module!=='undefined'&&module.exports?require('./elemental-powers.js').ABILITIES:root.NutElementalPowers?.ABILITIES;
for(const entry of ENTRIES){
 if(entry.group==='elemental'&&POWER_LEDGER?.[entry.id]){
  entry.effect=POWER_LEDGER[entry.id];
  entry.rule='LIVE · Triggers when the elemental-marked nut is destroyed, not when its blocker loses a layer. Destroying another elemental nut can chain its ability.';
 }
 if(ACTIVE_OVERLAY_DETAILS[entry.id]){
  const [effect,rule]=ACTIVE_OVERLAY_DETAILS[entry.id];
  Object.assign(entry,{live:true,effect,rule});
 }
}
const GROUPS=[['nuts','Nuts'],['elemental','Elemental'],['specials','Matches'],['blockers','Blockers'],['tile-effects','Tile FX'],['hazards','Statuses'],['board','Board'],['boosters','Tools']];
const api=Object.freeze({entries:Object.freeze(ENTRIES.map(x=>Object.freeze(x))),groups:Object.freeze(GROUPS.map(x=>Object.freeze(x))),byGroup:group=>ENTRIES.filter(x=>x.group===group)});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutCodex=api;
})(typeof window!=='undefined'?window:globalThis);
