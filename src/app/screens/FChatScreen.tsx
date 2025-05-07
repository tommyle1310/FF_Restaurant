import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { MainStackParamList } from "@/src/navigation/AppNavigator";
import { StackNavigationProp } from "@react-navigation/stack";
import { useFChatSocket } from "@/src/hooks/useFChatSocket";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import { colors, spacing } from "@/src/theme";

type FChatNavigationProp = StackNavigationProp<MainStackParamList, "FChat">;
type FChatRouteProp = RouteProp<MainStackParamList, "FChat">;

const FChatScreen = () => {
  const navigation = useNavigation<FChatNavigationProp>();
  const route = useRoute<FChatRouteProp>();
  const [message, setMessage] = useState("");
  const { socket, messages, roomId, startChat, sendMessage, getChatHistory } =
    useFChatSocket();
  const { user_id, id } = useSelector((state: RootState) => state.auth);

  // Start chat when component mounts
  useEffect(() => {
    if (socket && route.params?.withUserId) {
      startChat(
        route.params.withUserId,
        route.params.type || "SUPPORT",
        route.params.orderId
      );
    }
  }, [socket, route.params]);

  // Get chat history when chatId is available
  useEffect(() => {
    if (roomId) {
      const chatHistory = getChatHistory();
    }
  }, [roomId]);

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessage(message.trim());
      setMessage("");
    }
  };

  return (
    <FFSafeAreaView>
      {/* Chat Header */}
      <View style={styles.header}>
        <FFScreenTopSection
          title="Support Chat"
          titlePosition="left"
          navigation={navigation}
        />
        <View style={styles.headerActions}>
          <TouchableOpacity>
            <Ionicons name="call" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="videocam" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons
              name="ellipsis-vertical"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((msg) => (
            <View
              key={msg.messageId}
              style={[
                styles.messageRow,
                msg.from === id
                  ? styles.messageRowRight
                  : styles.messageRowLeft,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  msg.from === id ? styles.sentMessage : styles.receivedMessage,
                ]}
              >
                {msg.type === "IMAGE" ? (
                  <Image
                    source={{ uri: msg.content }}
                    style={styles.messageImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text
                    style={[
                      styles.messageText,
                      msg.from === user_id
                        ? styles.sentMessageText
                        : styles.receivedMessageText,
                    ]}
                  >
                    {msg.content}
                  </Text>
                )}
                <Text
                  style={[
                    styles.messageTime,
                    msg.from === user_id
                      ? styles.sentMessageTime
                      : styles.receivedMessageTime,
                  ]}
                >
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity>
            <Ionicons name="attach" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type your message here..."
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <TouchableOpacity>
              <Ionicons name="happy" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
          >
            <Ionicons
              name="send"
              size={20}
              color={colors.white}
              style={styles.sendIcon}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </FFSafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerActions: {
    flexDirection: "row",
    marginLeft: "auto",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  messagesContent: {
    paddingVertical: spacing.lg,
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
  },
  sentMessageTime: {
    color: colors.textSecondary,
  },
  receivedMessageTime: {
    color: colors.textSecondary,
  },
  messageImage: {
    width: 120,
    height: 120,
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
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 9999,
    paddingHorizontal: spacing.md,
    // paddingVertical: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 12,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    marginLeft: spacing.sm,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  sendIcon: {
    marginLeft: 2,
  },
});

export default FChatScreen;
