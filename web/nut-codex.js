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
    "live": false,
    "art": "art/primary/nuts/elemental/fire.png",
    "effect": "On activation, burns one surface layer from the four orthogonal neighbors.",
    "rule": "PROPOSED: Dense lock and ice clusters. An elemental nut would keep its underlying match color; its effect would activate only when it is cleared. Does not currently spawn."
  },
  {
    "id": "ice",
    "name": "Ice Nut",
    "group": "elemental",
    "live": false,
    "art": "art/primary/nuts/elemental/ice.png",
    "effect": "On activation, freezes two adjacent movable nuts for one player turn.",
    "rule": "PROPOSED: Timing and route planning. An elemental nut would keep its underlying match color; its effect would activate only when it is cleared. Does not currently spawn."
  },
  {
    "id": "water",
    "name": "Water Nut",
    "group": "elemental",
    "live": false,
    "art": "art/primary/nuts/elemental/water.png",
    "effect": "On activation, washes sticky butter from every cell in its row.",
    "rule": "PROPOSED: Spreading peanut-butter puzzles. An elemental nut would keep its underlying match color; its effect would activate only when it is cleared. Does not currently spawn."
  },
  {
    "id": "earth",
    "name": "Earth Nut",
    "group": "elemental",
    "live": false,
    "art": "art/primary/nuts/elemental/earth.png",
    "effect": "On activation, crushes one surface layer on the three nearest cells in its column.",
    "rule": "PROPOSED: Deep, narrow blocker routes. An elemental nut would keep its underlying match color; its effect would activate only when it is cleared. Does not currently spawn."
  },
  {
    "id": "wind",
    "name": "Wind Nut",
    "group": "elemental",
    "live": false,
    "art": "art/primary/nuts/elemental/wind.png",
    "effect": "On activation, rotates the nearest three movable nut payloads once, leaving fixed hazards in place.",
    "rule": "PROPOSED: Controlled cascade setup. An elemental nut would keep its underlying match color; its effect would activate only when it is cleared. Does not currently spawn."
  },
  {
    "id": "lightning",
    "name": "Lightning Nut",
    "group": "elemental",
    "live": false,
    "art": "art/primary/nuts/elemental/lightning.png",
    "effect": "On activation, chains to three distinct nuts of its own underlying color.",
    "rule": "PROPOSED: Separated color collections. An elemental nut would keep its underlying match color; its effect would activate only when it is cleared. Does not currently spawn."
  },
  {
    "id": "nature",
    "name": "Nature Nut",
    "group": "elemental",
    "live": false,
    "art": "art/primary/nuts/elemental/nature.png",
    "effect": "On activation, removes one adjacent sticky layer and grows one extra move if butter was removed.",
    "rule": "PROPOSED: Hazard recovery. An elemental nut would keep its underlying match color; its effect would activate only when it is cleared. Does not currently spawn."
  },
  {
    "id": "poison",
    "name": "Poison Nut",
    "group": "elemental",
    "live": false,
    "art": "art/primary/nuts/elemental/poison.png",
    "effect": "On activation, marks two adjacent empty-of-butter cells; the marks turn sticky after the next move.",
    "rule": "PROPOSED: Risk-versus-reward hazard control. An elemental nut would keep its underlying match color; its effect would activate only when it is cleared. Does not currently spawn."
  },
  {
    "id": "radiance",
    "name": "Radiance Nut",
    "group": "elemental",
    "live": false,
    "art": "art/primary/nuts/elemental/radiance.png",
    "effect": "On activation, cleanses the nearest three hostile statuses, prioritizing sticky butter then chains.",
    "rule": "PROPOSED: Safely breaking pressure. An elemental nut would keep its underlying match color; its effect would activate only when it is cleared. Does not currently spawn."
  },
  {
    "id": "shadow",
    "name": "Shadow Nut",
    "group": "elemental",
    "live": false,
    "art": "art/primary/nuts/elemental/shadow.png",
    "effect": "On activation, makes one marked tile temporarily untargetable to automatic effects for a turn; marked tile remains visible.",
    "rule": "PROPOSED: Precision obstacle routing. An elemental nut would keep its underlying match color; its effect would activate only when it is cleared. Does not currently spawn."
  },
  {
    "id": "crystal",
    "name": "Crystal Nut",
    "group": "elemental",
    "live": false,
    "art": "art/primary/nuts/elemental/crystal.png",
    "effect": "On activation, stores one combo charge; the next scoring cascade consumes it for a second bonus pulse.",
    "rule": "PROPOSED: Combo planning. An elemental nut would keep its underlying match color; its effect would activate only when it is cleared. Does not currently spawn."
  },
  {
    "id": "magma",
    "name": "Magma Nut",
    "group": "elemental",
    "live": false,
    "art": "art/primary/nuts/elemental/magma.png",
    "effect": "On activation, strikes its column, then strikes surviving blockers in that column once more after gravity.",
    "rule": "PROPOSED: Reinforced vertical obstacles. An elemental nut would keep its underlying match color; its effect would activate only when it is cleared. Does not currently spawn."
  },
  {
    "id": "frost",
    "name": "Frost Nut",
    "group": "elemental",
    "live": false,
    "art": "art/primary/nuts/elemental/frost.png",
    "effect": "On activation, creates a visible one-hit ice shell on a nearby unshielded nut.",
    "rule": "PROPOSED: Deliberate defensive tradeoffs. An elemental nut would keep its underlying match color; its effect would activate only when it is cleared. Does not currently spawn."
  },
  {
    "id": "storm",
    "name": "Storm Nut",
    "group": "elemental",
    "live": false,
    "art": "art/primary/nuts/elemental/storm.png",
    "effect": "On activation, forks to up to five nuts, prioritizing distinct rows and columns.",
    "rule": "PROPOSED: Crowded split boards. An elemental nut would keep its underlying match color; its effect would activate only when it is cleared. Does not currently spawn."
  },
  {
    "id": "arcane",
    "name": "Arcane Nut",
    "group": "elemental",
    "live": false,
    "art": "art/primary/nuts/elemental/arcane.png",
    "effect": "On activation, recolors two adjacent ordinary nuts to the activated nut's underlying match color.",
    "rule": "PROPOSED: Crafting five-matches. An elemental nut would keep its underlying match color; its effect would activate only when it is cleared. Does not currently spawn."
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
    "art": "art/primary/blockers/ice-2.png",
    "symbol": "🧊",
    "effect": "Ice protects the nut beneath it. Each hit removes ONE layer; two-hit ice cracks to one-hit ice, then breaks. The nut remains until a later hit.",
    "rule": "In the current engine. Hit priority: butter → ice → chain → chest → timer → nut."
  },
  {
    "id": "chain",
    "name": "Chain Shield / Lock",
    "group": "blockers",
    "live": true,
    "art": "art/primary/blockers/chain-1.png",
    "symbol": "⛓️",
    "effect": "A chain shields its nut from clearing; one hit removes one chain layer. Chained nuts can still be swapped. Master Key removes all chains.",
    "rule": "In the current engine. Hit priority: butter → ice → chain → chest → timer → nut."
  },
  {
    "id": "chest",
    "name": "Treasure Chest",
    "group": "blockers",
    "live": true,
    "art": "art/primary/blockers/chest.png",
    "symbol": "🧰",
    "effect": "A chest needs two separate hits (or a multi-hit tool). Both hits count toward chest objectives; the nut is preserved until unshielded.",
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
    "art": null,
    "symbol": "🍯",
    "effect": "A match or tool removes sticky butter before damaging another shield. Starting at level 110, one sticky layer spreads to a neighbor every third move.",
    "rule": "In the current engine. Hit priority: butter → ice → chain → chest → timer → nut."
  },
  {
    "id": "fuse",
    "name": "Timed Acorn",
    "group": "hazards",
    "live": true,
    "art": null,
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
    "effect": "From level 125, rotates nut payloads within a marked row every second turn. Ice, locks, butter and chests stay on their squares.",
    "rule": "In the current engine. Hit priority: butter → ice → chain → chest → timer → nut."
  },
  {
    "id": "portal",
    "name": "Portal",
    "group": "board",
    "live": true,
    "art": null,
    "symbol": "◎",
    "effect": "From level 164, exchanges nut payloads between two marked cells every third turn (faster later). The blockers remain fixed.",
    "rule": "In the current engine. Hit priority: butter → ice → chain → chest → timer → nut."
  },
  {
    "id": "wind",
    "name": "Wind Tunnel",
    "group": "board",
    "live": true,
    "art": null,
    "symbol": "↕",
    "effect": "From level 301, rotates a marked column every second turn; from level 401, every turn. Direction reverses after each gust.",
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
const GROUPS=[['nuts','Nuts'],['elemental','Elemental'],['specials','Matches'],['blockers','Blockers'],['hazards','Statuses'],['board','Board'],['boosters','Tools']];
const api=Object.freeze({entries:Object.freeze(ENTRIES.map(x=>Object.freeze(x))),groups:Object.freeze(GROUPS.map(x=>Object.freeze(x))),byGroup:group=>ENTRIES.filter(x=>x.group===group)});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.NutCodex=api;
})(typeof window!=='undefined'?window:globalThis);
