# 001. Database Choice - Supabase with PostgreSQL

**Date:** 2025-12-03
**Status:** Accepted
**Deciders:** Engineering Team, Product Team
**Tags:** backend, database, infrastructure

## Context

Scrollio needs a robust database solution to store user data, videos, quizzes, progress tracking, and more. The database must support:

**Requirements:**
- **Relational data:** Users, videos, topics, quizzes have clear relationships
- **Complex queries:** Filtering videos by topic, user progress tracking, leaderboards
- **Real-time capabilities:** Live quiz scores, leaderboard updates
- **Security:** Row-level security for multi-tenant data (users can only access their data)
- **Scalability:** Support growth from 0 to 100K+ users
- **Developer experience:** Fast iteration, easy local development
- **Cost:** Affordable for MVP stage

**Constraints:**
- MVP timeline: 3 months
- Small team (3-5 engineers)
- Limited DevOps resources
- Mobile-first application

## Decision

**We will use Supabase with PostgreSQL as our primary database and backend platform.**

Supabase provides:
- PostgreSQL database (relational)
- Built-in authentication (email/password, OAuth)
- Row Level Security (RLS) for data security
- Real-time subscriptions via WebSockets
- Auto-generated REST and GraphQL APIs
- Storage for user-uploaded files
- Edge Functions (serverless Deno functions)
- Auto-generated TypeScript types from schema

**We will:**
- Use Supabase hosted service (not self-hosted)
- Enable Row Level Security (RLS) on all tables
- Use Supabase Auth for user authentication
- Use Supabase Storage for small files (avatars, thumbnails)
- Use Supabase Edge Functions for webhook processing
- Use Supabase local development for testing

**We will not:**
- Store large video files in Supabase (use AWS S3 instead)
- Build a custom backend API (leverage auto-generated APIs)
- Manage our own PostgreSQL infrastructure

## Consequences

### Positive

- **All-in-one solution:** Database, Auth, Storage, Realtime in one platform reduces complexity
- **PostgreSQL power:** ACID compliance, complex queries, full-text search, JSON support
- **Row Level Security:** Database-level security reduces backend code and improves security
- **TypeScript integration:** Auto-generated types improve developer experience
- **Real-time capabilities:** Built-in WebSocket subscriptions for live features
- **Fast development:** No need to build auth, APIs, or database infrastructure
- **Local development:** `supabase local` for offline development and testing
- **Cost-effective:** Free tier for MVP, affordable scaling ($25/month Pro tier)
- **Managed service:** No database administration overhead

### Negative

- **Vendor lock-in:** Migrating away from Supabase would require significant effort
- **Pricing uncertainty:** Future pricing changes could impact costs
- **Less control:** Cannot customize database layer as deeply as self-hosted
- **Storage limitations:** Supabase Storage not suitable for large video files

**Mitigations:**
- Use standard PostgreSQL syntax (makes migration easier if needed)
- Abstract Supabase client behind service layer (`services/supabase/`)
- Document all RLS policies for potential migration
- Use AWS S3 for video storage (already planning this)

### Neutral

- **Learning curve:** Team needs to learn Supabase-specific patterns (RLS, Edge Functions)
- **Postgres knowledge:** Team needs to understand PostgreSQL best practices

## Alternatives Considered

### Alternative 1: Firebase (NoSQL)

**Pros:**
- Google-backed, mature platform
- Excellent real-time capabilities
- Strong mobile SDK support
- Generous free tier

**Cons:**
- NoSQL (Firestore) makes complex queries difficult
- No relational integrity (joins require client-side logic)
- Less suitable for structured data (users, videos, quizzes)
- Vendor lock-in with Firebase-specific query syntax

**Why rejected:**
Scrollio has highly relational data (users → progress → videos → quizzes → topics). NoSQL would make queries complex and error-prone. PostgreSQL's relational model is a better fit.

---

### Alternative 2: Custom Backend (Node.js + PostgreSQL)

**Pros:**
- Full control over backend architecture
- No vendor lock-in
- Can optimize exactly for our needs

**Cons:**
- 5-10x longer development time (build auth, APIs, RLS, etc.)
- Need to manage infrastructure (servers, databases, scaling)
- More DevOps overhead (monitoring, backups, updates)
- Higher operational costs

**Why rejected:**
MVP timeline is 3 months. Building a custom backend would take 6-9 months. Supabase lets us focus on product features, not infrastructure.

---

### Alternative 3: AWS Amplify

**Pros:**
- AWS ecosystem integration
- Managed backend (AppSync, DynamoDB, Cognito)
- Scalability

**Cons:**
- Complex setup and configuration
- Less developer-friendly than Supabase
- DynamoDB (NoSQL) has same issues as Firebase
- More expensive than Supabase
- Steeper learning curve

**Why rejected:**
Amplify's complexity and NoSQL limitations make it less suitable. Supabase provides better developer experience and relational database.

---

### Alternative 4: Hasura (GraphQL + PostgreSQL)

**Pros:**
- GraphQL API generation from PostgreSQL
- Row-level security
- Real-time subscriptions

**Cons:**
- No built-in auth (need to integrate with Auth0, Clerk, etc.)
- No storage solution (need separate service)
- More complex setup than Supabase
- Smaller ecosystem than Supabase

**Why rejected:**
Supabase provides everything Hasura does, plus Auth and Storage. Simpler to use for MVP.

## Implementation Notes

**Database Schema Design:**
- Normalized tables for users, profiles, videos, topics, quizzes, progress
- Foreign keys for relational integrity
- Indexes on frequently queried columns (user_id, topic_id, created_at)
- Full schema documented in `brain/01-architecture/database-schema.md`

**Row Level Security:**
- Enable RLS on ALL tables
- Users can only access their own data (profiles, progress, parental controls)
- Public read access for videos, topics, quizzes
- Document all RLS policies in `brain/06-security/rls-policies.md`

**Real-time Subscriptions:**
- Use for live leaderboards (quiz scores)
- Use for live quiz results
- Avoid overuse to minimize database load

**Edge Functions:**
- Video processing webhooks (S3 upload → metadata extraction)
- Quiz grading logic
- Content moderation webhooks

**Local Development:**
- Use `supabase start` to run local PostgreSQL
- Seed data with `supabase/seed.sql`
- Migrations in `supabase/migrations/`

## Related Decisions

- [ADR-002: Video Storage Strategy](./002-video-storage-strategy.md) - Why we use AWS S3 instead of Supabase Storage
- [ADR-003: State Management](./003-state-management.md) - Redux Toolkit for client-side state
- [ADR-004: Authentication Flow](./004-authentication-flow.md) - Supabase Auth implementation

## References

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase vs Firebase Comparison](https://supabase.com/alternatives/supabase-vs-firebase)

## Review Schedule

**Next review:** Q2 2026 or when reaching 50K users
**Review frequency:** Quarterly or when considering major backend changes

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-03 | Initial decision | Engineering Team |
