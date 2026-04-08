import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserRole } from '../../shared/types';
import type { ChildProfile } from '../../shared/types';
import type { AuthSession, AuthState } from '../types/auth.types';
import { secureStorage } from '../../../../services/storage/secureStorage';
import * as authApi from '../services/authApi';
import * as pinApi from '../services/pinApi';
import * as childProfileApi from '../services/childProfileApi';
import * as roleApi from '../services/roleApi';
import { clearAll as clearKidsStorage } from '../../shared/utils/storage';

// ────────────────────── Initial State ──────────────────────

const initialState: AuthState = {
  session: null,
  userRole: UserRole.USER,
  activeChildProfileId: null,
  characterSelectChildId: null,
  childProfiles: [],
  isPinSet: false,
  isPinVerified: false,
  isLoading: false,
  error: null,
};

// ────────────────────── Async Thunks ──────────────────────

export const loginThunk = createAsyncThunk(
  'kidsAuth/login',
  async (params: { email: string; password: string }, { rejectWithValue }) => {
    const res = await authApi.signIn(params.email, params.password);
    if (res.error || !res.data) {
      return rejectWithValue(res.error || 'Login failed');
    }

    // Store session in secure storage
    await secureStorage.setSession({
      accessToken: res.data.session.accessToken,
      refreshToken: res.data.session.refreshToken,
      expiresAt: res.data.session.expiresAt,
      userId: res.data.user.id,
    });

    return res.data;
  },
);

export const registerThunk = createAsyncThunk(
  'kidsAuth/register',
  async (
    params: { email: string; password: string; displayName: string },
    { rejectWithValue },
  ) => {
    const res = await authApi.signUp(params.email, params.password, params.displayName);
    if (res.error || !res.data) {
      return rejectWithValue(res.error || 'Registration failed');
    }

    await secureStorage.setSession({
      accessToken: res.data.session.accessToken,
      refreshToken: res.data.session.refreshToken,
      expiresAt: res.data.session.expiresAt,
      userId: res.data.user.id,
    });

    return res.data;
  },
);

export const logoutThunk = createAsyncThunk(
  'kidsAuth/logout',
  async () => {
    await authApi.signOut();
    await secureStorage.clearSession();
    await clearKidsStorage();
    return true;
  },
);

export const fetchMeThunk = createAsyncThunk(
  'kidsAuth/fetchMe',
  async (_, { rejectWithValue }) => {
    const res = await authApi.getMe();
    if (res.error || !res.data) {
      return rejectWithValue(res.error || 'Failed to fetch profile');
    }
    return res.data;
  },
);

export const setPinThunk = createAsyncThunk(
  'kidsAuth/setPin',
  async (pin: string, { rejectWithValue }) => {
    const res = await pinApi.setPin(pin);
    if (res.error || !res.data) {
      return rejectWithValue(res.error || 'Failed to set PIN');
    }
    return res.data;
  },
);

export const verifyPinThunk = createAsyncThunk(
  'kidsAuth/verifyPin',
  async (pin: string, { rejectWithValue }) => {
    const res = await pinApi.verifyPin(pin);
    if (res.error || !res.data) {
      return rejectWithValue(res.error || 'Failed to verify PIN');
    }
    return res.data;
  },
);

export const fetchChildrenThunk = createAsyncThunk(
  'kidsAuth/fetchChildren',
  async (_, { rejectWithValue }) => {
    const res = await childProfileApi.getChildren();
    if (res.error || !res.data) {
      return rejectWithValue(res.error || 'Failed to fetch children');
    }
    return res.data;
  },
);

export const createChildThunk = createAsyncThunk(
  'kidsAuth/createChild',
  async (
    data: { displayName: string; dateOfBirth?: string; avatarConfig?: Record<string, unknown> },
    { rejectWithValue },
  ) => {
    const res = await childProfileApi.createChild(data);
    if (res.error || !res.data) {
      return rejectWithValue(res.error || 'Failed to create child');
    }
    return res.data;
  },
);

export const switchChildThunk = createAsyncThunk(
  'kidsAuth/switchChild',
  async (childId: string, { rejectWithValue }) => {
    const res = await childProfileApi.switchChild(childId);
    if (res.error || !res.data) {
      return rejectWithValue(res.error || 'Failed to switch child');
    }
    return res.data;
  },
);

export const updateChildThunk = createAsyncThunk(
  'kidsAuth/updateChild',
  async (
    params: { childId: string; data: { selectedCharacterId: string } },
    { rejectWithValue },
  ) => {
    const res = await childProfileApi.updateChild(params.childId, params.data);
    if (res.error || !res.data) {
      return rejectWithValue(res.error || 'Failed to update child');
    }
    return res.data;
  },
);

export const upgradeRoleThunk = createAsyncThunk(
  'kidsAuth/upgradeRole',
  async (targetRole: string, { rejectWithValue }) => {
    const res = await roleApi.upgradeRole(targetRole);
    if (res.error || !res.data) {
      return rejectWithValue(res.error || 'Failed to upgrade role');
    }
    return res.data;
  },
);

// ────────────────────── Slice ──────────────────────

const authSlice = createSlice({
  name: 'kidsAuth',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<AuthSession | null>) => {
      state.session = action.payload;
    },
    setRole: (state, action: PayloadAction<UserRole>) => {
      state.userRole = action.payload;
    },
    setActiveChild: (state, action: PayloadAction<string | null>) => {
      state.activeChildProfileId = action.payload;
    },
    setChildProfiles: (state, action: PayloadAction<ChildProfile[]>) => {
      state.childProfiles = action.payload;
    },
    setPinVerified: (state, action: PayloadAction<boolean>) => {
      state.isPinVerified = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setCharacterSelectChildId: (state, action: PayloadAction<string | null>) => {
      state.characterSelectChildId = action.payload;
    },
    resetAuth: () => initialState,
  },
  extraReducers: (builder) => {
    // ── Login ──
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.session = {
          accessToken: action.payload.session.accessToken,
          refreshToken: action.payload.session.refreshToken,
          expiresIn: action.payload.session.expiresIn,
          expiresAt: action.payload.session.expiresAt,
          user: {
            id: action.payload.user.id,
            email: action.payload.user.email ?? '',
            displayName: action.payload.user.displayName,
          },
        };
        state.userRole = (action.payload.role as UserRole) || UserRole.USER;
        state.isPinSet = action.payload.isPinSet;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ── Register ──
    builder
      .addCase(registerThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.session = {
          accessToken: action.payload.session.accessToken,
          refreshToken: action.payload.session.refreshToken,
          expiresIn: action.payload.session.expiresIn,
          expiresAt: action.payload.session.expiresAt,
          user: {
            id: action.payload.user.id,
            email: action.payload.user.email ?? '',
            displayName: action.payload.user.displayName,
          },
        };
        state.userRole = UserRole.PARENT;
        state.isPinSet = false;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ── Logout ──
    builder.addCase(logoutThunk.fulfilled, () => initialState);

    // ── Fetch Me ──
    builder
      .addCase(fetchMeThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMeThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userRole = (action.payload.primaryRole as UserRole) || UserRole.USER;
        state.isPinSet = action.payload.isPinSet;
      })
      .addCase(fetchMeThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ── Set PIN ──
    builder
      .addCase(setPinThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setPinThunk.fulfilled, (state) => {
        state.isLoading = false;
        state.isPinSet = true;
        state.isPinVerified = true; // Just set it, so it's verified
      })
      .addCase(setPinThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ── Verify PIN ──
    builder
      .addCase(verifyPinThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyPinThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isPinVerified = action.payload.valid;
        if (!action.payload.valid) {
          state.error = 'Incorrect PIN. Please try again.';
        }
      })
      .addCase(verifyPinThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ── Fetch Children ──
    builder
      .addCase(fetchChildrenThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchChildrenThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        // Map snake_case from DB to camelCase
        const ids = new Set(action.payload.map((c) => (c as { id?: string }).id ?? ''));
        if (state.activeChildProfileId && !ids.has(state.activeChildProfileId)) {
          state.activeChildProfileId = null;
        }
        state.childProfiles = action.payload.map((c) => {
          const raw = c as unknown as Record<string, unknown>;
          return {
            id: (raw.id ?? '') as string,
            parentId: ((raw.parent_id ?? raw.parentId) ?? '') as string,
            displayName: ((raw.display_name ?? raw.displayName) ?? '') as string,
            avatarConfig: ((raw.avatar_config ?? raw.avatarConfig) ?? {}) as Record<string, unknown>,
            dateOfBirth: (raw.date_of_birth ?? raw.dateOfBirth) as string | undefined,
            isActive: ((raw.is_active ?? raw.isActive) ?? true) as boolean,
            createdAt: ((raw.created_at ?? raw.createdAt) ?? '') as string,
            updatedAt: ((raw.updated_at ?? raw.updatedAt) ?? '') as string,
            selectedCharacterId: (raw.selected_character_id ?? raw.selectedCharacterId) as string | undefined,
            topicOnboardingCompletedAt: (raw.topic_onboarding_completed_at ??
              raw.topicOnboardingCompletedAt) as string | undefined,
          };
        });
      })
      .addCase(fetchChildrenThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ── Create Child ──
    builder
      .addCase(createChildThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createChildThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        const raw = action.payload as unknown as Record<string, unknown>;
        const newChild: ChildProfile = {
          id: (raw.id ?? '') as string,
          parentId: ((raw.parent_id ?? raw.parentId) ?? '') as string,
          displayName: ((raw.display_name ?? raw.displayName) ?? '') as string,
          avatarConfig: ((raw.avatar_config ?? raw.avatarConfig) ?? {}) as Record<string, unknown>,
          dateOfBirth: (raw.date_of_birth ?? raw.dateOfBirth) as string | undefined,
          isActive: true,
          createdAt: ((raw.created_at ?? raw.createdAt) ?? '') as string,
          updatedAt: ((raw.updated_at ?? raw.updatedAt) ?? '') as string,
          selectedCharacterId: (raw.selected_character_id ?? raw.selectedCharacterId) as string | undefined,
          topicOnboardingCompletedAt: (raw.topic_onboarding_completed_at ??
            raw.topicOnboardingCompletedAt) as string | undefined,
        };
        state.childProfiles.push(newChild);
      })
      .addCase(createChildThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ── Switch Child ──
    builder
      .addCase(switchChildThunk.fulfilled, (state, action) => {
        state.activeChildProfileId = action.payload.childId;
      })
      .addCase(switchChildThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // ── Update Child ──
    builder
      .addCase(updateChildThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateChildThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.characterSelectChildId = null;
        const raw = action.payload as unknown as Record<string, unknown>;
        const updatedId = (raw.id ?? '') as string;
        const idx = state.childProfiles.findIndex((p) => p.id === updatedId);
        if (idx !== -1) {
          const prev = state.childProfiles[idx];
          state.childProfiles[idx] = {
            id: updatedId,
            parentId: ((raw.parent_id ?? raw.parentId) ?? prev.parentId) as string,
            displayName: ((raw.display_name ?? raw.displayName) ?? prev.displayName) as string,
            avatarConfig: ((raw.avatar_config ?? raw.avatarConfig) ?? prev.avatarConfig) as Record<string, unknown>,
            dateOfBirth: (raw.date_of_birth ?? raw.dateOfBirth ?? prev.dateOfBirth) as string | undefined,
            isActive: ((raw.is_active ?? raw.isActive) ?? prev.isActive) as boolean,
            createdAt: ((raw.created_at ?? raw.createdAt) ?? prev.createdAt) as string,
            updatedAt: ((raw.updated_at ?? raw.updatedAt) ?? prev.updatedAt) as string,
            selectedCharacterId: (raw.selected_character_id ?? raw.selectedCharacterId) as string | undefined,
            topicOnboardingCompletedAt: (raw.topic_onboarding_completed_at ??
              raw.topicOnboardingCompletedAt ??
              prev.topicOnboardingCompletedAt) as string | undefined,
          };
        }
      })
      .addCase(updateChildThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ── Upgrade Role ──
    builder
      .addCase(upgradeRoleThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(upgradeRoleThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userRole = action.payload.role as UserRole;
      })
      .addCase(upgradeRoleThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setSession,
  setRole,
  setActiveChild,
  setChildProfiles,
  setPinVerified,
  setLoading,
  setError,
  setCharacterSelectChildId,
  resetAuth,
} = authSlice.actions;

export default authSlice.reducer;
