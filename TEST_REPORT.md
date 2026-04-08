# Test Report Document

## Title Page
- Document Name: Test Report Document
- Team Number: [To be filled]
- Company Name: Scrollio
- Product Name: Scrollio - Micro-Learning Mobile Application
- Team Members: [To be filled]
- Date: April 2026
- Version: 1.0

## Table of Contents
1. Abstract
2. Introduction
3. Functional Specifications Under Test
4. List of Tests
5. Test Execution Records
6. Supporting Equipment, Assumptions, and Responsibility
7. Results and Discussion
8. Conclusion
9. References

## List of Figures/Tables
- Table 1: Functional Specifications and Test Mapping
- Table 2: Test Execution Status Summary
- Table 3: Detailed Test Case Records

## 1. Abstract
This report documents the test procedures and outcomes used to verify that the currently live Scrollio product meets selected functional specifications. The report is derived from `TEST_PLAN.md` and captures objective, procedure, pass/fail criteria, execution evidence, and observed outcomes for each test case.

## 2. Introduction
Scrollio is a React Native and Expo based micro-learning mobile application with authentication, onboarding, short-video feed interactions, profile modules, teacher lesson workflows, and playground modules. This report presents the execution of functional tests performed on the live scope for the conference demo version.

## 3. Functional Specifications Under Test
Table 1 maps each target functional requirement to its test case identifier.

| Spec ID | Functional Specification | Test Case |
|---|---|---|
| FS-01 | User can register, profile record is created, onboarding is reached, duplicate email is rejected | T-01 |
| FS-02 | User login with valid credentials and safe generic invalid-credential handling | T-02 |
| FS-03 | Onboarding requires minimum topic selection and persists preferences | T-03 |
| FS-04 | Feed loads within target time and batch size | T-04 |
| FS-05 | Like/bookmark actions update UI, feedback, and persistence | T-05 |
| FS-06 | Profile tabs show correct data and refresh | T-06 |
| FS-07 | Teacher reference upload constraints and playback verification | T-07 |
| FS-08 | Teacher AI lesson pipeline completion and persisted outputs | T-08 |
| FS-09 | Kids Space Repair game interaction and completion behavior | T-09 |
| FS-10 | Core Conquer the Class interaction and map ownership behavior | T-10 |
| FS-11 | Kids Know and Conquer state transitions and winner calculation | T-11 |

## 4. List of Tests
- T-01 User Registration
- T-02 User Login
- T-03 Onboarding - Interest and Difficulty Selection
- T-04 Video Feed Loading
- T-05 Video Like and Bookmark Actions
- T-06 Profile - Stats and Tabs
- T-07 Teacher - Reference Video Upload
- T-08 Teacher - Lesson Creation Pipeline
- T-09 Kids Playground - Space Repair
- T-10 Core Playground - Conquer the Class
- T-11 Kids Playground - Know and Conquer

## 5. Test Execution Records
Use one subsection per test. Keep this section updated after every executed test.

### T-01 - User Registration
- Specification Under Test: FS-01
- Objective: Verify successful registration, onboarding navigation, profile row creation, and duplicate-email rejection behavior.
- Procedure: See `TEST_PLAN.md` T-01.
- Pass/Fail Criteria: See `TEST_PLAN.md` T-01.
- Responsible: Arhan Bartu Erguven
- Equipment: Mobile phone or simulator, Supabase Dashboard
- Quantitative Metrics:
  - Time from register tap to onboarding screen: Observed within acceptable range (manual run)
- Result: **Pass**
- Evidence Collected:
  - Registration attempt with unique email: Successful
  - Supabase `profiles` verification: Row exists and maps correctly
  - Duplicate email attempt: Rejected with clear error
- Discussion: T-01 passed all acceptance checks in manual device testing. No code-side issue detected in the registration path.

### T-02 - User Login
- Specification Under Test: FS-02
- Objective: Verify successful authentication with valid credentials and generic error handling for invalid credentials without revealing account existence.
- Procedure: See `TEST_PLAN.md` T-02.
- Pass/Fail Criteria: See `TEST_PLAN.md` T-02.
- Responsible: Arhan Bartu Erguven
- Equipment: Mobile phone or simulator
- Quantitative Metrics:
  - Time from login tap to feed screen: Observed within acceptable range (manual run)
- Result: **Pass**
- Evidence Collected:
  - Valid credentials login: Successful, feed opened
  - Wrong password attempt: Rejected with generic invalid-credentials behavior
  - Non-existent email attempt: Same generic invalid-credentials behavior
- Discussion: T-02 passed in manual testing; authentication and error-message behavior aligned with requirements.

### T-03 - Onboarding - Interest and Difficulty Selection
- Specification Under Test: FS-03
- Objective: Verify onboarding enforces minimum topic selection and persists topic/difficulty preferences after completion.
- Procedure: See `TEST_PLAN.md` T-03.
- Pass/Fail Criteria: See `TEST_PLAN.md` T-03.
- Responsible: Arhan Bartu Erguven
- Equipment: Mobile phone or simulator, Supabase Dashboard
- Result: **Pass**
- Evidence Collected:
  - Continue remained disabled with fewer than 3 topics.
  - Continue became enabled at 3 selected topics and navigated to difficulty step.
  - Preferences were persisted after onboarding completion.
- Discussion: T-03 passed all required checks in manual testing.

### T-04 - Video Feed Loading
- Specification Under Test: FS-04
- Objective: Verify feed performance and content batch size meet defined thresholds on Wi-Fi.
- Procedure: See `TEST_PLAN.md` T-04.
- Pass/Fail Criteria: See `TEST_PLAN.md` T-04.
- Responsible: Arhan Bartu Erguven, Furkan Komac
- Equipment: Mobile phone or simulator
- Quantitative Metrics:
  - First content visible time (seconds): Within 15-second target (manual run)
  - First batch size: At least 10 videos (manual run)
- Result: **Pass**
- Evidence Collected:
  - First frame/thumbnail appeared within timing threshold.
  - First feed batch met minimum item count requirement.
- Discussion: T-04 passed with no loading or batch-size violation in manual testing.

### T-05 - Video Like and Bookmark Actions
- Specification Under Test: FS-05
- Objective: Verify like/bookmark actions trigger haptic, animate, update counts, and persist across navigation.
- Procedure: See `TEST_PLAN.md` T-05.
- Pass/Fail Criteria: See `TEST_PLAN.md` T-05.
- Responsible: Erkan Can Arslan
- Equipment: Mobile phone
- Result: **Pass (with corrective action)**
- Evidence Collected:
  - Like tap: icon animates, count increments, haptic fires, state persists after navigation.
  - Unlike tap: count decrements, icon returns to outline.
  - Bookmark tap: icon changes state, video appears in Profile Bookmarks tab.
- Discussion: Initial testing revealed a UI defect — the bottom gradient overlay (`LinearGradient`) in both core and kids `FeedVideoItem` was intercepting touch events, preventing bookmark/share/like buttons from responding. Root cause: the gradient `Animated.View` wrapper lacked `pointerEvents="none"`. Fix applied to `FeedVideoItem.tsx` and `KidsVideoItem.tsx`. After fix, all T-05 checks passed.

### T-06 - Profile - Stats and Tabs
- Specification Under Test: FS-06
- Objective: Verify profile identity is displayed and all three content tabs (Bookmarks, Likes, Watched) show the correct videos with working pull-to-refresh.
- Procedure: See `TEST_PLAN.md` T-06.
- Pass/Fail Criteria: See `TEST_PLAN.md` T-06.
- Responsible: Erkan Can Arslan
- Equipment: Mobile phone or simulator
- Result: **Pass**
- Evidence Collected:
  - Display name and avatar visible on profile screen.
  - Liked videos appeared correctly in the Likes tab.
  - Bookmarked video appeared correctly in the Bookmarks tab.
  - Watched video appeared correctly in the Watched tab.
  - Pull-to-refresh reloaded data on all tabs.
- Discussion: T-06 passed all acceptance checks in manual device testing.

### T-07 - Teacher - Reference Video Upload
- Specification Under Test: FS-07
- Objective: Verify teacher reference video upload completes successfully, is persisted with correct status, and the dashboard reflects the updated state.
- Procedure: See `TEST_PLAN.md` T-07.
- Pass/Fail Criteria: See `TEST_PLAN.md` T-07.
- Responsible: Artun Balta
- Equipment: Mobile phone or simulator, Supabase Dashboard, sample videos
- Result: **Pass (with corrective actions)**
- Evidence Collected:
  - Upload completes and success alert appears.
  - `teacher_profiles.reference_video_url` populated and `reference_video_status = 'ready'` in Supabase DB.
  - Dashboard correctly shows "Referans video hazır" after navigating back.
  - Oversized upload rejected with error alert.
- Discussion: Two defects identified and resolved during testing.
  - **Defect 1 (test-plan mismatch):** The test plan stated to verify the uploaded file in Supabase Storage. The actual implementation stores reference videos in BunnyCDN, not Supabase Storage. Correct verification is via the `teacher_profiles.reference_video_url` and `reference_video_status` columns in the Supabase database. Test plan and interview guide updated accordingly.
  - **Defect 2 (stale dashboard status):** After uploading a reference video and navigating back to the Teacher dashboard, the status badge still showed "Referans video yüklenmedi". Root cause: `TeacherDashboardScreen` fetched the teacher profile only on component mount (`useEffect([], [])`). Since the screen remained mounted in the navigation stack, the profile data was never refreshed after the upload. Fix applied: replaced `useEffect` with `useFocusEffect` (React Navigation) so the profile re-fetches every time the dashboard screen gains focus.

### T-08 - Teacher - Lesson Creation Pipeline
- Specification Under Test: FS-08
- Objective: Verify the 3-stage AI pipeline (LLM slide generation → TTS → lipsync) completes successfully and persists 3 slides with audioUrl and videoUrl in the database.
- Procedure: See `TEST_PLAN.md` T-08.
- Pass/Fail Criteria: See `TEST_PLAN.md` T-08.
- Responsible: Artun Balta
- Equipment: Mobile phone or simulator with Teacher account (reference video required), Supabase Dashboard, Wi-Fi
- Result: **Pass**
- Evidence Collected:
  - Pipeline completed through all three stages: slides → tts → lipsync.
  - Lesson status reached PUBLISHED (green badge in Derslerim).
  - Detail screen showed 3 slides each with "Video ready".
  - `teacher_lessons.slides_data` in Supabase confirmed 3 slide objects with populated `audioUrl` and `videoUrl`.
- Discussion: T-08 passed fully in manual testing. Two test plan inaccuracies noted and corrected: (1) `slides_data` lives in `teacher_lessons`, not the `videos` table as the test plan stated; (2) the fail criterion "fewer than 10 slides" is a typo — the backend hardcodes exactly 3 slides (`TEACHER_LESSON_SLIDE_COUNT = 3`). Both the interview guide and this report reflect the correct values.

### T-09 - Kids Playground - Space Repair
- Specification Under Test: FS-09
- Objective: Verify draggable answer blocks, immediate progress updates on correct placement, and victory screen on completion.
- Procedure: See `TEST_PLAN.md` T-09.
- Pass/Fail Criteria: See `TEST_PLAN.md` T-09.
- Responsible: Furkan Komac
- Equipment: Mobile phone or simulator
- Result: **Pass**
- Evidence Collected:
  - Answer blocks draggable without visual overlap.
  - Progress updated immediately upon correct block placement.
  - Victory screen ("Uzay Gemisi Tamir Edildi!") appeared on completion.
- Discussion: T-09 passed all acceptance checks in manual device testing.

### T-10 - Core Playground - Conquer the Class
- Specification Under Test: FS-10
- Objective: Verify the classroom desk game (seat ownership, emoji badges, glowing borders, haptic feedback) is accessible to core users and functions correctly.
- Procedure: See `TEST_PLAN.md` T-10.
- Pass/Fail Criteria: See `TEST_PLAN.md` T-10.
- Responsible: Furkan Komac
- Equipment: Mobile phone (haptic feedback requires physical device)
- Result: **Pass (with corrective actions)**
- Evidence Collected:
  - Glowing borders visible on valid selectable desks only.
  - Haptic pulse felt on desk tap.
  - Desk ownership updated immediately on correct answer with correct player colour badge.
- Discussion: The game `BilVeFethetClassroomGame` ("Bil ve Fethet: Sınıf") was fully implemented but never wired into the app. Four defects fixed before testing: (1) Not registered in `registryInit.ts` — imported and registered; (2) Missing `'core'` category in `definition.tsx` — added; (3) Not listed in `STANDALONE_GAMES` in `PlaygroundScreen.tsx` — added along with its rendering block using `ClassroomMenuScreen`; (4) Navigation routes `ClassroomLobby` and `ClassroomGame` absent from `AppNavigator.tsx` — both routes and screens added. After fixes, all T-10 acceptance checks passed in manual device testing.

### T-11 - Kids Playground - Know and Conquer
- Specification Under Test: FS-11
- Objective: Verify the game reducer correctly processes answer submissions, updates desk ownership only on correct answers, and accurately declares the winner at game end.
- Procedure: See `TEST_PLAN.md` T-11.
- Pass/Fail Criteria: See `TEST_PLAN.md` T-11.
- Responsible: Furkan Komac
- Equipment: Mobile phone or simulator
- Result: **Pass**
- Evidence Collected:
  - Claiming phase: each tapped desk immediately showed the correct player badge.
  - Attack phase (correct answer): desk ownership transferred to attacking player.
  - Attack phase (incorrect answer): desk ownership did not change.
  - Game-over screen appeared with correct trophy/skull icon and accurate winner declaration.
- Discussion: T-11 passed all acceptance checks in manual device testing. The reducer-driven state machine handled all transitions without crash or freeze.

## 6. Supporting Equipment, Assumptions, and Responsibility
- Devices: iOS/Android physical phone and/or simulator
- Network: Stable Wi-Fi for feed and generation pipelines
- Services: Supabase project access with dashboard permissions
- Accounts: Learner, Teacher, and Kid test accounts
- Assumptions:
  - Environment variables are correctly configured
  - Backend and Supabase services are reachable
  - Test data permissions are valid for each role

## 7. Results and Discussion
Table 2 should be updated as tests are executed.

| Test ID | Status | Key Notes |
|---|---|---|
| T-01 | Pass | Registration, profile creation, and duplicate rejection verified |
| T-02 | Pass | Valid login and generic invalid-credential handling verified |
| T-03 | Pass | Minimum topic gate and preference persistence verified |
| T-04 | Pass | Feed load time and first batch size criteria met |
| T-05 | Pass | Gradient touch-blocking fix applied; like/bookmark/share verified |
| T-06 | Pass | Profile identity, all three tabs, and pull-to-refresh verified |
| T-07 | Pass (with corrective actions) | BunnyCDN storage path clarified; dashboard stale-fetch bug fixed with useFocusEffect |
| T-08 | Pass | 3-stage pipeline completed; 3 slides with audioUrl and videoUrl verified |
| T-09 | Pass | Drag mechanics, progress update, and victory screen verified |
| T-10 | Pass (with corrective actions) | Four wiring defects fixed; glowing borders, haptic, and ownership update verified |
| T-11 | Pass | Reducer state transitions, ownership logic, and winner declaration verified |

Discussion entries should explain root cause for failures, constraints, and any corrective action taken.

## 8. Conclusion
All 11 functional test cases defined in the test plan were executed on a physical iOS device running the Scrollio application via Expo Go, connected over Wi-Fi. The test execution covered the complete live feature scope: authentication, onboarding, video feed, user interactions, profile, teacher lesson management, and playground games.

**Summary of results:**

| Result | Count | Tests |
|---|---|---|
| Pass | 9 | T-01, T-02, T-03, T-04, T-06, T-08, T-09, T-10, T-11 |
| Pass (with corrective action) | 2 | T-05, T-07 |
| Fail | 0 | — |

All 11 tests passed. Three defect categories were identified and resolved during the test cycle:

1. **Touch interception (T-05):** A gradient overlay was blocking like/bookmark button taps in `FeedVideoItem.tsx` and `KidsVideoItem.tsx`. Fixed by adding `pointerEvents="none"` to the overlay wrapper.
2. **Stale dashboard fetch (T-07):** `TeacherDashboardScreen` used `useEffect` with an empty dependency array, causing the profile status badge to remain stale after a reference video upload. Fixed by replacing with `useFocusEffect` so the profile re-fetches on every screen focus.
3. **Game wiring (T-10):** The "Bil ve Fethet: Sınıf" classroom game was fully implemented but not connected to the app — missing registry entry, category, `STANDALONE_GAMES` entry, and navigation routes. All four wiring defects were corrected.

The Scrollio application is in a stable, demo-ready state across all tested functional specifications. No open failures remain.

## 9. References
1. `TEST_PLAN.md`
2. Scrollio PRD (team internal document)
3. `brain/00-core/PROJECT_OVERVIEW.md`
4. `brain/00-core/TECH_STACK.md`
5. `brain/01-architecture/database-schema.md`
6. `AGENT_GUIDE.md`
7. Supabase RLS documentation: https://supabase.com/docs/guides/auth/row-level-security
8. React Native Testing Library docs: https://callstack.github.io/react-native-testing-library/
9. Expo AV docs: https://docs.expo.dev/versions/latest/sdk/av/
