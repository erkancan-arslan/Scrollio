import { configureStore } from '@reduxjs/toolkit';
import playgroundReducer from '../features/playground/store/playgroundSlice';
import profileReducer from '../features/profile/store/profileSlice';
// Kids reducers
import kidsAuthReducer from '../features/kids/auth/store/authSlice';
import kidsFeedReducer from '../features/kids/feed/store/feedSlice';
import kidsCanvasReducer from '../features/kids/playground/store/canvasSlice';
import kidsProgressionReducer from '../features/kids/playground/store/progressionSlice';
import kidsProfileReducer from '../features/kids/profile/store/profileSlice';
import kidsParentalReducer from '../features/kids/parental/store/parentalSlice';
import kidsMascotReducer from '../features/kids/mascot/store/mascotSlice';
// Wire up the Kids API client (breaks circular dep: api → store → slices → api)
import { setStoreRef } from '../features/kids/shared/utils/api';

export const store = configureStore({
    reducer: {
        playground: playgroundReducer,
        profile: profileReducer,
        // Kids
        kidsAuth: kidsAuthReducer,
        kidsFeed: kidsFeedReducer,
        kidsCanvas: kidsCanvasReducer,
        kidsProgression: kidsProgressionReducer,
        kidsProfile: kidsProfileReducer,
        kidsParental: kidsParentalReducer,
        kidsMascot: kidsMascotReducer,
    },
});

// Inject store getter into Kids API client (lazy, avoids circular import)
setStoreRef(() => store.getState().kidsAuth?.activeChildProfileId ?? null);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
