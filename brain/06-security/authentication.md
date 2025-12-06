# Authentication & Session Management

## Authentication Architecture

### User Types
1. **Parents:** Full authentication with email/password
2. **Children:** No direct authentication (managed by parent)

### Authentication Flow
```
Parent Sign Up → Email Verification → Parent Dashboard → Create Child Profile → Child Can Use App
```

## Parent Authentication

### Sign Up Pattern
```typescript
// features/auth/screens/SignUpScreen.tsx
import { supabase } from '@/services/supabase';

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
}

export async function signUpParent(data: SignUpData) {
  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
        user_type: 'parent'
      },
      emailRedirectTo: `${APP_URL}/verify-email`
    }
  });

  if (authError) throw authError;

  // 2. Create parent profile (via database trigger or explicit insert)
  const { error: profileError } = await supabase
    .from('parent_profiles')
    .insert({
      id: authData.user!.id,
      email: data.email,
      full_name: data.fullName
    });

  if (profileError) throw profileError;

  return { success: true, userId: authData.user!.id };
}
```

### Sign In Pattern
```typescript
// features/auth/screens/SignInScreen.tsx
export async function signInParent(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    // Handle specific errors
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('Incorrect email or password');
    }
    if (error.message.includes('Email not confirmed')) {
      throw new Error('Please verify your email before signing in');
    }
    throw error;
  }

  return data;
}
```

### Email Verification
```typescript
// features/auth/screens/VerifyEmailScreen.tsx
export async function resendVerificationEmail(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email
  });

  if (error) throw error;

  return { success: true };
}

// Handle verification link (deep linking)
export async function handleVerificationLink(token: string, type: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: type as any
  });

  if (error) throw error;

  return data;
}
```

### Password Reset
```typescript
// features/auth/screens/ForgotPasswordScreen.tsx
export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${APP_URL}/reset-password`
  });

  if (error) throw error;

  return { success: true };
}

// features/auth/screens/ResetPasswordScreen.tsx
export async function resetPassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;

  return { success: true };
}
```

## Session Management

### Session Persistence
```typescript
// services/auth/authService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage, // Persist session
      autoRefreshToken: true, // Auto refresh before expiry
      persistSession: true,
      detectSessionInUrl: false // Mobile doesn't need this
    }
  }
);
```

### Session Monitoring
```typescript
// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading, user: session?.user ?? null };
}
```

### Auto Logout on Inactivity
```typescript
// hooks/useAutoLogout.ts
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/services/supabase';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function useAutoLogout() {
  const lastActivityRef = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    resetInactivityTimer();

    return () => {
      subscription.remove();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function handleAppStateChange(nextAppState: AppStateStatus) {
    if (nextAppState === 'active') {
      // Check if exceeded inactivity timeout
      const inactiveDuration = Date.now() - lastActivityRef.current;
      if (inactiveDuration > INACTIVITY_TIMEOUT) {
        supabase.auth.signOut();
      } else {
        resetInactivityTimer();
      }
    } else if (nextAppState === 'background') {
      lastActivityRef.current = Date.now();
    }
  }

  function resetInactivityTimer() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      supabase.auth.signOut();
    }, INACTIVITY_TIMEOUT);
  }
}
```

## Child Account Management

### Create Child Profile (Parent Only)
```typescript
// features/parental-controls/screens/CreateChildScreen.tsx
interface ChildProfileData {
  username: string;
  dateOfBirth: string;
  avatarUrl?: string;
}

export async function createChildProfile(data: ChildProfileData) {
  // Get current parent session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Parent must be authenticated');
  }

  // Validate age (7-12 years old)
  const age = calculateAge(data.dateOfBirth);
  if (age < 7 || age > 12) {
    throw new Error('Child must be between 7 and 12 years old');
  }

  // Create child profile
  const { data: child, error } = await supabase
    .from('child_profiles')
    .insert({
      parent_id: session.user.id,
      username: data.username,
      date_of_birth: data.dateOfBirth,
      avatar_url: data.avatarUrl
    })
    .select()
    .single();

  if (error) throw error;

  return child;
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}
```

### Select Child Profile (App Entry)
```typescript
// features/auth/screens/SelectChildScreen.tsx
import { useAppDispatch } from '@/store';
import { setActiveChild } from '@/store/slices/authSlice';

export function SelectChildScreen() {
  const dispatch = useAppDispatch();
  const [children, setChildren] = useState([]);

  useEffect(() => {
    loadChildren();
  }, []);

  async function loadChildren() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return;

    const { data } = await supabase
      .from('child_profiles')
      .select('*')
      .eq('parent_id', session.user.id)
      .order('created_at', { ascending: true });

    setChildren(data || []);
  }

  function selectChild(childId: string) {
    // Store in Redux (no authentication, just profile selection)
    dispatch(setActiveChild(childId));
    
    // Navigate to main app
    navigation.navigate('MainTabs');
  }

  return (
    <View>
      {children.map(child => (
        <TouchableOpacity key={child.id} onPress={() => selectChild(child.id)}>
          <Text>{child.username}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

### Store Active Child in Redux
```typescript
// store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  parentSession: Session | null;
  activeChildId: string | null;
  activeChildProfile: ChildProfile | null;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    parentSession: null,
    activeChildId: null,
    activeChildProfile: null
  } as AuthState,
  reducers: {
    setParentSession(state, action: PayloadAction<Session | null>) {
      state.parentSession = action.payload;
    },
    setActiveChild(state, action: PayloadAction<string>) {
      state.activeChildId = action.payload;
    },
    setActiveChildProfile(state, action: PayloadAction<ChildProfile>) {
      state.activeChildProfile = action.payload;
    },
    clearAuth(state) {
      state.parentSession = null;
      state.activeChildId = null;
      state.activeChildProfile = null;
    }
  }
});

export const { setParentSession, setActiveChild, setActiveChildProfile, clearAuth } = authSlice.actions;
export default authSlice.reducer;
```

## Security Rules

### 1. Password Requirements
```typescript
// utils/validation.ts
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return { valid: errors.length === 0, errors };
}
```

### 2. Email Validation
```typescript
// utils/validation.ts
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

### 3. Rate Limiting
```sql
-- Implement at database level for sign-up attempts
CREATE TABLE auth_rate_limits (
  ip_address INET PRIMARY KEY,
  attempts INTEGER DEFAULT 0,
  last_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  locked_until TIMESTAMP WITH TIME ZONE
);

CREATE OR REPLACE FUNCTION check_rate_limit(ip INET)
RETURNS BOOLEAN AS $$
DECLARE
  record RECORD;
BEGIN
  SELECT * INTO record FROM auth_rate_limits WHERE ip_address = ip;

  IF NOT FOUND THEN
    INSERT INTO auth_rate_limits (ip_address, attempts) VALUES (ip, 1);
    RETURN TRUE;
  END IF;

  -- Check if locked
  IF record.locked_until IS NOT NULL AND record.locked_until > NOW() THEN
    RETURN FALSE;
  END IF;

  -- Reset if last attempt was > 1 hour ago
  IF record.last_attempt < NOW() - INTERVAL '1 hour' THEN
    UPDATE auth_rate_limits SET attempts = 1, last_attempt = NOW(), locked_until = NULL
    WHERE ip_address = ip;
    RETURN TRUE;
  END IF;

  -- Increment attempts
  IF record.attempts >= 5 THEN
    UPDATE auth_rate_limits SET locked_until = NOW() + INTERVAL '1 hour'
    WHERE ip_address = ip;
    RETURN FALSE;
  END IF;

  UPDATE auth_rate_limits SET attempts = attempts + 1, last_attempt = NOW()
  WHERE ip_address = ip;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

## Backend Authentication (NestJS)

### JWT Verification
```typescript
// backend/src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for admin operations
  );

  async verifyToken(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error) {
      throw new UnauthorizedException('Invalid token');
    }

    return data.user;
  }
}
```

### Auth Guard
```typescript
// backend/src/auth/guards/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      return false;
    }

    try {
      const user = await this.authService.verifyToken(token);
      request.user = user;
      return true;
    } catch {
      return false;
    }
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
```

## Testing Authentication

### Unit Tests
```typescript
// __tests__/services/auth.test.ts
import { signUpParent, signInParent } from '@/services/auth/authService';

describe('Authentication Service', () => {
  it('should sign up parent with valid credentials', async () => {
    const result = await signUpParent({
      email: 'test@example.com',
      password: 'SecurePass123!',
      fullName: 'Test Parent'
    });

    expect(result.success).toBe(true);
    expect(result.userId).toBeDefined();
  });

  it('should reject weak passwords', async () => {
    await expect(
      signUpParent({
        email: 'test@example.com',
        password: 'weak',
        fullName: 'Test Parent'
      })
    ).rejects.toThrow('Password must be at least 8 characters');
  });

  it('should sign in with valid credentials', async () => {
    const data = await signInParent('test@example.com', 'SecurePass123!');
    
    expect(data.session).toBeDefined();
    expect(data.user.email).toBe('test@example.com');
  });
});
```

## Common Authentication Errors

### Error Handling Pattern
```typescript
// services/auth/authErrors.ts
export function handleAuthError(error: any): string {
  const message = error.message.toLowerCase();

  if (message.includes('user already registered')) {
    return 'An account with this email already exists';
  }
  if (message.includes('invalid login credentials')) {
    return 'Incorrect email or password';
  }
  if (message.includes('email not confirmed')) {
    return 'Please verify your email address';
  }
  if (message.includes('password should be at least')) {
    return 'Password must be at least 6 characters';
  }
  if (message.includes('unable to validate email')) {
    return 'Please enter a valid email address';
  }

  // Default fallback
  return 'An error occurred. Please try again.';
}
```

## References
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Auth Helpers (React Native)](https://supabase.com/docs/guides/auth/auth-helpers/react-native)
- RLS policies: `/brain/06-security/rls-policies.md`
- COPPA compliance: `/brain/06-security/data-privacy.md`
