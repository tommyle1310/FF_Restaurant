import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useSelector, useDispatch } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import { store } from "@/src/store/store";
import { BACKEND_URL, CHAT_SOCKET_URL } from "../utils/constants";
import { 
  addMessage, 
  setMessages, 
  addRoom, 
  setActiveRoom,
  ChatMessage,
  setSupportSession
} from "@/src/store/chatSlice";

// Define types for the chatbot responses
export interface ChatbotOption {
  text: string;
  value: string;
}

export interface ChatbotQuickReply {
  text: string;
  value: string;
}

export interface ChatbotCard {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  buttons?: Array<{
    text: string;
    value: string;
  }>;
}

export interface ChatbotFormField {
  type: 'text' | 'select' | 'date' | 'number';
  label: string;
  key: string;
  required?: boolean;
  options?: Array<{
    text: string;
    value: string;
  }>;
}

export interface ChatbotMessage {
  sessionId: string;
  message: string;
  type: 'text' | 'options' | 'quickReplies' | 'cards' | 'form' | 'image';
  options?: ChatbotOption[];
  quickReplies?: ChatbotQuickReply[];
  cards?: ChatbotCard[];
  formFields?: ChatbotFormField[];
  followUpPrompt?: string;
  timestamp: string;
  sender: string;
  confidence?: number;
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

export const useFChatSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingSupport, setIsRequestingSupport] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [chatType, setChatType] = useState<"SUPPORT" | "ORDER" | "CHATBOT">("SUPPORT");
  const [currentSession, setCurrentSession] = useState<{
    chatId?: string;
    dbRoomId?: string;
    withUser?: string;
    type?: "SUPPORT" | "ORDER" | "CHATBOT";
    orderId?: string;
    supportSessionId?: string;
  } | null>(null);
  
  // Track sent messages to avoid duplicates
  const sentMessagesRef = useRef<Set<string>>(new Set());
  
  const dispatch = useDispatch();
  const { accessToken, id: restaurantId } = useSelector((state: RootState) => state.auth);
  const { activeRoomId, messages, supportSession } = useSelector((state: RootState) => state.chat);
  
  // Get messages for the active room
  const activeRoomMessages = activeRoomId ? messages[activeRoomId] || [] : [];

  // Debug logging
  useEffect(() => {
    console.log("Current session:", currentSession);
    console.log("Active room ID:", activeRoomId);
    console.log("Support session:", supportSession);
  }, [currentSession, activeRoomId, supportSession]);

  // Initialize socket connection
  useEffect(() => {
    if (!accessToken) {
      console.log("No access token available");
      return;
    }

    console.log("Initializing socket connection with URL:", `${CHAT_SOCKET_URL}`);
    
    // Initialize socket connection specifically for chat
    const socketInstance = io(`${CHAT_SOCKET_URL}`, {
      transports: ["websocket"],
      extraHeaders: {
        auth: `Bearer ${accessToken}`,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Log all socket events for debugging
    const originalEmit = socketInstance.emit;
    socketInstance.emit = function(event: string, ...args: any[]) {
      console.log(`[Socket Emit] ${event}`, args.length > 0 ? args[0] : '');
      return originalEmit.apply(this, [event, ...args]);
    };

    socketInstance.onAny((event, ...args) => {
      console.log(`[Socket Received] ${event}`, args.length > 0 ? args[0] : '');
    });

    socketInstance.on("connect", () => {
      console.log("Connected to chat server with socket ID:", socketInstance.id);
      setSocket(socketInstance);
      setIsConnected(true);
      
      // If we have an activeRoomId but no currentSession, try to restore the session
      if (activeRoomId && !currentSession?.dbRoomId) {
        console.log("Attempting to restore session for room:", activeRoomId);
        // We can use the activeRoomId directly for getting chat history
        socketInstance.emit("getChatHistory", { roomId: activeRoomId });
      }
      
      // If we have a support session ID, try to reconnect to it
      if (supportSession?.sessionId && !currentSession?.supportSessionId) {
        console.log("Reconnecting to support session:", supportSession.sessionId);
        setCurrentSession(prev => ({
          ...prev,
          supportSessionId: supportSession.sessionId,
          type: "CHATBOT"
        }));
      }
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Disconnected from chat server:", reason);
      setSocket(null);
      setIsConnected(false);
      
      // Don't clear currentSession on disconnect to allow for reconnection
      // Just mark that we're disconnected
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setSocket(null);
      setIsConnected(false);
    });

    // Handle incoming messages
    socketInstance.on("newMessage", (message: ChatMessage) => {
      console.log("New message received:", message);
      
      // Check if this is a message we already sent locally
      if (message.senderId === restaurantId && sentMessagesRef.current.has(message.content)) {
        console.log("Skipping duplicate message that we already added locally:", message.content);
        // Remove from tracking set as we've now processed it
        sentMessagesRef.current.delete(message.content);
        return;
      }
      
      // If we have a roomId in the message
      if (message.roomId) {
        // Check if this room exists in our store
        const state = store.getState();
        const roomExists = state.chat.rooms.some((room: any) => room.id === message.roomId);
        
        if (!roomExists) {
          console.log("Creating new room for message:", message.roomId);
          
          // Create a new room for this message
          dispatch(addRoom({
            id: message.roomId,
            participants: [message.senderId || message.from || "unknown"],
            unreadCount: 1,
            type: currentSession?.type || "SUPPORT",
            orderId: currentSession?.orderId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
          
          // If we don't have an active room or this message is for our current session but we're missing the roomId
          if (!activeRoomId || (currentSession && !currentSession.dbRoomId)) {
            console.log("Setting active room to:", message.roomId);
            dispatch(setActiveRoom(message.roomId));
            
            // Update current session with the roomId
            if (currentSession) {
              setCurrentSession({
                ...currentSession,
                dbRoomId: message.roomId
              });
            }
          }
        }
        
        // Add the message to the store
        dispatch(addMessage(message));
      } else {
        console.warn("Received message without roomId:", message);
      }
    });
    
    // Handle chat history
    socketInstance.on(
      "chatHistory",
      (data: { roomId: string; messages: ChatMessage[]; id?: string }) => {
        console.log("Chat history received:", data);
        if (data.messages && Array.isArray(data.messages)) {
          const formattedMessages = data.messages.map((msg) => ({
            ...msg,
            messageId: msg.id ?? "",
            from: msg.senderId ?? "",
            content: msg.content,
            type: msg.messageType ?? "TEXT",
            timestamp: msg.timestamp,
            roomId: msg.roomId,
          }));
          
          const roomId = data.roomId;
          
          dispatch(setMessages({
            roomId,
            messages: formattedMessages
          }));
          
          // If we got history but don't have a current session with this roomId,
          // update our current session to use this roomId
          if (!currentSession?.dbRoomId && roomId) {
            console.log("Updating current session with roomId from chat history:", roomId);
            setCurrentSession(prev => ({
              ...prev,
              dbRoomId: roomId,
              chatId: prev?.chatId || `restored_${roomId}`,
              type: prev?.type || "SUPPORT"
            }));
          }
          
          setIsLoading(false);
        } else {
          console.log("Unexpected message format or empty history:", data);
          // Always set loading to false even if there are no messages
          setIsLoading(false);
        }
      }
    );

    // Handle chat started event
    socketInstance.on("chatStarted", (data: {
      chatId: string;
      withUser: string;
      type: "SUPPORT" | "ORDER" | "CHATBOT";
      dbRoomId?: string;
      orderId?: string;
    }) => {
      console.log("Chat started:", data);
      
      // Only update session if we don't already have a valid dbRoomId
      // This prevents overwriting an existing valid session
      if (!currentSession?.dbRoomId) {
        // Extract roomId from dbRoomId if provided, otherwise use chatId as a temporary ID
        const roomId = data.dbRoomId || data.chatId;
        
        // Update current session
        setCurrentSession({
          chatId: data.chatId,
          dbRoomId: data.dbRoomId,
          withUser: data.withUser,
          type: data.type,
          orderId: data.orderId
        });
        
        // Update chat type
        setChatType(data.type);
        
        // Only add room to Redux store if we have a valid dbRoomId
        if (data.dbRoomId) {
          dispatch(addRoom({
            id: data.dbRoomId,
            participants: [data.withUser],
            unreadCount: 0,
            type: data.type,
            orderId: data.orderId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
          
          // Set active room
          dispatch(setActiveRoom(data.dbRoomId));
        }
        
        // Reset request state
        setIsRequestingSupport(false);
        setRequestError(null);
      } else {
        console.log("Ignoring chatStarted event as we already have an active session with dbRoomId:", currentSession.dbRoomId);
      }
    });

    // Handle support chat responses
    socketInstance.on("startSupportChatResponse", (data: {
      success: boolean;
      sessionId: string;
      chatMode: string;
      status: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      category?: string;
      slaDeadline?: string;
      timestamp: string;
      note?: string;
    }) => {
      console.log("Support chat started:", data);
      
      if (data.success) {
        // Store the support session in Redux
        dispatch(setSupportSession({
          sessionId: data.sessionId,
          chatMode: data.chatMode,
          status: data.status,
          priority: data.priority,
          category: data.category,
          slaDeadline: data.slaDeadline,
          timestamp: data.timestamp
        }));
        
        // Update current session with support session ID
        setCurrentSession(prev => ({
          ...prev,
          supportSessionId: data.sessionId,
          type: "CHATBOT"
        }));
        
        // Create a temporary room ID for chatbot messages
        const tempRoomId = `chatbot_${data.sessionId}`;
        
        // Add room to Redux store
        dispatch(addRoom({
          id: tempRoomId,
          participants: ["FlashFood Assistant"],
          unreadCount: 0,
          type: "CHATBOT",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        
        // Set active room
        dispatch(setActiveRoom(tempRoomId));
        
        // Update current session with room ID
        setCurrentSession(prev => ({
          ...prev,
          dbRoomId: tempRoomId,
          supportSessionId: data.sessionId,
          type: "CHATBOT"
        }));
        
        setChatType("CHATBOT");
        setIsRequestingSupport(false);
        setRequestError(null);
        setIsLoading(false);
      } else {
        setRequestError("Failed to start support chat. Please try again.");
        setIsRequestingSupport(false);
        setIsLoading(false);
      }
    });

    // Handle chatbot messages
    socketInstance.on("chatbotMessage", (data: ChatbotMessage) => {
      console.log("Chatbot message received:", data);
      
      // Check if we have a valid session ID and support session
      if (!data.sessionId) {
        console.warn("Received chatbot message without session ID");
      }
      
      if (!supportSession) {
        console.warn("No active support session found in Redux store");
        // Try to create a support session from the message
        if (data.sessionId) {
          console.log("Creating support session from message:", data.sessionId);
          dispatch(setSupportSession({
            sessionId: data.sessionId,
            chatMode: "chatbot",
            status: "active",
            priority: "medium",
            timestamp: new Date().toISOString()
          }));
        }
      }
      
      // Create a room ID for chatbot if we don't have one
      const roomId = currentSession?.dbRoomId || `chatbot_${data.sessionId}`;
      console.log("Using room ID for chatbot message:", roomId);
      
      // Format the message content based on the type
      let content = data.message;
      let messageType: "TEXT" | "IMAGE" | "VIDEO" | "ORDER_INFO" | "OPTIONS" = "TEXT";
      
      // For options type, format the content to include options
      if (data.type === 'options' && data.options) {
        messageType = "OPTIONS";
        console.log("Processing options message with options:", data.options);
      }
      
      // Create a message object
      const message: ChatMessage = {
        messageId: `chatbot_${Date.now()}`,
        from: "FlashFood Assistant",
        senderId: "FlashFood Assistant",
        content: content,
        type: messageType,
        timestamp: data.timestamp || new Date().toISOString(),
        roomId: roomId,
        metadata: {
          chatbotMessage: data // Store the original chatbot message
        }
      };
      
      console.log("Created message object:", message);
      
      // If we don't have an active room yet, create one
      if (!activeRoomId) {
        console.log("Creating new room for chatbot:", roomId);
        dispatch(addRoom({
          id: roomId,
          participants: ["FlashFood Assistant"],
          unreadCount: 0,
          type: "CHATBOT",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        
        dispatch(setActiveRoom(roomId));
        
        // Update current session
        setCurrentSession(prev => ({
          ...prev,
          dbRoomId: roomId,
          supportSessionId: data.sessionId,
          type: "CHATBOT"
        }));
      }
      
      // Add the message to the store
      console.log("Dispatching addMessage with:", message);
      dispatch(addMessage(message));
      
      // Make sure loading state is cleared when we receive messages
      setIsLoading(false);
    });

    // Handle human agent messages
    socketInstance.on("agentMessage", (data: {
      agentId: string;
      agentName: string;
      message: string;
      messageType: string;
      sender: string;
      sessionId: string;
      timestamp: string;
    }) => {
      console.log("Agent message received:", data);
      
      if (!data.sessionId) {
        console.warn("Received agent message without session ID");
        return;
      }
      
      // Create or update support session if needed
      if (!supportSession) {
        console.log("Creating support session from agent message:", data.sessionId);
        dispatch(setSupportSession({
          sessionId: data.sessionId,
          chatMode: "human",
          status: "active",
          priority: "medium",
          timestamp: new Date().toISOString()
        }));
      }
      
      // Create a room ID for agent chat if we don't have one
      const roomId = currentSession?.dbRoomId || `chatbot_${data.sessionId}`;
      console.log("Using room ID for agent message:", roomId);
      
      // Determine message type based on the messageType field
      let messageType: "TEXT" | "IMAGE" | "VIDEO" | "ORDER_INFO" | "OPTIONS" = "TEXT";
      
      if (data.messageType === "image") {
        messageType = "IMAGE";
        console.log("Processing image message from agent:", data.message);
      }
      
      // Create a message object
      const message: ChatMessage = {
        messageId: `agent_${Date.now()}`,
        from: data.sender || data.agentName,
        senderId: data.agentId,
        content: data.message,
        type: messageType,
        timestamp: data.timestamp || new Date().toISOString(),
        roomId: roomId,
        metadata: {
          agentMessage: data // Store the original agent message
        }
      };
      
      console.log("Created agent message object with type:", message.type);
      
      // If we don't have an active room yet, create one
      if (!activeRoomId) {
        console.log("Creating new room for agent chat:", roomId);
        dispatch(addRoom({
          id: roomId,
          participants: [data.agentName || "Customer Care"],
          unreadCount: 0,
          type: "CHATBOT",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        
        dispatch(setActiveRoom(roomId));
        
        // Update current session
        setCurrentSession(prev => ({
          ...prev,
          dbRoomId: roomId,
          supportSessionId: data.sessionId,
          type: "CHATBOT"
        }));
      }
      
      // Add the message to the store
      console.log("Dispatching agent message:", message);
      dispatch(addMessage(message));
      
      // Make sure loading state is cleared when we receive messages
      setIsLoading(false);
    });

    // Handle agent join notification
    socketInstance.on("agentJoined", (data: {
      agentId: string;
      agentName: string;
      sessionId: string;
      timestamp: string;
    }) => {
      console.log("Agent joined:", data);
      
      if (!data.sessionId) {
        console.warn("Received agent joined notification without session ID");
        return;
      }
      
      // Create a room ID for agent chat
      const roomId = currentSession?.dbRoomId || `chatbot_${data.sessionId}`;
      
      // Create a system message to show agent joined
      const message: ChatMessage = {
        messageId: `system_${Date.now()}`,
        from: "system",
        senderId: "system",
        content: `${data.agentName} has joined the chat`,
        type: "TEXT",
        timestamp: data.timestamp || new Date().toISOString(),
        roomId: roomId,
        metadata: {
          isSystemMessage: true,
          agentJoined: data
        }
      };
      
      // Add the message to the store
      dispatch(addMessage(message));
    });

    // Handle agent leave notification
    socketInstance.on("agentLeft", (data: {
      agentId: string;
      agentName: string;
      sessionId: string;
      timestamp: string;
    }) => {
      console.log("Agent left:", data);
      
      if (!data.sessionId) {
        console.warn("Received agent left notification without session ID");
        return;
      }
      
      // Create a room ID for agent chat
      const roomId = currentSession?.dbRoomId || `chatbot_${data.sessionId}`;
      
      // Create a system message to show agent left
      const message: ChatMessage = {
        messageId: `system_${Date.now()}`,
        from: "system",
        senderId: "system",
        content: `${data.agentName} has left the chat`,
        type: "TEXT",
        timestamp: data.timestamp || new Date().toISOString(),
        roomId: roomId,
        metadata: {
          isSystemMessage: true,
          agentLeft: data
        }
      };
      
      // Add the message to the store
      dispatch(addMessage(message));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [accessToken, dispatch, restaurantId, activeRoomId, currentSession, supportSession]);

  // Request customer care chat - this is the main method to start a support chat
  const requestCustomerCare = useCallback(() => {
    if (!socket) {
      console.log("Socket is not initialized");
      setRequestError("Connection not available");
      return;
    }
    
    setIsRequestingSupport(true);
    setRequestError(null);
    setChatType("SUPPORT");
    
    console.log("Requesting customer care");
    socket.emit("requestCustomerCare", { type: "SUPPORT" });
  }, [socket]);

  // Start a chat with a user - mainly for ORDER type chats
  const startChat = useCallback((
    withUserId: string,
    type: "SUPPORT" | "ORDER",
    orderId?: string
  ) => {
    if (!socket) {
      console.log("Socket is not initialized");
      setRequestError("Connection not available");
      return;
    }
    
    setIsRequestingSupport(true);
    setRequestError(null);
    setChatType(type);
    
    console.log("Starting chat with", withUserId, "type:", type, "orderId:", orderId);
    socket.emit("startChat", { withUserId, type, orderId });
  }, [socket]);

  // Start a support chat with the chatbot
  const startSupportChat = useCallback((
    category?: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    metadata?: Record<string, any>
  ) => {
    if (!socket) {
      console.log("Socket is not initialized");
      setRequestError("Connection not available");
      return;
    }
    
    if (!socket.connected) {
      console.log("Socket is not connected, attempting to reconnect");
      socket.connect();
      
      // Wait for connection before proceeding
      socket.once('connect', () => {
        console.log("Socket reconnected, proceeding with startSupportChat");
        _startSupportChat(socket);
      });
      
      return;
    }
    
    _startSupportChat(socket);
    
    function _startSupportChat(socketInstance: Socket) {
      setIsRequestingSupport(true);
      setIsLoading(true);
      setRequestError(null);
      setChatType("CHATBOT");
      
      console.log("Starting support chat with category:", category, "priority:", priority);
      
      // If we already have a support session, try to reuse it
      if (supportSession?.sessionId) {
        console.log("Reusing existing support session:", supportSession.sessionId);
        
        // Create a room ID for the session if needed
        const roomId = currentSession?.dbRoomId || `chatbot_${supportSession.sessionId}`;
        
        if (!currentSession?.dbRoomId) {
          console.log("Setting up room for existing session:", roomId);
          
          // Add room to Redux store
          dispatch(addRoom({
            id: roomId,
            participants: ["FlashFood Assistant"],
            unreadCount: 0,
            type: "CHATBOT",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
          
          // Set active room
          dispatch(setActiveRoom(roomId));
          
          // Update current session
          setCurrentSession({
            dbRoomId: roomId,
            supportSessionId: supportSession.sessionId,
            type: "CHATBOT"
          });
        }
        
        // Send a welcome message to restart the conversation
        socketInstance.emit("sendSupportMessage", {
          sessionId: supportSession.sessionId,
          message: "Hello",
          messageType: "text",
          metadata: { resumeSession: true, ...metadata }
        });
        
        setIsRequestingSupport(false);
        setIsLoading(false);
        return;
      }
      
      // Otherwise, start a new session
      socketInstance.emit("startSupportChat", { 
        category, 
        priority,
        metadata
      });
      
      // Set a timeout to clear loading state if no response is received
      const loadingTimeout = setTimeout(() => {
        console.log("Support chat request timed out, clearing loading state");
        setIsLoading(false);
        setIsRequestingSupport(false);
      }, 10000); // 10 seconds timeout
      
      return () => clearTimeout(loadingTimeout);
    }
  }, [socket, supportSession, currentSession, dispatch]);

  // Send a message to the chatbot
  const sendSupportMessage = useCallback((
    message: string,
    messageType: 'text' | 'image' | 'voice' | 'file' = 'text',
    metadata?: Record<string, any>
  ) => {
    if (!socket) {
      console.log("Socket is not initialized");
      return;
    }
    
    if (!socket.connected) {
      console.log("Socket is not connected, attempting to reconnect");
      socket.connect();
    }
    
    if (!supportSession?.sessionId) {
      console.log("No support session ID available");
      return;
    }
    
    console.log("Sending support message:", message, "type:", messageType, "to session:", supportSession.sessionId);
    
    // Create a temporary message to show immediately in the UI
    const roomId = currentSession?.dbRoomId || `chatbot_${supportSession.sessionId}`;
    
    // Add to tracking set to avoid duplicates
    sentMessagesRef.current.add(message);
    
    // Determine message type for the UI
    let uiMessageType: "TEXT" | "IMAGE" | "VIDEO" | "ORDER_INFO" | "OPTIONS" = "TEXT";
    if (messageType === "image") {
      uiMessageType = "IMAGE";
    }
    
    // Create a temporary message to show immediately in the UI
    const tempMessage: ChatMessage = {
      messageId: `temp_${Date.now()}`,
      from: restaurantId || "",
      senderId: restaurantId || "",
      content: message,
      type: uiMessageType,
      timestamp: new Date().toISOString(),
      roomId
    };
    
    // Add the temporary message to the store
    dispatch(addMessage(tempMessage));
    
    // Log the exact message being sent to help debug
    console.log("Emitting sendSupportMessage event with payload:", {
      sessionId: supportSession.sessionId,
      message,
      messageType,
      metadata
    });
    
    // Send the actual message via socket
    socket.emit("sendSupportMessage", {
      sessionId: supportSession.sessionId,
      message,
      messageType,
      metadata
    });
    
    // Add a check to see if we receive a response within a reasonable time
    const responseTimeout = setTimeout(() => {
      console.log("No chatbot response received within timeout period. Check server logs or connection.");
    }, 3000);
    
    // Store the timeout to clear it if needed
    const timeoutRef = { current: responseTimeout };
    
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [socket, supportSession, currentSession, restaurantId, dispatch]);

  // Send a message
  const sendMessage = useCallback((
    content: string,
    type: "TEXT" | "IMAGE" | "VIDEO" | "ORDER_INFO" = "TEXT"
  ) => {
    // Use dbRoomId from currentSession or fall back to activeRoomId
    const roomId = currentSession?.dbRoomId || activeRoomId;
    
    // If this is a chatbot session, use sendSupportMessage instead
    if (currentSession?.type === "CHATBOT" && supportSession?.sessionId) {
      const messageType = type === "IMAGE" ? "image" : "text";
      sendSupportMessage(content, messageType as any);
      return;
    }
    
    if (!socket || !roomId) {
      console.log("Socket or roomId is not available", { 
        socket: !!socket, 
        roomId, 
        currentSession,
        activeRoomId
      });
      return;
    }
    
    console.log("sending message", roomId, content, type);
    
    // Add to tracking set to avoid duplicates
    sentMessagesRef.current.add(content);
    
    // Create a temporary message to show immediately in the UI
    const tempMessage: ChatMessage = {
      messageId: `temp_${Date.now()}`,
      from: restaurantId || "",
      senderId: restaurantId || "",
      content,
      type,
      timestamp: new Date().toISOString(),
      roomId
    };
    
    // Add the temporary message to the store
    dispatch(addMessage(tempMessage));
    
    // Send the actual message via socket
    socket.emit("sendMessage", {
      roomId,
      content,
      type,
    });
  }, [socket, activeRoomId, currentSession, restaurantId, dispatch, supportSession, sendSupportMessage]);

  // Get chat history
  const getChatHistory = useCallback(() => {
    // Use dbRoomId from currentSession or fall back to activeRoomId
    const roomId = currentSession?.dbRoomId || activeRoomId;
    
    if (!socket || !roomId) {
      console.log("Socket or roomId is not available for getting chat history", { 
        socket: !!socket, 
        roomId, 
        currentSession,
        activeRoomId
      });
      return;
    }
    
    setIsLoading(true);
    console.log("Getting chat history for room:", roomId);
    socket.emit("getChatHistory", { roomId });
    
    // Set a timeout to clear loading state if no response is received
    const loadingTimeout = setTimeout(() => {
      console.log("Chat history request timed out, clearing loading state");
      setIsLoading(false);
    }, 5000); // 5 seconds timeout
    
    // Store the timeout ID in a ref to clear it if needed
    const timeoutRef = { current: loadingTimeout };
    
    // Clean up the timeout when the component unmounts or when the function is called again
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [socket, activeRoomId, currentSession]);

  return {
    socket,
    isConnected,
    isLoading,
    isRequestingSupport,
    requestError,
    messages: activeRoomMessages,
    roomId: currentSession?.dbRoomId || activeRoomId,
    currentSession,
    chatType,
    supportSession,
    requestCustomerCare,
    startChat,
    startSupportChat,
    sendMessage,
    sendSupportMessage,
    getChatHistory,
  };
};
