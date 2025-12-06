# Data Privacy & COPPA Compliance

## Target Audience
**Age Group:** 7-12 years old
**Compliance Required:** COPPA (Children's Online Privacy Protection Act)

## COPPA Requirements

### 1. Parental Consent
**CRITICAL:** Cannot collect personal information from children under 13 without verifiable parental consent.

#### What Requires Parental Consent
- Email address
- Phone number
- Full name
- Physical address
- Geolocation data
- Photos/videos of the child
- Screen name/username
- Persistent identifiers (cookies, device IDs)

#### Implementation Pattern
```typescript
// services/auth/parentalConsent.ts
export interface ParentalConsentRequest {
  parentEmail: string;
  parentName: string;
  childName: string;
  childDateOfBirth: string;
  timestamp: string;
}

export async function requestParentalConsent(
  request: ParentalConsentRequest
): Promise<{ success: boolean; consentId: string }> {
  // 1. Send verification email to parent
  const { data, error } = await supabase.auth.signInWithOtp({
    email: request.parentEmail,
    options: {
      data: {
        consent_request: request,
        type: 'parental_consent'
      }
    }
  });

  if (error) throw error;

  // 2. Store consent request in database
  const { data: consent, error: consentError } = await supabase
    .from('parental_consents')
    .insert({
      parent_email: request.parentEmail,
      parent_name: request.parentName,
      child_name: request.childName,
      child_dob: request.childDateOfBirth,
      status: 'pending',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    })
    .select()
    .single();

  if (consentError) throw consentError;

  return { success: true, consentId: consent.id };
}
```

### 2. Parent Dashboard
**REQUIRED:** Parents must be able to review, modify, and delete their child's information.

#### Parent Capabilities
- ✅ View all child data collected
- ✅ Modify child profile information
- ✅ Delete child account and all data
- ✅ Control what information is collected
- ✅ Control who can contact child
- ✅ View child's activity history
- ✅ Export all child data

#### Implementation Pattern
```typescript
// features/parental-controls/screens/ChildDataScreen.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';

export function ChildDataScreen({ childId }: { childId: string }) {
  const [childData, setChildData] = useState(null);

  useEffect(() => {
    loadChildData();
  }, [childId]);

  async function loadChildData() {
    // Fetch all data associated with child
    const { data, error } = await supabase
      .rpc('get_child_complete_data', { child_id: childId });

    if (!error) setChildData(data);
  }

  async function deleteAllChildData() {
    // This should cascade delete ALL child data
    const { error } = await supabase
      .from('child_profiles')
      .delete()
      .eq('id', childId);

    if (!error) {
      // Navigate back to parent dashboard
    }
  }

  async function exportChildData() {
    const { data, error } = await supabase
      .rpc('export_child_data_json', { child_id: childId });

    if (!error) {
      // Download JSON file
      downloadJSON(data, `child_data_${childId}.json`);
    }
  }

  return (
    <View>
      <Button onPress={exportChildData}>Export All Data</Button>
      <Button onPress={deleteAllChildData} variant="danger">
        Delete All Data
      </Button>
    </View>
  );
}
```

### 3. Data Minimization
**PRINCIPLE:** Collect only what is necessary for the app's functionality.

#### What We Collect
✅ **Allowed (Minimal):**
- Anonymous usage statistics
- Quiz progress (linked to anonymous ID)
- Video watch history (for recommendations)
- Device type (for optimization)

❌ **Avoid (Excessive):**
- Real name (use username only)
- Email (only parent's email)
- Phone number
- Physical address
- Precise geolocation
- Contacts list
- Photos from device

#### Implementation Pattern
```typescript
// types/user.types.ts
export interface ChildProfile {
  id: string;
  username: string; // NOT real name
  avatar_url?: string;
  date_of_birth: string; // For age verification only
  parent_id: string;
  created_at: string;
  
  // NO email, phone, address, real name, etc.
}

export interface ChildActivity {
  id: string;
  child_id: string;
  activity_type: 'video_watched' | 'quiz_completed' | 'narrator_selected';
  timestamp: string;
  
  // NO IP address, device ID, geolocation
}
```

### 4. Third-Party Disclosure
**REQUIRED:** Notify parents about any third-party data sharing.

#### Third Parties We Use
- **AWS S3/CloudFront:** Video storage and delivery
- **Supabase:** Database and authentication (parent accounts only)
- **Analytics:** Anonymous usage tracking (no PII)

#### Privacy Policy Requirements
```typescript
// config/privacy.ts
export const THIRD_PARTY_SERVICES = [
  {
    name: 'Amazon Web Services (AWS)',
    purpose: 'Video storage and content delivery',
    dataShared: 'Video files, anonymous user IDs',
    privacyPolicy: 'https://aws.amazon.com/privacy/'
  },
  {
    name: 'Supabase',
    purpose: 'Database and parent authentication',
    dataShared: 'Parent email, encrypted passwords, child profiles',
    privacyPolicy: 'https://supabase.com/privacy'
  }
];
```

### 5. Data Retention
**POLICY:** Delete inactive child accounts after reasonable period.

#### Retention Rules
- Active accounts: Indefinite (while parent maintains consent)
- Inactive accounts: 180 days after last activity
- Deleted accounts: 30-day grace period, then permanent deletion
- Activity logs: 90 days retention

#### Implementation Pattern
```sql
-- Automated data retention function
CREATE OR REPLACE FUNCTION cleanup_inactive_accounts()
RETURNS void AS $$
BEGIN
  -- Mark inactive accounts for deletion
  UPDATE child_profiles
  SET status = 'pending_deletion',
      deletion_scheduled = NOW() + INTERVAL '30 days'
  WHERE last_activity_at < NOW() - INTERVAL '180 days'
    AND status = 'active';

  -- Permanently delete accounts past grace period
  DELETE FROM child_profiles
  WHERE deletion_scheduled < NOW()
    AND status = 'pending_deletion';
END;
$$ LANGUAGE plpgsql;

-- Schedule via cron
SELECT cron.schedule(
  'cleanup-inactive-accounts',
  '0 2 * * *', -- 2 AM daily
  'SELECT cleanup_inactive_accounts();'
);
```

### 6. No Behavioral Advertising
**PROHIBITED:** Cannot use child data for targeted advertising.

#### What's Allowed
✅ Contextual recommendations (based on current video)
✅ Age-appropriate content filtering
✅ Educational content suggestions

#### What's Prohibited
❌ Tracking across apps/websites
❌ Building behavioral profiles
❌ Personalized ads
❌ Third-party ad networks

#### Implementation Pattern
```typescript
// services/recommendations/videoRecommendations.ts
export async function getRecommendations(
  currentVideoId: string
): Promise<Video[]> {
  // ✅ CORRECT: Contextual recommendations only
  const { data } = await supabase
    .rpc('get_similar_videos', {
      video_id: currentVideoId,
      limit: 10
    });

  return data;
}

// ❌ WRONG: Behavioral tracking
async function getPersonalizedAds(childId: string) {
  // DON'T DO THIS
}
```

## Data Security Requirements

### 1. Encryption
```typescript
// All data must be encrypted at rest and in transit

// ✅ Supabase handles this automatically
// - TLS for transit
// - AES-256 for rest

// ✅ Verify in environment
if (!process.env.SUPABASE_URL?.startsWith('https://')) {
  throw new Error('SUPABASE_URL must use HTTPS');
}
```

### 2. Access Control
```typescript
// Only parents can access child data
// See /brain/06-security/rls-policies.md for RLS patterns

// features/parental-controls/hooks/useChildAccess.ts
export function useChildAccess(childId: string) {
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    verifyParentAccess();
  }, [childId]);

  async function verifyParentAccess() {
    const { data: session } = await supabase.auth.getSession();
    
    if (!session) {
      setHasAccess(false);
      return;
    }

    // Check if current user is parent of this child
    const { data, error } = await supabase
      .from('child_profiles')
      .select('id')
      .eq('id', childId)
      .eq('parent_id', session.user.id)
      .single();

    setHasAccess(!error && !!data);
  }

  return hasAccess;
}
```

### 3. Audit Logging
```typescript
// Log all access to child data for compliance

// services/audit/auditLog.ts
export async function logDataAccess(event: {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, any>;
}) {
  await supabase.from('audit_logs').insert({
    user_id: event.userId,
    action: event.action,
    resource_type: event.resourceType,
    resource_id: event.resourceId,
    metadata: event.metadata,
    timestamp: new Date().toISOString()
  });
}

// Usage
await logDataAccess({
  userId: parentId,
  action: 'view_child_data',
  resourceType: 'child_profile',
  resourceId: childId
});
```

## Privacy by Design Checklist

Before implementing any new feature that collects data:

- [ ] Does this require collecting personal information?
- [ ] Can we accomplish this with anonymous data instead?
- [ ] Have we minimized the data collected?
- [ ] Does this require additional parental consent?
- [ ] Is data encrypted at rest and in transit?
- [ ] Are RLS policies in place?
- [ ] Can parents view/modify/delete this data?
- [ ] Have we documented this in the privacy policy?
- [ ] Is there a data retention policy?
- [ ] Are we sharing this with third parties?
- [ ] Is audit logging in place?

## Incident Response

### Data Breach Procedure
1. **Immediate:** Contain the breach
2. **Within 24 hours:** Notify legal counsel
3. **Within 72 hours:** Notify affected parents
4. **Within 1 week:** File FTC report
5. **Within 2 weeks:** Implement preventive measures

### Parent Data Request
1. **Within 48 hours:** Acknowledge request
2. **Within 10 days:** Provide data export or confirm deletion
3. **Log request:** Audit trail for compliance

## Testing COPPA Compliance

### Manual Testing Checklist
```typescript
// tests/coppa-compliance.test.ts
describe('COPPA Compliance Tests', () => {
  it('should require parental consent before child account creation', async () => {
    // Attempt to create child account without parent
    // Should fail
  });

  it('should allow parents to delete all child data', async () => {
    // Create child account
    // Delete via parent dashboard
    // Verify all data is removed (cascade)
  });

  it('should not collect PII without consent', async () => {
    // Verify child_profiles table has no email, phone, address
  });

  it('should enforce data retention policies', async () => {
    // Create inactive account
    // Run cleanup function
    // Verify deletion
  });
});
```

## References
- [COPPA Rule](https://www.ftc.gov/enforcement/rules/rulemaking-regulatory-reform-proceedings/childrens-online-privacy-protection-rule)
- [FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/auth-security)
- Database schema: `/brain/01-architecture/database-schema.md`
- RLS policies: `/brain/06-security/rls-policies.md`
- Authentication patterns: `/brain/06-security/authentication.md`
