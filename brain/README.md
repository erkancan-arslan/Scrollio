# Scrollio - AI Project Brain 🧠

Welcome to the Scrollio Project Brain! This directory contains all documentation, architecture decisions, API references, and context files to help AI agents and developers understand and build Scrollio.

---

## 🎯 Purpose

This "brain" serves as a comprehensive knowledge base for:
- **AI Agents:** Providing complete context for feature development
- **Developers:** Quick reference for architecture, APIs, and patterns
- **Product Team:** Understanding technical decisions and constraints
- **New Team Members:** Fast onboarding with clear documentation

---

## 📂 Directory Structure

```
brain/
├── ENTRY.md                    # ⭐ START HERE - Primary AI context file
├── .cursorrules                 # Coding standards and rules
│
├── 00-core/                     # Foundation documents
│   ├── PROJECT_OVERVIEW.md      # Product vision and goals
│   ├── TECH_STACK.md            # Technology choices
│   ├── QUICK_START.md           # ⭐ Developer setup guide
│   └── GLOSSARY.md              # Domain terminology
│
├── 01-architecture/             # System design
│   ├── decisions/               # Architecture Decision Records (ADRs)
│   ├── system-architecture.md   # High-level system design
│   ├── data-flow.md             # User journey data flows
│   ├── database-schema.md       # ⭐ Database design
│   └── diagrams/                # Architecture diagrams
│
├── 02-features/                 # Feature specifications
│   ├── video-feed/              # Video feed feature
│   ├── quiz-system/             # Quiz and gamification
│   ├── ai-narrators/            # AI character system
│   ├── parental-controls/       # Kids safety features
│   └── personalization/         # Content recommendations
│
├── 03-api/                      # API documentation
│   ├── supabase/                # Supabase APIs
│   ├── aws/                     # AWS S3 & CloudFront
│   └── external/                # Third-party APIs
│
├── 04-development/              # Developer guides
│   ├── setup/                   # Environment setup
│   ├── standards/               # ⭐ Coding standards
│   ├── testing/                 # Testing guides
│   ├── git-workflow.md          # Git conventions
│   └── troubleshooting.md       # Common issues
│
├── 05-components/               # Component library docs
│   ├── _component-template.md   # Component doc template
│   ├── video-player.md          # Core components
│   └── ...
│
├── 06-security/                 # Security documentation
│   ├── rls-policies.md          # Database security
│   ├── authentication.md        # Auth patterns
│   ├── data-privacy.md          # COPPA compliance
│   └── content-moderation.md    # Safety guidelines
│
├── 07-deployment/               # Operations
│   ├── environments.md          # Dev, staging, production
│   ├── ci-cd-pipeline.md        # Build and deploy
│   └── monitoring.md            # Observability
│
├── 08-examples/                 # Code examples
│   ├── common-patterns/         # Reusable patterns
│   ├── api-usage/               # API integration examples
│   └── component-examples/      # Component usage
│
└── 09-references/               # External resources
    ├── react-native-best-practices.md
    ├── supabase-patterns.md
    └── useful-libraries.md
```

---

## 🚀 Quick Navigation

### For AI Agents
1. **Start here:** [ENTRY.md](ENTRY.md) - Complete project context
2. **Understand the product:** [00-core/PROJECT_OVERVIEW.md](00-core/PROJECT_OVERVIEW.md)
3. **Know the stack:** [00-core/TECH_STACK.md](00-core/TECH_STACK.md)
4. **Review architecture:** [01-architecture/](01-architecture/)
5. **Check coding rules:** [.cursorrules](.cursorrules)

### For New Developers
1. **Setup environment:** [00-core/QUICK_START.md](00-core/QUICK_START.md) ⚡
2. **Understand the system:** [01-architecture/system-architecture.md](01-architecture/system-architecture.md)
3. **Learn database schema:** [01-architecture/database-schema.md](01-architecture/database-schema.md)
4. **Read coding standards:** [04-development/standards/coding-style.md](04-development/standards/coding-style.md)
5. **See code examples:** [08-examples/](08-examples/)

### For Implementing Features
1. **Check if feature docs exist:** [02-features/](02-features/)
2. **Review relevant ADRs:** [01-architecture/decisions/](01-architecture/decisions/)
3. **Check API docs:** [03-api/](03-api/)
4. **Follow component patterns:** [05-components/](05-components/)
5. **Update docs after implementation** ✅

### For Understanding Decisions
1. **Architecture decisions:** [01-architecture/decisions/](01-architecture/decisions/)
2. **Technology choices:** [00-core/TECH_STACK.md](00-core/TECH_STACK.md)
3. **Database design:** [01-architecture/database-schema.md](01-architecture/database-schema.md)

---

## ⭐ Key Documents

| Document | Purpose | Priority |
|----------|---------|----------|
| [CLAUDE.md](CLAUDE.md) | Primary AI context and project overview | 🔴 Essential |
| [00-core/QUICK_START.md](00-core/QUICK_START.md) | Setup guide (30 min to running app) | 🔴 Essential |
| [00-core/PROJECT_OVERVIEW.md](00-core/PROJECT_OVERVIEW.md) | Product vision, users, features | 🔴 Essential |
| [00-core/TECH_STACK.md](00-core/TECH_STACK.md) | Technology stack and rationale | 🔴 Essential |
| [01-architecture/database-schema.md](01-architecture/database-schema.md) | Complete database design | 🔴 Essential |
| [.cursorrules](.cursorrules) | Coding standards | 🟡 Important |
| [04-development/standards/coding-style.md](04-development/standards/coding-style.md) | Code patterns and conventions | 🟡 Important |
| [01-architecture/decisions/](01-architecture/decisions/) | Why we made key decisions | 🟡 Important |

---

## 📖 How to Use This Brain

### When Starting Development
1. Read [CLAUDE.md](CLAUDE.md) for complete context
2. Follow [QUICK_START.md](00-core/QUICK_START.md) to set up
3. Review [coding standards](.cursorrules)

### When Building a Feature
1. Check if feature docs exist in [02-features/](02-features/)
2. Review related ADRs in [01-architecture/decisions/](01-architecture/decisions/)
3. Check API docs in [03-api/](03-api/)
4. Look for similar patterns in [08-examples/](08-examples/)
5. **Update docs after implementation!**

### When Debugging
1. Check [troubleshooting guide](04-development/troubleshooting.md)
2. Review relevant API docs in [03-api/](03-api/)
3. Check if issue is related to an architectural decision (ADRs)

### When Making Architectural Decisions
1. Create an ADR in [01-architecture/decisions/](01-architecture/decisions/)
2. Use the [ADR template](01-architecture/decisions/_template.md)
3. Consider alternatives and document trade-offs

---

## 🧭 Documentation Principles

### 1. Documentation-First Development
- **Plan:** Write/update feature docs before coding
- **Implement:** Reference docs in code comments
- **Review:** Update docs with learnings after implementation
- **Release:** Ensure docs are current with codebase

### 2. AI-Friendly Documentation
- **Clear headings:** Use markdown structure
- **Code examples:** Show, don't just tell
- **Context:** Explain *why*, not just *what*
- **Cross-references:** Link related docs

### 3. Living Documentation
- Docs evolve with code
- Update docs in same PR as code changes
- Review docs quarterly
- Archive outdated docs (don't delete, mark as deprecated)

---

## 📝 Creating New Documentation

### Feature Documentation Template

```markdown
# [Feature Name]

## Overview
[What this feature does]

## User Flow
[Step-by-step user journey]

## Technical Implementation
[Architecture, components, APIs used]

## Database Schema
[Tables, relationships, RLS policies]

## API Endpoints
[Endpoints used/created]

## Testing Strategy
[How to test this feature]

## Related Decisions
- [Link to ADRs]
```

### ADR (Architecture Decision Record) Template

See [01-architecture/decisions/_template.md](01-architecture/decisions/_template.md)

### Component Documentation Template

See [05-components/_component-template.md](05-components/_component-template.md)

---

## 🔄 Maintenance

### Documentation Review Schedule
- **Weekly:** Update docs for completed features
- **Monthly:** Review for accuracy and completeness
- **Quarterly:** Major review, archive outdated docs
- **On major changes:** Update relevant ADRs and architecture docs

### Who Maintains What
- **Core Docs (00-core):** Product + Engineering leads
- **Architecture (01-architecture):** Engineering team
- **Features (02-features):** Feature owners
- **API Docs (03-api):** Backend engineers
- **Development (04-development):** Tech lead
- **Components (05-components):** Frontend engineers

---

## 🎓 Learning Resources

### React Native
- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)

### Backend
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Tutorial](https://www.postgresql.org/docs/current/tutorial.html)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

### State Management
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [React Redux Hooks](https://react-redux.js.org/api/hooks)

### Video & AWS
- [AWS S3 Docs](https://docs.aws.amazon.com/s3/)
- [CloudFront Docs](https://docs.aws.amazon.com/cloudfront/)
- [Video Streaming Best Practices](https://aws.amazon.com/blogs/media/)

---

## 🤝 Contributing to Documentation

### Guidelines
1. **Be clear and concise:** Assume reader is smart but unfamiliar
2. **Include code examples:** Show real code, not pseudocode
3. **Link related docs:** Help readers navigate
4. **Update changelog:** Track documentation changes
5. **Review before committing:** Check for broken links, typos

### Documentation Standards
- Use markdown (.md files)
- Include frontmatter for metadata (optional)
- Follow naming conventions (lowercase-with-dashes.md)
- Keep files under 500 lines (split if larger)
- Use relative links for internal docs

---

## 📞 Getting Help

- **Can't find docs?** Check this README's navigation section
- **Docs unclear?** Update them and submit a PR!
- **Missing docs?** Create them using templates above
- **Technical questions?** Check [troubleshooting](04-development/troubleshooting.md)

---

## ✅ Documentation Checklist

When creating new features, ensure:

- [ ] Feature documented in `02-features/[feature-name]/`
- [ ] Component docs updated in `05-components/`
- [ ] API changes documented in `03-api/`
- [ ] Database changes in `database-schema.md`
- [ ] ADR created for architectural decisions
- [ ] Code examples added to `08-examples/`
- [ ] Tests documented in `04-development/testing/`
- [ ] `CLAUDE.md` updated if significant changes

---

## 🔮 Future Enhancements

### Planned Documentation
- [ ] API integration guides for each service
- [ ] Performance optimization playbook
- [ ] Security audit checklist
- [ ] Deployment runbook
- [ ] Incident response guide
- [ ] User onboarding flows
- [ ] Analytics and metrics guide

### Tooling
- [ ] Automated doc generation from code
- [ ] Broken link checker (GitHub Actions)
- [ ] Auto-generate database schema from migrations
- [ ] Documentation site (Docusaurus, GitBook)

---

**Remember:** Good documentation is code for humans. Keep it clear, current, and helpful!

🧠 **This is the brain of Scrollio. Keep it healthy!**
