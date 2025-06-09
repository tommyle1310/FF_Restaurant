// store/store.ts
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer from "./authSlice"; // Replace with the correct path to your auth slice
import restaurantOrderTrackingReducer from "./restaurantOrderTrackingSlice"; // Replace with the correct path to your auth slice

const rootReducer = combineReducers({
  auth: authReducer,
  restaurantOrderTracking: restaurantOrderTrackingReducer,
});

const appReducer = (state: any, action: any) => {
  // Reset entire store on RESET_ALL_STATE action
  if (action.type === "RESET_ALL_STATE") {
    console.log("🔥 NUCLEAR RESET: Clearing entire Redux store");
    state = undefined;
  }
  return rootReducer(state, action);
};

const store = configureStore({
  reducer: appReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
