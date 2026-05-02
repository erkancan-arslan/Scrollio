# Scrollio — Spec Compliance Audit

**Source document:** Product Technical Specifications v2 (December 7, 2025)  
**Audit date:** April 28, 2026

---

## Shared System Requirements (3.1)

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | Email/password account creation | ✅ Done | |
| 2 | Auth ≤ 3 seconds | — | Performance SLA, not enforceable in code |
| 3 | Feed supports ≥ 50 continuous videos | ✅ Done | FlatList-based feed with pagination |
| 4 | Videos max 60 seconds | ⚠️ Partial | Default is 45s for kids; no hard 60s cap in Core admin upload pipeline |
| **5** | **Pause, replay, mute, skip controls** | **⚠️ Partial** | Pause ✅, Mute ✅, Swipe-to-skip ✅ — **Replay/restart button is missing** |
| 6 | Watch history (date, time, duration) | ✅ Done | `feedService.recordView()` → `POST /feed/videos/:id/view` with `watchDuration` |
| 7 | Content recommendation on ≥ 3 topics | ✅ Done | Minimum 3 selected at onboarding |
| 8 | Store XP, videos watched, quiz accuracy | ✅ Done | Profile tracks all three |
| 9 | Internet connectivity required | — | Runtime/network behavior |
| 10 | Functional at ≥ 5% battery | — | OS-level, not app-level |

---

## Scrollio 13+ Module (3.2)

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| **11** | **Age 13+ access gate** | **❌ Missing** | Landing screen says "ages 13+" in copy only; no DOB input or enforcement at sign-up |
| **12** | **1–10 topics in onboarding** | **❌ Wrong** | Minimum is hardcoded to **3** (not 1), and there is **no maximum of 10** |
| **13** | **Quizzes every 4–7 watched videos** | **❌ Different logic** | Core quiz triggers on topic/level completion (watch all videos in a level), not a 4–7 video interval |
| 14 | Quizzes: 2–4 options, instant feedback | ✅ Done | `CoreQuizOverlay` has answer options and immediate feedback |
| **15** | **10–50 XP per watched video** | **❌ Missing** | `recordView` does not award XP; no such range found in Core feed path |
| **16** | **50–150 XP per correct quiz** | **❌ Wrong** | Kids quiz awards fixed 10 XP (base) / 50 XP (correct); no Core equivalent in this range found |
| 17 | XP determines level progression | ✅ Done | `add_xp` RPC and level system exist |
| **18** | **Bookmarks max 500 capacity** | **❌ Not enforced** | Constant exists in kids config but is never checked on insert in either Core or Kids bookmark services |
| 19 | Recommendations adapt to watch time/likes/quiz | ✅ Done | Backend recommendation logic uses these signals |
| **20** | **Weekly analytics (videos, quiz accuracy, topic distribution)** | **❌ Missing** | Profile only shows lifetime aggregates; no weekly breakdown screen or topic distribution view |

---

## Scrollio Kids Module (3.3)

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| **21** | **Kids age gate 7–12** | **❌ Missing** | No age verification; just a text label "for ages 7–12" on landing |
| 22 | Drawing canvas ≥ 8 colors, ≥ 3 brush sizes | ✅ Done | 10 colors, 5 brush sizes |
| 23 | AI avatar generation ≤ 30 seconds | ⚠️ Unverifiable | Pipeline exists (mascot jobs via FAL.ai), but no timeout enforcement/SLA found |
| 24 | Kids videos ≤ 45 seconds | ⚠️ Soft default | Default is 45s but no hard validation gate on upload |
| **25** | **3D playground: 1 reward per 3 lessons/quizzes** | **❌ Missing** | Missions/rewards exist but no "1 reward per 3 completions" rule implemented |
| 26 | Parent-approved categories only | ✅ Done | Content safety settings in parental dashboard |
| 27 | No public comms in Kids (messaging, comments, profile discovery) | ✅ Done | Kids navigator has no chat/social routes |
| **28** | **Switching Kids → Core requires parental approval** | **❌ Missing** | `AppLandingScreen` lets anyone tap "Core" with no PIN challenge |
| 29 | Screen time limits 10–120 min | ✅ Done | `ScreenTimeGuard` + parental settings |

---

## Parental Dashboard (3.4)

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 30 | Watch time daily, weekly, monthly | ⚠️ Partial | **Daily** shown; **weekly and monthly totals are missing** |
| **31** | **Quiz performance % by topic** | **❌ Missing** | Parental dashboard has no quiz breakdown by topic |
| 32 | Modify screen time limits, lock when exceeded | ✅ Done | `ScreenTimeGuard` enforces this |
| **33** | **Weekly usage summary reports (automated/push)** | **❌ Missing** | FCM is a placeholder (Firebase Admin TODO); no cron/scheduler for weekly reports |
| **34** | **30 days of progress history** | **❌ Missing** | No feature or query implementing 30-day history retention |

---

## Summary of What's Left Out

### High priority gaps (functional features explicitly in spec)

1. **Replay button** on video player
2. **Age gates** — both 13+ for Core and 7–12 for Kids (signup/onboarding)
3. **Topic onboarding: min 1 / max 10** (currently min 3, no max)
4. **Core quiz cadence**: every 4–7 videos (currently topic/level-based)
5. **XP awards**: 10–50 XP per Core video, 50–150 XP per Core quiz
6. **Weekly analytics screen** (videos watched, quiz accuracy, topic distribution)
7. **Playground reward: 1 per 3 lessons/quizzes** (reward rule not wired to this logic)
8. **Kids → Core switch requires parental PIN/approval**
9. **Parental dashboard: weekly/monthly watch time totals**
10. **Parental dashboard: quiz performance % by topic**
11. **Weekly automated usage reports to parents** (FCM is a stub)
12. **30 days of progress history**
13. **Bookmarks 500-item cap** (constant defined but never enforced)

### Minor / soft gaps

- Hard 60-second cap on Core video uploads (not validated in admin pipeline)
- Hard 45-second cap on Kids videos (soft default only)
- AI avatar ≤ 30 second SLA (no timeout enforcement)
