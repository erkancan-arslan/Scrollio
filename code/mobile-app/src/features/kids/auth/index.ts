// Screens
export { KidsLoginScreen } from './screens/LoginScreen';
export { KidsRegisterScreen } from './screens/RegisterScreen';
export { KidsPinEntryScreen } from './screens/PinEntryScreen';
export { KidsSetPinScreen } from './screens/SetPinScreen';
export { KidsChildSelectorScreen } from './screens/ChildSelectorScreen';
export { KidsCreateChildScreen } from './screens/CreateChildScreen';
export { KidsRoleBlockedScreen } from './screens/RoleBlockedScreen';

// Components
export { PinPad } from './components/PinPad';

// Services
export {
  signIn,
  signUp,
  signOut,
  getMe,
  upgradeRole,
  setPin,
  verifyPin,
  getChildren,
  createChild,
  updateChild,
  deleteChild,
  switchChild,
} from './services';

// Store — actions
export {
  setSession,
  setRole,
  setActiveChild,
  setChildProfiles,
  setPinVerified,
  setLoading,
  setError,
  resetAuth,
} from './store/authSlice';

// Store — thunks
export {
  loginThunk,
  registerThunk,
  logoutThunk,
  fetchMeThunk,
  setPinThunk,
  verifyPinThunk,
  fetchChildrenThunk,
  createChildThunk,
  switchChildThunk,
  upgradeRoleThunk,
  restoreSessionThunk,
} from './store/authSlice';

export { default as kidsAuthReducer } from './store/authSlice';

// Types
export type { LoginParams, RegisterParams, AuthSession, AuthState, PinState } from './types/auth.types';
