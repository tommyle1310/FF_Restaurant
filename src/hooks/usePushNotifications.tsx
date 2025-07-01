import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform, Alert } from "react-native";
import { useEffect, useRef, useState } from "react";

export interface PushNotificationState {
  notifications?: Notifications.Notification;
  expoPushToken?: Notifications.ExpoPushToken;
}

export const usePushNotifications = (): PushNotificationState => {
  const [expoPushToken, setExpoPushToken] = useState<
    Notifications.ExpoPushToken | undefined
  >(undefined);
  const [notifications, setNotifications] = useState<
    Notifications.Notification | undefined
  >(undefined);
  const isTokenFetched = useRef(false);

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  async function registerForPushNotificationAsync() {
    if (isTokenFetched.current) {
      console.log("Token already fetched, skipping...");
      return expoPushToken;
    }

    try {
      if (!Device.isDevice) {
        console.warn("Push notifications require a physical device");
        Alert.alert("Error", "Push notifications require a physical device");
        return undefined;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("Push notification permissions not granted");
        Alert.alert(
          "Error",
          "Push notification permissions not granted. Please enable them in your device settings."
        );
        return undefined;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      isTokenFetched.current = true;
      console.log("Push token fetched:", token);
      return token;
    } catch (error) {
      console.error("Error fetching push token:", error);
      Alert.alert("Error", "Failed to fetch push token. Please try again.");
      return undefined;
    }
  }

  useEffect(() => {
    console.log("Initializing usePushNotifications hook");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    registerForPushNotificationAsync().then((token) => {
      if (token) {
        console.log("Setting expoPushToken:", token);
        setExpoPushToken(token);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotifications(notification);
        console.log("Notification received:", notification);
        // Alert.alert(
        //   notification.request.content.title || "New Order Received",
        //   notification.request.content.body || "You have a new order",
        //   [{ text: "OK" }]
        // );
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("Notification response received:", response);
      }
    );

    return () => {
      console.log("Cleaning up usePushNotifications hook");
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return { expoPushToken, notifications };
};