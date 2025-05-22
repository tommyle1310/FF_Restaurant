// store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice"; // Replace with the correct path to your auth slice
import restaurantOrderTrackingReducer from "./restaurantOrderTrackingSlice"; // Replace with the correct path to your auth slice

const store = configureStore({
  reducer: {
    auth: authReducer,
    restaurantOrderTracking: restaurantOrderTrackingReducer 
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
