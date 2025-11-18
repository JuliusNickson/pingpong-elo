# 📊 PingPong ELO System - Complete Documentation

## Table of Contents
1. [ELO Rating Calculation](#elo-rating-calculation)
2. [Rating Deviation (RD) System](#rating-deviation-rd-system)
3. [Bulk Match Processing](#bulk-match-processing)
4. [Win Probability](#win-probability)
5. [Constants Reference](#constants-reference)
6. [Real-World Examples](#real-world-examples)

---

## 🎯 ELO Rating Calculation

### Expected Score Formula
```javascript
Expected = 1 / (1 + 10^((OpponentELO - PlayerELO) / 400))
```

**What it means:**
- Calculates the probability of winning (value between 0 and 1)
- Based on the rating difference between two players
- Standard ELO formula used in chess and other competitive games

**Example:**
If you're rated 1200 and your opponent is 1100:
```
Expected = 1 / (1 + 10^((1100-1200)/400))
Expected = 1 / (1 + 10^(-0.25))
Expected ≈ 0.64 (64% chance to win)
```

**Key Points:**
- **400 point difference** = 10:1 odds (90.9% vs 9.1%)
- **Equal ratings** = 50% chance each
- **200 point difference** ≈ 76% vs 24%

---

### ELO Change Formula
```javascript
New Rating = Old Rating + K × (Actual Score - Expected Score)
```

**Parameters:**
- **Actual Score**: 1 if won, 0 if lost
- **K-factor**: Dynamic multiplier based on Rating Deviation (see below)
- **Expected Score**: Calculated probability from formula above

**Example 1: Favorite Wins**
```
You: 1200 ELO, Opponent: 1100 ELO
Expected: 0.64 (64% to win)
K-factor: 20

You WIN:
New ELO = 1200 + 20 × (1 - 0.64)
New ELO = 1200 + 7.2 = 1207 (+7 points)

Small gain because you were expected to win
```

**Example 2: Underdog Wins (Upset)**
```
You: 1100 ELO, Opponent: 1200 ELO
Expected: 0.36 (36% to win)
K-factor: 20

You WIN:
New ELO = 1100 + 20 × (1 - 0.36)
New ELO = 1100 + 12.8 = 1113 (+13 points)

Bigger gain because upset victory!
```

**Example 3: Favorite Loses**
```
You: 1200 ELO, Opponent: 1100 ELO
Expected: 0.64 (64% to win)
K-factor: 20

You LOSE:
New ELO = 1200 + 20 × (0 - 0.64)
New ELO = 1200 - 12.8 = 1187 (-13 points)

Big loss because you were expected to win!
```

---

## 📉 Rating Deviation (RD) System

### What is RD?

Rating Deviation (RD) measures the **uncertainty** in a player's rating:

- **High RD (300)**: New player, uncertain skill level → ratings change quickly
- **Low RD (50)**: Experienced player, stable skill level → ratings change slowly
- **Medium RD (150-200)**: Regular player with moderate stability

RD makes the system **fair and adaptive** for all players.

---

### Dynamic K-Factor Formula

```javascript
K = BASE_K_FACTOR × (RD / 200)
K = 20 × (RD / 200)
```

**What it means:**
- K-factor determines how much your rating can change per match
- **High RD → High K**: Ratings change faster for uncertain players
- **Low RD → Low K**: Ratings change slowly for stable players

**Examples:**

| Player Type | RD | K-Factor | Rating Change |
|-------------|-----|----------|---------------|
| New player | 300 | 30 | ±30 points max |
| Average player | 200 | 20 | ±20 points max |
| Active veteran | 100 | 10 | ±10 points max |
| Highly stable | 50 | 5 | ±5 points max |

**Why This Matters:**
- New players reach their "true" rating faster (high K)
- Experienced players have stable ratings (low K)
- System is fair for all skill levels
- Encourages regular play to maintain stability

---

### RD Decrease: Playing Matches

```javascript
New RD = Current RD - RD_DECAY_PER_MATCH
New RD = Current RD - 5
Minimum RD = 50 (cannot go lower)
```

**What it means:**
- Every match you play decreases RD by **5 points**
- More matches = more confidence in your rating = lower RD
- Stops decreasing at RD = 50 (maximum confidence)

**Example Journey:**
```
New player starts:        RD = 300, K = 30
After 10 matches:         RD = 250, K = 25
After 30 matches:         RD = 150, K = 15
After 50 matches:         RD = 50,  K = 5  (max stability)
After 100 matches:        RD = 50,  K = 5  (stays at minimum)
```

At RD = 50, your rating becomes very stable and requires many matches to change significantly.

---

### RD Increase: Inactivity Penalty

```javascript
Days Inactive = (Now - Last Match Date) / (24 hours)
RD Increase = Days Inactive × RD_INCREASE_PER_DAY
RD Increase = Days Inactive × 2
New RD = Current RD + RD Increase
Maximum RD = 350 (cap)
```

**What it means:**
- For every day you don't play, RD increases by **+2 points**
- Skill uncertainty increases over time without practice
- Encourages regular play to maintain stable ratings
- Capped at 350 RD maximum

**Inactivity Examples:**

| Time Inactive | RD Increase | Impact |
|---------------|-------------|--------|
| 1 week | +14 RD | Slight increase |
| 2 weeks | +28 RD | Moderate increase |
| 1 month | +60 RD | Significant increase |
| 3 months | +180 RD | Major increase |
| 6 months | +360 → 350 | Capped at maximum |

**Combined Effect Example:**
```
Active player has RD = 100 (very stable)
They stop playing for 30 days:

New RD = 100 + (30 × 2) = 160

Their K-factor increases:
Old K = 20 × (100/200) = 10
New K = 20 × (160/200) = 16

When they return:
- Ratings will swing more (±16 instead of ±10)
- Allows them to quickly adjust if skill changed
- Returns to stability after playing regularly again
```

---

## 🎮 Bulk Match Processing (Multiple Games)

### How It Works

When recording multiple games in a session (e.g., "I won 5, they won 2"), the system processes each game **sequentially** rather than as one large calculation.

### Sequential Calculation Formula

```javascript
// For each game won by Player A:
for (i = 0; i < winsA; i++) {
  expectedA = 1 / (1 + 10^((ratingB - ratingA) / 400))
  expectedB = 1 / (1 + 10^((ratingA - ratingB) / 400))
  
  newA = ratingA + K × (1 - expectedA)  // A wins
  newB = ratingB + K × (0 - expectedB)  // B loses
  
  ratingA = newA  // Update for next game
  ratingB = newB
}

// For each game won by Player B:
for (i = 0; i < winsB; i++) {
  expectedA = 1 / (1 + 10^((ratingB - ratingA) / 400))
  expectedB = 1 / (1 + 10^((ratingA - ratingB) / 400))
  
  newA = ratingA + K × (0 - expectedA)  // A loses
  newB = ratingB + K × (1 - expectedB)  // B wins
  
  ratingA = newA
  ratingB = newB
}

Final ratings saved after all games processed
```

### Complete Example: 6-Game Session

**Setup:**
- Niki: 1200 ELO
- Rezi: 1100 ELO
- Results: Niki wins 5, Rezi wins 1
- K-factor: 20 (simplified)

**Game-by-Game Breakdown:**

```
Game 1: Niki wins
  Expected: Niki 0.64, Rezi 0.36
  Niki: 1200 + 20×(1-0.64) = 1207 (+7)
  Rezi: 1100 + 20×(0-0.36) = 1093 (-7)

Game 2: Niki wins
  Expected: Niki 0.66, Rezi 0.34
  Niki: 1207 + 20×(1-0.66) = 1214 (+7)
  Rezi: 1093 + 20×(0-0.34) = 1086 (-7)

Game 3: Niki wins
  Expected: Niki 0.68, Rezi 0.32
  Niki: 1214 + 20×(1-0.68) = 1220 (+6)
  Rezi: 1086 + 20×(0-0.32) = 1080 (-6)

Game 4: Niki wins
  Expected: Niki 0.69, Rezi 0.31
  Niki: 1220 + 20×(1-0.69) = 1226 (+6)
  Rezi: 1080 + 20×(0-0.31) = 1074 (-6)

Game 5: Niki wins
  Expected: Niki 0.71, Rezi 0.29
  Niki: 1226 + 20×(1-0.71) = 1232 (+6)
  Rezi: 1074 + 20×(0-0.29) = 1068 (-6)

Game 6: Rezi wins (upset!)
  Expected: Niki 0.72, Rezi 0.28
  Niki: 1232 + 20×(0-0.72) = 1218 (-14)
  Rezi: 1068 + 20×(1-0.28) = 1082 (+14)

Final Results:
  Niki: 1200 → 1218 (+18 total)
  Rezi: 1100 → 1082 (-18 total)
```

### Why Sequential Processing?

**✅ CORRECT (Our Method):**
- Realistic rating evolution through the session
- Accounts for changing expected scores after each game
- Matches real-world tournament systems (FIDE, Chess.com)
- Fair for mixed results (e.g., 5-1 vs 6-0)

**❌ WRONG (Single Calculation):**
```javascript
// Don't do this:
change = K × (5 - 0.64 × 6)
```
- Creates unrealistic rating jumps
- Ignores match dynamics
- Unfair for upsets
- Not how professional systems work

**Systems Using Sequential Processing:**
- FIDE Chess
- Chess.com
- Table Tennis ratings
- Badminton, Squash, Padel
- Professional eSports rankings

---

## 📈 Win Probability Display

```javascript
Win Probability % = Expected Score × 100
```

### Example Matchups:

| Your ELO | Opponent ELO | Your Win % | Opponent Win % |
|----------|--------------|------------|----------------|
| 1200 | 1200 | 50% | 50% |
| 1300 | 1200 | 64% | 36% |
| 1400 | 1200 | 76% | 24% |
| 1400 | 1000 | 91% | 9% |
| 1500 | 1100 | 91% | 9% |
| 1200 | 800 | 96% | 4% |

**How to Read:**
- **50%**: Even match, toss-up
- **64%**: Slight favorite
- **76%**: Clear favorite
- **91%**: Heavy favorite
- **96%+**: Almost certain victory

---

## 🔢 Constants Reference

### System Configuration

```javascript
// Starting values
DEFAULT_ELO = 1000        // Starting rating for new players
DEFAULT_RD = 300          // Starting uncertainty (new players)
BASE_K_FACTOR = 20        // Base multiplier for rating changes

// RD boundaries
MIN_RD = 50              // Maximum confidence (veterans)
MAX_RD = 350             // Maximum uncertainty

// RD adjustment rates
RD_DECAY_PER_MATCH = 5   // RD decrease per game played
RD_INCREASE_PER_DAY = 2  // RD increase per day inactive

// Protection
MIN_ELO = 100            // Floor rating (cannot go below)
```

### Why These Values?

| Constant | Value | Reasoning |
|----------|-------|-----------|
| `DEFAULT_ELO` | 1000 | Industry standard, easy to understand |
| `BASE_K_FACTOR` | 20 | Balanced: not too volatile, not too slow |
| `DEFAULT_RD` | 300 | High uncertainty for new players |
| `MIN_RD` | 50 | Prevents ratings from becoming frozen |
| `MAX_RD` | 350 | Caps uncertainty from extreme inactivity |
| `RD_DECAY` | 5 | Stable after ~50 matches |
| `RD_INCREASE` | 2/day | Meaningful after 1 month inactivity |

---

## ✅ Real-World Examples

### Example 1: New Player Journey

**John joins the ping pong league**

**Day 1 - First Match:**
```
John's Stats: ELO 1000, RD 300, K-factor 30
Opponent: ELO 1100
Expected: 0.36 (36% to win)

John WINS:
New ELO = 1000 + 30×(1-0.36) = 1019 (+19)
New RD = 300 - 5 = 295

Big gain! Rating moving quickly for new player.
```

**After 10 Matches (mixed results):**
```
ELO: 1150 (found competitive level)
RD: 250
K-factor: 25
Ratings still adjusting quickly
```

**After 50 Matches:**
```
ELO: 1250 (stabilized at skill level)
RD: 50 (minimum reached)
K-factor: 5
Rating now very stable
```

**Takes 60-Day Break (Summer Vacation):**
```
RD increases: 50 + (60×2) = 170
K-factor: 17
Rating will move more when returning
```

**Returns and Plays:**
```
Ratings adjust faster to account for potential skill changes
After 10 matches back, RD drops to 120
Eventually stabilizes again with regular play
```

---

### Example 2: Veteran vs Newbie

**Sarah (Veteran) vs Mike (New):**

```
Sarah: ELO 1400, RD 50, K 5
Mike: ELO 1000, RD 300, K 30
Expected: Sarah 91%, Mike 9%

Sarah WINS (expected):
  Sarah: 1400 + 5×(1-0.91) = 1400 (+0.45 ≈ 0)
  Mike: 1000 + 30×(0-0.09) = 997 (-3)
  
  Sarah barely moves (stable, expected win)
  Mike loses only 3 points (underdog protection)

Mike WINS (huge upset!):
  Sarah: 1400 + 5×(0-0.91) = 1395 (-5)
  Mike: 1000 + 30×(1-0.09) = 1027 (+27)
  
  Sarah loses only 5 (stable rating protected)
  Mike gains 27 (rapid adjustment for skilled play)
```

**Fairness:**
- Veteran ratings protected from volatility
- New players adjust rapidly to true skill
- Upsets rewarded appropriately
- System self-corrects over time

---

### Example 3: Comeback After Inactivity

**Alex's Story:**

**Active Period (3 months of regular play):**
```
Start: ELO 1000, RD 300
End: ELO 1350, RD 50
Status: Highly stable, skilled player
```

**Inactivity (6 months break):**
```
Days inactive: 180
RD increase: 180 × 2 = 360 → capped at 350
New RD: 350 (maximum uncertainty)
New K-factor: 35 (will move quickly)
```

**Return Match Against 1350 Opponent:**
```
Expected: 50% (equal ratings)
K-factor: 35 (high due to RD)

If Alex is rusty and LOSES:
  ELO: 1350 + 35×(0-0.5) = 1333 (-17)
  Big drop to account for potential skill decay

If Alex maintained skill and WINS:
  ELO: 1350 + 35×(1-0.5) = 1368 (+18)
  Quick adjustment upward

After 10 return matches:
  RD drops to 300
  K-factor: 30
  Rating stabilizing at true current level
```

**System Benefits:**
- Accounts for potential skill changes
- Allows rapid re-adjustment
- Protects competitive integrity
- Fair to both active and returning players

---

## 🏆 System Philosophy

### Design Principles

1. **Fair for All Levels**
   - New players adjust quickly
   - Veterans have stable ratings
   - Upsets rewarded appropriately

2. **Self-Correcting**
   - Ratings converge to true skill
   - Inactivity handled gracefully
   - No manual interventions needed

3. **Transparent**
   - Clear formulas
   - Predictable outcomes
   - Visible win probabilities

4. **Industry Standard**
   - Based on proven ELO system
   - Matches professional implementations
   - Trusted algorithms

### Comparison to Other Systems

| System | Our Implementation |
|--------|-------------------|
| **Chess (FIDE)** | ✅ Same core formula |
| **Chess.com** | ✅ Similar dynamic K |
| **Table Tennis** | ✅ Sequential processing |
| **League of Legends** | ✅ RD-based confidence |
| **Professional Sports** | ✅ Inactivity handling |

---

## 📚 Additional Resources

### For Developers

- **Code Location**: `/utils/elo.js`
- **Constants**: `/constants/defaults.js`
- **RD System**: `/utils/rd.js`
- **Match Processing**: `/utils/matchRequests.js`

### Mathematical Background

- [Elo Rating System (Wikipedia)](https://en.wikipedia.org/wiki/Elo_rating_system)
- [Glicko Rating System](http://www.glicko.net/glicko.html) (RD inspiration)
- [FIDE Rating Regulations](https://www.fide.com/fide/handbook.html?id=172&view=article)

### Testing

All formulas can be tested in the development environment:
```bash
npm test        # Run unit tests
npm run dev     # Test in development mode
```

---

**Last Updated:** November 18, 2025  
**Version:** 2.0  
**System Status:** Production Ready ✅
