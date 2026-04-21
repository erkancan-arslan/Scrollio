# Test Interview Guide

## Scrollio — Micro-Learning Mobile Application
Document Version: 1.0 | Date: April 2026 | Prepared by: Scrollio Product Development Team

---

## Purpose
This document is to be used during the Traders' Conference interview. For each functional requirement, it states what specification is being verified, gives the exact test procedure with real app UI labels, and defines clear pass/fail criteria. The tester should read the expected result aloud before each action, then record the verdict.

---

## Interview Flow
1. State the functional requirement (Specification) being demonstrated.
2. Walk through the procedure step by step on the device.
3. State what you expect to happen before each action.
4. Record the verdict (Pass / Fail) against each criterion.

---

## T-01 — User Registration

**Specification:** The system shall allow new users to register with a valid email and password. A `profiles` record shall be created in the database and the user shall be navigated to the onboarding screen. Duplicate email registration shall be rejected with a clear error message.

**Equipment:** Physical phone or simulator, Supabase Dashboard (browser)

**Procedure:**
1. Open the Scrollio app. The landing screen appears.
2. Tap **Sign Up** (or the Sign Up tab on the auth card).
3. Fill in Full Name, Email (use a unique address), Password, and Confirm Password. Password must be 8+ characters with upper/lowercase and a number.
4. Tap **Create Account**. Start a mental timer.
5. Verify you are taken to the onboarding screen ("What's your name?").
6. Open Supabase Dashboard → Table Editor → `profiles`. Verify a row exists for the new user with the correct `user_id`.
7. Go back to the app and attempt to register again with the same email.
8. Verify an error message is displayed and registration is blocked.

**Pass Criteria:**
- User is navigated to the onboarding screen after successful registration.
- A `profiles` row with the correct `user_id` and email exists in Supabase.
- Registering with a duplicate email is rejected with a visible error message.

**Fail Criteria:**
- Onboarding screen does not appear.
- No `profiles` row is found in Supabase.
- Duplicate email is accepted silently.

**Latest Outcome: Pass**

---

## T-02 — User Login

**Specification:** The system shall authenticate registered users using email and password and navigate to the main feed. Failed attempts shall show a generic error message that does not reveal whether the email or password is incorrect.

**Equipment:** Physical phone or simulator

**Procedure:**
1. From the landing screen tap **Sign In**.
2. Enter valid email and password. Tap **Sign In**. Start a mental timer.
3. Verify the main feed (Home tab) opens.
4. Go back to Sign In. Enter the correct email but a wrong password. Tap **Sign In**.
5. Verify an error message appears and navigation does not happen.
6. Enter a non-existent email with any password. Tap **Sign In**.
7. Verify the same generic error appears and navigation does not happen.

**Pass Criteria:**
- Valid credentials → feed opens.
- Wrong password → generic error shown, no navigation.
- Non-existent email → same generic error shown, no navigation.
- Neither error message reveals whether the email exists.

**Fail Criteria:**
- Login fails for valid credentials.
- Error messages differ between "wrong password" and "no account" cases.

**Latest Outcome: Pass**

---

## T-03 — Onboarding: Interest & Difficulty Selection

**Specification:** After registration, the user shall select a minimum of 3 topics of interest before proceeding. They shall also select a difficulty level per topic. Selections shall be persisted to `profiles.preferences` in the database.

**Equipment:** Physical phone or simulator, Supabase Dashboard (browser)

**Procedure:**
1. Complete registration (T-01) to reach the onboarding interests screen ("What interests you?").
2. Tap **Next →** without selecting any topics. Verify the button is disabled (greyed out, not tappable).
3. Select exactly 2 topics. Verify the counter shows "2 selected / 3 min" and the button is still disabled.
4. Select a 3rd topic. Verify the counter shows "3 selected ✓" and the **Next →** button becomes active.
5. Tap **Next →**. Verify navigation to the difficulty screen ("Your level per topic").
6. For each topic shown, select a difficulty level (Beginner / Intermediate / Advanced).
7. Tap **Finish & Explore 🎉**. Verify the main app (Home tab) opens.
8. In Supabase Dashboard → `profiles` → `preferences` column for this user. Verify it contains the selected topic IDs and difficulty mapping.

**Pass Criteria:**
- Continue button is disabled with fewer than 3 topics selected.
- Counter displays "X selected / 3 min" when below minimum.
- With 3+ topics selected, button becomes active and navigates to the difficulty screen.
- After finishing, `profiles.preferences` contains the selected topic IDs and difficulty levels.

**Fail Criteria:**
- User can proceed with fewer than 3 topics.
- `profiles.preferences` is empty or missing after onboarding completion.

**Latest Outcome: Pass**

---

## T-04 — Video Feed Loading

**Specification:** The video feed shall load and display the first video within 15 seconds on a Wi-Fi connection. The feed shall return at least 10 videos per batch.

**Equipment:** Physical phone or simulator, stable Wi-Fi connection

**Procedure:**
1. Ensure the device is connected to Wi-Fi.
2. Log in and wait for the app to navigate to the **Home** tab.
3. Start a timer the moment the Home tab screen receives focus.
4. Stop the timer when the first video thumbnail or frame is visible on screen.
5. Scroll down through the feed and count the total number of video cards loaded in the first batch.

**Pass Criteria:**
- First video is visible within 15 seconds.
- First batch contains at least 10 videos.

**Fail Criteria:**
- Feed takes longer than 15 seconds to show any content.
- Fewer than 10 videos are available in the first scroll batch.

**Latest Outcome: Pass**

---

## T-05 — Video Like & Bookmark Actions

**Specification:** Users shall be able to like and bookmark any video from the feed. Both actions shall trigger haptic feedback, animate the icon, and persist the state to the database. Updated counts shall be reflected immediately in the UI.

**Equipment:** Physical phone (haptic feedback requires physical device)

**Procedure:**
1. Open the **Home** tab and navigate to any video.
2. Note the current like count shown on the right-side action buttons.
3. Tap the **heart (like) button**.
4. Verify: the heart icon animates/bounces, the count increments by 1, and a haptic pulse is felt.
5. Navigate away from the feed (e.g. switch to Profile tab) then come back to the same video.
6. Verify the heart icon is still filled (liked state is preserved).
7. Tap the **bookmark button**.
8. Verify the bookmark icon changes to filled state.
9. Tap the **Profile** tab at the bottom. Tap the **Bookmarks** tab on the profile screen. Verify the bookmarked video appears in the grid.
10. Go back to the feed and tap the heart again to unlike.
11. Verify the count decrements by 1 and the icon returns to outline state.

**Pass Criteria:**
- Like: icon animates, count increments by 1, haptic fires.
- Like state persists after navigating away and returning.
- Unlike: count decrements, icon returns to outline.
- Bookmark: icon changes to filled; video appears under Profile → Bookmarks tab.

**Fail Criteria:**
- Like count does not update immediately.
- Like or bookmark state resets after navigating away.
- Bookmarked video does not appear in the Bookmarks tab.
- No haptic feedback.

**Latest Outcome: Pass**

---

## T-06 — Profile: Stats and Tabs — **Latest Outcome: Pass**

**Specification:** The Profile screen shall display the user's display name and avatar, and three content tabs (Bookmarks, Likes, Watched) each showing the correct videos. Pull-to-refresh shall reload data on each tab.

**Equipment:** Physical phone or simulator

**Procedure:**
1. Log in and tap the **Profile** tab in the bottom navigation bar.
2. Verify the display name and avatar are shown at the top.
3. Go to the **Home** tab and like 2 different videos.
4. Return to **Profile** and tap the **Likes** tab. Verify both liked videos appear.
5. Go back to the feed and bookmark 1 video.
6. Return to **Profile** and tap the **Bookmarks** tab. Verify the bookmarked video appears.
7. Go back to the feed and watch 1 video to completion (let it play to the end).
8. Return to **Profile** and tap the **Watched** tab. Verify the watched video appears.
9. On each tab, pull down (swipe down from top of the list) to trigger a refresh. Verify the list reloads without errors.

**Pass Criteria:**
- Display name and avatar visible on the profile.
- All liked videos appear in the **Likes** tab.
- Bookmarked video appears in the **Bookmarks** tab.
- Watched video appears in the **Watched** tab.
- Pull-to-refresh reloads each tab successfully.

**Fail Criteria:**
- Any tab is empty after performing the corresponding action.
- Pull-to-refresh does not reload data or causes an error.

---

## T-07 — Teacher: Reference Video Upload — **Latest Outcome: Pass (with corrective actions)**

**Specification:** Teacher accounts shall be able to upload a reference video (MP4/MOV/WebM, max 500 MB). The file shall be stored in the `reference-videos` Supabase Storage bucket at `{userId}/{timestamp}.{ext}`. A signed URL shall be retrievable and the video shall play back in the app.

**Equipment:** Physical phone or simulator with a Teacher account, Supabase Dashboard, video files of varied sizes

**Procedure:**
1. Log in with a Teacher account. The Teacher dashboard opens.
2. Tap **Referans Video** on the dashboard.
3. On the Reference Video screen, tap **Video Yükle**.
4. Select a valid MP4 video under 500 MB from device storage.
5. Wait for the upload to complete. Verify a success alert ("Başarılı") is shown.
6. In Supabase Dashboard → Table Editor → `teacher_profiles`. Find the row for this teacher and verify the `reference_video_url` field is populated with a URL and `reference_video_status` is `ready`. (Note: the file is stored in BunnyCDN, not Supabase Storage — verify via the database column, not the Storage tab.)
7. Back in the app, verify the screen now shows "Mevcut video:" with a URL.
8. Navigate back to the Teacher dashboard. Verify the status badge now says "Referans video hazır" (reference video ready).
9. Now attempt to upload a file larger than 500 MB. Verify an error alert is shown and the upload is rejected.

**Pass Criteria:**
- File under 500 MB: upload completes with success alert; `teacher_profiles.reference_video_url` is populated and `reference_video_status = 'ready'` in Supabase DB.
- App shows "Mevcut video:" URL after upload.
- Navigating back to the Teacher dashboard shows "Referans video hazır".
- File over 500 MB: upload is rejected with an error message.

**Fail Criteria:**
- `reference_video_url` is empty or `reference_video_status` is not `ready` after upload.
- Dashboard still shows "Referans video yüklenmedi" after navigating back post-upload.
- Oversized file is accepted without error.

---

## T-08 — Teacher: Lesson Creation Pipeline — **Latest Outcome: Pass**

**Specification:** Teachers shall be able to create a lesson by filling in title, topic, description, subject, grade, tone, and language. The system shall run a 3-stage AI generation pipeline (slide generation via LLM → TTS audio per slide → lipsync video per slide) and save the result with `status = 'published'` and a `slides_data` field containing 3 slides each with an `audioUrl` and `videoUrl`.

**Equipment:** Physical phone or simulator with Teacher account that has an uploaded reference video (T-07 must pass first), Supabase Dashboard, stable Wi-Fi

**Procedure:**
1. Log in as a Teacher. Verify the dashboard shows **"Referans video hazır"** (reference video is ready). If it says "Referans video yüklenmedi", complete T-07 first.
2. Tap **Ders Oluştur** on the dashboard.
3. Fill in the required fields:
   - **Başlık** (Title) — required, e.g. "Kesirlerde Toplama"
   - **Konu** (Topic) — required, e.g. "Payda eşitleme"
   - **Açıklama** (Description) — optional
   - **Branş** (Subject) — optional, e.g. "Matematik"
   - **Sınıf** (Grade) — optional, e.g. "5"
   - Select a **Ton** chip: friendly / formal / energetic
   - Select a **Dil** chip: tr / en
   - Select a **Zorluk** chip: easy / medium / hard
4. Tap **Oluştur & Başlat**. A success alert appears and navigation moves to **Derslerim** (lesson list).
5. Find your new lesson in the list with an orange **PROCESSING** badge. Tap it to open the detail screen.
6. The detail screen auto-refreshes every 5 seconds. Watch the step label ("slides" → "tts" → "lipsync" → "done") and the progress bar advance to 100%.
7. When the status badge turns green and reads **PUBLISHED**, scroll down to the **Slaytlar** section.
8. Verify it shows **3 slides** numbered #1, #2, #3. Each slide card should show "Video ready" below its content.
9. In Supabase Dashboard → Table Editor → **`teacher_lessons`** table. Find the row for this lesson. Verify `status = 'published'` and the `slides_data` JSONB column contains 3 objects each with a non-empty `audioUrl` and `videoUrl`.

**Pass Criteria:**
- Pipeline completes without error; status reaches **PUBLISHED**.
- Lesson appears in **Derslerim** with a green PUBLISHED badge.
- Detail screen shows exactly 3 slides, each displaying "Video ready".
- `teacher_lessons.slides_data` in Supabase contains 3 slide objects each with non-empty `audioUrl` and `videoUrl`.

**Fail Criteria:**
- Status becomes FAILED or pipeline does not progress.
- Fewer than 3 slides are generated.
- Any slide is missing "Video ready" (i.e. `videoUrl` is empty).
- Lesson does not appear in Derslerim after submission.

**Note:** The pipeline typically takes 3–8 minutes on a good Wi-Fi connection. Keep the detail screen open and let it auto-refresh.

---

## T-09 — Kids Playground: Space Repair (Uzay Gemisi Tamiri) — **Latest Outcome: Pass**

**Specification:** The system shall allow kids to play the Space Repair mini-game. The game must display draggable answer blocks, correctly validate answers to repair the spaceship, and display a victory screen upon completing all repairs.

**Equipment:** Physical phone or simulator (logged in to Kids section)

**Procedure:**
1. From the landing screen enter the **Scrollio Kids** path and log in with a kids account.
2. Tap the **Playground** tab in the bottom navigation bar.
3. Tap the **Uzay Gemisi Tamiri** game card, then tap **Oyna**.
4. The game screen opens showing the spaceship panel with broken parts and a set of answer blocks.
5. Drag a correct answer block to its matching target slot on the spaceship panel.
6. Verify: the block snaps into place, visual feedback is shown (the part is "repaired"), and the progress/score updates immediately.
7. Continue dragging correct blocks to remaining slots until all repairs are complete.
8. Verify the victory screen appears ("Uzay Gemisi Tamir Edildi!").

**Pass Criteria:**
- Answer blocks are draggable and do not visually overlap each other.
- Score/progress updates immediately when a correct block is placed.
- Victory screen appears when all repairs are complete.

**Fail Criteria:**
- Blocks cannot be dragged or visually overlap incorrectly.
- Score or progress does not update after a correct answer.
- Game does not reach a victory state after all repairs.

---

## T-10 — Core Playground: Bil ve Fethet: Sınıf (Conquer the Class — Multiplayer) — **Latest Outcome: Pass (with corrective actions)**

**Specification:** Standard (Core) users shall be able to access "Bil ve Fethet: Sınıf" from the Core Playground and start a multiplayer classroom game. The map must distinguish desk ownership using floating emoji badges, display glowing borders for selectable desks, and respond with haptic feedback on desk interaction.

**Equipment:** Physical phone (haptic feedback requires physical device), at least one other device or player to test room joining

**Procedure:**
1. Log in with a standard (Core) learner account.
2. Tap the **Playground** tab in the bottom navigation bar.
3. Tap the **Bil ve Fethet: Sınıf** game card, then tap **Oyna**.
4. The game menu opens with three options: **Rastgele Oyna**, **Oda Oluştur**, **Odaya Katıl**.
5. Tap **Oda Oluştur** to create a room. A room code is displayed — note it.
6. On a second device, log in with another Core account, go to Playground → Bil ve Fethet: Sınıf → **Odaya Katıl**, enter the room code, and join.
7. Verify both players appear in the lobby screen.
8. The host taps **Oyunu Başlat**. Verify the game starts and the classroom map loads.
9. During desk selection, verify selectable desks show a **glowing border**.
10. Tap a glowing desk and verify **haptic feedback** fires.
11. Verify the desk ownership badge updates after the correct answer.

**Pass Criteria:**
- "Bil ve Fethet: Sınıf" card is visible in the Core Playground.
- Room creation produces a shareable room code.
- Second player can join using the code and both appear in the lobby.
- Game starts and classroom map loads with glowing borders on selectable desks.
- Haptic feedback fires on desk tap.
- Desk ownership updates with the correct player badge after a correct answer.

**Fail Criteria:**
- Game card is not visible in the Core Playground.
- Room creation or joining fails.
- Glowing borders or haptic feedback absent.
- Desk ownership does not update correctly.

---

## T-11 — Kids Playground: Sınıfı Fethet! — Game Logic & Win Detection — **Latest Outcome: Pass**

**Specification:** The "Sınıfı Fethet!" game state reducer must correctly process answer submissions, update desk ownership on the classroom map, and accurately declare the winner when all desks are claimed. (This is the same "Sınıfı Fethet!" game as T-10 but tests the underlying correctness of answer-to-territory logic and end-game detection rather than visual/haptic appearance.)

**Equipment:** Physical phone or simulator (logged in to Kids section)

**Procedure:**
1. From the Kids section, tap the **Playground** tab.
2. Tap the **Sınıfı Fethet!** game card, then tap **Oyna**.
3. Play through the claiming phase — tap desks and verify each claimed desk shows your badge (🧑).
4. When the attack phase starts, tap an opponent's desk and answer the question correctly.
5. Verify the desk switches to your ownership (badge changes from the opponent emoji to 🧑).
6. Answer a question **incorrectly** and verify the desk does **not** change ownership.
7. Continue playing until all 15 desks are owned (no neutral desks remain) or until only one player controls all desks.
8. Verify the **game over screen** appears with a trophy (🏆) if you won or a skull (💀) if you lost, and that the correct winner is declared.

**Pass Criteria:**
- Desk ownership updates correctly after a correct answer.
- Desk ownership does not change on an incorrect answer.
- End screen appears and accurately declares the winner with trophy/skull icon and correct desk count.

**Fail Criteria:**
- Desk ownership changes incorrectly or does not update.
- Game crashes or freezes during answer submission or state transitions.
- End screen does not appear or shows the wrong winner.
- Final score or declared winner is wrong.
