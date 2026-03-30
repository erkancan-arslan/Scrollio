# Batch Video Generation Pipeline — Change Summary

## What We Built

A multi-stage, human-in-the-loop pipeline that generates 15 educational videos (5 beginner, 5 intermediate, 5 advanced) from a single topic prompt. The user reviews and approves topics and scripts before any video is generated.

---

## Pipeline Flow

```
Enter topic
    ↓
Review & approve beginner topics (5)
    ↓
LLM suggests intermediate topics using beginner as context
    ↓
Review & approve intermediate topics (5)
    ↓
LLM suggests advanced topics using beginner + intermediate as context
    ↓
Review & approve advanced topics (5)
    ↓
Scripts generated in parallel (chunked: 10 then 5)
    ↓
Review & approve each script individually
    ↓
Video generated per script (TTS → Lipsync → Thumbnail → Publish)
```

---

## Database Migrations

### `20260328000000_batch_jobs_and_thumbnails.sql`
Created the `generation_batches` table, added `batch_id` FK to `generated_video_jobs`, added `difficulty` and `thumbnail_url` columns to `generated_videos`, and created the `generated-thumbnails` storage bucket.

### `20260328000100_fix_videos_difficulty_constraint.sql`
Updated the `videos` table check constraint to allow `beginner`, `intermediate`, and `advanced` as valid difficulty values (previously only covered a narrower set).

### `20260328000200_batch_interactive_pipeline.sql`
Added `pending_scripts` as a valid batch status, added `suggested_sub_topic` column to `generated_video_jobs` (stores LLM-suggested specific topic before user approval), and added `script_approved` boolean (tracks per-job script approval).

---

## Backend Files

### `src/admin/ai/topic-suggestion.service.ts` *(new)*
**Purpose:** Calls the LLM to suggest 5 specific video topics for a given difficulty level.

Accepts previous difficulty levels as context so each level genuinely builds on the last. For example, intermediate suggestions are generated knowing the 5 approved beginner topics, so there is no overlap. Returns a JSON array of `{ title, subTopic }` pairs.

### `src/admin/ai/script-generation.service.ts` *(rewritten)*
**Purpose:** Generates a spoken narration script for one video.

Key changes:
- Moved to a single `prompt` field (FAL+Gemini ignores the `system` field)
- Word limit is stated at the start and repeated at the end of the prompt (`STRICT WORD LIMIT: 50 words`)
- Server-side truncation backstop: caps output at 120% of target word count
- Forbidden openings list ("Ever wondered", "Have you ever", etc.)
- 8 rotating opening styles chosen deterministically from topic+difficulty hash
- Difficulty doctrine: each level covers a different *sub-topic*, not just a different explanation depth

### `src/admin/ai/thumbnail.service.ts` *(new)*
**Purpose:** Extracts the first frame of a generated video using FFmpeg and uploads it as a JPEG thumbnail to Supabase Storage.

Avoids AI-generated thumbnails in favour of extracting directly from the video so the thumbnail always matches the actual content.

### `src/admin/generation-jobs/generation-orchestrator.service.ts` *(extended)*
**Purpose:** Orchestrates the full video generation pipeline.

Added methods:
- `generateScriptsForBatch(jobIds)` — generates scripts for all jobs in chunks of 10 (respects provider concurrency limit), saves each script to the DB
- `runVideoFromApprovedScript(jobId)` — skips script generation, reads the approved narration from DB, then runs TTS → Lipsync → Thumbnail → Publish for a single job

### `src/admin/batch-jobs/batch-jobs.service.ts` *(new)*
**Purpose:** Manages batch lifecycle.

- `createBatch` — creates 15 job records, suggests 5 beginner topics immediately
- `approveAndSuggestNext` — saves current difficulty's approved topics, loads all previous levels from DB, calls topic suggestion service with full context, saves and returns next level's suggestions
- `applyApprovedTopics` — saves the final (advanced) approved topics
- `getScripts` / `markScriptApproved` — script review and approval helpers
- `updateBatchProgress` / `updateBatchStatus` — progress tracking

### `src/admin/batch-jobs/batch-jobs.controller.ts` *(new)*
**Purpose:** HTTP endpoints for the batch pipeline.

| Endpoint | Purpose |
|---|---|
| `POST /admin/batch-jobs` | Create batch, get beginner topic suggestions |
| `POST /:id/approve-and-suggest-next` | Approve current level, get next level suggestions |
| `POST /:id/approve-topics` | Approve advanced topics, start script generation for all 15 |
| `GET /:id/scripts` | Poll for generated scripts |
| `POST /:id/approve-script/:jobId` | Approve one script, fire video generation |

### `src/admin/batch-jobs/dto/` *(new files)*
- `create-batch-job.dto.ts` — batch creation inputs with class-validator decorators
- `approve-topics.dto.ts` — final topic approval payload
- `approve-script.dto.ts` — script approval with optional edited text
- `approve-and-suggest-next.dto.ts` — current difficulty + approved jobs payload

All DTOs have full `class-validator` decorators required by the global `ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`).

### `src/admin/generated-videos/generated-videos.service.ts` *(updated)*
Added `difficulty` and `thumbnail_url` to the `createFromJob` insert so they are persisted on the generated video record.

### `src/admin/feeds/feed-publishing.service.ts` *(updated)*
Propagates `thumbnail_url` and `difficulty` to the main `videos` table when publishing to the feed.

### `src/admin/admin.module.ts` *(updated)*
Registered `TopicSuggestionService`, `BatchJobsService`, and `BatchJobsController`.

---

## Mobile App Files

### `src/features/admin/screens/CreateBatchJobScreen.tsx` *(updated)*
After batch creation, navigates to `ReviewTopicsScreen` (beginner step) instead of auto-starting the full pipeline.

### `src/features/admin/screens/ReviewTopicsScreen.tsx` *(new, rewritten twice)*
3-step stepper for topic review. Shows one difficulty level at a time:
1. **Beginner** — 5 editable cards, button generates intermediate using beginner as context
2. **Intermediate** — 5 editable cards, button generates advanced using both levels as context
3. **Advanced** — 5 editable cards, button approves all and triggers script generation

Step indicator at the top shows ①②③ with completed steps marked ✓.

### `src/features/admin/screens/ReviewScriptsScreen.tsx` *(new)*
Displays all 15 generated scripts grouped by difficulty. Each card:
- Shows "Generating…" spinner while script is still being generated
- Displays the full script in an editable `TextInput` once ready (no collapse toggle — always visible)
- Has an "Approve & Generate Video" button that fires TTS+Lipsync for that job
- Shows a read-only preview after approval

Polls every 4 seconds while any script is still generating.

### `src/features/admin/screens/BatchJobDetailScreen.tsx` *(updated)*
Shows batch progress grouped by difficulty. Auto-polls while status is `running`.

### `src/navigation/AdminNavigator.tsx` *(updated)*
Added `AdminReviewTopics` and `AdminReviewScripts` routes.

### `src/features/admin/services/adminApi.ts` *(updated)*
Added: `approveAndSuggestNext`, `approveTopics`, `getBatchScripts`, `approveScript`.

### `src/features/admin/types/admin.types.ts` *(updated)*
Added `BatchJobSummaryJob`, `BatchJobScriptJob`, `BatchJobScripts` interfaces. Updated `BatchJob.status` to include `pending_scripts`.

---

## Key Design Decisions

**Why sequential topic approval (not all 15 at once)?**
Each difficulty level should cover genuinely different ground. By approving beginner topics first and using them as LLM context for intermediate, and then both for advanced, you get a coherent curriculum where each level builds on the previous — rather than three independent sets that might overlap.

**Why chunks of 10 for script generation?**
The provider (FAL) has a concurrent request limit of 10. Firing all 15 simultaneously caused failures. The pipeline now runs 10 in parallel, waits, then runs the remaining 5.

**Why no `system` field in LLM calls?**
FAL's `any-llm` proxy does not reliably pass the `system` field to Gemini. All instructions are merged into the single `prompt` field, with critical constraints (word limit, JSON-only) stated at both the start and end.

**Why per-script approval instead of all-at-once?**
Video generation (TTS + Lipsync) is the slowest and most expensive step. Approving scripts individually lets the first approved video start generating immediately while the user is still reviewing the remaining scripts, rather than waiting for all 15 approvals before anything starts.
