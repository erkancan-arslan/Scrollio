# Scrollio - Technology Stack

**Last Updated:** December 2025
**Status:** Active

This document outlines the complete technology stack for Scrollio, including rationale for each technology choice and alternatives considered.

---

## Stack Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile Application                    │
│              React Native + Expo + TypeScript            │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Backend Services                      │
│         Supabase (Auth, Database, Realtime, Storage)    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Video Storage & CDN                   │
│              AWS S3 + CloudFront CDN                     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    AI Services                           │
│         OpenAI (Content) + ElevenLabs (Voices)          │
└─────────────────────────────────────────────────────────┘
```

---

## Frontend

### React Native
**Version:** 0.74+
**Website:** https://reactnative.dev/

**Why React Native:**
- **Cross-platform:** Single codebase for iOS and Android
- **Performance:** Native performance with JavaScript flexibility
- **Ecosystem:** Massive library ecosystem and community support
- **Developer experience:** Hot reloading, excellent debugging tools
- **Team familiarity:** Most common framework for mobile development
- **Video support:** Strong libraries for video playback (expo-av, react-native-video)

**Alternatives Considered:**
- **Flutter:** Strong performance, but less mature ecosystem for video and less team familiarity
- **Native (Swift/Kotlin):** Best performance, but 2x development effort for separate codebases
- **Ionic/Cordova:** Rejected due to performance concerns for video-heavy app

**ADR:** See `brain/01-architecture/decisions/001-react-native-framework.md`

---

### Expo
**Version:** SDK 51+
**Website:** https://expo.dev/

**Why Expo:**
- **Faster development:** Pre-configured build system, no native code setup
- **Over-the-air updates:** Push updates without app store review
- **Expo Router:** File-based routing for React Native
- **EAS Build:** Managed CI/CD for React Native apps
- **Rich SDK:** Camera, video, file system, notifications out of the box
- **expo-av:** Excellent video playback capabilities

**Alternatives Considered:**
- **React Native CLI:** More control, but slower development and more complex setup
- **Bare React Native:** Considered for later if we need more native control

**Trade-offs:**
- Slightly larger bundle size
- Limited to Expo's supported native modules (can eject if needed)

**ADR:** See `brain/01-architecture/decisions/002-expo-framework.md`

---

### TypeScript
**Version:** 5.3+
**Website:** https://www.typescriptlang.org/

**Why TypeScript:**
- **Type safety:** Catch errors at compile time, not runtime
- **Better IDE support:** Autocomplete, refactoring, inline documentation
- **Maintainability:** Easier to understand and refactor large codebases
- **Team productivity:** Reduces bugs, improves code quality
- **Required for Supabase:** Supabase generates TypeScript types from database schema

**Alternatives Considered:**
- **JavaScript:** Rejected due to lack of type safety for large codebase
- **Flow:** Less popular, smaller ecosystem than TypeScript

**Configuration:**
- Strict mode enabled
- No implicit `any`
- All libraries must have TypeScript types or `@types/*` definitions

---

### State Management: Redux Toolkit
**Version:** 2.0+
**Website:** https://redux-toolkit.js.org/

**Why Redux Toolkit:**
- **Predictable state:** Single source of truth for app state
- **DevTools:** Time-travel debugging, state inspection
- **Middleware:** Easy async logic with Redux Thunk
- **Scalability:** Proven for large applications
- **Ecosystem:** Extensive middleware and tooling
- **Simplified Redux:** Less boilerplate than classic Redux

**Alternatives Considered:**
- **Zustand:** Simpler but less feature-rich for large apps
- **Recoil:** Interesting but less mature ecosystem
- **Context API:** Too limited for complex state management
- **MobX:** Rejected due to less predictability and team familiarity

**Usage:**
- Global state: Auth, user profile, feed state
- Local state: Component-specific state (use `useState`)
- Server state: Redux Toolkit Query for API caching

**ADR:** See `brain/01-architecture/decisions/003-state-management.md`

---

### Navigation: React Navigation v6
**Version:** 6.x
**Website:** https://reactnavigation.org/

**Why React Navigation:**
- **Industry standard:** Most popular navigation library for React Native
- **Expo integration:** Works seamlessly with Expo Router
- **Flexible:** Stack, tab, drawer navigation out of the box
- **Type-safe:** Full TypeScript support
- **Animations:** Smooth transitions, customizable gestures
- **Deep linking:** Support for universal links

**Alternatives Considered:**
- **React Native Navigation:** More native but complex setup
- **Expo Router only:** Considered, but React Navigation provides more control

**Navigation Structure:**
- Stack navigation for auth flow
- Tab navigation for main app (Feed, Explore, Profile)
- Modal navigation for quizzes and detail screens

---

### UI Component Library
**Strategy:** Custom components with design system

**Why Custom:**
- **Brand identity:** Need unique look and feel (TikTok-style feed)
- **Performance:** Video-heavy app needs optimized components
- **Flexibility:** Custom components avoid library constraints

**Core Libraries:**
- **react-native-reanimated:** High-performance animations
- **react-native-gesture-handler:** Smooth gestures (swipe, pan)
- **react-native-svg:** Custom icons and illustrations

**Alternatives Considered:**
- **React Native Paper:** Too Material Design-focused
- **NativeBase:** Good but adds bundle size
- **UI Kitten:** Rejected for performance concerns

---

## Backend

### Supabase
**Version:** 2.x
**Website:** https://supabase.com/

**Why Supabase:**
- **PostgreSQL:** Powerful, reliable relational database
- **Built-in Auth:** Email/password, OAuth, magic links out of the box
- **Row Level Security (RLS):** Database-level security for user data
- **Realtime:** WebSocket subscriptions for live data
- **Storage:** File uploads with access control
- **Edge Functions:** Serverless Deno functions
- **Auto-generated APIs:** REST and GraphQL APIs from schema
- **TypeScript support:** Auto-generate types from database schema
- **Developer experience:** Excellent dashboard, local development
- **Cost:** Free tier for MVP, scales affordably

**Alternatives Considered:**
- **Firebase:** Rejected due to NoSQL limitations for complex queries
- **AWS Amplify:** More complex setup, less developer-friendly
- **Custom backend (Node.js + PostgreSQL):** More control but 5x development time
- **Hasura:** Great GraphQL but less feature-rich than Supabase

**Supabase Features Used:**
- **Auth:** User registration, login, session management
- **Database:** PostgreSQL for all structured data
- **RLS:** User-specific data access control
- **Storage:** User avatars, video thumbnails (small files)
- **Realtime:** Live quiz scores, leaderboards
- **Edge Functions:** Video processing webhooks, quiz grading

**ADR:** See `brain/01-architecture/decisions/004-supabase-backend.md`

---

### Database: PostgreSQL (via Supabase)
**Version:** 15+
**Website:** https://www.postgresql.org/

**Why PostgreSQL:**
- **Relational data:** User profiles, videos, quizzes have clear relationships
- **ACID compliance:** Data integrity for quiz scores, user progress
- **Complex queries:** Advanced filtering, sorting, aggregations
- **Full-text search:** Search videos by title, description
- **JSON support:** Flexible schema for quiz questions, video metadata
- **Mature ecosystem:** Battle-tested, extensive tooling
- **RLS:** Row-level security for multi-tenant data

**Alternatives Considered:**
- **MongoDB:** Rejected due to lack of relational integrity
- **MySQL:** Good, but PostgreSQL has better JSON and full-text search

**Schema Design:**
- Normalized tables for users, videos, quizzes, topics
- RLS policies for data security
- Indexes for performance
- See `brain/01-architecture/database-schema.md` for full schema

**ADR:** See `brain/01-architecture/decisions/005-postgresql-database.md`

---

## Video Storage & Delivery

### AWS S3
**Version:** Latest
**Website:** https://aws.amazon.com/s3/

**Why AWS S3:**
- **Scalability:** Unlimited storage, proven at massive scale
- **Reliability:** 99.999999999% durability
- **Cost-effective:** Pay only for what you use, cheap for large files
- **Security:** Fine-grained access control with IAM and bucket policies
- **Integration:** Works seamlessly with CloudFront CDN
- **Pre-signed URLs:** Secure, time-limited upload/download links
- **Lifecycle policies:** Automatic archiving to Glacier for old content

**Alternatives Considered:**
- **Supabase Storage:** Good for small files, but expensive and slower for video
- **Cloudflare R2:** Interesting (S3-compatible, no egress fees), but less mature
- **Google Cloud Storage:** Good, but team has more AWS experience
- **Self-hosted:** Rejected due to operational complexity

**S3 Structure:**
```
scrollio-videos/
├── raw/                 # Original uploaded videos
│   └── {video-id}.mp4
├── transcoded/          # Processed videos (multiple resolutions)
│   ├── 360p/
│   ├── 720p/
│   └── 1080p/
└── thumbnails/          # Video thumbnails
    └── {video-id}.jpg
```

**ADR:** See `brain/01-architecture/decisions/006-video-storage-s3.md`

---

### AWS CloudFront CDN
**Version:** Latest
**Website:** https://aws.amazon.com/cloudfront/

**Why CloudFront:**
- **Global delivery:** Edge locations worldwide for low latency
- **Bandwidth:** High throughput for video streaming
- **Cost:** Reasonable pricing for video delivery
- **S3 integration:** Native integration with S3
- **Caching:** Reduce S3 requests and costs
- **Security:** HTTPS, signed URLs, geo-restrictions
- **Video optimizations:** Adaptive bitrate streaming support

**Alternatives Considered:**
- **Direct S3:** Slow, expensive egress costs, no caching
- **Cloudflare:** Great, but AWS ecosystem integration
- **Fastly:** Expensive for startup scale

**Configuration:**
- Cache control: 1 week for videos (immutable content)
- Geo-restrictions: Optional per market regulations
- Signed URLs: For premium/paid content (future)

---

### Video Playback: expo-av
**Version:** Latest with Expo SDK
**Website:** https://docs.expo.dev/versions/latest/sdk/av/

**Why expo-av:**
- **Expo integration:** Native support in Expo ecosystem
- **Cross-platform:** iOS and Android with same API
- **HLS support:** Adaptive bitrate streaming
- **Control:** Play, pause, seek, playback rate
- **Events:** Progress, buffering, errors
- **Background audio:** For audio-only mode (future)

**Alternatives Considered:**
- **react-native-video:** More features, but Expo integration is complex
- **Native players:** Best performance, but 2x development effort

**ADR:** See `brain/01-architecture/decisions/007-video-playback-expo-av.md`

---

## AI Services

### OpenAI
**API:** GPT-4, DALL-E 3
**Website:** https://openai.com/

**Why OpenAI:**
- **Content generation:** GPT-4 for educational video scripts
- **Quality:** Best-in-class for coherent, educational content
- **API reliability:** Mature, well-documented API
- **Customization:** Fine-tuning for educational tone and style

**Use Cases:**
- Generate video scripts for AI narrators
- Generate quiz questions from video content
- Content moderation and safety checks
- Personalization recommendations

**Alternatives Considered:**
- **Anthropic Claude:** Excellent, but OpenAI has better API ecosystem
- **Google PaLM:** Good, but less accessible API
- **Open-source LLMs:** Cheaper but require hosting and less quality

**Cost Management:**
- Cache frequent prompts
- Use GPT-3.5 for non-critical tasks
- Batch requests where possible

---

### ElevenLabs
**API:** Voice synthesis
**Website:** https://elevenlabs.io/

**Why ElevenLabs:**
- **Voice quality:** Most natural-sounding AI voices
- **Variety:** Multiple voices for different narrator characters
- **Customization:** Clone voices, adjust speed and emotion
- **API:** Easy integration, reliable
- **Pricing:** Reasonable for startup scale

**Use Cases:**
- Generate voiceovers for AI-narrated videos
- Create unique voices for AI narrator characters
- Multi-language support (future)

**Alternatives Considered:**
- **Google Text-to-Speech:** Cheaper but less natural
- **Amazon Polly:** Good but voices less engaging
- **Azure Speech Services:** Considered, but ElevenLabs has better quality

**Voice Management:**
- 5-10 distinct narrator characters (different topics)
- Cache generated audio to reduce API costs

---

## Development Tools

### Version Control: Git + GitHub
**Why GitHub:**
- **Industry standard:** Most popular Git hosting
- **CI/CD:** GitHub Actions for build and deployment
- **Issue tracking:** Built-in project management
- **Code review:** Pull requests with inline comments
- **Team collaboration:** Permissions, branch protection

---

### CI/CD: GitHub Actions + EAS Build
**Why GitHub Actions:**
- **Native integration:** Built into GitHub
- **Free tier:** Generous for private repositories
- **Flexibility:** Custom workflows for testing, building, deploying

**Why EAS Build (Expo Application Services):**
- **Managed builds:** No need to maintain build servers
- **iOS builds without Mac:** Build iOS apps in cloud
- **Over-the-air updates:** Push updates without app store review
- **Versioning:** Automatic versioning and changelog

**Workflows:**
1. **On Pull Request:** Run tests, linting, type checking
2. **On Merge to Main:** Build preview version, deploy to TestFlight/Internal Testing
3. **On Tag:** Build production version, submit to app stores

---

### Testing

**Unit & Integration Tests:**
- **Jest:** Test runner, mocking, assertions
- **React Native Testing Library:** Component testing
- **@testing-library/jest-dom:** DOM assertions

**End-to-End Tests:**
- **Detox:** E2E testing for React Native
- Covers critical user flows (login, video playback, quiz submission)

**Code Quality:**
- **ESLint:** JavaScript/TypeScript linting
- **Prettier:** Code formatting
- **TypeScript:** Static type checking

**Test Coverage Target:**
- Unit tests: >80% for utils, hooks, services
- Integration tests: >60% for features
- E2E tests: Critical user flows (5-10 scenarios)

---

### Package Manager: npm
**Version:** 10+

**Why npm:**
- **Default:** Comes with Node.js
- **Workspaces:** Monorepo support
- **Performance:** Improved caching and speed in v10+

**Alternatives Considered:**
- **Yarn:** Good, but npm is sufficient
- **pnpm:** Fast, but less team familiarity

---

### Code Editor: VS Code (Recommended)
**Why VS Code:**
- **TypeScript support:** Best-in-class
- **Extensions:** React Native Tools, Expo Tools, ESLint, Prettier
- **Debugging:** Excellent React Native debugging
- **Team standard:** Most popular editor

**Recommended Extensions:**
- React Native Tools
- Expo Tools
- ESLint
- Prettier
- GitLens
- TypeScript Error Translator

---

## Monitoring & Analytics

### Analytics: Mixpanel (Planned)
**Why Mixpanel:**
- **Event tracking:** Track user interactions (video watched, quiz completed)
- **Cohort analysis:** User retention, engagement
- **Funnels:** Conversion tracking (signup → first video → first quiz)
- **Free tier:** Generous for MVP

**Alternatives Considered:**
- **Google Analytics:** Less suited for mobile apps
- **Amplitude:** Great, but more expensive
- **Firebase Analytics:** Good, but locked into Firebase ecosystem

---

### Error Tracking: Sentry (Planned)
**Why Sentry:**
- **Real-time error tracking:** Know when app crashes
- **Stack traces:** Debug production errors
- **Performance monitoring:** Track app performance
- **React Native support:** First-class integration

**Alternatives Considered:**
- **Bugsnag:** Good, but Sentry has better free tier
- **Rollbar:** Considered, but Sentry is more popular

---

### Logging: Supabase Logs + CloudWatch
**Why:**
- **Supabase Logs:** Database queries, Edge Function logs
- **AWS CloudWatch:** S3 access logs, CloudFront logs

---

## Infrastructure as Code

### Terraform (Planned)
**Why Terraform:**
- **Multi-cloud:** Manage AWS and Supabase resources
- **Version control:** Infrastructure changes tracked in Git
- **Reproducibility:** Spin up environments easily
- **Team collaboration:** Shared infrastructure state

**Alternatives Considered:**
- **AWS CloudFormation:** AWS-only, less readable syntax
- **Pulumi:** Interesting but less mature ecosystem
- **Manual setup:** Rejected for reproducibility and scaling

**Managed Resources:**
- AWS S3 buckets, CloudFront distributions
- IAM roles and policies
- (Supabase managed via dashboard initially)

---

## Security & Compliance

### Authentication: Supabase Auth
- Email/password authentication
- OAuth (Google, Apple)
- Magic links (future)
- Session management with JWTs

### Authorization: Row Level Security (RLS)
- Database-level security
- User-specific data access
- Prevent unauthorized access

### Data Privacy: COPPA Compliance
- Parental consent for users under 13
- Limited data collection for kids
- No personalized ads for kids
- See `brain/06-security/data-privacy.md`

### Content Safety
- AI moderation (OpenAI Moderation API)
- Human moderation queue
- User reporting mechanism

---

## Environment Management

### Environments
1. **Development:** Local development, Supabase local
2. **Staging:** Preview builds, testing
3. **Production:** Live app for end users

### Environment Variables
Managed via:
- `.env` files (local development)
- EAS Secrets (mobile app builds)
- Supabase Dashboard (Edge Functions)
- AWS Parameter Store (infrastructure)

**Required Variables:**
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- `AWS_S3_BUCKET`, `AWS_REGION`, `AWS_CLOUDFRONT_DOMAIN`
- `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`
- `APP_ENV` (development, staging, production)

---

## Cost Estimates (MVP, Month 1-3)

### Supabase
- **Tier:** Free tier initially, then Pro ($25/month)
- **Costs:** Database, Auth, Storage (small files only)

### AWS S3 + CloudFront
- **Storage:** $0.023/GB (~100GB = $2.30/month)
- **CloudFront:** $0.085/GB transfer (~1TB = $85/month)
- **Total:** ~$100-150/month for 1,000 active users

### OpenAI
- **GPT-4:** $0.03/1K tokens (input), $0.06/1K tokens (output)
- **Estimated:** $200-500/month for content generation

### ElevenLabs
- **Tier:** Creator ($22/month, 30K characters)
- **Estimated:** $100-200/month for voiceovers

### Expo EAS
- **Tier:** Free for development, Production ($99/month)

### Total Estimated Cost (MVP): **$500-1,000/month**

---

## Scalability Plan

### Phase 1 (MVP, 0-10K users)
- Supabase Pro
- AWS S3 + CloudFront
- Single region (US)

### Phase 2 (10K-100K users)
- Supabase Team/Enterprise
- Multi-region CloudFront
- Video transcoding pipeline (AWS MediaConvert)
- Redis caching (Upstash)

### Phase 3 (100K+ users)
- Dedicated Supabase instance
- Multi-region S3 replication
- Microservices for content generation
- Kubernetes for backend services (if needed)

---

## Technology Decisions Summary

| Category | Technology | Rationale |
|----------|-----------|-----------|
| Mobile Framework | React Native + Expo | Cross-platform, fast development, video support |
| Language | TypeScript | Type safety, maintainability |
| State Management | Redux Toolkit | Scalable, predictable state |
| Navigation | React Navigation v6 | Industry standard, flexible |
| Backend | Supabase | All-in-one, PostgreSQL, RLS, Realtime |
| Database | PostgreSQL | Relational, ACID, complex queries |
| Video Storage | AWS S3 | Scalable, reliable, cost-effective |
| CDN | AWS CloudFront | Global delivery, low latency |
| Video Playback | expo-av | Expo integration, HLS support |
| AI Content | OpenAI (GPT-4) | Best quality for educational content |
| AI Voices | ElevenLabs | Most natural voices |
| CI/CD | GitHub Actions + EAS | Automated builds and deployments |
| Testing | Jest, React Native Testing Library, Detox | Comprehensive testing coverage |

---

## Future Considerations

### Potential Additions
- **Redis:** Caching layer for frequently accessed data
- **Elasticsearch:** Advanced video search
- **AWS MediaConvert:** Video transcoding for adaptive bitrate
- **GraphQL:** Replace REST APIs with GraphQL (Hasura or custom)
- **WebSockets:** Custom real-time features beyond Supabase Realtime

### Potential Replacements
- **expo-av → react-native-video:** If need more advanced video features
- **Supabase → Custom backend:** If outgrow Supabase limitations (unlikely)

---

**For more details:**
- **Architecture Decisions:** See `brain/01-architecture/decisions/` for all ADRs
- **Database Schema:** See `brain/01-architecture/database-schema.md`
- **API Documentation:** See `brain/03-api/`
