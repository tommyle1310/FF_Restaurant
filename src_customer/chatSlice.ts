import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ChatMessage {
  messageId: string;
  id?: string;
  senderId?: string;
  from: string;
  content: string;
  type: "TEXT" | "IMAGE" | "VIDEO" | "ORDER_INFO";
  messageType?: "TEXT" | "IMAGE" | "VIDEO" | "ORDER_INFO";
  timestamp: Date | string; // Allow both for compatibility
  roomId: string;
  // Additional fields from server response
  readBy?: string[];
  senderDetails?: {
    avatar?: any;
    first_name?: string;
    last_name?: string;
    id?: string;
    phone?: string;
  };
  senderType?:
    | "CUSTOMER"
    | "CUSTOMER_CARE_REPRESENTATIVE"
    | "RESTAURANT"
    | "DRIVER";
}

interface ChatSession {
  chatId: string;
  dbRoomId: string;
  withUser: string;
  type: "SUPPORT" | "ORDER";
  orderId?: string;
  isActive: boolean;
  createdAt: string; // ISO string for serialization
  lastMessageAt?: string; // ISO string for serialization
}

interface ChatState {
  // Current active chat sessions by type
  currentSupportSession: ChatSession | null;
  currentOrderSession: ChatSession | null;
  
  // Legacy field for backward compatibility
  currentSession: ChatSession | null;

  // All chat sessions (for history)
  sessions: ChatSession[];

  // Messages for current sessions by type
  supportMessages: ChatMessage[];
  orderMessages: Record<string, ChatMessage[]>; // Keyed by orderId

  // Legacy field for backward compatibility
  messages: ChatMessage[];

  // Chat request state
  isRequestingSupport: boolean;
  requestError: string | null;

  // Connection state
  isConnected: boolean;

  // Loading states
  isLoadingHistory: boolean;
  isLoadingSessions: boolean;
}

const initialState: ChatState = {
  currentSupportSession: null,
  currentOrderSession: null,
  currentSession: null,
  sessions: [],
  supportMessages: [],
  orderMessages: {},
  messages: [],
  isRequestingSupport: false,
  requestError: null,
  isConnected: false,
  isLoadingHistory: false,
  isLoadingSessions: false,
};

// AsyncStorage keys
const CHAT_SESSIONS_KEY = "@chat_sessions";
const CHAT_SUPPORT_MESSAGES_KEY = "@chat_support_messages";
const CHAT_ORDER_MESSAGES_KEY = "@chat_order_messages";
const CURRENT_SUPPORT_SESSION_KEY = "@current_support_chat_session";
const CURRENT_ORDER_SESSION_KEY = "@current_order_chat_session";

// Legacy keys
const CHAT_MESSAGES_KEY = "@chat_messages";
const CURRENT_SESSION_KEY = "@current_chat_session";

// Async thunks for persistence
export const loadChatDataFromStorage = createAsyncThunk(
  "chat/loadChatDataFromStorage",
  async () => {
    try {
      const [
        sessionsData, 
        supportMessagesData, 
        orderMessagesData, 
        currentSupportSessionData,
        currentOrderSessionData,
        // Legacy data
        messagesData,
        currentSessionData
      ] = await Promise.all([
        AsyncStorage.getItem(CHAT_SESSIONS_KEY),
        AsyncStorage.getItem(CHAT_SUPPORT_MESSAGES_KEY),
        AsyncStorage.getItem(CHAT_ORDER_MESSAGES_KEY),
        AsyncStorage.getItem(CURRENT_SUPPORT_SESSION_KEY),
        AsyncStorage.getItem(CURRENT_ORDER_SESSION_KEY),
        // Legacy data
        AsyncStorage.getItem(CHAT_MESSAGES_KEY),
        AsyncStorage.getItem(CURRENT_SESSION_KEY),
      ]);

      const sessions = sessionsData ? JSON.parse(sessionsData) : [];
      const supportMessages = supportMessagesData ? JSON.parse(supportMessagesData) : [];
      const orderMessages = orderMessagesData ? JSON.parse(orderMessagesData) : {};
      let currentSupportSession = currentSupportSessionData ? JSON.parse(currentSupportSessionData) : null;
      let currentOrderSession = currentOrderSessionData ? JSON.parse(currentOrderSessionData) : null;
      
      // Legacy data
      const messages = messagesData ? JSON.parse(messagesData) : [];
      const currentSession = currentSessionData ? JSON.parse(currentSessionData) : null;

      // If we have legacy data but no new data, migrate it
      if (!currentSupportSession && !currentOrderSession && currentSession) {
        if (currentSession.type === "SUPPORT") {
          currentSupportSession = currentSession;
        } else if (currentSession.type === "ORDER") {
          currentOrderSession = currentSession;
        }
      }

      // Determine which session to use as the current session for backward compatibility
      const finalCurrentSession = currentSupportSession || currentOrderSession || null;

      return {
        sessions,
        supportMessages,
        orderMessages,
        currentSupportSession,
        currentOrderSession,
        // Legacy data
        messages,
        currentSession: finalCurrentSession,
      };
    } catch (error) {
      console.error("Error loading chat data from storage:", error);
      return {
        sessions: [],
        supportMessages: [],
        orderMessages: {},
        currentSupportSession: null,
        currentOrderSession: null,
        // Legacy data
        messages: [],
        currentSession: null,
      };
    }
  }
);

export const saveChatSessionToStorage = createAsyncThunk(
  "chat/saveChatSessionToStorage",
  async (session: ChatSession) => {
    try {
      // Save current session based on type
      if (session.type === "SUPPORT") {
        await AsyncStorage.setItem(CURRENT_SUPPORT_SESSION_KEY, JSON.stringify(session));
      } else if (session.type === "ORDER") {
        await AsyncStorage.setItem(CURRENT_ORDER_SESSION_KEY, JSON.stringify(session));
      }
      
      // Also save to legacy key for backward compatibility
      await AsyncStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));

      // Update sessions list
      const existingSessions = await AsyncStorage.getItem(CHAT_SESSIONS_KEY);
      const sessions: ChatSession[] = existingSessions
        ? JSON.parse(existingSessions)
        : [];

      // Update or add session
      const sessionIndex = sessions.findIndex(
        (s) => s.chatId === session.chatId
      );
      if (sessionIndex >= 0) {
        sessions[sessionIndex] = session;
      } else {
        sessions.push(session);
      }

      await AsyncStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));

      return session;
    } catch (error) {
      console.error("Error saving chat session to storage:", error);
      throw error;
    }
  }
);

export const saveMessagesToStorage = createAsyncThunk(
  "chat/saveMessagesToStorage",
  async (payload: { messages: ChatMessage[], type: "SUPPORT" | "ORDER", orderId?: string }) => {
    try {
      const { messages, type, orderId } = payload;
      
      if (type === "SUPPORT") {
        await AsyncStorage.setItem(CHAT_SUPPORT_MESSAGES_KEY, JSON.stringify(messages));
      } else if (type === "ORDER" && orderId) {
        // Get existing order messages
        const existingOrderMessages = await AsyncStorage.getItem(CHAT_ORDER_MESSAGES_KEY);
        const orderMessages = existingOrderMessages ? JSON.parse(existingOrderMessages) : {};
        
        // Update messages for this order
        orderMessages[orderId] = messages;
        
        await AsyncStorage.setItem(CHAT_ORDER_MESSAGES_KEY, JSON.stringify(orderMessages));
      } else if (type === "ORDER") {
        // If it's an ORDER type but no orderId, just save to legacy storage
        await AsyncStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
      }
      
      // Also save to legacy key for backward compatibility
      await AsyncStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
      
      return { messages, type, orderId };
    } catch (error) {
      console.error("Error saving messages to storage:", error);
      throw error;
    }
  }
);

export const clearChatSession = createAsyncThunk(
  "chat/clearChatSession",
  async (type: "SUPPORT" | "ORDER" | "ALL", { getState }) => {
    try {
      const state = getState() as { chat: ChatState };
      const currentOrderSession = state.chat.currentOrderSession;
      
      if (type === "SUPPORT" || type === "ALL") {
        await AsyncStorage.removeItem(CURRENT_SUPPORT_SESSION_KEY);
        await AsyncStorage.removeItem(CHAT_SUPPORT_MESSAGES_KEY);
      }
      
      if (type === "ORDER" || type === "ALL") {
        await AsyncStorage.removeItem(CURRENT_ORDER_SESSION_KEY);
        if (currentOrderSession?.orderId) {
          // Get existing order messages
          const existingOrderMessages = await AsyncStorage.getItem(CHAT_ORDER_MESSAGES_KEY);
          const orderMessages = existingOrderMessages ? JSON.parse(existingOrderMessages) : {};
          
          // Remove messages for this order
          delete orderMessages[currentOrderSession.orderId];
          
          await AsyncStorage.setItem(CHAT_ORDER_MESSAGES_KEY, JSON.stringify(orderMessages));
        }
      }
      
      // Also clear legacy keys if clearing all
      if (type === "ALL") {
        await AsyncStorage.removeItem(CURRENT_SESSION_KEY);
        await AsyncStorage.removeItem(CHAT_MESSAGES_KEY);
      }
      
      return type;
    } catch (error) {
      console.error("Error clearing chat session:", error);
      throw error;
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    // Connection state
    setConnectionState: (state, action) => {
      state.isConnected = action.payload;
    },

    // Support request state
    startSupportRequest: (state) => {
      state.isRequestingSupport = true;
      state.requestError = null;
    },

    supportRequestSuccess: (state) => {
      state.isRequestingSupport = false;
      state.requestError = null;
    },

    supportRequestError: (state, action) => {
      state.isRequestingSupport = false;
      state.requestError = action.payload;
    },

    // Chat session management
    setChatSession: (state, action) => {
      // Accept either a full session object or individual properties
      let session: ChatSession;
      
      if (action.payload.chatId && action.payload.createdAt) {
        // Full session object
        session = action.payload;
      } else {
        // Individual properties (legacy support)
        const { chatId, dbRoomId, withUser, type, orderId } = action.payload;
        session = {
          chatId,
          dbRoomId,
          withUser,
          type,
          orderId,
          isActive: true,
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
        };
      }
      
      // Store session based on type
      if (session.type === "SUPPORT") {
        state.currentSupportSession = session;
      } else if (session.type === "ORDER") {
        state.currentOrderSession = session;
      }
      
      // Also update legacy field for backward compatibility
      state.currentSession = session;
    },

    endChatSession: (state, action) => {
      const type = action.payload?.type || "ALL";
      
      if (type === "SUPPORT" || type === "ALL") {
        if (state.currentSupportSession) {
          state.currentSupportSession.isActive = false;
        }
      }
      
      if (type === "ORDER" || type === "ALL") {
        if (state.currentOrderSession) {
          state.currentOrderSession.isActive = false;
        }
      }
      
      // Update legacy field
      if (state.currentSession) {
        state.currentSession.isActive = false;
      }
    },

    // Message management
    addMessage: (state, action) => {
      const message = action.payload;
      
      // Determine which message array to update based on current session type
      if (state.currentSupportSession && state.currentSupportSession.dbRoomId === message.roomId) {
        state.supportMessages.push(message);
        
        // Update last message time
        state.currentSupportSession.lastMessageAt = new Date().toISOString();
        
        // Update legacy fields
        state.messages.push(message);
        if (state.currentSession && state.currentSession.type === "SUPPORT") {
          state.currentSession.lastMessageAt = new Date().toISOString();
        }
      } else if (state.currentOrderSession && state.currentOrderSession.dbRoomId === message.roomId) {
        const orderId = state.currentOrderSession.orderId;
        if (orderId) {
          if (!state.orderMessages[orderId]) {
            state.orderMessages[orderId] = [];
          }
          state.orderMessages[orderId].push(message);
          
          // Update last message time
          state.currentOrderSession.lastMessageAt = new Date().toISOString();
          
          // Update legacy fields
          state.messages.push(message);
          if (state.currentSession && state.currentSession.type === "ORDER") {
            state.currentSession.lastMessageAt = new Date().toISOString();
          }
        } else {
          // If no orderId but we have a roomId match, still add to legacy messages
          state.messages.push(message);
        }
      } else {
        // If we can't determine where to put it, just add to legacy messages
        state.messages.push(message);
        
        // Try to match by roomId to any existing session
        if (state.currentSupportSession && message.roomId === state.currentSupportSession.dbRoomId) {
          state.supportMessages.push(message);
        } else if (state.currentOrderSession && message.roomId === state.currentOrderSession.dbRoomId) {
          const orderId = state.currentOrderSession.orderId;
          if (orderId) {
            if (!state.orderMessages[orderId]) {
              state.orderMessages[orderId] = [];
            }
            state.orderMessages[orderId].push(message);
          }
        }
      }
    },

    setMessages: (state, action) => {
      const { messages, type, orderId } = action.payload;
      
      if (type === "SUPPORT") {
        state.supportMessages = messages;
      } else if (type === "ORDER" && orderId) {
        state.orderMessages[orderId] = messages;
      } else if (type === "ORDER" && !orderId && state.currentOrderSession?.orderId) {
        // If no orderId provided but we have one in the current session, use that
        state.orderMessages[state.currentOrderSession.orderId] = messages;
      }
      
      // Update legacy field
      state.messages = messages;
    },

    clearMessages: (state, action) => {
      const type = action.payload?.type || "ALL";
      const orderId = action.payload?.orderId;
      
      if (type === "SUPPORT" || type === "ALL") {
        state.supportMessages = [];
      }
      
      if (type === "ORDER" && orderId) {
        state.orderMessages[orderId] = [];
      } else if (type === "ORDER" && !orderId && state.currentOrderSession?.orderId) {
        state.orderMessages[state.currentOrderSession.orderId] = [];
      } else if (type === "ALL") {
        state.orderMessages = {};
      }
      
      // Update legacy field
      if (type === "ALL") {
        state.messages = [];
      }
    },

    // Loading states
    setLoadingHistory: (state, action) => {
      state.isLoadingHistory = action.payload;
    },

    setLoadingSessions: (state, action) => {
      state.isLoadingSessions = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(loadChatDataFromStorage.fulfilled, (state, action) => {
        const { 
          sessions, 
          supportMessages, 
          orderMessages, 
          currentSupportSession, 
          currentOrderSession,
          // Legacy data
          messages,
          currentSession
        } = action.payload;
        
        state.sessions = sessions;
        state.supportMessages = supportMessages;
        state.orderMessages = orderMessages;
        state.currentSupportSession = currentSupportSession;
        state.currentOrderSession = currentOrderSession;
        
        // Legacy fields
        state.messages = messages;
        state.currentSession = currentSession;
      })
      .addCase(saveChatSessionToStorage.fulfilled, (state, action) => {
        // Update sessions list in state
        const session = action.payload;
        const sessionIndex = state.sessions.findIndex(
          (s) => s.chatId === session.chatId
        );
        if (sessionIndex >= 0) {
          state.sessions[sessionIndex] = session;
        } else {
          state.sessions.push(session);
        }
      })
      .addCase(saveMessagesToStorage.fulfilled, (state, action) => {
        // Messages are already updated in state, this is just for persistence confirmation
      })
      .addCase(clearChatSession.fulfilled, (state, action) => {
        const type = action.payload;
        
        if (type === "SUPPORT" || type === "ALL") {
          state.currentSupportSession = null;
          state.supportMessages = [];
        }
        
        if (type === "ORDER" || type === "ALL") {
          if (state.currentOrderSession?.orderId) {
            delete state.orderMessages[state.currentOrderSession.orderId];
          }
          state.currentOrderSession = null;
        }
        
        if (type === "ALL") {
          state.currentSession = null;
          state.messages = [];
        }
      });
  },
});

export const {
  setConnectionState,
  startSupportRequest,
  supportRequestSuccess,
  supportRequestError,
  setChatSession,
  endChatSession,
  addMessage,
  setMessages,
  clearMessages,
  setLoadingHistory,
  setLoadingSessions,
} = chatSlice.actions;

export default chatSlice.reducer;
