# Scrollio - Micro-Learning Mobile App

**Transform passive scrolling into measurable learning progress**

Scrollio is a TikTok-style educational video platform that delivers personalized learning content through short-form videos, AI-generated narrator characters, interactive quizzes, and gamification.

---

## 🎯 Project Structure

This repository is organized as a **monorepo** with two main directories:

```
scrollio-v1/
├── brain/                    # 🧠 Documentation & AI Context
│   ├── CLAUDE.md            # Primary AI context file
│   ├── .cursorrules         # Coding standards
│   ├── 00-core/             # Foundation docs
│   ├── 01-architecture/     # System design & ADRs
│   ├── 02-features/         # Feature specifications
│   ├── 03-api/              # API documentation
│   ├── 04-development/      # Developer guides
│   ├── 05-components/       # Component library docs
│   ├── 06-security/         # Security & compliance
│   ├── 07-deployment/       # Operations
│   ├── 08-examples/         # Code examples
│   └── 09-references/       # External resources
│
└── code/                    # 💻 Source Code
    ├── mobile-app/          # React Native application
    ├── supabase/            # Database migrations & Edge Functions
    └── infrastructure/      # AWS infrastructure as code
```

---

## 🚀 Quick Start

### For Developers

**Get up and running in 30 minutes:**

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd scrollio-v1
   ```

2. **Read the setup guide:**
   [brain/00-core/QUICK_START.md](brain/00-core/QUICK_START.md)

3. **Set up Supabase:**
   ```bash
   cd code
   supabase start
   ```

4. **Start the mobile app:**
   ```bash
   cd code/mobile-app
   npm install
   npm start
   ```

**Full setup instructions:** [brain/00-core/QUICK_START.md](brain/00-core/QUICK_START.md)

---

### For AI Agents

**Start here for complete project context:**

1. **Primary context file:** [brain/CLAUDE.md](brain/CLAUDE.md)
2. **Coding standards:** [.cursorrules](.cursorrules)
3. **Project overview:** [brain/00-core/PROJECT_OVERVIEW.md](brain/00-core/PROJECT_OVERVIEW.md)
4. **Tech stack:** [brain/00-core/TECH_STACK.md](brain/00-core/TECH_STACK.md)
5. **Database schema:** [brain/01-architecture/database-schema.md](brain/01-architecture/database-schema.md)

**Full brain documentation:** [brain/README.md](brain/README.md)

---

## 📱 Product Overview

### What is Scrollio?

Scrollio transforms passive scrolling time into measurable learning progress using:
- **Short educational videos** (<60 seconds)
- **AI-generated narrator characters** for engaging content delivery
- **Interactive quizzes** to reinforce learning
- **Gamification** (XP, levels, achievements) to maintain motivation
- **Expert content** for high-stakes topics (finance, health)
- **Parental controls** for safe kids experience (ages 7-12)

### Target Users

1. **The Learner (13+):** Young adults and professionals who want to learn in short bursts
2. **The Child (7-12):** Kids who learn through imagination and play
3. **The Parent:** Parents seeking safe, enriching digital experiences for their children

**Full product details:** [brain/00-core/PROJECT_OVERVIEW.md](brain/00-core/PROJECT_OVERVIEW.md)

---

## 🛠️ Technology Stack

### Frontend
- **React Native** with **Expo** and **TypeScript**
- **Redux Toolkit** for state management
- **React Navigation v6** for navigation
- **expo-av** for video playback

### Backend
- **Supabase** (PostgreSQL, Auth, Realtime, Storage)
- **AWS S3** + **CloudFront CDN** for video storage/delivery

### AI Services
- **OpenAI GPT-4** for content generation
- **ElevenLabs** for AI voice synthesis

### Development Tools
- **GitHub Actions** + **EAS Build** for CI/CD
- **Jest** + **React Native Testing Library** for testing
- **ESLint** + **Prettier** for code quality

**Full stack details:** [brain/00-core/TECH_STACK.md](brain/00-core/TECH_STACK.md)

---

## 📚 Documentation

### Essential Reading

| Document | Purpose | Audience |
|----------|---------|----------|
| [brain/CLAUDE.md](brain/CLAUDE.md) | Primary AI context | AI Agents, All Devs |
| [brain/00-core/QUICK_START.md](brain/00-core/QUICK_START.md) | Setup guide | New Developers |
| [brain/00-core/PROJECT_OVERVIEW.md](brain/00-core/PROJECT_OVERVIEW.md) | Product vision | Everyone |
| [brain/00-core/TECH_STACK.md](brain/00-core/TECH_STACK.md) | Technology choices | Engineers |
| [brain/01-architecture/database-schema.md](brain/01-architecture/database-schema.md) | Database design | Backend Devs |
| [.cursorrules](.cursorrules) | Coding standards | All Devs |

**Complete documentation:** [brain/README.md](brain/README.md)

---

## 🎯 Key Features

### Phase 1: MVP (Months 1-3)
- ✅ Personalized video feed (TikTok-style)
- ✅ User authentication (Supabase Auth)
- ✅ Interactive quizzes
- ✅ Gamification (XP, levels)
- ✅ AWS S3 video storage
- ✅ Database with RLS security

### Phase 2: Kids Version (Months 4-6)
- 🔲 Parental controls dashboard
- 🔲 AI character generation from child's drawing
- 🔲 Content safety filtering
- 🔲 COPPA compliance

### Phase 3: Content Platform (Months 7-9)
- 🔲 Content creator platform
- 🔲 Expert verification
- 🔲 Revenue sharing

### Phase 4: B2B (Months 10-12)
- 🔲 White-label solution
- 🔲 Enterprise dashboard

**Detailed roadmap:** [brain/00-core/PROJECT_OVERVIEW.md](brain/00-core/PROJECT_OVERVIEW.md)

---

## 🧪 Development

### Prerequisites

- Node.js 18+
- Docker Desktop (for Supabase local)
- Expo CLI
- Supabase CLI

### Setup

```bash
# Install dependencies
cd code/mobile-app
npm install

# Start Supabase
cd code
supabase start

# Start mobile app
cd code/mobile-app
npm start
```

### Available Scripts

```bash
# Mobile App
npm start           # Start Expo dev server
npm run ios         # Run on iOS simulator
npm run android     # Run on Android emulator
npm test            # Run tests
npm run lint        # Run ESLint
npm run type-check  # TypeScript check

# Supabase
supabase start      # Start local Supabase
supabase stop       # Stop local Supabase
supabase db push    # Apply migrations
supabase db reset   # Reset database
```

**Full development guide:** [brain/04-development/](brain/04-development/)

---

## 🏗️ Architecture

### High-Level Architecture

```
Mobile App (React Native + Expo)
        ↓
Supabase (Auth, Database, Realtime)
        ↓
AWS S3 + CloudFront (Video Storage & Delivery)
        ↓
OpenAI + ElevenLabs (AI Content & Voices)
```

### Database Schema

- **users** (Supabase Auth) → **profiles** → **user_progress**
- **topics** → **videos** → **quizzes** → **quiz_attempts**
- **ai_characters** → **videos**
- **parental_controls** → **child_profiles**

**Full schema:** [brain/01-architecture/database-schema.md](brain/01-architecture/database-schema.md)

**Architecture decisions:** [brain/01-architecture/decisions/](brain/01-architecture/decisions/)

---

## 🔒 Security

### Row Level Security (RLS)

All Supabase tables have RLS enabled:
- Users can only access their own data
- Public read for videos, topics, quizzes
- Admin-only access for moderation

### Data Privacy

- **COPPA compliant** for users under 13
- Parental consent required for kids
- No personalized ads for children
- Limited data collection for minors

**Security documentation:** [brain/06-security/](brain/06-security/)

---

## 🧪 Testing

### Test Strategy

- **Unit tests:** Utils, hooks, services (>80% coverage)
- **Integration tests:** Features, components (>60% coverage)
- **E2E tests:** Critical user flows (Detox)

### Running Tests

```bash
# Unit tests
npm test

# Test coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

**Testing guide:** [brain/04-development/testing/](brain/04-development/testing/)

---

## 📦 Deployment

### Environments

- **Development:** Local development with Supabase local
- **Staging:** Preview builds via EAS Build
- **Production:** Live app in app stores

### CI/CD Pipeline

- **GitHub Actions** for automated builds
- **EAS Build** for mobile app builds
- **Over-the-air updates** for quick fixes

**Deployment guide:** [brain/07-deployment/](brain/07-deployment/)

---

## 🤝 Contributing

### Guidelines

1. **Read the docs:**
   - [CLAUDE.md](brain/CLAUDE.md) for context
   - [.cursorrules](.cursorrules) for coding standards

2. **Follow the workflow:**
   - Create feature branch
   - Write tests
   - Update documentation
   - Submit PR

3. **Code standards:**
   - TypeScript strict mode
   - ESLint + Prettier
   - Follow established patterns

4. **Documentation:**
   - Update docs with code changes
   - Create ADRs for architectural decisions
   - Add code examples

**Development standards:** [brain/04-development/standards/](brain/04-development/standards/)

---

## 📄 License

[Your License Here]

---

## 👥 Team

- **Product Lead:** [Name]
- **Tech Lead:** [Name]
- **Frontend Engineers:** [Names]
- **Backend Engineers:** [Names]
- **Design:** [Name]

---

## 📞 Contact

- **Issues:** [GitHub Issues](your-repo-issues-url)
- **Documentation:** [brain/](brain/)
- **Email:** [your-email]

---

## 🎓 Resources

### Documentation
- [Complete Brain Documentation](brain/README.md)
- [Quick Start Guide](brain/00-core/QUICK_START.md)
- [API Documentation](brain/03-api/)
- [Code Examples](brain/08-examples/)

### External Resources
- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [AWS S3 Docs](https://docs.aws.amazon.com/s3/)

---

**Built with ❤️ for lifelong learners**

🧠 **Project Brain:** [brain/](brain/)
💻 **Source Code:** [code/](code/)
🚀 **Get Started:** [brain/00-core/QUICK_START.md](brain/00-core/QUICK_START.md)
