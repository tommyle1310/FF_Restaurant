// store/store.ts
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer from "./authSlice"; // Replace with the correct path to your auth slice
import restaurantOrderTrackingReducer from "./restaurantOrderTrackingSlice"; // Replace with the correct path to your auth slice
import chatReducer, { loadChatFromStorage } from './chatSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  restaurantOrderTracking: restaurantOrderTrackingReducer,
  chat: chatReducer,
});

const appReducer = (state: any, action: any) => {
  // Reset entire store on RESET_ALL_STATE action
  if (action.type === "RESET_ALL_STATE") {
    console.log("🔥 NUCLEAR RESET: Clearing entire Redux store");
    state = undefined;
  }
  return rootReducer(state, action);
};

export const store = configureStore({
  reducer: appReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['chat/addRoom', 'chat/addMessage', 'chat/setMessages'],
        // Ignore these paths in the state
        ignoredPaths: ['chat.rooms', 'chat.messages'],
      },
    }),
});

// Load chat data from storage on app startup
store.dispatch(loadChatFromStorage());

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
