# Scrollio - Micro-Learning Mobile App

## Project Overview

Scrollio is a TikTok-style educational video platform that transforms passive scrolling into measurable learning progress. We deliver personalized educational content through short-form videos (under 60 seconds), AI-generated narrator characters, interactive quizzes, and gamification elements.

**Vision:** Turn screen time into learning time by providing high-quality, engaging educational content in bite-sized formats that fit into users' daily routines.

**Target Users:**
- **The Learner (13+):** Young adults and professionals who want to learn but struggle with time and motivation
- **The Child (7-12):** Kids who learn best through imagination and play
- **The Parent:** Parents seeking safe, enriching digital experiences for their children

## Tech Stack

- **Frontend:** React Native with Expo and TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Video Storage:** AWS S3 + CloudFront CDN
- **State Management:** Redux Toolkit
- **Navigation:** React Navigation v6
- **Video Playback:** expo-av
- **AI Services:** OpenAI (content generation), ElevenLabs (voice synthesis)
- **Testing:** Jest, React Native Testing Library, Detox (E2E)
- **CI/CD:** GitHub Actions, EAS Build

## Project Structure

This repository is organized as a monorepo with two main directories:

### `/brain/` - Documentation & Context (AI Project Brain)
All documentation, architecture decisions, API references, and context files that help AI agents and developers understand the project.

```
brain/
├── CLAUDE.md                    # This file - primary AI context
├── .cursorrules                 # Coding standards
├── 00-core/                     # Foundation documents
├── 01-architecture/             # System design & ADRs
├── 02-features/                 # Feature specifications
├── 03-api/                      # API documentation
├── 04-development/              # Developer guides
├── 05-components/               # Component library docs
├── 06-security/                 # Security & compliance
├── 07-deployment/               # Operations
├── 08-examples/                 # Code examples
└── 09-references/               # External resources
```

### `/code/` - Source Code
All implementation code, tests, and configurations.

```
code/
├── mobile-app/                  # React Native application
├── supabase/                    # Database migrations & Edge Functions
└── infrastructure/              # AWS infrastructure as code
```

## Key Features

1. **Personalized Micro-Learning:** AI-curated educational video feed tailored to user interests
2. **AI-Generated Narrators:** Topic-specific AI characters deliver content engagingly
3. **Expert Content:** Hybrid model combining AI-generated and human expert videos
4. **Interactive Quizzes:** Periodic assessments to reinforce learning
5. **Gamification:** Progress tracking, XP points, levels, and achievements
6. **Parental Controls:** Comprehensive monitoring and content filtering for kids (COPPA compliant)
7. **Safe Environment:** Strong content curation and age-appropriate filtering

## Development Guidelines

### Getting Started

1. **Read First:**
   - [brain/00-core/QUICK_START.md](brain/00-core/QUICK_START.md) - Setup instructions
   - [brain/01-architecture/system-architecture.md](brain/01-architecture/system-architecture.md) - System overview
   - [brain/01-architecture/database-schema.md](brain/01-architecture/database-schema.md) - Data model

2. **Understand the Architecture:**
   - Review Architecture Decision Records (ADRs) in `brain/01-architecture/decisions/`
   - Check feature documentation in `brain/02-features/` before modifying features

3. **Follow Standards:**
   - Read `brain/04-development/standards/coding-style.md`
   - Use TypeScript strict mode - avoid `any` types
   - Follow the established folder structure

### Key Principles

**TypeScript-First:**
- Use strict typing throughout
- Define interfaces for all props and data structures
- Avoid `any` - use `unknown` if type is truly unknown

**Functional Components:**
- Always use functional components with hooks
- No class components

**Performance:**
- Optimize FlatLists with `getItemLayout`, `keyExtractor`, `removeClippedSubviews`
- Use React.memo strategically for expensive components
- Lazy load heavy components
- Video feed must maintain 60fps scrolling

**Security:**
- Enable Row Level Security (RLS) on ALL Supabase tables
- Document all RLS policies in `brain/06-security/rls-policies.md`
- Never commit secrets, API keys, or credentials
- Validate all user input

**Accessibility:**
- Follow WCAG 2.1 AA standards
- Add accessibility labels to all interactive elements
- Support screen readers
- Ensure sufficient color contrast

**Feature-Based Organization:**
- Organize code by feature in `src/features/`
- Keep related components, hooks, and types together
- Share common components in `src/components/common/`

### Before Making Changes

**Always:**
- Check if an ADR exists for the area you're modifying
- Review feature documentation in `brain/02-features/[feature-name]/`
- Update relevant brain docs if changing architecture or APIs
- Write tests for new features
- Update component documentation for new/modified components

**Ask First:**
- Changing database schema or RLS policies
- Adding new third-party services or dependencies
- Modifying authentication flows
- Changing video streaming architecture
- Making architectural decisions (create an ADR)

**Never:**
- Commit secrets or API keys (use environment variables)
- Disable RLS policies without security review
- Skip accessibility considerations
- Push directly to main branch (use PRs)
- Use `any` type without strong justification
- Add dependencies without documenting rationale

### Development Workflow

1. **Planning:**
   - Review/create feature documentation
   - Check for existing patterns in `brain/08-examples/`
   - Create or update ADR for architectural decisions

2. **Implementation:**
   - Follow coding standards from `.cursorrules`
   - Reference brain docs in code comments
   - Use established patterns from component library

3. **Testing:**
   - Write unit tests for utilities and hooks
   - Write component tests for UI components
   - Add integration tests for feature flows
   - Test accessibility with screen readers

4. **Documentation:**
   - Update feature docs with implementation learnings
   - Add code examples to `brain/08-examples/`
   - Update component library docs
   - Document any new environment variables

5. **Review:**
   - Self-review against coding standards
   - Ensure tests pass
   - Check documentation is updated
   - Submit PR with clear description

## Key Files to Reference

### Essential Documentation
- **Project Overview:** `brain/00-core/PROJECT_OVERVIEW.md`
- **Tech Stack Details:** `brain/00-core/TECH_STACK.md`
- **Database Schema:** `brain/01-architecture/database-schema.md`
- **System Architecture:** `brain/01-architecture/system-architecture.md`

### API References
- **Supabase Auth:** `brain/03-api/supabase/authentication.md`
- **Supabase Database:** `brain/03-api/supabase/database-api.md`
- **AWS S3 Operations:** `brain/03-api/aws/s3-operations.md`
- **Video Streaming:** `brain/03-api/aws/video-streaming.md`

### Development Guides
- **Setup Guide:** `brain/00-core/QUICK_START.md`
- **Coding Style:** `brain/04-development/standards/coding-style.md`
- **Testing Guide:** `brain/04-development/testing/`
- **Troubleshooting:** `brain/04-development/troubleshooting.md`

### Feature Documentation
- **Video Feed:** `brain/02-features/video-feed/overview.md`
- **Quiz System:** `brain/02-features/quiz-system/overview.md`
- **AI Narrators:** `brain/02-features/ai-narrators/overview.md`
- **Parental Controls:** `brain/02-features/parental-controls/overview.md`

### Component Library
- **Component Template:** `brain/05-components/_component-template.md`
- **Video Player:** `brain/05-components/video-player.md`
- **Quiz Card:** `brain/05-components/quiz-card.md`

### Code Examples
- **Common Patterns:** `brain/08-examples/common-patterns/`
- **API Usage:** `brain/08-examples/api-usage/`
- **Component Examples:** `brain/08-examples/component-examples/`

## Special Considerations

### COPPA Compliance (Kids Version)
- All content for ages 7-12 must be COPPA compliant
- Parental consent required before data collection
- No personalized ads or behavioral tracking for kids
- See `brain/06-security/data-privacy.md` for full requirements

### Performance Targets
- Video feed must maintain 60fps scrolling
- App launch time under 3 seconds
- Video playback starts within 1 second
- Offline support for downloaded content

### Content Safety
- AI-generated content goes through safety filters
- High-stakes topics (finance, health) prioritize expert content
- User reporting mechanism for inappropriate content
- Age-appropriate content filtering

### Localization
- Support for 10+ languages planned
- Use i18n for all user-facing strings
- RTL language support required

### Offline Support
- Core features work without connectivity
- Downloaded videos playable offline
- Progress syncs when back online

## Common Patterns

### Supabase Database Query
```typescript
import { supabase } from '@/services/supabase/client';

const fetchVideos = async (topicId: string) => {
  const { data, error } = await supabase
    .from('videos')
    .select('*, topics(*)')
    .eq('topic_id', topicId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data;
};
```

### Redux Slice Pattern
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FeedState {
  videos: Video[];
  loading: boolean;
  error: string | null;
}

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    setVideos: (state, action: PayloadAction<Video[]>) => {
      state.videos = action.payload;
    },
  },
});
```

### Component Pattern
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface VideoCardProps {
  title: string;
  duration: number;
  onPress: () => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ title, duration, onPress }) => {
  // See brain/05-components/video-card.md for full documentation
  return (
    <View style={styles.container}>
      {/* Implementation */}
    </View>
  );
};
```

## Boundaries & Guidelines

### Always Do
- Write tests for new features
- Update documentation when changing APIs
- Follow the established folder structure
- Use TypeScript strict mode
- Enable RLS on new Supabase tables
- Validate user input
- Handle errors gracefully
- Add accessibility labels
- Use environment variables for config

### Ask First
- Changing database schema
- Adding new third-party services
- Modifying authentication flows
- Changing video streaming architecture
- Making architectural decisions
- Changing state management patterns

### Never Do
- Commit secrets or API keys
- Disable RLS policies without security review
- Skip accessibility considerations
- Push directly to main branch
- Use `any` type liberally
- Ignore TypeScript errors
- Skip tests for features
- Hard-code configuration values

## Troubleshooting

For common issues and solutions, see:
- `brain/04-development/troubleshooting.md`
- Check existing GitHub Issues
- Review relevant ADRs for context on architectural decisions

## Contact & Resources

- **Architecture Questions:** Review ADRs in `brain/01-architecture/decisions/`
- **Setup Issues:** `brain/04-development/troubleshooting.md`
- **API Documentation:** `brain/03-api/`
- **Code Examples:** `brain/08-examples/`

## Contributing

1. Review this file and related documentation
2. Follow the development workflow above
3. Keep documentation in sync with code
4. Write clear, descriptive commit messages
5. Update tests and docs in the same PR as code changes

---

**Remember:** This project brain exists to help you understand the system and make consistent, well-informed decisions. When in doubt, consult the relevant documentation in the `brain/` directory.
