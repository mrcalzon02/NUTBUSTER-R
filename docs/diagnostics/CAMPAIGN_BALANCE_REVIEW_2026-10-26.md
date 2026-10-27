# NUTBUSTER campaign difficulty: evidence-based review (2026-10-26)

## Scope and provenance
Source: `Nutbuster-diagnostics-40436940350` from [GitHub Actions run 40436940350](https://github.com/mrcalzon02/NUTBUSTER-R/actions/runs/40436940350) at revision `04439977c411a270dc8bb39b0e87221b2b84210b`. This archive includes `nutbuster-difficulty-audit.json` (one fixed starting seed on all 1,000 stages) and `nutbuster-greedy-playtest.json` (two seeded, no-booster greedy attempts per stage). That run's diagnostics, release publisher, Fire tablet proxy, and Android emulator completed successfully.

**An audit exiting 0 is not evidence that the full campaign is fairly balanced.** The structural audit only checks that each seed has at least one immediate scoring swap and reports an aggregate. The automated player is deliberately short-sighted, uses no boosters, and optimizes immediate matches. Its two seeds do not establish theoretical solvability, human success probabilities or the difficulty for a skilled player.

## Observed measurements

| Chapter | Levels | Greedy-bot wins / 200 | Stages with 0 / 2 bot wins | Mean allowed moves | Mean immediate opening swaps | Hazard detonations / 200 attempts |
|---|---|---:|---:|---:|---:|---:|
| 1 | 1–100 | 151 | 14 | 28.3 | 2.9 | 0 |
| 2 | 101–200 | 96 | 43 | 19.7 | 1.9 | 0 |
| 3 | 201–300 | 50 | 66 | 17.0 | 1.7 | 173 |
| 4 | 301–400 | 29 | 78 | 16.0 | 1.5 | 374 |
| 5 | 401–500 | 20 | 84 | 15.0 | 1.4 | 625 |
| 6 | 501–600 | 5 | 96 | 16.0 | 1.4 | 851 |
| 7 | 601–700 | 7 | 93 | 15.7 | 1.4 | 942 |
| 8 | 701–800 | 1 | 99 | 15.7 | 1.5 | 956 |
| 9 | 801–900 | 1 | 99 | 14.7 | 1.4 | 966 |
| 10 | 901–1000 | 0 | 100 | 14.7 | 1.5 | 983 |

In total, the heuristic won **360 of 2,000 attempts**, 772 stages had no wins among their two trials, and the runs recorded **5,870 hazard detonations** and **41,500 transport events**. The first zero-win stage was **37**, the last sampled winning stage was **858**. The longest contiguous zero-win stretches were **707–857** (151 stages) and **859–1000** (142 stages). These are *bot observations, not unwinnable-stage findings*.

## What needs verification before changing balance

1. Independently inspect a limited sample of early teaching stages (37, 44, 58, 62–63, 98–102) with realistic booster availability and a better move-selection policy; confirm no objective is blocked by an impossible or hidden constraint.
2. Prioritize late levels 501–520, 707–720, 801–820, 901–920, and 1000 for deeper scripted and human playtesting. Compare runs with and without ordinary earned boosters rather than artificially supplying currency or purchases.
3. Measure objective progress at each turn, blockers remaining, hazard expirations, rescue/shuffle frequency, and remaining moves at defeat. The present report lacks those *reasons* for failure.
4. Measure multiple randomized seeds and at least one alternative player strategy before touching authored move budgets, score targets, hazard schedules or elemental powers.
5. Preserve original approved sprites, overlay transparency, power-up mappings, and the 1,000-level campaign. Difficulty tuning must be a separate, evidence-supported gameplay change with review of Android/Fire OS and Windows/Linux parity, never a cosmetic-test workaround.

## Tracking and policy
The script `tools/balance-risk-report.js` converts the two optional JSON reports into an explicit severity review, including longest zero-win streaks and a GitHub Actions job summary. It validates completeness and aggregation but returns **0 for actual high difficulty**. Only missing/corrupt diagnostic evidence makes the optional job fail. It is listed as a report-only diagnostic in `tests/diagnostic-suites.txt`. No balance thresholds are added to the signed-publisher's functional release gate.

**Decision:** Flag Chapters 6–10 for comparative playtesting; *do not* unilaterally make them easier or claim they are impossible based solely on a two-trial no-booster greedy bot.
