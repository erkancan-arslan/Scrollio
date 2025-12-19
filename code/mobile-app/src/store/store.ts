import { configureStore } from '@reduxjs/toolkit';
import playgroundReducer from '../features/playground/store/playgroundSlice';

export const store = configureStore({
    reducer: {
        playground: playgroundReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
