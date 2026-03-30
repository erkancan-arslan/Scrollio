/**
 * Scrollio Kids Demo — React Native
 *
 * Drop this file (and optionally index.ts) into your app and install peers:
 *
 *   npm install react-native-svg react-native-view-shot
 *   # iOS: cd ios && pod install
 *
 * Your Next.js (or compatible) backend must expose the same routes as this
 * landing app: POST /api/generate, POST /api/send-email
 *
 * @example
 * <ScrollioKidsDemo apiBaseUrl="https://your-deployed-site.com" />
 */

import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import ViewShot, { captureRef } from "react-native-view-shot";

// ─── types ─────────────────────────────────────────────────

export type ScrollioKidsDemoProps = {
  /** Origin of your deployed API, no trailing slash (e.g. https://scrollio.example.com) */
  apiBaseUrl: string;
  /** Optional Authorization header for protected APIs */
  authHeader?: string;
  embedded?: boolean;
  onClose?: () => void;
};

type Point = { x: number; y: number };
type Stroke = { points: Point[]; color: string; width: number };

const COLORS = [
  { name: "Black", value: "#000000" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
  { name: "Green", value: "#22c55e" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
];

const ERASER = "#ffffff";
const CANVAS_W = 400;
const CANVAS_H = 300;

function strokeToPathD(points: Point[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  let d = `M ${first.x} ${first.y}`;
  for (const p of rest) d += ` L ${p.x} ${p.y}`;
  return d;
}

type Step = "draw" | "generating-mentor" | "mentor-ready" | "generating-video" | "video-ready";

export function ScrollioKidsDemo({
  apiBaseUrl,
  authHeader,
  embedded,
  onClose,
}: ScrollioKidsDemoProps) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [current, setCurrent] = useState<Stroke | null>(null);
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  const [step, setStep] = useState<Step>("draw");
  const [generationStatus, setGenerationStatus] = useState("");
  const [learningPrompt, setLearningPrompt] = useState("");
  const [mentorData, setMentorData] = useState<{
    drawingDescription?: string;
    characterImageUrl?: string;
  } | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [childName, setChildName] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const viewShotRef = useRef<ViewShot | null>(null);

  const effectiveColor = isEraser ? ERASER : brushColor;
  const effectiveWidth = isEraser ? brushSize * 3 : brushSize;

  const appendPoint = useCallback(
    (x: number, y: number) => {
      setCurrent((prev) => {
        if (!prev) {
          return { points: [{ x, y }], color: effectiveColor, width: effectiveWidth };
        }
        return { ...prev, points: [...prev.points, { x, y }] };
      });
    },
    [effectiveColor, effectiveWidth]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetResponder: () => true,
        onMoveShouldSetResponder: () => true,
        onPanResponderGrant: (e) => {
          const x = e.nativeEvent.locationX;
          const y = e.nativeEvent.locationY;
          setCurrent({
            points: [{ x, y }],
            color: effectiveColor,
            width: effectiveWidth,
          });
        },
        onPanResponderMove: (e) => {
          const x = e.nativeEvent.locationX;
          const y = e.nativeEvent.locationY;
          appendPoint(x, y);
        },
        onPanResponderRelease: () => {
          setCurrent((prev) => {
            if (prev && prev.points.length > 0) {
              setStrokes((s) => [...s, prev]);
            }
            return null;
          });
        },
      }),
    [appendPoint, effectiveColor, effectiveWidth]
  );

  const handleUndo = () => {
    setStrokes((s) => s.slice(0, -1));
  };

  const clearCanvas = () => {
    setStrokes([]);
    setCurrent(null);
  };

  const baseHeaders = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (authHeader) h.Authorization = authHeader;
    return h;
  }, [authHeader]);

  const captureDataUrl = async (): Promise<string> => {
    if (!viewShotRef.current) throw new Error("Canvas not ready");
    const base64 = await captureRef(viewShotRef, {
      format: "png",
      quality: 1,
      result: "base64",
    });
    return `data:image/png;base64,${base64}`;
  };

  const handleGenerateMentor = async () => {
    if (!email.trim()) return;
    setStep("generating-mentor");
    setError(null);
    setGenerationStatus("Creating your mentor in Pixar style...");
    try {
      const imageBase64 = await captureDataUrl();
      const response = await fetch(`${apiBaseUrl}/api/generate`, {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          imageBase64,
          generateVideo: false,
          email: email.trim(),
          childName: childName.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed");
      setMentorData({
        drawingDescription: data.drawingDescription,
        characterImageUrl: data.characterImageUrl,
      });
      if (data.characterImageUrl && email.trim()) {
        setGenerationStatus("Sending your mentor to your email...");
        try {
          const emailResponse = await fetch(`${apiBaseUrl}/api/send-email`, {
            method: "POST",
            headers: baseHeaders,
            body: JSON.stringify({
              toEmail: email.trim(),
              childName: childName.trim(),
              originalDrawing: imageBase64,
              mentorImageUrl: data.characterImageUrl,
            }),
          });
          const emailResult = await emailResponse.json();
          if (emailResponse.ok && emailResult.success) setEmailSent(true);
        } catch {
          /* non-fatal */
        }
      }
      setStep("mentor-ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("draw");
    }
  };

  const handleGenerateVideo = async () => {
    if (!mentorData?.characterImageUrl || !learningPrompt.trim()) return;
    setStep("generating-video");
    setError(null);
    setGenerationStatus("Creating educational video...");
    try {
      const response = await fetch(`${apiBaseUrl}/api/generate`, {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          characterImageUrl: mentorData.characterImageUrl,
          learningPrompt,
          generateVideo: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
        throw new Error(errorMsg || "Video generation failed");
      }
      if (data.videoUrl) {
        setVideoUrl(data.videoUrl);
        setStep("video-ready");
      } else {
        throw new Error("Video could not be generated");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Video could not be created");
      setStep("mentor-ready");
    }
  };

  const handleReset = () => {
    setStep("draw");
    setMentorData(null);
    setVideoUrl(null);
    setError(null);
    setLearningPrompt("");
    setEmail("");
    setChildName("");
    setEmailSent(false);
    setIsEraser(false);
    clearCanvas();
  };

  const allPaths = [...strokes, ...(current ? [current] : [])];

  const content = (
    <>
      {onClose && !embedded && (
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>Scrollio Kids Demo</Text>
        <Text style={styles.subtitle}>
          {step === "draw" && "Draw your mentor!"}
          {step === "generating-mentor" && "AI is working its magic..."}
          {step === "mentor-ready" && "Here's your mentor!"}
          {step === "generating-video" && "Creating video..."}
          {step === "video-ready" && "Your video is ready!"}
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {step === "draw" && (
        <>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>✏️ Draw your mentor</Text>
            <View style={styles.row}>
              <Pressable onPress={handleUndo} disabled={strokes.length === 0} style={styles.smallBtn}>
                <Text style={[styles.smallBtnText, strokes.length === 0 && styles.disabled]}>Undo</Text>
              </Pressable>
              <Pressable onPress={clearCanvas} style={styles.smallBtn}>
                <Text style={styles.smallBtnText}>Clear</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.muted}>Color</Text>
          <View style={styles.colorRow}>
            {COLORS.map((c) => (
              <Pressable
                key={c.value}
                onPress={() => {
                  setBrushColor(c.value);
                  setIsEraser(false);
                }}
                style={[
                  styles.colorDot,
                  { backgroundColor: c.value },
                  brushColor === c.value && !isEraser && styles.colorDotActive,
                ]}
              />
            ))}
            <Pressable
              onPress={() => setIsEraser(!isEraser)}
              style={[styles.colorDot, styles.eraserDot, isEraser && styles.colorDotActive]}
            >
              <Text style={styles.eraserIcon}>⌫</Text>
            </Pressable>
          </View>

          <Text style={styles.muted}>{isEraser ? "Eraser size" : "Brush size"}: {brushSize}</Text>
          <View style={styles.sliderRow}>
            <Text style={styles.muted}>1</Text>
            <View style={{ flex: 1, marginHorizontal: 8 }}>
              {/* Simple stepped size without @react-native-community/slider */}
              <View style={styles.fakeSlider}>
                {[1, 4, 8, 12, 16, 20].map((n) => (
                  <Pressable key={n} onPress={() => setBrushSize(n)} style={styles.tick}>
                    <View style={[styles.tickInner, brushSize === n && styles.tickActive]} />
                  </Pressable>
                ))}
              </View>
            </View>
            <Text style={styles.muted}>20</Text>
          </View>

          <View
            style={[styles.canvasOuter, { width: CANVAS_W, height: CANVAS_H }]}
            {...panResponder.panHandlers}
          >
            <ViewShot
              ref={viewShotRef}
              options={{ format: "png", quality: 1, result: "base64" }}
              style={{
                width: CANVAS_W,
                height: CANVAS_H,
                backgroundColor: "#ffffff",
              }}
            >
              <Svg width={CANVAS_W} height={CANVAS_H}>
                {allPaths.map((s, i) => (
                  <Path
                    key={`${i}-${s.points.length}`}
                    d={strokeToPathD(s.points)}
                    stroke={s.color}
                    strokeWidth={s.width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                ))}
              </Svg>
            </ViewShot>
          </View>

          <Text style={styles.hint}>Use your finger to draw your dream mentor</Text>

          <View style={styles.emailBox}>
            <Text style={styles.emailTitle}>We&apos;ll send your mentor via email!</Text>
            <TextInput
              style={styles.input}
              placeholder="Your child's name (optional)"
              value={childName}
              onChangeText={setChildName}
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.input}
              placeholder="Your email address *"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.muted}>* We&apos;ll send the generated mentor to your email</Text>
          </View>

          <Pressable
            onPress={handleGenerateMentor}
            disabled={!email.trim()}
            style={[styles.primaryBtn, !email.trim() && styles.primaryBtnDisabled]}
          >
            <Text style={styles.primaryBtnText}>Create Mentor ✨</Text>
          </Pressable>
        </>
      )}

      {step === "generating-mentor" && (
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.genTitle}>{generationStatus}</Text>
          <Text style={styles.muted}>This may take 20-40 seconds...</Text>
        </View>
      )}

      {step === "mentor-ready" && mentorData && (
        <View style={styles.section}>
          {emailSent ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                Your mentor has been sent to {email}!
              </Text>
            </View>
          ) : null}
          {mentorData.characterImageUrl ? (
            <View style={styles.section}>
              <Text style={styles.label}>Here&apos;s Your Mentor!</Text>
              <Image
                source={{ uri: mentorData.characterImageUrl }}
                style={styles.mentorImage}
                resizeMode="contain"
              />
            </View>
          ) : null}
          <View style={styles.learnBox}>
            <Text style={styles.label}>What would you like to learn?</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., Dinosaurs, space, animals..."
              value={learningPrompt}
              onChangeText={setLearningPrompt}
              placeholderTextColor="#9ca3af"
            />
            <View style={styles.row}>
              <Pressable
                onPress={handleGenerateVideo}
                disabled={!learningPrompt.trim()}
                style={[styles.videoBtn, !learningPrompt.trim() && styles.primaryBtnDisabled]}
              >
                <Text style={styles.primaryBtnText}>Create Video 🎬</Text>
              </Pressable>
              {onClose ? (
                <Pressable onPress={onClose} style={styles.secondaryBtn}>
                  <Text style={styles.secondaryBtnText}>That&apos;s enough ✓</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
          <Pressable onPress={handleReset}>
            <Text style={styles.link}>← Draw again</Text>
          </Pressable>
        </View>
      )}

      {step === "generating-video" && (
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.genTitle}>{generationStatus}</Text>
          <Text style={styles.muted}>Video creation may take 2-5 minutes...</Text>
        </View>
      )}

      {step === "video-ready" && (
        <View style={styles.section}>
          {videoUrl ? (
            <View style={styles.section}>
              <Text style={styles.label}>Your Mentor&apos;s Video</Text>
              <Text style={styles.muted}>
                Open this URL in a browser or wire react-native-video:{"\n"}
                {videoUrl}
              </Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Pressable onPress={handleReset} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Create New Mentor</Text>
            </Pressable>
            {onClose ? (
              <Pressable onPress={onClose} style={styles.videoBtn}>
                <Text style={styles.primaryBtnText}>Close</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      )}

      <Text style={styles.footer}>Demo • Powered by fal.ai</Text>
    </>
  );

  if (embedded) {
    return <View style={[styles.embeddedRoot, styles.card]}>{content}</View>;
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={[styles.card, styles.maxW]}>{content}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#fafafa" },
  scrollContent: { padding: 16, paddingBottom: 32 },
  embeddedRoot: { flex: 1, minHeight: 0 },
  maxW: { maxWidth: 480, alignSelf: "center", width: "100%" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  closeBtn: { position: "absolute", top: 12, right: 12, zIndex: 10 },
  closeBtnText: { fontSize: 20, color: "#9ca3af" },
  header: { alignItems: "center", marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    marginBottom: 12,
  },
  errorText: { color: "#dc2626", fontSize: 14 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap", alignItems: "center" },
  label: { fontSize: 14, fontWeight: "600", color: "#111827" },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  smallBtnText: { fontSize: 12, color: "#4b5563" },
  disabled: { opacity: 0.4 },
  muted: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#d1d5db",
  },
  colorDotActive: { borderColor: "#f97316", transform: [{ scale: 1.1 }] },
  eraserDot: { justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  eraserIcon: { fontSize: 12, color: "#4b5563" },
  sliderRow: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  fakeSlider: { flexDirection: "row", justifyContent: "space-between" },
  tick: { padding: 4 },
  tickInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#e5e7eb" },
  tickActive: { backgroundColor: "#f97316" },
  canvasOuter: {
    alignSelf: "center",
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  hint: { fontSize: 11, color: "#6b7280", textAlign: "center", marginTop: 8 },
  emailBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  emailTitle: { fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  primaryBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#ea580c",
    alignItems: "center",
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  centerBlock: { paddingVertical: 40, alignItems: "center" },
  genTitle: { fontSize: 16, fontWeight: "600", marginTop: 16, color: "#111827", textAlign: "center" },
  successBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    marginBottom: 12,
  },
  successText: { color: "#15803d", fontSize: 14, textAlign: "center" },
  section: { marginTop: 8 },
  mentorImage: { width: "100%", height: 280, borderRadius: 12, marginTop: 8, backgroundColor: "#fafafa" },
  learnBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  videoBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#9333ea",
    alignItems: "center",
    minWidth: 120,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    minWidth: 120,
  },
  secondaryBtnText: { color: "#374151", fontWeight: "600" },
  link: { textAlign: "center", color: "#6b7280", marginTop: 12, fontSize: 14 },
  footer: { textAlign: "center", fontSize: 11, color: "#9ca3af", marginTop: 16 },
});

export default ScrollioKidsDemo;
