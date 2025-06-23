import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  StyleSheet,
  ActivityIndicator,
  TextStyle,
  ViewStyle,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { MainStackParamList } from "@/src/navigation/AppNavigator";
import { StackNavigationProp } from "@react-navigation/stack";
import { useFChatSocket, ChatbotMessage } from "@/src/hooks/useFChatSocket";
import { useSelector, useDispatch } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import { colors, spacing } from "@/src/theme";
import FFText from "@/src/components/FFText";
import FFView from "@/src/components/FFView";
import { ChatMessage } from "@/src/store/chatSlice";
import FFButton from "@/src/components/FFButton";
import * as ImagePicker from "expo-image-picker";
import axiosInstance from "@/src/utils/axiosConfig";
import FFSpinner from "@/src/components/FFSpinner";

type FChatNavigationProp = StackNavigationProp<MainStackParamList, "FChat">;
type FChatRouteProp = RouteProp<
  MainStackParamList & {
    FChat: {
      withUserId?: string;
      type?: "SUPPORT" | "ORDER" | "CHATBOT";
      orderId?: string;
      title?: string;
    };
  },
  "FChat"
>;

// Separate component for message content to handle state properly
const MessageContent = ({ message, restaurantId, onOptionSelect }: { 
  message: ChatMessage, 
  restaurantId: string | null,
  onOptionSelect: (value: string) => void
}) => {
  const [imageError, setImageError] = useState(false);
  const chatbotData = message.metadata?.chatbotMessage as ChatbotMessage | undefined;
  const agentData = message.metadata?.agentMessage as any;
  
  // Helper function to format timestamp
  const formatTime = (timestamp: Date | string | number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Render chatbot options
  const renderChatbotOptions = (options: any[], messageId: string) => {
    console.log("Rendering options:", options.length, "for message:", messageId);
    
    return (
      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={`${messageId}_option_${index}`}
            style={styles.optionButton}
            onPress={() => onOptionSelect(option.value)}
          >
            <FFText style={styles.optionText}>{option.text}</FFText>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render quick replies
  const renderQuickReplies = (quickReplies: any[], messageId: string) => {
    return (
      <View style={styles.quickRepliesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickReplies.map((reply, index) => (
            <TouchableOpacity
              key={`${messageId}_reply_${index}`}
              style={styles.quickReplyButton}
              onPress={() => onOptionSelect(reply.value)}
            >
              <FFText style={styles.quickReplyText}>{reply.text}</FFText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };
  
  console.log("Rendering message content:", message.messageId, "type:", message.type, 
    "has chatbot data:", !!chatbotData,
    "has agent data:", !!agentData);
  
  // Force image type for agent messages with image messageType
  const isImageMessage = message.type === "IMAGE" || 
    (agentData && agentData.messageType === "image");
  
  if (isImageMessage) {
    console.log("Rendering image message:", message.content);
    
    // Create image component with error handling
    const imageComponent = (
      <View>
        {imageError ? (
          <View style={[styles.messageImage, styles.imageFallback]}>
            <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
            <FFText style={styles.imageFallbackText}>Image failed to load</FFText>
          </View>
        ) : (
          <Image
            source={{ uri: message.content }}
            style={styles.messageImage}
            resizeMode="cover"
            onError={() => {
              console.log("Image failed to load:", message.content);
              setImageError(true);
            }}
          />
        )}
      </View>
    );
    
    // For agent messages with images, show agent name above the image
    if (agentData?.agentName) {
      return (
        <View>
          <FFText
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: colors.primary,
              marginBottom: 4,
            }}
          >
            {agentData.agentName}
          </FFText>
          {imageComponent}
        </View>
      );
    }
    
    // Regular image message
    return imageComponent;
  } else if (message.type === "OPTIONS" && chatbotData?.options) {
    console.log("Rendering options message with options:", chatbotData.options);
    return (
      <View>
        <FFText
          style={{
            ...styles.messageText,
            ...(message.senderId === restaurantId || message.from === restaurantId
               ? styles.sentMessageText
               : styles.receivedMessageText),
          }}
        >
          {message.content}
        </FFText>
        {renderChatbotOptions(chatbotData.options, message.messageId)}
      </View>
    );
  } else if (chatbotData?.quickReplies && chatbotData.quickReplies.length > 0) {
    return (
      <View>
        <FFText
          style={{
            ...styles.messageText,
            ...(message.senderId === restaurantId || message.from === restaurantId
               ? styles.sentMessageText
               : styles.receivedMessageText),
          }}
        >
          {message.content}
        </FFText>
        {renderQuickReplies(chatbotData.quickReplies, message.messageId)}
      </View>
    );
  } else if (agentData) {
    // Special styling for human agent messages
    return (
      <View>
        {/* Agent name if available */}
        {agentData.agentName && (
          <FFText
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: colors.primary,
              marginBottom: 4,
            }}
          >
            {agentData.agentName}
          </FFText>
        )}
        <FFText
          style={{
            ...styles.messageText,
            ...(message.senderId === restaurantId || message.from === restaurantId
               ? styles.sentMessageText
               : styles.receivedMessageText),
          }}
        >
          {message.content}
        </FFText>
      </View>
    );
  } else {
    return (
      <FFText
        style={{
          ...styles.messageText,
          ...(message.senderId === restaurantId || message.from === restaurantId
             ? styles.sentMessageText
             : styles.receivedMessageText),
        }}
      >
        {message.content}
      </FFText>
    );
  }
};

const FChatScreen = () => {
  const navigation = useNavigation<FChatNavigationProp>();
  const route = useRoute<FChatRouteProp>();
  const [message, setMessage] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const dispatch = useDispatch();
  const flatListRef = useRef<FlatList>(null);
  
  // Keep track of whether we've had a valid session with dbRoomId
  const [hasHadValidSession, setHasHadValidSession] = useState(false);
  
  // Image queue state
  const [queuedImage, setQueuedImage] = useState<{
    uri: string;
    type: string;
    name: string;
    cloudUrl?: string;
  } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const { 
    socket, 
    isConnected,
    isLoading, 
    isRequestingSupport,
    requestError,
    messages, 
    roomId, 
    currentSession,
    chatType,
    supportSession,
    requestCustomerCare,
    startChat,
    startSupportChat,
    sendMessage, 
    sendSupportMessage,
    getChatHistory 
  } = useFChatSocket();
  
  const { id: restaurantId } = useSelector((state: RootState) => state.auth);

  // Get the chat type from route params or default to SUPPORT
  const routeChatType = route.params?.type || "SUPPORT";
  const orderId = route.params?.orderId || "";
  
  // Helper function to get the formatted title
  const getFormattedTitle = useCallback(() => {
    if (route.params?.title) return route.params.title;
    
    if (chatType === "SUPPORT" || chatType === "CHATBOT") {
      return "Support Chat";
    }
    
    if (orderId) {
      return `Order #${orderId.slice(-5)}`;
    }
    
    return "Order Chat";
  }, [route.params?.title, chatType, orderId]);

  // Start chat when component mounts
  useEffect(() => {
    if (socket) {
      if (routeChatType === "SUPPORT") {
        // For support chats, use requestCustomerCare
        console.log("Requesting customer care in FChatScreen");
        requestCustomerCare();
      } else if (routeChatType === "CHATBOT") {
        // For chatbot, if we don't have a support session yet, start one
        if (!supportSession) {
          console.log("Starting support chat in FChatScreen");
          startSupportChat('restaurant_support', 'medium', { userType: 'restaurant_owner' });
        }
      } else if (routeChatType === "ORDER" && route.params?.withUserId && route.params?.orderId) {
        // For order chats, use startChat with the necessary parameters
        console.log("Starting order chat in FChatScreen", route.params.withUserId, route.params.orderId);
        startChat(
          route.params.withUserId,
          "ORDER",
          route.params.orderId
        );
      }
    }
  }, [socket, routeChatType, route.params, requestCustomerCare, startChat, startSupportChat, supportSession]);

  // Get chat history when roomId is available
  useEffect(() => {
    if (roomId) {
      console.log("Getting chat history with roomId:", roomId);
      getChatHistory();
      
      // Mark that we've had a valid session
      if (!hasHadValidSession) {
        setHasHadValidSession(true);
      }
    }
  }, [roomId, currentSession, getChatHistory, hasHadValidSession]);

  // If connection is lost and then restored, try to get chat history again
  useEffect(() => {
    if (isConnected && roomId && hasHadValidSession && messages.length === 0) {
      console.log("Reconnected, getting chat history again");
      getChatHistory();
    }
  }, [isConnected, roomId, hasHadValidSession, messages.length, getChatHistory]);

  // Debug logs for troubleshooting
  useEffect(() => {
    console.log("FChatScreen - Current state:", {
      roomId,
      currentSession,
      isConnected,
      messagesCount: messages.length,
      hasHadValidSession
    });
  }, [roomId, currentSession, isConnected, messages, hasHadValidSession]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = () => {
    // If we have a queued image with cloud URL, send it as an image message
    if (queuedImage && queuedImage.cloudUrl) {
      console.log("Sending image message:", queuedImage.cloudUrl);
      
      // Use sendSupportMessage for chatbot sessions with image type
      if (chatType === "CHATBOT" && supportSession) {
        sendSupportMessage(queuedImage.cloudUrl, 'image');
      } else {
        sendMessage(queuedImage.cloudUrl, "IMAGE");
      }
      
      // Clear the queued image after sending
      setQueuedImage(null);
      return;
    }
    
    // Regular text message
    if (message.trim()) {
      console.log("Sending message:", message, "to room:", roomId);
      
      // Use sendSupportMessage for chatbot sessions
      if (chatType === "CHATBOT" && supportSession) {
        sendSupportMessage(message.trim());
      } else {
        sendMessage(message.trim());
      }
      
      setMessage("");
    }
  };

  // Handle option selection for chatbot
  const handleOptionSelect = (value: string) => {
    console.log("Selected option:", value);
    if (supportSession) {
      console.log("Sending option selection to chatbot:", value);
      sendSupportMessage(value);
    } else {
      console.warn("Cannot send option selection - no active support session");
    }
  };

  // Image picker function
  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log("Selected image:", asset.uri);
        
        // Queue the image for upload
        setQueuedImage({
          uri: asset.uri,
          type: "image/jpeg",
          name: "chat_image.jpg",
        });
        
        // Upload the image immediately
        uploadImage(asset.uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };
  
  // Upload image to server
  const uploadImage = async (imageUri: string) => {
    if (!imageUri) return;
    
    setIsUploadingImage(true);
    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: "chat_image.jpg",
      } as any);
      
      
      // Upload the image
      const response = await axiosInstance.post("/upload/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      console.log("Image upload response:", response.data);
      
      if (response.data.EC === 0) {
        // Store the cloud URL in the queued image
        setQueuedImage(prev => 
          prev ? { ...prev, cloudUrl: response.data.data.url } : null
        );
      } else {
        console.error("Failed to upload image:", response.data.EM);
        // Remove the queued image if upload fails
        setQueuedImage(null);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      // Remove the queued image if upload fails
      setQueuedImage(null);
    } finally {
      setIsUploadingImage(false);
    }
  };
  
  // Remove queued image
  const removeQueuedImage = () => {
    setQueuedImage(null);
  };

  // Format timestamp to readable time
  const formatTime = (timestamp: Date | string | number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render chatbot options
  const renderChatbotOptions = (options: any[], messageId: string) => {
    console.log("Rendering options:", options.length, "for message:", messageId);
    
    return (
      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={`${messageId}_option_${index}`}
            style={styles.optionButton}
            onPress={() => handleOptionSelect(option.value)}
          >
            <FFText style={styles.optionText}>{option.text}</FFText>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render quick replies
  const renderQuickReplies = (quickReplies: any[], messageId: string) => {
    return (
      <View style={styles.quickRepliesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickReplies.map((reply, index) => (
            <TouchableOpacity
              key={`${messageId}_reply_${index}`}
              style={styles.quickReplyButton}
              onPress={() => handleOptionSelect(reply.value)}
            >
              <FFText style={styles.quickReplyText}>{reply.text}</FFText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Render customer care request UI if no session established yet
  const renderCustomerCareRequest = () => (
    <View style={styles.requestContainer}>
      <View style={styles.requestCard}>
        {/* Icon */}
        <View style={styles.requestIconContainer}>
          <View style={styles.requestIcon}>
            <Ionicons 
              name={routeChatType === "SUPPORT" || routeChatType === "CHATBOT" ? "headset" : "chatbubbles"} 
              size={32} 
              color="white" 
            />
          </View>
          <FFText style={styles.requestTitle}>
            {routeChatType === "SUPPORT" || routeChatType === "CHATBOT" ? "Customer Support" : `Order Chat ${orderId ? `#${orderId.slice(-5)}` : ""}`}
          </FFText>
          <FFText style={styles.requestDescription}>
            {routeChatType === "SUPPORT" || routeChatType === "CHATBOT"
              ? "Need help? Our customer care team is here to assist you with any questions or concerns."
              : `Connecting to chat for your order #${orderId ? orderId.slice(-5) : ""}`
            }
          </FFText>
        </View>

        {/* Request Button */}
        {routeChatType === "SUPPORT" || routeChatType === "CHATBOT" ? (
          <TouchableOpacity
            style={[styles.requestButton, isRequestingSupport && styles.requestButtonDisabled]}
            onPress={routeChatType === "CHATBOT" 
              ? () => startSupportChat('restaurant_support', 'medium') 
              : requestCustomerCare}
            disabled={isRequestingSupport || !isConnected}
          >
            {isRequestingSupport ? (
              <View style={styles.requestButtonContent}>
                <ActivityIndicator size="small" color="white" />
                <FFText style={styles.requestButtonText}>Connecting...</FFText>
              </View>
            ) : (
              <View style={styles.requestButtonContent}>
                <Ionicons name="chatbubbles" size={20} color="white" />
                <FFText style={styles.requestButtonText}>
                  {routeChatType === "CHATBOT" ? "Start Support Chat" : "Request Customer Care Chat"}
                </FFText>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.connectingContainer}>
            <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
            <FFText style={styles.connectingText}>
              {isRequestingSupport ? "Connecting to chat..." : "Waiting for connection..."}
            </FFText>
          </View>
        )}

        {/* Connection Status */}
        <View style={styles.connectionStatus}>
          <View
            style={[
              styles.connectionIndicator,
              isConnected ? styles.connectionIndicatorConnected : styles.connectionIndicatorDisconnected
            ]}
          />
          <FFText
            style={{
              fontSize: 14,
              color: isConnected ? colors.success : colors.error
            }}
          >
            {isConnected ? "Connected" : "Connecting..."}
          </FFText>
        </View>

        {/* Error Message */}
        {requestError && (
          <View style={{
            marginTop: spacing.md,
            padding: spacing.sm,
            backgroundColor: 'rgba(255, 200, 200, 0.5)',
            borderRadius: 12,
          }}>
            <FFText style={styles.errorText}>{requestError}</FFText>
          </View>
        )}
      </View>
    </View>
  );

  // If we've never had a valid session with dbRoomId, or we don't have one now and haven't had messages yet,
  // show the request support UI
  if (!hasHadValidSession && !roomId && messages.length === 0) {
    return (
      <FFSafeAreaView style={styles.container}>
        <FFScreenTopSection
          title={getFormattedTitle()}
          titlePosition="left"
          navigation={navigation}
        />
        {currentSession && !currentSession.dbRoomId && isRequestingSupport ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <FFText style={styles.loadingText}>
              Connecting to support... Please wait.
            </FFText>
          </View>
        ) : (
          renderCustomerCareRequest()
        )}
      </FFSafeAreaView>
    );
  }

  // If we have messages or a valid session (even if temporarily lost), show the chat UI
  return (
    <FFSafeAreaView style={styles.container}>
      {/* Chat Header */}
      <View style={styles.header}>
        <FFScreenTopSection
          title={getFormattedTitle()}
          titlePosition="left"
          navigation={navigation}
        />
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="call" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="videocam" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {isLoading && messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <FFText style={styles.loadingText}>Loading messages...</FFText>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.textSecondary} />
            <FFText style={styles.emptyText}>No messages yet</FFText>
            <FFText style={styles.emptySubtext}>Start the conversation!</FFText>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={({ item }) => {
              console.log('cehck item', item)
              // System messages are centered
              if (item.metadata?.isSystemMessage) {
                return (
                  <View
                    key={item.messageId || item.id}
                    style={styles.systemMessageContainer}
                  >
                    <View style={styles.systemMessageBubble}>
                      <FFText style={styles.systemMessageText}>
                        {item.content}
                      </FFText>
                      <Text
                        style={[
                          styles.messageTime,
                          styles.receivedMessageTime
                        ]}
                      >
                        {formatTime(item.timestamp)}
                      </Text>
                    </View>
                  </View>
                );
              }
              
              // Regular messages
              return (
                <View
                  key={item.messageId || item.id}
                  style={[
                    styles.messageRow,
                    item.senderId === restaurantId || item.from === restaurantId ? styles.messageRowRight : styles.messageRowLeft,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      item.senderId === restaurantId || item.from === restaurantId ? styles.sentMessage : styles.receivedMessage,
                    ]}
                  >
                    <MessageContent message={item} restaurantId={restaurantId} onOptionSelect={handleOptionSelect} />
                    <Text
                      style={[
                        styles.messageTime,
                        item.senderId === restaurantId || item.from === restaurantId ? styles.sentMessageTime : styles.receivedMessageTime,
                      ]}
                    >
                      {formatTime(item.timestamp)}
                    </Text>
                  </View>
                </View>
              );
            }}
            keyExtractor={(item) => item.messageId || item.id || Math.random().toString()}
            contentContainerStyle={styles.messagesContent}
          />
        )}

        {/* Message Input */}
        <View style={styles.inputContainer}>
          {/* Image Queue UI */}
          {queuedImage && (
            <View style={styles.queuedImageContainer}>
              {isUploadingImage ? (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <FFText style={styles.uploadingText}>Uploading...</FFText>
                </View>
              ) : (
                <>
                  <Image source={{ uri: queuedImage.uri }} style={styles.queuedImage} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={removeQueuedImage}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.error} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
          
          {/* Attach button (disabled when image is queued) */}
          <TouchableOpacity 
            style={styles.attachButton}
            onPress={handleImagePick}
            disabled={!!queuedImage || isUploadingImage}
          >
            <Ionicons 
              name="image" 
              size={24} 
              color={queuedImage ? colors.textSecondary + '80' : colors.textSecondary} 
            />
          </TouchableOpacity>
          
          {/* Text Input (disabled when image is queued) */}
          <View style={[
            styles.inputWrapper,
            queuedImage && styles.inputWrapperDisabled
          ]}>
            <TextInput
              style={styles.input}
              placeholder={queuedImage ? "Image ready to send" : "Type your message here..."}
              value={message}
              onChangeText={setMessage}
              multiline
              editable={!queuedImage}
            />
            <TouchableOpacity 
              style={styles.emojiButton}
              disabled={!!queuedImage}
            >
              <Ionicons 
                name="happy" 
                size={24} 
                color={queuedImage ? colors.textSecondary + '80' : colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
          
          {/* Send Button */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!message.trim() && !queuedImage) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!message.trim() && !queuedImage}
          >
            <Ionicons
              name="send"
              size={20}
              color={(message.trim() || queuedImage) ? colors.white : colors.textSecondary}
              style={styles.sendIcon}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </FFSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  headerActions: {
    flexDirection: "row",
    marginLeft: "auto",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  headerButton: {
    padding: spacing.xs,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: 18,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  emptySubtext: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  messagesContent: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  messageRowRight: {
    justifyContent: "flex-end",
  },
  messageRowLeft: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 16,
    padding: spacing.sm,
  },
  sentMessage: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 0,
  },
  receivedMessage: {
    backgroundColor: colors.backgroundSecondary,
    borderTopLeftRadius: 0,
  },
  messageText: {
    fontSize: 16,
  },
  sentMessageText: {
    color: colors.white,
  },
  receivedMessageText: {
    color: colors.text,
  },
  messageTime: {
    fontSize: 12,
    marginTop: spacing.xs,
    alignSelf: "flex-end",
  },
  sentMessageTime: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  receivedMessageTime: {
    color: colors.textSecondary,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  inputContainer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  attachButton: {
    padding: spacing.xs,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  inputWrapperDisabled: {
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: spacing.xs,
  },
  emojiButton: {
    padding: spacing.xs,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: colors.backgroundSecondary,
  },
  sendIcon: {
    marginLeft: 2,
  },
  // Customer care request styles
  requestContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
  },
  requestCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  requestIconContainer: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  requestIcon: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  requestTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  requestDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  requestButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  requestButtonDisabled: {
    opacity: 0.7,
  },
  requestButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  requestButtonText: {
    color: colors.white,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  connectingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  connectingText: {
    color: colors.textSecondary,
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  connectionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  connectionIndicatorConnected: {
    backgroundColor: colors.success,
  },
  connectionIndicatorDisconnected: {
    backgroundColor: colors.error,
  },
  errorText: {
    color: colors.error,
    textAlign: "center",
    fontSize: 14,
  },
  // Chatbot specific styles
  optionsContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  optionButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  optionText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  quickRepliesContainer: {
    marginTop: spacing.md,
    flexDirection: 'row',
  },
  quickReplyButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  quickReplyText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  // System message styles
  systemMessageContainer: {
    alignItems: "center",
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  systemMessageBubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  systemMessageText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  imageFallback: {
    backgroundColor: colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  imageFallbackText: {
    color: colors.textSecondary,
  },
  // Image queue styles
  queuedImageContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  uploadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
  },
  uploadingText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  queuedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  removeImageButton: {
    padding: spacing.xs,
  },
});

export default FChatScreen;
