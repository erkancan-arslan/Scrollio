# From Children's Drawing to Animation Pipeline
## Complete Implementation Guide

> This document contains everything needed to implement the full pipeline from scratch.
> A new agent with zero prior knowledge should be able to implement every part by following this guide top to bottom.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Architecture & Data Flow](#2-architecture--data-flow)
3. [Tech Stack & Services](#3-tech-stack--services)
4. [Environment Variables](#4-environment-variables)
5. [Database Schema (Supabase)](#5-database-schema-supabase)
6. [Project Structure](#6-project-structure)
7. [Step 1 — Drawing Canvas (Frontend)](#7-step-1--drawing-canvas-frontend)
8. [Step 2 — Image Generation API Route](#8-step-2--image-generation-api-route)
9. [Step 3 — Email Delivery API Route](#9-step-3--email-delivery-api-route)
10. [Step 4 — Video Generation API Route](#10-step-4--video-generation-api-route)
11. [State Machine (UX Flow)](#11-state-machine-ux-flow)
12. [Frontend Component: Full KidsModeDemo](#12-frontend-component-full-kidsmodedemo)
13. [Implementation Tricks & Gotchas](#13-implementation-tricks--gotchas)
14. [Testing Checklist](#14-testing-checklist)

---

## 1. Product Overview

**Scrollio Kids** is a feature where:

1. A child draws any character on an in-browser canvas (finger/mouse).
2. The drawing is sent to an AI that transforms it into a **Pixar-quality 3D character** while preserving every design detail.
3. The resulting mentor image is **emailed to the parent** automatically.
4. Optionally, the parent types a topic ("dinosaurs", "space") and the AI generates a **short educational video** where the character teaches that topic.

The entire flow runs in a single page without navigation. No login required.

---

## 2. Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (React)                          │
│                                                                 │
│  ┌──────────────┐    canvas.toDataURL()    ┌─────────────────┐ │
│  │ HTML Canvas  │ ──── base64 PNG ───────► │  KidsModeDemo   │ │
│  │ (draw here)  │                          │  (state machine)│ │
│  └──────────────┘                          └────────┬────────┘ │
└───────────────────────────────────────────────────────┼─────────┘
                                                        │ POST /api/generate
                                                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NEXT.JS API ROUTES (server)                   │
│                                                                 │
│  POST /api/generate                                             │
│  ├── receives: imageBase64, email, childName, generateVideo     │
│  ├── calls: fal.ai  "fal-ai/nano-banana-pro/edit"              │
│  │          (image-to-image: drawing → Pixar 3D character)      │
│  ├── saves: original + result to Supabase `drawings` table      │
│  └── returns: { characterImageUrl, drawingDescription }         │
│                                                                 │
│  POST /api/send-email                                           │
│  ├── receives: toEmail, childName, originalDrawing, mentorUrl   │
│  ├── downloads mentor image → base64 attachment                 │
│  └── calls: Resend API (sends HTML email with CID attachments)  │
│                                                                 │
│  POST /api/generate  (second call, generateVideo: true)         │
│  ├── receives: characterImageUrl, learningPrompt, generateVideo │
│  ├── calls: fal.ai  "fal-ai/sora-2/image-to-video"            │
│  └── returns: { videoUrl }                                      │
└─────────────────────────────────────────────────────────────────┘
                         │           │
              ┌──────────┘           └──────────┐
              ▼                                  ▼
     ┌─────────────────┐              ┌──────────────────┐
     │   fal.ai        │              │   Supabase       │
     │  (AI inference) │              │  (Postgres DB)   │
     │  • nano-banana  │              │  • drawings table│
     │  • sora-2       │              │  • email logs    │
     └─────────────────┘              └──────────────────┘
              │
              ▼
     ┌─────────────────┐
     │   Resend        │
     │  (email delivery)│
     │  • HTML email   │
     │  • CID images   │
     └─────────────────┘
```

---

## 3. Tech Stack & Services

| Layer | Tool | Purpose |
|---|---|---|
| Framework | Next.js 14+ (App Router) | Full-stack React, API routes |
| Language | TypeScript | Type safety |
| Canvas | HTML5 Canvas API | Drawing surface |
| Image AI | **fal.ai** `fal-ai/nano-banana-pro/edit` | Drawing → Pixar 3D character |
| Video AI | **fal.ai** `fal-ai/sora-2/image-to-video` | Character image → educational video |
| Email | **Resend** | Transactional email with image attachments |
| Database | **Supabase** (Postgres) | Store drawings + mentor images |
| Styling | Tailwind CSS | UI |
| Animation | Framer Motion | UI transitions |

### Service Accounts You Need

- **fal.ai** — https://fal.ai — create account, get API key from dashboard
- **Resend** — https://resend.com — create account, verify sending domain, get API key
- **Supabase** — https://supabase.com — create project, get URL + anon key

---

## 4. Environment Variables

Create a `.env.local` file in the project root. **Never commit this file.**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# fal.ai — get from https://fal.ai/dashboard/keys
FAL_KEY=your_fal_key_id:your_fal_key_secret

# Resend — get from https://resend.com/api-keys
RESEND_API_KEY=re_your_resend_key_here
```

### How to get FAL_KEY

1. Go to https://fal.ai
2. Sign up / log in
3. Dashboard → API Keys → Create Key
4. The key format is `KEY_ID:KEY_SECRET` — copy the **full string** including the colon

### How to get RESEND_API_KEY

1. Go to https://resend.com
2. Sign up
3. Add & verify your domain (DNS TXT + MX records)
4. API Keys → Create API Key
5. Set sending `from` address to `something@yourdomain.com`

---

## 5. Database Schema (Supabase)

Run this SQL in the Supabase SQL editor:

```sql
-- Table: drawings
CREATE TABLE drawings (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_drawing TEXT,                    -- base64 PNG of child's drawing
  mentor_image_url TEXT,                    -- URL of AI-generated Pixar character
  drawing_description TEXT,                 -- AI description (currently static string)
  user_email      TEXT,                     -- parent's email (optional)
  child_name      TEXT,                     -- child's name (optional)
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (allow inserts from server-side)
ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;

-- Policy: allow server (anon key) to insert
CREATE POLICY "Allow insert for all" ON drawings
  FOR INSERT WITH CHECK (true);

-- Policy: allow reading only with service role (admin panel only)
CREATE POLICY "Allow read for service role" ON drawings
  FOR SELECT USING (auth.role() = 'service_role');
```

### Supabase client setup

Install: `npm install @supabase/supabase-js`

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

---

## 6. Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── generate/
│   │   │   └── route.ts        ← Image gen + video gen (same route, different mode)
│   │   └── send-email/
│   │       └── route.ts        ← Resend email delivery
│   └── page.tsx                ← Mount <KidsModeDemo /> here
├── components/
│   └── KidsModeDemo.tsx        ← Full self-contained drawing → mentor flow
└── lib/
    └── supabase.ts             ← Supabase client
```

---

## 7. Step 1 — Drawing Canvas (Frontend)

The canvas is a standard `<canvas>` element with mouse and touch event handlers.

### Key implementation details

```typescript
// Canvas setup (called once on mount)
const canvas = canvasRef.current;
const context = canvas.getContext("2d");
context.fillStyle = "#ffffff";          // white background
context.fillRect(0, 0, canvas.width, canvas.height);

// Brush settings
context.strokeStyle = currentColor;     // or ERASER_COLOR = "#ffffff" for eraser
context.lineWidth = isEraser ? brushSize * 3 : brushSize;
context.lineCap = "round";
context.lineJoin = "round";
```

### Touch + mouse coordinate normalization

The canvas has a fixed internal resolution (`width={400} height={300}`) but is displayed at a different CSS size. You MUST scale coordinates:

```typescript
const getCoordinates = (e: MouseEvent | TouchEvent) => {
  const canvas = canvasRef.current!;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  if ("touches" in e) {
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY,
    };
  }
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
};
```

**IMPORTANT:** Add `touch-action: none` CSS to the canvas element to prevent scroll hijacking on mobile.

### Converting canvas to base64 for API

```typescript
const imageBase64 = canvas.toDataURL("image/png");
// Produces: "data:image/png;base64,iVBORw0KGgo..."
// Send this whole string to the API — fal.ai accepts data URIs
```

### Undo system

Store snapshots of the canvas in a `history` array:

```typescript
const [history, setHistory] = useState<ImageData[]>([]);

const saveToHistory = () => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  setHistory(prev => [...prev, imageData]);
};

const handleUndo = () => {
  const newHistory = [...history];
  const previousState = newHistory.pop();
  if (previousState) {
    ctx.putImageData(previousState, 0, 0);
    setHistory(newHistory);
  }
};
```

Call `saveToHistory()` at the start of every `startDrawing` event (not during draw, only on mousedown/touchstart).

---

## 8. Step 2 — Image Generation API Route

**File:** `src/app/api/generate/route.ts`

Install: `npm install @fal-ai/client`

### The fal.ai model

Model ID: `fal-ai/nano-banana-pro/edit`

This is an **image-to-image** model. It takes:
- `prompt`: detailed text instructions
- `image_urls`: array containing the source image (base64 data URI or https URL)

And returns:
- `images`: array of objects with `url` (CDN URL to the generated image)

### Full route implementation

```typescript
// src/app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const FAL_KEY = process.env.FAL_KEY;
  if (!FAL_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  // Must configure inside handler (not at module level) so env vars are loaded
  fal.config({ credentials: FAL_KEY });

  const {
    imageBase64,         // base64 PNG from canvas (step 1 only)
    characterImageUrl,   // CDN URL of generated character (step 2 only)
    learningPrompt,      // topic string e.g. "dinosaurs"
    generateVideo,       // boolean: false = image only, true = video
    email,               // parent email
    childName,           // child's name
  } = await request.json();

  // ─── MODE A: Video generation (character already exists) ───────────────────
  if (characterImageUrl && generateVideo) {
    const videoResult = await fal.subscribe("fal-ai/sora-2/image-to-video", {
      input: {
        prompt: buildVideoPrompt(learningPrompt),
        image_url: characterImageUrl,
      },
    });
    const videoUrl = (videoResult.data as { video?: { url: string } })?.video?.url;
    return NextResponse.json({ success: true, videoUrl });
  }

  // ─── MODE B: Image generation from drawing ──────────────────────────────────
  if (!imageBase64) {
    return NextResponse.json({ error: "Image is required" }, { status: 400 });
  }

  const imageResult = await fal.subscribe("fal-ai/nano-banana-pro/edit", {
    input: {
      prompt: PIXAR_PROMPT,
      image_urls: [imageBase64],  // fal.ai accepts data URIs directly
    },
  });

  const characterImageUrl = (imageResult.data as {
    images?: Array<{ url: string }>;
  })?.images?.[0]?.url;

  // Save to Supabase (fire-and-forget, don't block response)
  if (characterImageUrl) {
    supabase.from("drawings").insert({
      original_drawing: imageBase64,
      mentor_image_url: characterImageUrl,
      drawing_description: "Pixar-style 3D character transformation",
      user_email: email || null,
      child_name: childName || null,
      created_at: new Date().toISOString(),
    }).then(({ error }) => {
      if (error) console.error("Supabase save error:", error);
    });
  }

  return NextResponse.json({
    success: true,
    drawingDescription: "Pixar-style 3D character transformation",
    characterImageUrl,
    videoUrl: null,
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildVideoPrompt(topic: string) {
  return `A cute animated mentor character teaching a child about ${topic}. The character is friendly, gently animated, making small movements, looking at the viewer warmly. Educational children's video style, colorful background, engaging, fun learning moment.`;
}

const PIXAR_PROMPT = `Transform the attached hand-drawn character into a high-fidelity 3D mascot in authentic Pixar animation style. The final result should feel as if the character belongs inside a Pixar film universe, with warmth, charm, emotional clarity, and cinematic polish.

Treat the drawing as a strict blueprint. Carefully analyze the drawing before generating the 3D version and preserve the exact silhouette, proportions, shape language, and overall structure. Maintain the original color palette exactly as it appears in the drawing, without reinterpretation or stylistic recoloring. All distinctive details, including facial features, accessories, asymmetries, and unique marks, must remain faithful to the original design.

Identify whether the subject is an animal, human, object, or hybrid and recreate it using soft, rounded Pixar-style 3D geometry. The character should feature large, expressive Pixar-style eyes, subtle facial nuance, and a friendly, emotionally readable personality that matches the mood and intention of the original drawing.

All materials and textures must follow Pixar's stylized realism approach. Fur should appear soft and touchable, petals should feel velvety and layered, and skin should be smooth and matte with a handcrafted feel. Surfaces should look warm and premium, avoiding photorealism or plastic-like finishes while remaining believable and rich in detail.

Use Pixar-style cinematic studio lighting to bring the character to life. The lighting should be soft and flattering, similar to clamshell or butterfly lighting, with gentle global illumination and subtle rim light to separate the character from the background while maintaining a friendly, magical atmosphere.

Enhance the drawing with true 3D depth, soft shadows, and natural dimensionality while staying completely faithful to the original design. Pose the character in a joyful, welcoming, high-energy Pixar-style stance that reinforces personality without altering proportions or structure.

Render the final output as a professional Pixar-quality 3D character reveal with ultra-clean presentation and high detail. Use a simple, whimsical, softly blurred background so the mascot remains the clear focus. The final image should feel like a Pixar movie poster or character introduction, presented with cinematic polish and 8K-level clarity.`;
```

### Expected timing

- Image generation: **20–60 seconds**
- Video generation: **2–5 minutes**

`fal.subscribe()` is a **blocking** call that polls until the job is done. It handles retries and timeouts internally.

### Error handling pattern

```typescript
try {
  const result = await fal.subscribe(...);
} catch (err) {
  // fal errors have extra fields
  if (err && typeof err === "object") {
    if ("body" in err) console.error("fal error body:", err.body);
    if ("status" in err) console.error("fal status:", err.status);
  }
  return NextResponse.json({ error: "Generation failed" }, { status: 500 });
}
```

---

## 9. Step 3 — Email Delivery API Route

**File:** `src/app/api/send-email/route.ts`

Install: `npm install resend`

### Critical implementation detail: CID image embedding

Resend supports embedding images as attachments with Content-ID (CID). This means the image renders inline in the email body without needing a public URL.

**The trick:** Pass `cid:filename` as the `src` in your HTML `<img>` tag, then list the same file as an attachment:

```typescript
// Attachment
attachments: [{
  filename: "mentor.png",
  content: base64String,    // Buffer base64, NOT the data URI prefix
  cid: "mentor-image",       // This is the identifier
}]

// In HTML body
`<img src="cid:mentor-image" />`
```

### Full route implementation

```typescript
// src/app/api/send-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
  }

  const resend = new Resend(RESEND_API_KEY);

  const { toEmail, childName, originalDrawing, mentorImageUrl } = await request.json();

  if (!toEmail || !mentorImageUrl) {
    return NextResponse.json(
      { error: "Email and mentor image are required" },
      { status: 400 }
    );
  }

  const attachments = [];

  // Download the mentor image from CDN and convert to base64
  try {
    const res = await fetch(mentorImageUrl);
    const buffer = await res.arrayBuffer();
    attachments.push({
      filename: "mentor.png",
      content: Buffer.from(buffer).toString("base64"),
      cid: "mentor-image",
    });
  } catch (err) {
    console.error("Failed to download mentor image:", err);
    // Continue without attachment — fallback to hotlinked img
  }

  // Strip the data URI prefix from the original drawing base64
  if (originalDrawing) {
    const raw = originalDrawing.replace(/^data:image\/\w+;base64,/, "");
    attachments.push({
      filename: "drawing.png",
      content: raw,
      cid: "original-drawing",
    });
  }

  const { data, error } = await resend.emails.send({
    from: "Scrollio <info@yourdomain.com>",    // must be verified domain
    to: toEmail,
    subject: `${childName ? childName + "'s" : "Your child's"} Scrollio Mentor is Ready! 🎨`,
    attachments: attachments.length > 0 ? attachments : undefined,
    html: buildEmailHtml(childName, !!originalDrawing),
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ success: true, emailId: data?.id });
}

function buildEmailHtml(childName: string | undefined, hasOriginal: boolean) {
  const name = childName ? `${childName}'s` : "Your child's";
  return `<!DOCTYPE html>
<html>
<body style="background:#0a0a0f; font-family: system-ui, sans-serif; padding: 40px 20px;">
  <div style="max-width:600px; margin:0 auto;">
    <h1 style="text-align:center; background:linear-gradient(135deg,#f97316,#a855f7);
               -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
      Scrollio Kids
    </h1>
    <div style="background:rgba(249,115,22,0.08); border:1px solid rgba(255,255,255,0.1);
                border-radius:20px; padding:30px; text-align:center;">
      <h2 style="color:#fff;">🎉 ${name} Mentor is Ready!</h2>
      <img src="cid:mentor-image" style="max-width:100%; border-radius:15px;
               border:2px solid rgba(249,115,22,0.3);" />
      ${hasOriginal ? `
        <p style="color:#aaa; margin-top:20px;">Original Drawing</p>
        <img src="cid:original-drawing" style="max-width:200px; border-radius:10px;" />
      ` : ""}
    </div>
    <div style="text-align:center; margin-top:24px;">
      <a href="https://scrollio.co"
         style="background:linear-gradient(135deg,#f97316,#a855f7); color:#fff;
                padding:14px 32px; border-radius:30px; text-decoration:none; font-weight:600;">
        Explore Scrollio
      </a>
    </div>
  </div>
</body>
</html>`;
}
```

---

## 10. Step 4 — Video Generation API Route

Video generation reuses the **same route** as image generation (`/api/generate`) but with a different payload:

```typescript
// Frontend call for video generation
const response = await fetch("/api/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    characterImageUrl: mentorData.characterImageUrl,  // CDN URL from step 2
    learningPrompt: "dinosaurs",                       // user's topic input
    generateVideo: true,                               // triggers video mode
  }),
});
const data = await response.json();
// data.videoUrl = "https://..."
```

### fal.ai Sora 2 model

Model ID: `fal-ai/sora-2/image-to-video`

Input:
```typescript
{
  prompt: string,      // text description of what the video should show
  image_url: string,   // HTTPS URL of the character image (must be public CDN URL)
}
```

Output:
```typescript
{
  video: {
    url: string        // CDN URL to the generated MP4
  }
}
```

**IMPORTANT:** `image_url` must be a **public HTTPS URL**, not a base64 string. This is why you use the `characterImageUrl` returned from step 2 (which is a fal.ai CDN URL).

### Timing

Video generation takes **2–5 minutes**. The `fal.subscribe()` call polls the fal.ai queue and resolves when done. The API route will stay open for this entire duration — Next.js App Router handles this correctly with no timeout by default on Vercel.

---

## 11. State Machine (UX Flow)

The UI has exactly 5 states. Transitions are one-way (linear), with reset going back to `draw`.

```
"draw"
  │
  │ user clicks "Create Mentor" (email required)
  │ POST /api/generate { imageBase64, email, childName, generateVideo: false }
  ▼
"generating-mentor"  ← show spinner, "Creating your mentor..." (20-60s)
  │
  │ success → characterImageUrl received
  │ [fire-and-forget] POST /api/send-email
  ▼
"mentor-ready"
  │
  │ user types learning topic + clicks "Create Video"
  │ POST /api/generate { characterImageUrl, learningPrompt, generateVideo: true }
  ▼
"generating-video"   ← show spinner, "Creating video..." (2-5 min)
  │
  │ success → videoUrl received
  ▼
"video-ready"
  │
  │ user clicks "Create New Mentor"
  ▼
"draw" (reset all state)
```

### State type definition

```typescript
type Step = "draw" | "generating-mentor" | "mentor-ready" | "generating-video" | "video-ready";
```

---

## 12. Frontend Component: Full KidsModeDemo

The component is self-contained and can be embedded anywhere. It takes no required props.

### Props interface

```typescript
export interface KidsModeDemoProps {
  onClose?: () => void;        // optional close button callback
  embedded?: boolean;          // true = no close button, compact layout
  className?: string;          // additional CSS classes for wrapper
  noInternalScroll?: boolean;  // true = no overflow scroll (for tight embeds)
}
```

### Minimal skeleton

```tsx
"use client";

import { useRef, useState, useEffect } from "react";

type Step = "draw" | "generating-mentor" | "mentor-ready" | "generating-video" | "video-ready";

export default function KidsModeDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [step, setStep] = useState<Step>("draw");
  const [email, setEmail] = useState("");
  const [childName, setChildName] = useState("");
  const [mentorImageUrl, setMentorImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [learningPrompt, setLearningPrompt] = useState("");
  const [generationStatus, setGenerationStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  // Initialize canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    setCtx(context);
  }, []);

  // Update brush settings when they change
  useEffect(() => {
    if (!ctx) return;
    ctx.strokeStyle = isEraser ? "#ffffff" : currentColor;
    ctx.lineWidth = isEraser ? brushSize * 3 : brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [ctx, currentColor, brushSize, isEraser]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!ctx) return;
    e.preventDefault();
    // Save snapshot for undo
    const imageData = ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    setHistory(prev => [...prev, imageData]);
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctx) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!ctx) return;
    setIsDrawing(false);
    ctx.closePath();
  };

  const handleUndo = () => {
    if (!ctx || history.length === 0) return;
    const newHistory = [...history];
    const prev = newHistory.pop()!;
    ctx.putImageData(prev, 0, 0);
    setHistory(newHistory);
  };

  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHistory([]);
  };

  const handleGenerateMentor = async () => {
    if (!canvasRef.current || !email.trim()) return;
    setStep("generating-mentor");
    setError(null);
    setGenerationStatus("Creating your mentor in Pixar style...");

    try {
      const imageBase64 = canvasRef.current.toDataURL("image/png");

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          generateVideo: false,
          email: email.trim(),
          childName: childName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setMentorImageUrl(data.characterImageUrl);

      // Send email in background (don't await, don't block UI)
      if (data.characterImageUrl && email.trim()) {
        setGenerationStatus("Sending to your email...");
        fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toEmail: email.trim(),
            childName: childName.trim(),
            originalDrawing: imageBase64,
            mentorImageUrl: data.characterImageUrl,
          }),
        })
          .then(r => r.json())
          .then(result => { if (result.success) setEmailSent(true); })
          .catch(err => console.error("Email error:", err));
      }

      setStep("mentor-ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("draw");
    }
  };

  const handleGenerateVideo = async () => {
    if (!mentorImageUrl || !learningPrompt.trim()) return;
    setStep("generating-video");
    setError(null);
    setGenerationStatus("Creating educational video...");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterImageUrl: mentorImageUrl,
          learningPrompt,
          generateVideo: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Video generation failed");
      if (!data.videoUrl) throw new Error("No video URL returned");

      setVideoUrl(data.videoUrl);
      setStep("video-ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Video generation failed");
      setStep("mentor-ready");
    }
  };

  const handleReset = () => {
    setStep("draw");
    setMentorImageUrl(null);
    setVideoUrl(null);
    setError(null);
    setLearningPrompt("");
    setEmail("");
    setChildName("");
    setEmailSent(false);
    setIsEraser(false);
    setHistory([]);
    clearCanvas();
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 bg-white rounded-2xl p-6 max-w-lg mx-auto">

      {/* STEP: draw */}
      {step === "draw" && (
        <>
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            className="w-full rounded-xl border border-gray-200 cursor-crosshair touch-none bg-white"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          <div className="flex gap-2">
            <button onClick={handleUndo} disabled={history.length === 0}>Undo</button>
            <button onClick={clearCanvas}>Clear</button>
          </div>
          {/* Color picker, brush size, eraser — add as needed */}
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Parent email *"
            required
          />
          <input
            type="text"
            value={childName}
            onChange={e => setChildName(e.target.value)}
            placeholder="Child's name (optional)"
          />
          <button
            onClick={handleGenerateMentor}
            disabled={!email.trim()}
          >
            Create Mentor
          </button>
        </>
      )}

      {/* STEP: generating-mentor */}
      {step === "generating-mentor" && (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p>{generationStatus}</p>
          <p className="text-sm text-gray-500">This takes 20–60 seconds</p>
        </div>
      )}

      {/* STEP: mentor-ready */}
      {step === "mentor-ready" && mentorImageUrl && (
        <>
          {emailSent && <p className="text-green-600">✅ Sent to {email}!</p>}
          <img src={mentorImageUrl} alt="Your mentor" className="w-full rounded-xl" />
          <input
            type="text"
            value={learningPrompt}
            onChange={e => setLearningPrompt(e.target.value)}
            placeholder="What should your mentor teach? (e.g. dinosaurs)"
          />
          <button onClick={handleGenerateVideo} disabled={!learningPrompt.trim()}>
            Create Video
          </button>
          <button onClick={handleReset}>← Draw again</button>
        </>
      )}

      {/* STEP: generating-video */}
      {step === "generating-video" && (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p>{generationStatus}</p>
          <p className="text-sm text-gray-500">Video takes 2–5 minutes</p>
        </div>
      )}

      {/* STEP: video-ready */}
      {step === "video-ready" && videoUrl && (
        <>
          <video src={videoUrl} controls autoPlay loop className="w-full rounded-xl" />
          <button onClick={handleReset}>Create New Mentor</button>
        </>
      )}

      {/* Error display */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
```

---

## 13. Implementation Tricks & Gotchas

### 1. fal.ai must be configured inside the route handler

**Wrong:**
```typescript
// Top of file — env not loaded yet at module init time
fal.config({ credentials: process.env.FAL_KEY });
```

**Correct:**
```typescript
export async function POST(request: NextRequest) {
  fal.config({ credentials: process.env.FAL_KEY });  // inside handler
  // ...
}
```

### 2. Canvas scale coordinates — always do this

The canvas has an internal pixel resolution different from its CSS size. If you skip scaling, drawing will feel offset and imprecise on any screen size other than the exact pixel size.

### 3. touch-action: none on canvas

Without this, touching the canvas on mobile will scroll the page instead of drawing. Add `touch-action: none` via Tailwind class `touch-none` or inline CSS.

### 4. Prevent scroll during touch draw

```typescript
onTouchStart={e => { e.preventDefault(); startDrawing(e); }}
onTouchMove={e => { e.preventDefault(); draw(e); }}
```

The `e.preventDefault()` must happen inside the handler for iOS Safari. This requires the event listener to be added with `{ passive: false }` if using `addEventListener`. React's synthetic events handle this automatically.

### 5. fal.ai image_urls vs image_url

- `nano-banana-pro/edit` takes `image_urls` (array, accepts base64 data URIs)
- `sora-2/image-to-video` takes `image_url` (single string, **must be HTTPS URL**)

Do not swap these. Sora 2 will fail silently if given a data URI.

### 6. Email: strip data URI prefix before using as attachment content

Resend attachment `content` field expects raw base64, not `data:image/png;base64,...`:

```typescript
const raw = originalDrawing.replace(/^data:image\/\w+;base64,/, "");
```

### 7. Email delivery can fail silently — fire and forget correctly

Send the email **after** the mentor image is confirmed, but don't block the state transition:

```typescript
setStep("mentor-ready");  // Update UI immediately
// Then send email in background
fetch("/api/send-email", { ... }).then(...).catch(console.error);
```

### 8. Supabase insert: don't block the API response

The DB save is non-critical. Use `.then()` chaining and don't `await` it in the main handler path.

### 9. Video generation timeout on Vercel

Vercel Hobby plan has a 60s function timeout. Video generation takes 2–5 minutes. 

**Solutions:**
- Upgrade to Vercel Pro (300s timeout) — recommended
- Or move video generation to a background job (e.g. trigger a Vercel Cron Job or use a queue service like Inngest/Trigger.dev)

### 10. fal.subscribe() vs fal.queue.submit()

`fal.subscribe()` blocks until the job is done. For very long jobs (video), consider:
```typescript
// Non-blocking: submit and get a request ID
const { request_id } = await fal.queue.submit("fal-ai/sora-2/image-to-video", { input });

// Poll from client with SSE or polling
const result = await fal.queue.result("fal-ai/sora-2/image-to-video", { requestId: request_id });
```

### 11. White canvas detection

Before sending to the API, optionally check if the canvas is blank:

```typescript
const isBlank = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext("2d")!;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  return data.every((v, i) => (i % 4 === 3) ? true : v === 255);
};
```

---

## 14. Testing Checklist

### Canvas
- [ ] Drawing works with mouse on desktop
- [ ] Drawing works with touch on iOS Safari (no scroll hijacking)
- [ ] Drawing works with touch on Android Chrome
- [ ] Undo works step by step
- [ ] Clear resets to white
- [ ] Color picker changes color
- [ ] Eraser works (draws white)

### Image Generation
- [ ] `POST /api/generate` with a base64 PNG returns `characterImageUrl`
- [ ] Response time is < 60 seconds
- [ ] The returned image looks like a Pixar-style version of the drawing
- [ ] Supabase `drawings` table gets a new row

### Email
- [ ] `POST /api/send-email` sends email to the provided address
- [ ] Mentor image renders inline in Gmail, Apple Mail, Outlook
- [ ] Original drawing renders inline
- [ ] CTA button links to correct URL
- [ ] `from` address matches your verified Resend domain

### Video Generation
- [ ] `POST /api/generate` with `generateVideo: true` and a valid CDN `characterImageUrl` returns `videoUrl`
- [ ] Response time is < 5 minutes
- [ ] Video auto-plays in the UI
- [ ] Video loop works

### UX Flow
- [ ] All 5 state transitions work correctly
- [ ] Error in image gen → stays on "draw" step, shows error
- [ ] Error in video gen → stays on "mentor-ready" step, shows error
- [ ] "Draw again" resets everything including canvas
- [ ] emailSent confirmation appears after email succeeds

---

## Quick Reference: API Contracts

### POST /api/generate (image mode)

**Request:**
```json
{
  "imageBase64": "data:image/png;base64,iVBOR...",
  "generateVideo": false,
  "email": "parent@example.com",
  "childName": "Emma"
}
```

**Response:**
```json
{
  "success": true,
  "drawingDescription": "Pixar-style 3D character transformation",
  "characterImageUrl": "https://fal.media/files/...",
  "videoUrl": null
}
```

### POST /api/generate (video mode)

**Request:**
```json
{
  "characterImageUrl": "https://fal.media/files/...",
  "learningPrompt": "dinosaurs",
  "generateVideo": true
}
```

**Response:**
```json
{
  "success": true,
  "videoUrl": "https://fal.media/files/....mp4"
}
```

### POST /api/send-email

**Request:**
```json
{
  "toEmail": "parent@example.com",
  "childName": "Emma",
  "originalDrawing": "data:image/png;base64,iVBOR...",
  "mentorImageUrl": "https://fal.media/files/..."
}
```

**Response:**
```json
{
  "success": true,
  "emailId": "re_123abc"
}
```

---

*End of implementation guide.*
