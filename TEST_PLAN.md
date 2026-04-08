# Test Plan Document

## Scrollio — Micro-Learning Mobile Application

Document Version: 1.
Date: April 2026
Prepared by: Scrollio Product Development Team
Project: GE402 — Scrollio Micro-Learning Mobile App

## Abstract

This document describes the test plan for the Scrollio mobile application, a TikTok-style
micro-learning platform built with React Native and Expo targeting iOS and Android.
The purpose of this document is to define test methods and procedures that verify Scrollio
meets some of the functional specifications and performance requirements defined in the
Product Requirements Document (PRD). This document covers only features currently
live in the application in the Readers Conference. Tests are organized around the active
functional modules: authentication, onboarding, video feed, user interactions, profile, and
teacher lesson management.

## 1. Introduction

1.1 Product Description
Scrollio is a mobile application that transforms passive scrolling time into measurable
learning progress. The app delivers personalized 20-second educational videos in a TikTok-
style vertical feed. The currently live version includes a standard learner feed with social
features (likes, bookmarks) and a Teacher module for AI-generated lesson creation.
The application is built on the following technology stack:

- Frontend: React Native 0.74+, Expo SDK 51+, TypeScript 5.3+
- Backend: Supabase (PostgreSQL 15+, Auth, Realtime, Storage)
- Video Storage & CDN: AWS S3 + BunnyCDN,
- AI Services: OpenAI GPT-4 (content), ElevenLabs (voice synthesis)

1.2 Purpose of This Document
This Test Plan is derived from the Product Technical Specifications and addresses all
functional specifications of the currently live Scrollio application. For each test case, the
document specifies:

- The specification or requirement being tested (test objective)
- The test procedure and pass/fail criteria with quantitative limits
- The responsible team member and required test equipment


1.3 Scope
This document covers only features that are currently deployed and live. Features not
yet released (such as a standalone quiz system for the standard feed, XP/level tracking,
and leaderboards) are excluded. All tests are designed to be performed in a standard lab
environment using a computer and a mobile phone.

## 2. List of Tests

```
# Test Name Module
T-01 User Registration Authentication
T-02 User Login Authentication
T-03 Onboarding – Interest & Difficulty Selection Onboarding
T-04 Video Feed Loading Video Feed
T-05 Video Like & Bookmark Actions User Interactions
T-06 Profile – Stats and Tabs Profile
T-07 Teacher – Reference Video Upload Teacher Module
T-08 Teacher – Lesson Creation Pipeline Teacher Module
T-09 Kids Playground – Space Repair Playground
T-10 Core Playground – Conquer the Class Playground
T-11 Kids Playground – Know and Conquer Playground
```
## 3. Test Cases

T-01 — User Registration
3.1.a Test Objective (Specification)
The system shall allow new users to register with a valid email address and password.
Upon successful registration, a profiles record shall be created in the database and the
user shall be navigated to the onboarding screen. Duplicate email registration shall be
rejected with a clear error message.
3.1.b Test Procedure & Pass/Fail Criteria
Procedure:

1. Open the Scrollio app on an iOS or Android device/simulator.
2. Tap “Create Account” on the landing screen.
3. Enter a unique valid email and a password of 8+ characters.
4. Tap the Register button and record time until the next screen appears.
5. Verify a profiles row was created in Supabase with the correct user_id.
    Pass Criteria:
    - Valid registration: User is navigated to the onboarding screen.


- A profiles row with the correct user_id and email exists in Supabase.
Fail Criteria:
- Navigation doesn’t happen.
- No profiles row is created after successful registration.
3.1.c Responsible Team Member & Equipment
- Responsible: Arhan Bartu Ergüven
- Equipment: Mobile phone or simulator, Supabase Dashboard (browser)

T-02 — User Login
3.2.a Test Objective (Specification)
The system shall authenticate registered users using email and password, returning a valid
session and navigating to the main feed. Failed login attempts shall display a generic error
message that does not reveal whether the email or password is incorrect.
3.2.b Test Procedure & Pass/Fail Criteria
Procedure:

1. Navigate to the Sign In screen.
2. Enter valid credentials and tap Login. Record time from tap to feed screen.
3. Enter a correct email with a wrong password and tap Login.
4. Enter a non-existent email and tap Login.
    Pass Criteria:
    - Valid credentials: Feed screen loads.
    - Wrong password: Generic error (“Invalid email or password”) appears; no naviga-
       tion.
    - Non-existent email: Same generic error message appears.
    Fail Criteria:
    - Login fails.
    - Error messages reveal whether the email exists.
    3.2.c Responsible Team Member & Equipment
- Responsible: Arhan Bartu Ergüven
- Equipment: Mobile phone or simulator


T-03 — Onboarding: Interest & Difficulty Selection
3.3.a Test Objective (Specification)
After registration, users shall select a username and a minimum of 3 topics of interest
from the onboarding screen before proceeding. Users shall also select a preferred difficulty
level. Selections shall be persisted to profiles.preferences in the database.
3.3.b Test Procedure & Pass/Fail Criteria
Procedure:

1. Complete registration to reach the OnboardingInterests screen.
2. Attempt to tap “Continue” without selecting any topics.
3. Select exactly 2 topics and attempt to continue.
4. Select 3 topics and tap “Continue”.
5. On the difficulty screen, select a difficulty level and complete onboarding.
6. Query profiles.preferences in Supabase to verify saved selections.
    Pass Criteria:
    - With fewer than 3 topics selected: Continue button is disabled; counter shows “X
       / 3 min”.
    - With 3 topics: Continue button is active; navigation to the difficulty screen pro-
       ceeds.
    - After completing onboarding: profiles.preferences contains the selected topic
       IDs and difficulty level.
    Fail Criteria:
    - User can proceed with fewer than 3 topics.
    - profiles.preferences is not updated after onboarding.
    3.3.c Responsible Team Member & Equipment
- Responsible: Arhan Bartu Ergüven
- Equipment: Mobile phone or simulator, Supabase Dashboard (browser)

T-04 — Video Feed Loading
3.4.a Test Objective (Specification)
The video feed shall load and display the first video within 15 seconds on a Wi-Fi con-
nection. The feed shall return at least 10 videos per batch.
3.4.b Test Procedure & Pass/Fail Criteria
Procedure:

1. Log in and navigate to the main Feed screen. Start a timer when the Feed screen
    receives focus.


2. Stop the timer when the first video thumbnail/frame is visible on screen.
3. Scroll through the feed and count total videos in the first batch.
    Pass Criteria:
    - First video visible within 15 seconds on Wi-Fi.
    - First batch contains ≥10 videos.
    Fail Criteria:
    - Feed takes longer than 15 seconds to show first content.
    - Fewer than 10 videos returned in the first batch.
    3.4.c Responsible Team Member & Equipment
- Responsible: Arhan Bartu Ergüven & Furkan Komaç
- Equipment: Mobile phone or simulator

T-05 — Video Like & Bookmark Actions
3.5.a Test Objective (Specification)
Users shall be able to like and bookmark any video from the feed using the right-side
action buttons. Both actions shall trigger haptic feedback, animate the icon, and persist
the state to the database. The updated like/bookmark count shall be reflected in the UI
immediately.
3.5.b Test Procedure & Pass/Fail Criteria
Procedure:

1. Open the feed and navigate to a video.
2. Record the current like count displayed on screen. Tap the like button.
3. Verify the like icon animates, the count increments by 1, and haptic feedback is
    felt.
4. Navigate away and return to the same video; verify the like state is preserved (icon
    remains filled).
5. Tap the bookmark button. Verify the bookmark icon animates and turns filled.
6. Navigate to the Profile screen → Bookmarks tab. Verify the bookmarked video
    appears there.
7. Tap the like button again to unlike. Verify count decrements and icon returns to
    outline state.
Pass Criteria:
- Like action: icon bounces, count increments, haptic fires, state persists after navi-
gation.


- Unlike action: count decrements, icon returns to outline.
- Bookmark action: icon changes state, video appears in Profile → Bookmarks tab.
Fail Criteria:
- Like count does not update immediately.
- Like/bookmark state resets after navigating away.
- Bookmarked video does not appear in the profile Bookmarks tab.
3.5.c Responsible Team Member & Equipment
- Responsible: Erkan Can Arslan
- Equipment: Mobile phone (haptic feedback requires a physical device)

T-06 — Profile: Stats and Tabs
3.6.a Test Objective (Specification)
The Profile screen shall display the user’s display name, avatar, and three content tabs:
Bookmarks, Liked Videos, and Watched Videos. Each tab shall load and display the
corresponding video grid with the correct videos from the database.
3.6.b Test Procedure & Pass/Fail Criteria
Procedure:

1. Log in and navigate to the Profile screen.
2. Verify the display name and avatar are shown.
3. Like 2 videos in the feed. Navigate to Profile → Liked tab.
4. Bookmark 1 video. Navigate to Profile → Bookmarks tab.
5. Watch 1 video to completion. Navigate to Profile → Watched tab.
6. Pull down to refresh on each tab and verify the data reloads.
    Pass Criteria:
    - Display name and avatar visible on profile.
    - All 2 liked videos appear in the Liked tab.
    - The bookmarked video appears in the Bookmarks tab.
    - The completed video appears in the Watched tab.
    - Pull-to-refresh updates the list.
    Fail Criteria:
    - Any tab shows incorrect or empty data after performing the corresponding action.
    - Pull-to-refresh does not reload data.


```
3.6.c Responsible Team Member & Equipment
```
- Responsible: Erkan Can Arslan
- Equipment: Mobile phone or simulator

T-07 — Teacher: Reference Video Upload
3.7.a Test Objective (Specification)
Teacher accounts shall be able to upload a reference video (MP4/MOV/WebM, maximum
500 MB) from the Teacher Reference Video screen. The uploaded file shall be stored in the
reference-videos Supabase Storage bucket at the path {userId}/{timestamp}.{ext}.
A signed URL for the uploaded video shall be retrievable and playable in the app.
3.7.b Test Procedure & Pass/Fail Criteria
Procedure:

1. Log in as a Teacher account and navigate to the Reference Video screen.
2. Select an MP4 video file under 500 MB and tap Upload. Wait for confirmation.
3. In the Supabase Dashboard→ Storage, verify the file appears at reference-videos/{userId}/.
4. Verify the uploaded video plays back correctly in the app using the signed URL.
5. Attempt to upload a file over 500 MB. Verify an error message is shown.
    Pass Criteria:
    - File under 500 MB: Upload completes; file appears at the correct path in Supabase
       Storage.
    - Signed URL is generated and the video plays back correctly.
    - File over 500 MB: Upload is rejected with an error message.
    Fail Criteria:
    - File does not appear in Supabase Storage after upload.
    - Signed URL is invalid or video does not play.
    - File size validation is not enforced.
    3.7.c Responsible Team Member & Equipment
- Responsible: Artun Balta
- Equipment: Mobile phone or simulator with a Teacher account, Supabase Dashboard
(browser), video files of varied sizes


T-08 — Teacher: Lesson Creation Pipeline
3.8.a Test Objective (Specification)
Teachers shall be able to create a lesson by filling in subject, grade, topic, description, and
tone. The system shall run a 3-stage AI generation pipeline (slide generation via LLM→
TTS audio per slide → lipsync video per slide) and save the result to the videos table
with status = ’published’ and a populated slides_data JSONB field containing 3
slides, each with a videoUrl.
3.8.b Test Procedure & Pass/Fail Criteria
Procedure:

1. Log in as a Teacher who has an uploaded reference video.
2. Navigate to Create Lesson and fill in all required fields (subject, grade, topic, de-
    scription, tone).
3. Submit the form and observe the progress indicator.
4. Wait for the pipeline to complete. Verify the lesson appears in the Teacher’s lesson
    list with status “Published”.
5. Open the lesson and verify the slide player shows 3 slides, each with a lipsync video
    playing.
6. In the Supabase Dashboard, verify the videos row has status = ’published’ and
    slides_data.slides contains 3 elements each with a non-empty videoUrl.
Pass Criteria:
- Pipeline completes without error.
- Lesson appears in the lesson list with status = ’published’.
- Slide player shows exactly 3 slides; each slide’s lipsync video plays.
- slides_data in Supabase contains 3 slide objects each with non-empty audioUrl
and videoUrl.
Fail Criteria:
- Pipeline fails or sets status = ’failed’.
- Fewer than 10 slides are generated.
- Any slide is missing audioUrl or videoUrl.
- Lesson does not appear in the teacher’s list after completion.
3.8.c Responsible Team Member & Equipment
- Responsible: Artun Balta
- Equipment: Mobile phone or simulator with a Teacher account, Supabase Dashboard
(browser), Wi-Fi internet connection


T-09 — Kids Playground: Space Repair
3.9.a Test Objective (Specification)
The system shall allow young users to play the Space Repair mini-game. The game
must display a grid of draggable answer blocks, correctly validate answers to repair the
spaceship, and display a victory condition upon completing all required repairs.
3.9.b Test Procedure & Pass/Fail Criteria
Procedure:

1. Log in and navigate to the Kids Playground section.
2. Launch the “Space Repair” game.
3. Drag a correct answer block to the designated target area.
4. Verify visual feedback is shown, and the progress/score updates instantly.
5. Complete all required repairs and verify the victory sequence triggers.
    Pass Criteria:
    - Draggable blocks function properly without visual overlap.
    - Progress updates instantly upon dropping a correct answer.
    - Victory screen appears upon game completion.
    Fail Criteria:
    - Blocks cannot be dragged or overlap visually.
    - Score/progress does not update correctly.
    - The game does not conclude properly.
    3.9.c Responsible Team Member & Equipment
- Responsible: Furkan Komaç
- Equipment: Mobile phone or simulator

T-10 — Core Playground: Conquer the Class
3.10.a Test Objective (Specification)
Standard users shall be able to play the “Conquer the Class” (Sınıfı Fethet) strategy
game. The map UI must clearly distinguish desk ownership using floating emoji badges,
display glowing borders for selectable desks, and respond with haptic feedback upon desk
interaction.
3.10.b Test Procedure & Pass/Fail Criteria
Procedure:

1. Log in and navigate to the standard (Core) Playground section.
2. Launch the “Conquer the Class” game.


3. Verify that selectable desks feature a glowing border.
4. Tap a highlighted desk to attack/defend and verify haptic feedback triggers.
5. Submit a perfectly correct answer and verify the desk ownership instantly updates
    on the map with the player’s emoji badge.
Pass Criteria:
- Glowing borders appear on valid choices.
- Haptic feedback fires on tap.
- Desk ownership updates accurately with emoji badges upon a perfect answer.
Fail Criteria:
- Game map lacks clear ownership indicators.
- Haptic feedback is missing.
- Empty submissions or incorrect distance calculations result in unintended wins.
3.10.c Responsible Team Member & Equipment
- Responsible: Furkan Komaç
- Equipment: Mobile phone (haptic feedback requires a physical device)

T-11 — Kids Playground: Know and Conquer
3.11.a Test Objective (Specification)
The system shall allow kids to play the “Know and Conquer” (Bil ve Fethet) game. The
game state reducer must correctly process answer submissions, update territory control
based on closest/correct answers, and accurately determine the winner at the end of the
match.
3.11.b Test Procedure & Pass/Fail Criteria
Procedure:

1. Log in with a kid-profile account and navigate to the Kids Playground.
2. Launch the “Know and Conquer” game.
3. Answer a territory question. Verify the UI and game state properly allocate the
    territory to the player with the correct or closest answer.
4. Continue playing until all territories on the map are claimed.
5. Verify the end-game state accurately calculates the total score/territories and de-
    clares the correct winner.
Pass Criteria:
- Game reducer accurately processes states (answer validation, territory allocation).
- Territory graphics update immediately upon claiming.


- Final screen displays the correct winner based on territory count.
Fail Criteria:
- Incorrect territory allocation.
- Game crashes or freezes during state transitions.
- Final score or winner is miscalculated.
3.11.c Responsible Team Member & Equipment
- Responsible: Furkan Komaç
- Equipment: Mobile phone or simulator

## 4. References

1. Scrollio Product Requirements Document (PRD) — Final Product Requirements
    Document (PRD): Scrollio.docx, Scrollio Team, 2025.
2. Scrollio Project Overview — brain/00-core/PROJECT_OVERVIEW.md, December
    2025.
3. Scrollio Technology Stack — brain/00-core/TECH_STACK.md, December 2025.
4. Scrollio Database Schema — brain/01-architecture/database-schema.md, De-
    cember 2025.
5. AI Video Lesson Module Agent Guide — AGENT_GUIDE.md, Scrollio Team, 2025.
6. Supabase Row Level Security Documentation — [https://supabase.com/docs/
    guides/auth/row-level-security](https://supabase.com/docs/guides/auth/
    row-level-security)
7. React Native Testing Library — [https://callstack.github.io/react-native-testing-library/
    ](https://callstack.github.io/react-native-testing-library/)
8. Expo AV Documentation — [https://docs.expo.dev/versions/latest/sdk/
    av/](https://docs.expo.dev/versions/latest/sdk/av/)

```
End of Document
```

