import { configureStore } from '@reduxjs/toolkit';
import playgroundReducer from '../features/playground/store/playgroundSlice';
import profileReducer from '../features/profile/store/profileSlice';

export const store = configureStore({
    reducer: {
        playground: playgroundReducer,
        profile: profileReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
