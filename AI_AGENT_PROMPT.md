# AI Agent Entry Prompt for Scrollio Development

**Use this prompt when starting work with an AI coding assistant on the Scrollio project.**

---

## Your Mission

You are about to work on **Scrollio**, a TikTok-style educational mobile app built with React Native, TypeScript, Supabase, and AWS. This project follows a **documentation-first development approach** with a comprehensive knowledge base called the **"brain"**.

**Critical: Before writing any code, you MUST read and understand the brain documentation. This is not optional—it's the foundation of consistent, informed development.**

---

## What is the "Brain"?

The **`/brain/` directory** is Scrollio's central knowledge base—a structured documentation system containing:

- **Architecture decisions** - Why we made specific technical choices
- **Database schemas** - Complete data models with relationships
- **Feature specifications** - Detailed requirements for each feature
- **API documentation** - How to interact with Supabase, AWS, and external services
- **Coding standards** - Rules for TypeScript, React Native, and project conventions
- **Development workflows** - How to plan, implement, test, and deploy features
- **Code examples** - Proven patterns for common tasks

**Why the brain matters:**
- **Consistency** - Ensures all developers (human and AI) follow the same patterns
- **Context** - Provides the "why" behind technical decisions, not just the "what"
- **Efficiency** - Prevents reinventing solutions that already exist
- **Quality** - Encodes best practices and lessons learned
- **Onboarding** - New team members (including AI agents) can get up to speed quickly

**Without the brain context, you will:**
- Make uninformed decisions that conflict with established architecture
- Violate security patterns (like disabling Row Level Security)
- Duplicate existing functionality
- Break coding conventions
- Miss critical requirements (like COPPA compliance for kids)

---

## How to Read the Brain

### Step 1: Start with ENTRY.md (MANDATORY FIRST READ)

**Location:** `/brain/ENTRY.md`

**Read this file first and completely.** It contains:
- Project overview and vision
- Tech stack summary
- Key features
- Development guidelines and principles
- Common code patterns
- Security considerations
- Links to all other documentation

**What you'll learn:**
- What Scrollio does and who it's for
- Core technologies (React Native, Expo, Supabase, AWS, Redux)
- Non-negotiable rules (TypeScript strict mode, RLS on all tables, no class components)
- The development workflow (Plan → Implement → Test → Document → Review)
- Special considerations (COPPA compliance, performance targets, offline support)

**Importance:** CRITICAL - Skip this and you'll break things

---

### Step 2: Understand the Core Concepts

After ENTRY.md, read these files in order:

#### A. **Project Overview** 
**Location:** `/brain/00-core/PROJECT_OVERVIEW.md`

**What you'll learn:**
- Target users and their pain points
- Product value propositions
- Key features in detail
- Business model and constraints

**When to read:** Before implementing any feature

---

#### B. **Tech Stack**
**Location:** `/brain/00-core/TECH_STACK.md`

**What you'll learn:**
- Why we chose React Native over Flutter or native
- Why Supabase instead of Firebase or custom backend
- Why Redux Toolkit for state management
- AWS S3 + CloudFront for video storage rationale
- Cost estimates and scalability plans

**When to read:** Before adding dependencies or changing architecture

---

#### C. **Database Schema**
**Location:** `/brain/01-architecture/database-schema.md`

**What you'll learn:**
- Complete PostgreSQL schema (tables, relationships, constraints)
- Row Level Security (RLS) policies for every table
- Indexes for performance
- Why data is structured this way

**When to read:** Before any database-related work
**Critical for:** Database queries, new features touching data

---

#### D. **Coding Standards**
**Location:** `/brain/.cursorrules`

**What you'll learn:**
- TypeScript conventions (no `any`, strict mode)
- React Native patterns (functional components only, memo optimization)
- File naming and organization
- Import ordering
- Redux slice patterns
- Testing requirements
- Git commit message format
- Security rules

**When to read:** Before writing any code
**Re-read:** When uncertain about code style

---

### Step 3: Context-Specific Documentation

Read these **as needed** based on your task:

#### **For Implementing a Feature:**
1. Check if feature docs exist: `/brain/02-features/[feature-name]/`
2. Review Architecture Decision Records: `/brain/01-architecture/decisions/`
3. Check API documentation: `/brain/03-api/supabase/` or `/brain/03-api/aws/`
4. Look for code examples: `/brain/08-examples/`

#### **For Modifying Components:**
1. Read component docs: `/brain/05-components/[component-name].md`
2. Check design patterns: `/brain/08-examples/component-examples/`

#### **For Security Work:**
1. Read: `/brain/06-security/rls-policies.md`
2. Read: `/brain/06-security/data-privacy.md` (especially for kids features)
3. Read: `/brain/06-security/authentication.md`

#### **For Debugging:**
1. Check: `/brain/04-development/troubleshooting.md`
2. Review relevant ADRs to understand architectural context

---

## Handling Missing or Incomplete Documentation

**IMPORTANT:** The brain documentation is continuously evolving. You may encounter:
- References to files that don't exist yet
- Incomplete feature documentation
- Empty folders with planned structure
- Outdated information that conflicts with current code

### When You Encounter Missing Documentation

**DO NOT:**
- ❌ Guess or make assumptions
- ❌ Proceed blindly without context
- ❌ Skip security considerations
- ❌ Ignore the gap and continue

**DO:**
1. **Stop and report the gap to the user/developer:**
   ```
   "I notice that the documentation references `/brain/06-security/rls-policies.md` 
   but this file doesn't exist. This is needed to safely implement [feature].
   
   Would you like me to:
   A) Create this documentation first based on existing code patterns
   B) Proceed with the implementation and document it afterward
   C) Search the codebase for existing RLS patterns to infer best practices
   D) Wait for you to provide the missing documentation"
   ```

2. **Provide context about why the documentation matters:**
   - Explain what you need to know
   - Describe the risks of proceeding without it
   - Suggest what the documentation should contain

3. **Offer actionable choices:**
   - Give the developer multiple options
   - Recommend the safest approach
   - Be clear about trade-offs

### When Documentation Conflicts with Code

If you find discrepancies between documentation and actual code:

1. **Assume the code is the source of truth** (unless it's obviously wrong)
2. **Report the conflict:**
   ```
   "The documentation in `/brain/04-development/standards/component-patterns.md` 
   says to use X pattern, but the existing codebase uses Y pattern in 15 files.
   
   Should I:
   A) Follow the documentation (and update existing code to match)
   B) Follow the codebase pattern (and update the documentation)
   C) Investigate why the discrepancy exists before proceeding"
   ```

3. **Update the documentation** if you confirm it's outdated (after developer confirmation)

### Creating Missing Documentation

If a developer asks you to create missing documentation:

1. **Research existing code** to understand current patterns
2. **Use the appropriate template** (from `/brain/`)
3. **Be comprehensive but not prescriptive** - document what exists, suggest improvements
4. **Mark uncertainty** - use "TODO", "VERIFY", or "DRAFT" for unconfirmed information
5. **Cross-reference** - link to related documentation and code examples

---

## Your Development Process (Step-by-Step)

### Phase 1: UNDERSTAND (Never Skip This)

**Before coding anything:**

1. **Read ENTRY.md completely**
2. **Check if an Architecture Decision Record (ADR) exists** for the area you're modifying
   - Location: `/brain/01-architecture/decisions/`
   - If one exists, read it to understand the "why"
   - **If missing:** Report to developer and ask for guidance
3. **Check if feature documentation exists**
   - Location: `/brain/02-features/[feature-name]/`
   - **If missing:** Search codebase for similar features and patterns
4. **Review database schema** if touching data
   - Location: `/brain/01-architecture/database-schema.md`
5. **Look for existing patterns** in code examples
   - Location: `/brain/08-examples/`
   - **If missing:** Search actual codebase for patterns

**Key Questions to Answer:**
- What problem am I solving?
- Has this been solved before in this codebase?
- What are the architectural constraints?
- Are there security considerations?
- What patterns should I follow?
- **Is any critical documentation missing that blocks safe implementation?**

---

### Phase 2: PLAN

1. **Determine if you need to create an ADR**
   - Create one if: Changing architecture, adding new tech, making design decisions
   - Template: `/brain/01-architecture/decisions/_template.md`

2. **Design your solution**
   - Follow established patterns from brain docs
   - Check coding standards in `.cursorrules`
   - Consider RLS policies if creating/modifying tables

3. **Identify what documentation you'll update**
   - Feature docs
   - Component docs
   - API docs
   - Code examples

---

### Phase 3: IMPLEMENT

**Follow these rules strictly:**

**DO:**
- Use TypeScript strict mode (no `any` types)
- Use functional components with hooks (never class components)
- Enable RLS on all new Supabase tables
- Follow file naming conventions (PascalCase for components, camelCase for utilities)
- Use path aliases (`@/components`, `@/services`, etc.)
- Handle all errors gracefully
- Add accessibility labels to interactive elements
- Use theme constants (never hardcode colors/spacing)
- Write self-documenting code with clear variable names

**NEVER:**
- Commit secrets, API keys, or credentials
- Disable RLS policies without security review
- Push directly to main branch (use PRs)
- Skip accessibility considerations
- Use `any` type without strong justification
- Hardcode configuration values
- Ignore TypeScript errors

**Code Structure Pattern:**
```typescript
// 1. Imports (organized: React → Third-party → Local)
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase/client';
import { colors, spacing } from '@/theme';
import { User } from '@/types/models';

// 2. Type definitions
interface MyComponentProps {
  userId: string;
  onComplete: () => void;
}

// 3. Component
export const MyComponent: React.FC<MyComponentProps> = ({ userId, onComplete }) => {
  // 4. Hooks
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  
  // 5. Event handlers
  const handlePress = () => {
    // Implementation
  };
  
  // 6. Render
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Title</Text>
    </View>
  );
};

// 7. Styles
const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text.primary,
  },
});
```

---

### Phase 4: TEST

**Test Requirements:**

1. **Unit Tests** (Jest)
   - Write tests for utilities and hooks
   - Target: >80% coverage
   - Naming: `ComponentName.test.tsx`

2. **Component Tests** (React Native Testing Library)
   - Test user interactions
   - Test accessibility

3. **Integration Tests**
   - Test feature flows
   - Target: >60% coverage

4. **Accessibility Tests**
   - Test with screen readers
   - Verify WCAG 2.1 AA compliance

**Example Test:**
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Click me" onPress={onPress} />
    );
    
    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

---

### Phase 5: DOCUMENT

**Update these as you code:**

1. **Feature Documentation**
   - Location: `/brain/02-features/[feature-name]/`
   - Document what you learned during implementation

2. **Component Documentation**
   - Location: `/brain/05-components/`
   - Use template: `/brain/05-components/_component-template.md`

3. **Code Examples**
   - Location: `/brain/08-examples/`
   - Add reusable patterns you created

4. **ADRs**
   - Location: `/brain/01-architecture/decisions/`
   - Document architectural decisions

5. **API Documentation**
   - Location: `/brain/03-api/`
   - Document new endpoints or API usage

**Documentation Principles:**
- Write for future developers (including future AI agents)
- Explain the "why", not just the "what"
- Include code examples
- Keep it up-to-date with the code

---

### Phase 6: REVIEW

**Before submitting:**

- [ ] TypeScript strict mode passes with no errors
- [ ] All tests pass (unit, component, integration)
- [ ] Code follows `.cursorrules` conventions
- [ ] No hardcoded secrets or API keys
- [ ] Accessibility labels added to interactive elements
- [ ] Documentation updated (brain docs, comments)
- [ ] RLS policies added for new tables (if applicable)
- [ ] Performance considerations addressed
- [ ] Error handling implemented
- [ ] Self-review against coding standards

**Git Commit Format:**
```
type(scope): description

Types: feat, fix, docs, refactor, test, chore

Examples:
feat(feed): implement vertical scrolling video feed
fix(quiz): correct score calculation for multiple choice
docs(api): update Supabase authentication guide
```

---

## Critical Rules (Never Violate)

### Security
1. **ALL Supabase tables MUST have RLS enabled**
   - No exceptions without security review
   - Document policies in `/brain/06-security/rls-policies.md`

2. **Never commit secrets**
   - Use environment variables
   - Check `.env.example` for required variables

3. **Validate all user input**
   - Use TypeScript for type safety
   - Sanitize data before database storage

### COPPA Compliance (Kids Features)
- Parental consent required for users under 13
- No personalized ads or behavioral tracking for kids
- Limited data collection
- See: `/brain/06-security/data-privacy.md`

### Performance
- Video feed MUST maintain 60fps scrolling
- App launch time < 3 seconds
- Video playback starts within 1 second
- Optimize FlatLists (use `getItemLayout`, `keyExtractor`, `removeClippedSubviews`)

### TypeScript
- Strict mode enabled
- No `any` types without strong justification
- Explicit return types for functions
- Interfaces for all component props

---

## Quick Reference Card

### When You Need to...

| Task | Read This |
|------|-----------|
| Start any work | `/brain/ENTRY.md` (always first) |
| Understand the product | `/brain/00-core/PROJECT_OVERVIEW.md` |
| Add a dependency | `/brain/00-core/TECH_STACK.md` |
| Query database | `/brain/01-architecture/database-schema.md` |
| Write code | `/brain/.cursorrules` |
| Implement a feature | `/brain/02-features/[feature-name]/` |
| Use Supabase | `/brain/03-api/supabase/` |
| Use AWS S3 | `/brain/03-api/aws/` |
| Create a component | `/brain/05-components/_component-template.md` |
| Handle security | `/brain/06-security/` |
| Find code patterns | `/brain/08-examples/` |
| Debug issues | `/brain/04-development/troubleshooting.md` |
| Understand a decision | `/brain/01-architecture/decisions/` |

---

## Getting Started Checklist

**Before you start coding:**

**Essential Reading (do this first):**
- [ ] Read `/brain/ENTRY.md` completely
- [ ] Skim `/brain/README.md` to understand brain structure
- [ ] Read `/brain/.cursorrules` coding standards

**Core Context (read based on your task):**
- [ ] `/brain/00-core/PROJECT_OVERVIEW.md` - Understand the product
- [ ] `/brain/01-architecture/database-schema.md` - If working with data
- [ ] `/brain/08-examples/` - Review relevant code patterns

**Then:**
- You're ready to start implementing features
- Always reference brain docs before and during coding
- Update brain docs as you learn and build

---

## Brain Maintenance

**As you work, you're also responsible for improving the brain:**

1. **When you learn something new:**
   - Add it to `/brain/08-examples/`

2. **When you make an architectural decision:**
   - Create an ADR in `/brain/01-architecture/decisions/`
   - Use the template: `_template.md`

3. **When you implement a feature:**
   - Update or create feature docs in `/brain/02-features/`

4. **When you find missing documentation:**
   - Fill in the gaps
   - Keep documentation in sync with code

**The brain is alive—it grows with every feature, decision, and lesson learned.**

---

## Common Pitfalls for AI Agents

### 1. **Skipping the Brain** 
WRONG: "I'll just write code based on the request"
RIGHT: "I'll read ENTRY.md and relevant brain docs first"

### 2. **Ignoring ADRs**
WRONG: "I'll change this architecture to use Firebase"
RIGHT: "Let me read the ADR on why we chose Supabase first"

### 3. **Breaking Security Patterns**
WRONG: "I'll just disable RLS for now to make it work"
RIGHT: "I'll write proper RLS policies following the patterns in the brain"

### 4. **Not Updating Documentation**
WRONG: "I'll implement the feature and move on"
RIGHT: "I'll update the brain docs with what I learned"

### 5. **Assuming Context**
WRONG: "This looks like a standard React Native app"
RIGHT: "Let me read PROJECT_OVERVIEW to understand unique requirements"

---

## Remember

> **The brain is your map. The code is your terrain.**
> 
> Without the map, you'll get lost, make wrong turns, and end up somewhere you didn't intend.
> 
> With the map, you know where you are, where you're going, and the best path to get there.

**The brain exists because:**
- **Context is everything** - Code without context is just syntax
- **Consistency matters** - Random patterns create chaos
- **Quality compounds** - Good practices build on each other
- **Speed comes from structure** - Freedom within constraints is faster than chaos

---

## Final Checklist Before You Start Coding

- [ ] I have read `/brain/ENTRY.md` completely
- [ ] I understand the project vision and tech stack
- [ ] I know where to find documentation for my task
- [ ] I've reviewed the coding standards in `.cursorrules`
- [ ] I understand the development workflow (Plan → Implement → Test → Document → Review)
- [ ] I know the critical rules (RLS, no secrets, TypeScript strict, COPPA compliance)
- [ ] I'm ready to update brain docs as I work

**If you checked all boxes:** You're ready to build Scrollio!

**If you didn't:** Go back and read the missing pieces. Your future self (and the team) will thank you.

---

## Questions?

If something is unclear or missing from the brain:
1. Check if documentation exists but you haven't found it yet
2. Look for similar patterns in existing code
3. Ask the team
4. **Document the answer in the brain** so the next person (or AI) doesn't have the same question

---

**Welcome to the Scrollio development team. The brain is your guide. Use it well.**

---

*Last Updated: December 5, 2025*
*Version: 1.0*
*Maintained by: Scrollio Engineering Team*
