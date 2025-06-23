import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  messageId: string;
  id?: string;
  senderId?: string;
  from: string;
  content: string;
  type: "TEXT" | "IMAGE" | "VIDEO" | "ORDER_INFO" | "OPTIONS";
  messageType?: "TEXT" | "IMAGE" | "VIDEO" | "ORDER_INFO" | "OPTIONS";
  timestamp: Date | string;
  roomId: string;
  metadata?: Record<string, any>;
}

interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  type: 'SUPPORT' | 'ORDER' | 'CHATBOT';
  orderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportSession {
  sessionId: string;
  chatMode: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  slaDeadline?: string;
  timestamp: string;
}

interface ChatState {
  rooms: ChatRoom[];
  activeRoomId: string | null;
  messages: Record<string, ChatMessage[]>;
  isLoading: boolean;
  error: string | null;
  supportSession: SupportSession | null;
}

const initialState: ChatState = {
  rooms: [],
  activeRoomId: null,
  messages: {},
  isLoading: false,
  error: null,
  supportSession: null,
};

// Load chat data from AsyncStorage
export const loadChatFromStorage = createAsyncThunk(
  'chat/loadFromStorage',
  async () => {
    try {
      const chatData = await AsyncStorage.getItem('restaurant_chat_data');
      if (chatData) {
        return JSON.parse(chatData);
      }
      return initialState;
    } catch (error) {
      console.error('Failed to load chat data from storage:', error);
      return initialState;
    }
  }
);

// Save chat data to AsyncStorage
const saveChatToStorage = async (state: ChatState) => {
  try {
    await AsyncStorage.setItem('restaurant_chat_data', JSON.stringify({
      rooms: state.rooms,
      messages: state.messages,
      supportSession: state.supportSession,
    }));
  } catch (error) {
    console.error('Failed to save chat data to storage:', error);
  }
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveRoom: (state, action: PayloadAction<string>) => {
      state.activeRoomId = action.payload;
      
      // Reset unread count when room becomes active
      const room = state.rooms.find(r => r.id === action.payload);
      if (room) {
        room.unreadCount = 0;
      }
      
      saveChatToStorage(state);
    },
    
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      const { roomId } = action.payload;
      
      // Ensure timestamp is a string for serialization
      const message = {
        ...action.payload,
        timestamp: action.payload.timestamp instanceof Date 
          ? action.payload.timestamp.toISOString() 
          : action.payload.timestamp
      };
      
      // Initialize messages array for the room if it doesn't exist
      if (!state.messages[roomId]) {
        state.messages[roomId] = [];
      }
      
      // Add message to the room
      state.messages[roomId].push(message);
      
      // Update room's last message
      const roomIndex = state.rooms.findIndex(r => r.id === roomId);
      if (roomIndex >= 0) {
        state.rooms[roomIndex].lastMessage = message;
        state.rooms[roomIndex].updatedAt = new Date().toISOString();
        
        // Increment unread count if this isn't the active room
        if (state.activeRoomId !== roomId) {
          state.rooms[roomIndex].unreadCount += 1;
        }
      }
      
      saveChatToStorage(state);
    },
    
    setMessages: (state, action: PayloadAction<{ roomId: string, messages: ChatMessage[] }>) => {
      const { roomId, messages } = action.payload;
      
      // Ensure all timestamps are strings for serialization
      const serializedMessages = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
      }));
      
      state.messages[roomId] = serializedMessages;
      
      // Update room's last message if there are messages
      if (serializedMessages.length > 0) {
        const roomIndex = state.rooms.findIndex(r => r.id === roomId);
        if (roomIndex >= 0) {
          state.rooms[roomIndex].lastMessage = serializedMessages[serializedMessages.length - 1];
        }
      }
      
      saveChatToStorage(state);
    },
    
    addRoom: (state, action: PayloadAction<Omit<ChatRoom, 'createdAt' | 'updatedAt'> & { 
      createdAt?: Date | string, 
      updatedAt?: Date | string 
    }>) => {
      // Convert dates to ISO strings for serialization
      const room: ChatRoom = {
        ...action.payload,
        createdAt: action.payload.createdAt instanceof Date 
          ? action.payload.createdAt.toISOString() 
          : (action.payload.createdAt || new Date().toISOString()),
        updatedAt: action.payload.updatedAt instanceof Date 
          ? action.payload.updatedAt.toISOString() 
          : (action.payload.updatedAt || new Date().toISOString())
      };
      
      // Check if room already exists
      const existingRoomIndex = state.rooms.findIndex(r => r.id === room.id);
      
      if (existingRoomIndex >= 0) {
        // Update existing room
        state.rooms[existingRoomIndex] = {
          ...state.rooms[existingRoomIndex],
          ...room,
        };
      } else {
        // Add new room
        state.rooms.push(room);
      }
      
      // Initialize messages array for the room
      if (!state.messages[room.id]) {
        state.messages[room.id] = [];
      }
      
      saveChatToStorage(state);
    },
    
    clearUnreadCount: (state, action: PayloadAction<string>) => {
      const roomId = action.payload;
      const roomIndex = state.rooms.findIndex(r => r.id === roomId);
      
      if (roomIndex >= 0) {
        state.rooms[roomIndex].unreadCount = 0;
      }
      
      saveChatToStorage(state);
    },

    setSupportSession: (state, action: PayloadAction<SupportSession>) => {
      state.supportSession = action.payload;
      saveChatToStorage(state);
    },

    clearSupportSession: (state) => {
      state.supportSession = null;
      saveChatToStorage(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadChatFromStorage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadChatFromStorage.fulfilled, (state, action) => {
        state.isLoading = false;
        
        if (action.payload) {
          // Restore rooms and messages from storage
          if (action.payload.rooms) {
            state.rooms = action.payload.rooms;
          }
          
          if (action.payload.messages) {
            state.messages = action.payload.messages;
          }

          if (action.payload.supportSession) {
            state.supportSession = action.payload.supportSession;
          }
        }
      })
      .addCase(loadChatFromStorage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load chat data';
      });
  },
});

export const { 
  setActiveRoom,
  addMessage,
  setMessages,
  addRoom,
  clearUnreadCount,
  setSupportSession,
  clearSupportSession
} = chatSlice.actions;

export default chatSlice.reducer; 