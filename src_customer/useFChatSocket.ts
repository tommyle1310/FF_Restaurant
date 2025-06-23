import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useSelector, useDispatch } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import { BACKEND_URL } from "../utils/constants";
import {
  setConnectionState,
  startSupportRequest,
  supportRequestSuccess,
  supportRequestError,
  setChatSession,
  addMessage,
  setMessages,
  setLoadingHistory,
  loadChatDataFromStorage,
  saveChatSessionToStorage,
  saveMessagesToStorage,
} from "@/src/store/chatSlice";

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

export const useFChatSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const dispatch = useDispatch();
  const [chatType, setChatType] = useState<"SUPPORT" | "ORDER">("SUPPORT");

  // Get state from Redux
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const {
    currentSupportSession,
    currentOrderSession,
    currentSession,
    supportMessages,
    orderMessages,
    messages,
    isRequestingSupport,
    requestError,
    isConnected,
  } = useSelector((state: RootState) => state.chat);

  // Get the appropriate session based on chat type
  const activeSession = chatType === "SUPPORT" 
    ? currentSupportSession 
    : currentOrderSession;
  
  // Get the appropriate messages based on chat type
  const getActiveMessages = useCallback(() => {
    if (chatType === "SUPPORT") {
      return supportMessages;
    } else if (chatType === "ORDER") {
      // For ORDER chats, check if we have messages for this order
      const orderId = activeSession?.orderId;
      if (orderId && orderMessages[orderId]) {
        return orderMessages[orderId];
      }
      
      // If we don't have specific messages for this order but we have a room ID,
      // return the legacy messages as they might contain our messages
      if (activeSession?.dbRoomId) {
        const relevantMessages = messages.filter(msg => msg.roomId === activeSession.dbRoomId);
        if (relevantMessages.length > 0) {
          return relevantMessages;
        }
      }
    }
    
    // Fallback to empty array if no messages found
    return [];
  }, [chatType, activeSession, supportMessages, orderMessages, messages]);

  // Get active messages
  const activeMessages = getActiveMessages();

  // Get roomId from active session
  const roomId = activeSession?.dbRoomId || null;

  // Debug logging
  useEffect(() => {
    console.log("Chat type:", chatType);
    console.log("Active session:", activeSession);
    console.log("Active messages:", activeMessages);
    console.log("Room ID:", roomId);
  }, [chatType, activeSession, activeMessages, roomId]);

  // Load chat data on mount
  useEffect(() => {
    dispatch(loadChatDataFromStorage());
  }, [dispatch]);

  // Save current session to storage whenever it changes
  useEffect(() => {
    if (activeSession) {
      dispatch(saveChatSessionToStorage(activeSession));
    }
  }, [activeSession, dispatch]);

  useEffect(() => {
    if (!accessToken) {
      console.log("No access token available");
      return;
    }

    // Initialize socket connection specifically for chat
    const socketInstance = io(`${BACKEND_URL}/chat`, {
      transports: ["websocket"],
      extraHeaders: {
        auth: `Bearer ${accessToken}`,
      },
    });

    socketInstance.on("connect", () => {
      console.log("Connected to chat server");
      setSocket(socketInstance);
      dispatch(setConnectionState(true));
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Disconnected from chat server:", reason);
      setSocket(null);
      dispatch(setConnectionState(false));
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setSocket(null);
      dispatch(setConnectionState(false));
    });

    socketInstance.on("newMessage", (message: any) => {
      console.log("New message received:", message);

      // Format message to match our interface
      const formattedMessage: ChatMessage = {
        messageId: message.id || message.messageId || "",
        id: message.id,
        senderId: message.senderId,
        from: message.senderId || "",
        content: message.content,
        type: message.messageType || message.type || "TEXT",
        messageType: message.messageType || message.type || "TEXT",
        timestamp: message.timestamp,
        roomId: message.roomId,
        readBy: message.readBy,
        senderDetails: message.senderDetails,
        senderType: message.senderType,
      };

      // Add message to the store
      dispatch(addMessage(formattedMessage));
      
      // Save messages to storage with the correct type and orderId
      if (activeSession) {
        const updatedMessages = [...activeMessages, formattedMessage];
        dispatch(saveMessagesToStorage({
          messages: updatedMessages,
          type: activeSession.type,
          orderId: activeSession.orderId
        }));
      }
    });
    
    socketInstance.on(
      "chatHistory",
      (data: { chatId: string; messages: any[]; id: string }) => {
        if (data.messages && Array.isArray(data.messages)) {
          const formattedMessages = data.messages.map((msg) => ({
            ...msg,
            messageId: msg.id ?? "",
            from: msg.senderId ?? "",
            content: msg.content,
            type: msg.messageType ?? "TEXT",
            messageType: msg.messageType ?? "TEXT",
            timestamp: msg.timestamp,
            roomId: msg.roomId,
            readBy: msg.readBy,
            senderDetails: msg.senderDetails,
            senderType: msg.senderType,
          }));
          
          // Set messages with the correct type and orderId
          if (activeSession) {
            dispatch(setMessages({
              messages: formattedMessages,
              type: activeSession.type,
              orderId: activeSession.orderId
            }));
            
            // Also save to storage
            dispatch(saveMessagesToStorage({
              messages: formattedMessages,
              type: activeSession.type,
              orderId: activeSession.orderId
            }));
          }
        } else {
          console.log("Unexpected message format:", data);
        }
      }
    );

    // Updated chatStarted handler to match expected data structure
    socketInstance.on(
      "chatStarted",
      (data: {
        chatId: string;
        withUser: string;
        type: "SUPPORT" | "ORDER";
        dbRoomId: string;
        orderId?: string;
      }) => {
        console.log("Chat started:", data);

        // Update the current chat type
        setChatType(data.type);

        // Create and save chat session with serializable dates
        const session = {
          chatId: data.chatId,
          dbRoomId: data.dbRoomId,
          withUser: data.withUser,
          type: data.type,
          orderId: data.orderId,
          isActive: true,
          createdAt: new Date().toISOString(), // Convert to ISO string
          lastMessageAt: new Date().toISOString(), // Convert to ISO string
        };

        // Dispatch actions in order - first set the chat session, then mark request as success
        dispatch(setChatSession(session));
        dispatch(saveChatSessionToStorage(session));
        dispatch(supportRequestSuccess());
      }
    );

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [accessToken]);

  // Request customer care chat
  const requestCustomerCare = useCallback(() => {
    if (!socket) {
      console.log("Socket is not initialized");
      dispatch(supportRequestError("Connection not available"));
      return;
    }

    // Set the chat type to SUPPORT
    setChatType("SUPPORT");
    
    dispatch(startSupportRequest());
    socket.emit("requestCustomerCare", {type: "SUPPORT"});
  }, [socket, dispatch]);

  // Generic method to start any type of chat
  const startChat = useCallback((
    withUserId: string,
    type: "SUPPORT" | "ORDER",
    orderId?: string
  ) => {
    if (!socket) {
      console.log("Socket is not initialized");
      dispatch(supportRequestError("Connection not available"));
      return;
    }

    // Update the current chat type
    setChatType(type);
    
    // For all chat types, we need to start a request
    dispatch(startSupportRequest());
    
    // Emit the appropriate event based on chat type
    if (type === "SUPPORT") {
      // For support chats, we might need special handling
      socket.emit("startChat", { withUserId, type, orderId });
    } else if (type === "ORDER") {
      // For order chats, ensure we include the orderId
      if (!orderId) {
        console.log("Order ID is required for ORDER type chats");
        dispatch(supportRequestError("Order ID is required"));
        return;
      }
      socket.emit("startChat", { withUserId, type, orderId });
    }
  }, [socket, dispatch]);

  const sendMessage = useCallback((
    content: string,
    type: "TEXT" | "IMAGE" | "VIDEO" | "ORDER_INFO" = "TEXT"
  ) => {
    if (!socket || !roomId) {
      console.log("Socket or roomId is not available");
      return;
    }
    console.log("sending message", roomId, content, type);
    socket.emit("sendMessage", {
      roomId,
      content,
      type,
    });
  }, [socket, roomId]);

  const getChatHistory = useCallback(() => {
    if (!socket || !roomId) {
      console.log("Socket or roomId is not available for getting chat history");
      return;
    }
    dispatch(setLoadingHistory(true));
    socket.emit("getChatHistory", { roomId });
  }, [socket, roomId, dispatch]);

  // Auto-load chat history when roomId changes
  useEffect(() => {
    if (socket && roomId) {
      getChatHistory();
    }
  }, [socket, roomId, getChatHistory]);

  return {
    socket,
    messages: activeMessages, // Return the active messages based on chat type
    roomId,
    currentSession: activeSession, // Return the active session based on chat type
    isRequestingSupport,
    requestError,
    isConnected,
    requestCustomerCare,
    startChat,
    sendMessage,
    getChatHistory,
    chatType,
  };
};
