# Level design and first 30 levels

The current playable prototype uses a deterministic eight-shape cycle applied to 30 levels, grouped into five six-level regions (Nut Grove, Peanut Butter Factory, Squirrel Hoard, Coconut Island, Golden Palace). Level-specific seeds produce no pre-existing matches and at least one legal initial move.

| Shape | Description | Testing concern |
|---|---|---|
| 1 | Full grid | Basic tutorial |
| 2 | Hourglass | Narrow center, segment gravity |
| 3 | Center spine and wings | Accessibility of edge pieces |
| 4 | Ring with center void | Disconnected gravity columns |
| 5 | Twin chambers joined by bridge | Legal swaps across bridge |
| 6 | Stepped upper/lower sections | Vertical refill |
| 7 | Asymmetric absent corners | Small pockets |
| 8 | Diamond/lozenge | Narrow tips |

The initial milestone is a playable prototype, **not** completed bespoke balance: tune move budgets, blocker combinations, score targets, special-candy interactions, and objective variety in later iterations. Win/loss criteria and blocker destruction require regression testing whenever the engine changes.
