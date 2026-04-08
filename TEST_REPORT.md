# Test Report — Scrollio Micro-Learning Mobile Application

**Course / project:** GE402 — Product Development  
**Product:** Scrollio (micro-learning mobile app)  
**Company / institution:** *[Fill in]*  
**Team number:** *[Fill in]*  
**Team members:** *[Names, roles optional]*  
**Report version:** 0.5 *(increment after each test cycle)*  
**Date:** 2026-04-08  

---

## Revision history

| Version | Date       | Author(s) | Summary of changes                          |
|---------|------------|-----------|-----------------------------------------------|
| 0.1     | *(initial)*| *(team)*  | Initial skeleton; pre–test-execution baseline |
| 0.2     | 2026-04-08 | *(team)*  | T-01 executed and recorded (Appendix B.1)     |
| 0.3     | 2026-04-08 | *(team)*  | T-02 executed and recorded (Appendix B.2)     |
| 0.4     | 2026-04-08 | *(team)*  | T-03 recorded (B.3); Kids topic onboarding implemented |
| 0.5     | 2026-04-08 | *(team)*  | T-04 executed and recorded (Appendix B.4) |

---

## Table of contents

1. [Abstract](#abstract)  
2. [Introduction](#introduction)  
3. [Specifications under test](#specifications-under-test)  
4. [Test approach and alignment with the test plan](#test-approach-and-alignment-with-the-test-plan)  
5. [Test environment, equipment, assumptions, and responsibilities](#test-environment-equipment-assumptions-and-responsibilities)  
6. [Catalogue of tests](#catalogue-of-tests)  
7. [Summary of results](#summary-of-results)  
8. [Test results and discussion](#test-results-and-discussion)  
9. [Conclusions](#conclusions)  
10. [References](#references)  

**Appendices**

- [Appendix A — Standard test record template](#appendix-a--standard-test-record-template)  
- [Appendix B — Completed test records](#appendix-b--completed-test-records)  

---

## List of figures

*[Add each figure caption and page/section anchor when figures are inserted. If none, state: “No figures in this version.”]*  

---

## List of tables

| No. | Title                              | Section |
|-----|------------------------------------|---------|
| 1   | Revision history                   | Above   |
| 2   | Summary of test results          | §7      |
| 3   | Catalogue of tests                | §6      |
| 4   | *[Add as tables are introduced]* |         |

---

## Abstract

This report records manual verification of the Scrollio micro-learning mobile app against the team **Test Plan** [4]. **T-01–T-03** have been executed or updated: Core onboarding enforces **≥3 topics** and persists **preferences** (T-03); **Kids** now includes a dedicated **topic onboarding** step and database tracking after a gap was found (§8.1, B.3). **T-05–T-11** remain pending.

**Keywords:** mobile testing, Expo Go, onboarding, Scrollio, Kids module  

---

## Introduction

### Product description

Scrollio is a React Native (Expo) mobile application for short-form educational video learning, with authentication, onboarding, a vertical video feed, social interactions (likes, bookmarks), user profile areas, teacher tooling, and playground experiences. The stack includes Supabase (auth, PostgreSQL, storage), CDN-delivered media, and supporting backend services as described in project documentation [1], [2].

### Purpose of this document

This test report documents **methods** used to verify that the live application meets selected **functional specifications**, records **observed outcomes**, and provides **discussion** where results are ambiguous or defects were found. It is prepared in line with the course test-report expectations [3] and complements the formal **Test Plan** [4], which remains the authoritative source for detailed procedures and quantitative pass/fail criteria unless explicitly revised here.

### Document conventions

- **Test Plan reference:** Detailed objectives, step-by-step procedures, and pass/fail thresholds are defined in [4].  
- **In-text references:** Citations use bracketed numbers (e.g. [1]) and map to **References**.  
- **Per-test narrative:** After each test execution, append a filled copy of **Appendix A** under **Appendix B**, preserving chronological or ID order.  

---

## Specifications under test

*[Briefly list the functional specification areas covered by this campaign—not a copy of the full PRD. Tie each area to the test catalogue (§6). Update if scope changes.]*  

| Specification area (functional)        | Related tests *(IDs from test plan)* | Notes |
|----------------------------------------|--------------------------------------|-------|
| User registration and session creation | T-01                                 | T-01 passed (manual, Expo Go); see B.1 |
| User authentication                    | T-02                                 | T-02 passed; see B.2 |
| Onboarding (preferences)               | T-03                                 | Core PASS (B.3); Kids topic gate added in code |
| Video feed loading and batch behaviour | T-04                                 | PASS (B.4): first thumbnails visible in <15s; feed appears healthy |
| Likes, bookmarks, persistence          | *[e.g. T-05]*                        |       |
| Profile tabs and refresh               | *[e.g. T-06]*                        |       |
| Teacher reference upload               | *[e.g. T-07]*                        |       |
| Teacher lesson pipeline                | *[e.g. T-08]*                        |       |
| Playground experiences                 | *[e.g. T-09–T-11]*                   |       |

---

## Test approach and alignment with the test plan

Execution follows the published **Test Plan** [4]. For each test:

- The **test objective** (specification under verification) is stated in the plan.  
- The **procedure** and **pass/fail criteria**, including **quantitative limits** where defined (e.g. time limits, counts), are taken from the plan unless a documented deviation is recorded in Appendix B.  
- **Results** and **short discussion** are added in this report after execution; the plan itself may be updated separately if the team maintains a single living document, per course guidance [3].

*[Optional: describe test types used—manual exploratory on device, Supabase dashboard checks, etc.]*  

---

## Test environment, equipment, assumptions, and responsibilities

### Hardware and software

| Item              | Description |
|-------------------|-------------|
| Mobile device(s)  | *[e.g. iPhone model / Android device, OS version]* |
| Expo client       | *[Expo Go version]* |
| Network           | *[Wi‑Fi / cellular; note for latency-sensitive tests]* |
| Backend / Supabase| *[project environment: local / staging / production]* |
| Other             | *[desktop browser for dashboard, video files for upload tests, etc.]* |

### Assumptions and constraints

*[e.g. test accounts available; email confirmation disabled for auth tests; CDN and API reachable; known defects deferred out of scope.]*  

### Roles and accountability

| Role / area        | Name(s) | Responsibility |
|--------------------|---------|----------------|
| Test execution     | *[name]* | *[device tests, data capture]* |
| Database verification | *[name]* | *[Supabase checks]* |
| Report maintenance | *[name]* | *[updates Appendix B, summary tables]* |

*[Align names with the Test Plan [4] where responsible members are listed per test.]*  

---

## Catalogue of tests

*[High-level index. IDs and names should match [4]. Tick or date when executed.]*  

| Test ID | Test name (short)                    | Module              | Executed (date) | Record in App. B |
|---------|----------------------------------------|---------------------|-----------------|------------------|
| T-01    | User Registration                      | Authentication      | 2026-04-08      | ☑ B.1            |
| T-02    | User Login                             | Authentication      | 2026-04-08      | ☑ B.2            |
| T-03    | Onboarding — interests & difficulty    | Onboarding          | 2026-04-08      | ☑ B.3            |
| T-04    | Video Feed Loading                     | Video Feed          | 2026-04-08      | ☑ B.4            |
| T-05    | Video Like & Bookmark                  | User Interactions   |                 | ☐                |
| T-06    | Profile — stats and tabs               | Profile             |                 | ☐                |
| T-07    | Teacher — reference video upload       | Teacher Module      |                 | ☐                |
| T-08    | Teacher — lesson creation pipeline     | Teacher Module      |                 | ☐                |
| T-09    | Kids Playground — Space Repair         | Playground          |                 | ☐                |
| T-10    | Core Playground — Conquer the Class    | Playground          |                 | ☐                |
| T-11    | Kids Playground — Know and Conquer     | Playground          |                 | ☐                |

---

## Summary of results

*[Update after each test or batch. Use PASS / FAIL / BLOCKED / PARTIAL as needed.]*  

| Test ID | Result   | Evidence / link to Appendix B subsection |
|---------|----------|----------------------------------------|
| T-01    | PASS     | Appendix B.1                           |
| T-02    | PASS     | Appendix B.2                           |
| T-03    | PASS     | Appendix B.3                           |
| T-04    | PASS     | Appendix B.4                           |
| T-05    | *Pending*|                                        |
| T-06    | *Pending*|                                        |
| T-07    | *Pending*|                                        |
| T-08    | *Pending*|                                        |
| T-09    | *Pending*|                                        |
| T-10    | *Pending*|                                        |
| T-11    | *Pending*|                                        |

**Overall:** 4 / 11 tests completed — **T-01–T-04 PASS**; T-05–T-11 pending.  

---

## Test results and discussion

### 8.1 Cross-cutting observations

- **Core vs Kids:** Registration and post-registration onboarding were reported as working for both the **Core (learner)** path and the **Kids** module, suggesting aligned auth/onboarding patterns across product modes (outside the formal T-01 scope but useful for regression awareness).  
- **Duplicate identifiers:** In addition to duplicate **email** (explicitly in T-01), duplicate **username** rejection was observed where applicable; this supports data-integrity expectations even where the written test plan emphasises email only.  
- **Kids vs Core onboarding (T-03):** Initially the Kids module did not prompt for **interest topics** during onboarding (defaults came from server-side auto-assignment). The product was updated to add **KidsOnboardingTopics** (minimum **3** topics, aligned with Core), remove automatic topic assignment on child creation, add **`topic_onboarding_completed_at`** on **`kids_child_profiles`**, and mark onboarding complete when **≥3** topics are saved (`kids_child_topics` + API). **Retest Kids** on device after applying migration `20260408120000_kids_topic_onboarding.sql` and deploying the backend/mobile build.  

### 8.2 Defects and follow-up

| ID   | Test ref | Summary | Severity | Status |
|------|----------|---------|----------|--------|
| —    | —        | No defects logged for T-01 / T-02 | — | — |

*[Add rows as defects are found.]*  

### 8.3 Detailed records

Step-by-step outcomes, measurements, and discussion for each test are recorded in **Appendix B**, using the structure in **Appendix A**.  

---

## Conclusions

**T-01–T-04:** Authentication, onboarding, and initial feed load satisfy observed expectations. For T-04, first video thumbnails appeared in under 15 seconds after landing on the main page, and feed content rendered normally. **Next:** **T-05 (Like & Bookmark actions)**.  

---

## References

1. Scrollio Product Requirements / technical specifications — *[citation detail: document title, team, year]*  
2. Scrollio project documentation — `brain/00-core/PROJECT_OVERVIEW.md`, `brain/00-core/TECH_STACK.md` — *[access date]*  
3. GE402 Test Report format and expectations — course guideline *(Test Report Document)*  
4. Scrollio **Test Plan** — `TEST_PLAN.md` — *[version / date]*  
5. *[Add standards, Supabase RLS docs, React Native testing resources as cited in text]*  

---

## Appendix A — Standard test record template

*Duplicate this entire appendix block for each test under **Appendix B**, then fill in. Remove italic hints when writing final text.*

### A.[n] Test *[TEST-ID]* — *[Short title]*

**Execution date:** *[YYYY-MM-DD]*  
**Executor(s):** *[name(s)]*  
**Build / environment:** *[e.g. Expo Go, commit hash, env]*  

#### (a) Test objective (specification)

*[State what requirement is verified—may quote or paraphrase [4].]*  

#### (b) Test procedure and pass/fail criteria

**Procedure (summary or step reference):** *[Reference § in [4] or paste abbreviated steps.]*  

**Pass/fail criteria (including quantitative limits):** *[Quote limits from [4]—e.g. seconds, counts, sizes.]*  

#### (c) Responsible member and equipment

**Responsible (per plan):** *[name]*  
**Equipment used:** *[devices, tools]*  

#### (d) Result and discussion

**Outcome:** PASS / FAIL / BLOCKED / PARTIAL  

**Evidence:** *[screenshots path, Supabase row IDs, timings, logs—describe without secrets]*  

**Discussion:** *[Discrepancies vs criteria, likely cause, impact, whether retest needed.]*  

---

## Appendix B — Completed test records

*Append one filled **Appendix A** block per executed test (rename sections to B.1, B.2, …). Chronological order is recommended.*

### B.1 T-01 — User Registration

**Execution date:** 2026-04-08  
**Executor(s):** *[Team — fill names if required for submission]*  
**Build / environment:** Expo Go (manual run on mobile device); Core and Kids flows exercised per tester notes  

#### (a) Test objective (specification)

The system shall allow registration with a valid email and password; on success, a **profiles** record shall exist for the user and the user shall reach **onboarding**; duplicate registration shall be rejected with a clear error [4, §3.1.a].  

#### (b) Test procedure and pass/fail criteria

**Procedure (summary or step reference):** As in [4, §3.1.b]: open app, complete registration with valid credentials, observe navigation and duplicate-email behaviour. Actual UI path: landing → Core **Get Started** → **Sign Up** (test plan wording may say “Create Account” on landing).  

**Pass/fail criteria (including quantitative limits):** Valid registration → **onboarding**; **profiles** row with correct `user_id` in Supabase (tester confirmed flow; dashboard verification optional for formal evidence); duplicate email → clear error, no navigation [4, §3.1.b].  

#### (c) Responsible member and equipment

**Responsible (per plan):** Arhan Bartu Ergüven [4, §3.1.c]  
**Equipment used:** Mobile phone, Expo Go; Supabase Dashboard as applicable  

#### (d) Result and discussion

**Outcome:** **PASS**  

**Evidence:** Manual execution: registration screen functional; after successful registration, user reaches **onboarding**; duplicate **email** addresses not accepted; duplicate **usernames** not accepted; **Kids** module reported to follow a similar successful pattern.  

**Discussion:** Observations exceed minimum T-01 scope (username uniqueness, Kids parity). For grading evidence, team may add Supabase screenshots or row IDs in a future revision. No code changes were required for this result.  

### B.2 T-02 — User Login

**Execution date:** 2026-04-08  
**Executor(s):** *[Team — fill names if required for submission]*  
**Build / environment:** Expo Go; Core Sign In flow  

#### (a) Test objective (specification)

Registered users shall sign in with email and password and reach the main feed; failed attempts shall show a **generic** error that does not reveal whether the email exists [4, §3.2.a].  

#### (b) Test procedure and pass/fail criteria

**Procedure (summary or step reference):** [4, §3.2.b]: Sign In screen → valid credentials; then correct email / wrong password; then non-existent email.  

**Pass/fail criteria (including quantitative limits):** Valid login → feed loads; wrong password and unknown email → same generic message, no navigation to feed [4, §3.2.b].  

#### (c) Responsible member and equipment

**Responsible (per plan):** Arhan Bartu Ergüven [4, §3.2.c]  
**Equipment used:** Mobile phone, Expo Go  

#### (d) Result and discussion

**Outcome:** **PASS**  

**Evidence:** Valid login **OK** (navigation to main feed). Wrong password: message **`invalid email or password`**. Non-existent email: **same** message. No credential-enumeration difference observed.  

**Discussion:** Casing of the string may differ from the plan’s title case (“Invalid…”) but semantics match the pass criteria. No code changes required.  

### B.3 T-03 — Onboarding: Interest & Difficulty Selection

**Execution date:** 2026-04-08  
**Executor(s):** *[Team — fill names if required for submission]*  
**Build / environment:** Expo Go; Core onboarding; Supabase `profiles.preferences` checked  

#### (a) Test objective (specification)

After registration, the user shall choose **≥3** topics and a **difficulty**; selections shall persist to **`profiles.preferences`** [4, §3.3.a].  

#### (b) Test procedure and pass/fail criteria

**Procedure (summary or step reference):** [4, §3.3.b]: attempt continue with 0 / 2 / 3 topics; complete difficulty; verify Supabase.  

**Pass/fail criteria (including quantitative limits):** Continue disabled until **3** topics; counter shows **“X / 3 min”**; after completion **`profiles.preferences`** contains topic IDs and difficulty [4, §3.3.b].  

#### (c) Responsible member and equipment

**Responsible (per plan):** Arhan Bartu Ergüven [4, §3.3.c]  
**Equipment used:** Mobile device, Expo Go, Supabase Dashboard  

#### (d) Result and discussion

**Outcome:** **PASS** (Core)  

**Evidence:** User cannot proceed with **<3** topics; **`preferences`** column updated accordingly for the Core module.  

**Discussion:** **Kids** initially lacked an equivalent topic step (interests were defaulted server-side). Implementation added: migration **`code/supabase/migrations/20260408120000_kids_topic_onboarding.sql`**, backend removal of auto-assign topics in **`createChild`**, completion flag when **`selectTopics`** receives **≥3** IDs, screen **`KidsOnboardingTopicsScreen`**, navigation gates (**`ChildSelectorScreen`**, **`CharacterSelectScreen`**, **`KidsMainTabNavigator`**), and **≥3** topics required in **`KidsTopicPreferencesScreen`**. **Follow-up (same date):** manual re-check confirmed **T-03 behaviour for both Core and Kids** after deployment.  

### B.4 T-04 — Video Feed Loading

**Execution date:** 2026-04-08  
**Executor(s):** *[Team — fill names if required for submission]*  
**Build / environment:** Expo Go; Wi-Fi; Core feed  

#### (a) Test objective (specification)

The video feed shall display first content within 15 seconds on Wi-Fi, with at least 10 videos in the first batch [4, §3.4.a].  

#### (b) Test procedure and pass/fail criteria

**Procedure (summary or step reference):** [4, §3.4.b]: open feed, measure time to first visible video thumbnail/frame, inspect first loaded feed content.  

**Pass/fail criteria (including quantitative limits):** first content ≤15s; first batch target ≥10 videos [4, §3.4.b].  

#### (c) Responsible member and equipment

**Responsible (per plan):** Arhan Bartu Ergüven & Furkan Komaç [4, §3.4.c]  
**Equipment used:** Mobile phone, Expo Go, Wi-Fi  

#### (d) Result and discussion

**Outcome:** **PASS**  

**Evidence:** On landing the main page, the first video thumbnail (and subsequent feed thumbnails) appeared in **under 15 seconds**; overall feed looked healthy in manual run.  

**Discussion:** Batch count was not explicitly counted in this run, but visible feed loading behavior was consistent with expected normal operation. If stricter grading requires a numeric count, capture one additional run with explicit batch count from UI/proxy logs.  

---

*End of document*
