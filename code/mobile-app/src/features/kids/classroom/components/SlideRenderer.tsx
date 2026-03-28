import React, { useRef } from 'react';
import { View, StyleSheet, Platform, useWindowDimensions, Text } from 'react-native';

interface Slide {
  index: number;
  title: string;
  content: string;
  bulletPoints: string[];
  narrationText: string;
}

interface Props {
  slide: Slide;
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const buildHtml = (slide: Slide): string => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" crossorigin="anonymous" />
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js" crossorigin="anonymous"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" crossorigin="anonymous"
  onload="renderMathInElement(document.body, { throwOnError: false })"></script>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    background:linear-gradient(135deg,#E1F5FE 0%,#FFF8E1 100%);
    padding:20px;color:#1A1A2E;min-height:100vh;
  }
  h1{font-size:22px;font-weight:700;color:#0277BD;margin-bottom:12px;line-height:1.3}
  .content{font-size:16px;line-height:1.6;margin-bottom:16px;color:#333}
  ul{list-style:none;padding:0}
  li{font-size:15px;line-height:1.5;padding:6px 0 6px 22px;position:relative;color:#37474F}
  li::before{content:'•';position:absolute;left:0;color:#FF6B35;font-weight:700;font-size:18px}
  .katex{font-size:1.1em}
</style>
</head>
<body>
  <h1>${escapeHtml(slide.title)}</h1>
  <div class="content">${escapeHtml(slide.content)}</div>
  ${slide.bulletPoints && slide.bulletPoints.length > 0 ? `
  <ul>
    ${slide.bulletPoints.map(bp => `<li>${escapeHtml(bp)}</li>`).join('\n    ')}
  </ul>` : ''}
</body>
</html>`;

/* ------------------------------------------------------------------ */
/* Web fallback: plain React Native render (iframe not available in RN) */
/* ------------------------------------------------------------------ */
const SlideRendererNative: React.FC<Props> = ({ slide }) => {
  let WebView: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    WebView = require('react-native-webview').WebView;
  } catch {
    WebView = null;
  }

  if (!WebView) {
    return <SlideRendererFallback slide={slide} />;
  }

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: buildHtml(slide) }}
        style={styles.webview}
        scrollEnabled
        javaScriptEnabled
        domStorageEnabled
        scalesPageToFit={false}
        allowUniversalAccessFromFileURLs
      />
    </View>
  );
};

/* ------------------------------------------------------------------ */
/* Web: use an <iframe> via a ref to inject srcDoc                     */
/* ------------------------------------------------------------------ */
const SlideRendererWeb: React.FC<Props> = ({ slide }) => {
  const { width } = useWindowDimensions();
  const iframeRef = useRef<any>(null);

  const html = buildHtml(slide);

  return (
    <View style={[styles.container, { width: '100%' as any }]}>
      {/* @ts-ignore — iframe is valid JSX in react-native-web */}
      <iframe
        ref={iframeRef}
        srcDoc={html}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: 16,
          background: 'transparent',
        }}
        sandbox="allow-scripts allow-same-origin"
        title={`slide-${slide.index}`}
      />
    </View>
  );
};

/* ------------------------------------------------------------------ */
/* Minimal text fallback (if WebView not available)                    */
/* ------------------------------------------------------------------ */
const SlideRendererFallback: React.FC<Props> = ({ slide }) => (
  <View style={styles.fallback}>
    <Text style={styles.fallbackTitle}>{slide.title}</Text>
    <Text style={styles.fallbackContent}>{slide.content}</Text>
    {(slide.bulletPoints || []).map((bp, i) => (
      <Text key={i} style={styles.fallbackBullet}>• {bp}</Text>
    ))}
  </View>
);

/* ------------------------------------------------------------------ */
/* Export: picks correct renderer by platform                          */
/* ------------------------------------------------------------------ */
export const SlideRenderer: React.FC<Props> = (props) =>
  Platform.OS === 'web' ? (
    <SlideRendererWeb {...props} />
  ) : (
    <SlideRendererNative {...props} />
  );

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E1F5FE',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  fallback: {
    flex: 1,
    padding: 20,
    backgroundColor: '#E1F5FE',
    borderRadius: 16,
  },
  fallbackTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0277BD',
    marginBottom: 12,
  },
  fallbackContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 12,
  },
  fallbackBullet: {
    fontSize: 15,
    color: '#37474F',
    lineHeight: 22,
    paddingVertical: 3,
  },
});
