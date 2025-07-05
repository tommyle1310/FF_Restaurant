// src/navigation/AppNavigator.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  createStackNavigator,
  StackNavigationProp,
} from "@react-navigation/stack";
import {
  createBottomTabNavigator,
  BottomTabNavigationProp,
} from "@react-navigation/bottom-tabs";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store/store";
import { useDispatch } from "../store/types";
import { loadTokenFromAsyncStorage } from "../store/authSlice";
import { useNavigation } from "@react-navigation/native";

import HomeScreen from "../app/screens/HomeScreen";
import OrderScreen from "../app/screens/OrdersScreen";
import LoginScreen from "../app/screens/Auth/LoginScreen";
import SignupScreen from "../app/screens/Auth/SignupScreen";
import SettingsScreen from "../app/screens/SettingsScreen";
import MenuManagement from "../app/screens/MenuManagementScreen";
import { Type_PushNotification_Order } from "../types/Orders";
import * as Notifications from "expo-notifications";

import FFBottomTab from "../components/FFBottomTab";
import PromotionManagement from "../app/screens/PromotionScreen";
import CustomerFeedback from "../app/screens/CustomerFeedback";
import useSearchNearbyDrivers from "../hooks/useSearchNearbyDrivers";
import { useSocket } from "../hooks/useSocket";
import FFToast from "../components/FFToast";
import FFText from "../components/FFText";
import Spinner from "../components/FFSpinner";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { TouchableOpacity, View } from "react-native";
import MenuItemFormScreen from "../app/screens/MenuItemFormScreen";
import NotificationsScreen from "../app/screens/NotificationsScreen";
import { Type_Address } from "../types/Address";
import PaymentMethodScreen from "../app/screens/PaymentMethodScreen";
import ChangePasswordScreen from "../app/screens/ChangePasswordScreen";
import ProfileScreen from "../app/screens/ProfileScreen";
import AddressDetailsScreen from "../app/screens/AddressDetailsScreen";
import SupportCenterScreen from "../app/screens/SupportCenterScreen";
import FChatScreen from "../app/screens/FChatScreen";
import CreateInquiryScreen from "../app/screens/CreateInquiryScreen";
import StatisticsScreen from "../app/screens/StatisticsScreen";
import RatingsReviewsScreen from "../app/screens/RatingsReviewsScreen";
import { spacing, typography } from "../theme";
import axiosInstance from "../utils/axiosConfig";
import FFInputControl from "../components/FFInputControl";
import FFModal from "../components/FFModal";
import { BACKEND_URL } from "../utils/constants";
import FFSplashScreen from "../components/FFSplashScreen";

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Signup: undefined;
};

export type MainStackParamList = {
  BottomTabs: undefined;
  Promotions: undefined;
  MenuItemForm: { menuItemId: string } | undefined;
  CustomerFeedback: undefined;
  FChat: { withUserId?: string; type?: "SUPPORT" | "ORDER" | "CHATBOT"; orderId?: string; title?: string };
  SupportCenter: undefined;
  Notification: undefined;
  Profile: undefined;
  CreateInquiry: undefined;
  ChangePassword: undefined;
  PaymentMethod: undefined;
  AddressDetails?: { addressDetail?: Type_Address; is_create_type?: boolean };
  Statistics: undefined;
  RatingsReviews: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Orders: undefined;
  MenuManagement: undefined;
  Settings: undefined;
};

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();
const BottomTab = createBottomTabNavigator<BottomTabParamList>();

type BottomNavigationProp = BottomTabNavigationProp<BottomTabParamList>;

const BottomTabs = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const navigation = useNavigation<BottomNavigationProp>();

  const renderedScreen = () => {
    switch (currentScreen) {
      case 0:
        return <HomeScreen />;
      case 1:
        return <OrderScreen />;
      case 2:
        return <MenuManagement />;
      case 3:
        return <SettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <>
      {renderedScreen()}
      <FFBottomTab
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
      />
    </>
  );
};

const MainStackScreen = () => {
  const { restaurant_id, id: restaurantUserId, accessToken } = useSelector(
    (state: RootState) => state.auth
  );
  const [selectedLocation] = useState({
    lat: 10.826411,
    lng: 106.617353,
  });
  const [reason, setReason] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { expoPushToken } = usePushNotifications();
  const [latestOrder, setLatestOrder] = useState<Type_PushNotification_Order | null>(null);
  const [isShowIncomingOrderToast, setIsShowIncomingOrderToast] = useState(false);
  const [orders, setOrders] = useState<Type_PushNotification_Order[]>([]);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPushTokenReady, setIsPushTokenReady] = useState(false);
  const lastOrderIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (expoPushToken?.data) {
      setIsPushTokenReady(true);
      console.log("Push token ready:", expoPushToken.data);
    } else {
      setIsPushTokenReady(false);
      console.log("Push token not ready:", expoPushToken);
    }
  }, [expoPushToken]);

  const sendPushNotification = useCallback(
    (order: Type_PushNotification_Order) => {
      if (lastOrderIdRef.current === order.orderId) {
        console.log("Duplicate order detected, skipping notification:", order.orderId);
        return;
      }
      lastOrderIdRef.current = order.orderId;

      console.log("check expoPushToken before sendpushnotification", {
        expoPushToken,
        data: expoPushToken?.data,
        isPushTokenReady,
      });

      if (!expoPushToken?.data || !isPushTokenReady) {
        console.warn("Cannot send push notification: expoPushToken is undefined or not ready");
        return;
      }

      console.log("Sending push notification:", {
        order,
        expoPushToken: expoPushToken.data,
      });

      fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: expoPushToken.data,
          sound: "default",
          title: "New Order Received",
          body: `Order #${order.orderId} - Status: ${order.status}`,
          data: { order },
        }),
      })
        .then((response) => response.json())
        .then((data) => console.log("Push notification sent:", data))
        .catch((error) => console.error("Error sending push notification:", error));
    },
    [expoPushToken, isPushTokenReady]
  );

  const { socket, latestOrder: socketLatestOrder } = useSocket(
    restaurant_id && isPushTokenReady ? restaurant_id : "",
    setOrders,
    isPushTokenReady ? sendPushNotification : (order) => {
      console.log("Push token not ready, skipping notification for order:", order.orderId);
    }
  );

  useEffect(() => {
    if (socketLatestOrder) {
      setLatestOrder((prev) => {
        if (
          !prev ||
          prev.orderId !== socketLatestOrder.orderId ||
          prev.status !== socketLatestOrder.status ||
          prev.updated_at !== socketLatestOrder.updated_at
        ) {
          console.log("Updating latestOrder:", socketLatestOrder.orderId);
          setIsShowIncomingOrderToast(true);
          return socketLatestOrder;
        }
        return prev;
      });
    }
  }, [socketLatestOrder]);

  const { nearbyDrivers, allDrivers } = useSearchNearbyDrivers({
    selectedLocation,
    tomtomKey: "e73LfeJGmk0feDJtiyifoYWpPANPJLhT",
    isCaptureDriverOnlyThisMoment: true,
  });

  const handleAcceptOrder = useCallback(async () => {
    if (!latestOrder) return;
    const requestBody = {
      availableDrivers: allDrivers,
      orderDetails: latestOrder.orderId,
    };
    console.log("Sending restaurantAcceptWithAvailableDrivers:", requestBody);
    socket?.emit("restaurantAcceptWithAvailableDrivers", requestBody);
    setIsShowIncomingOrderToast(false);
  }, [latestOrder, allDrivers, socket]);

  const handleRejectOrder = useCallback(async () => {
    if (!latestOrder) return;
    setIsRejectModalVisible(true);
  }, [latestOrder]);

  const handleSubmitReject = useCallback(async () => {
    console.log("Submitting reject with state:", { reason, title, description });

    if (!latestOrder || !restaurant_id || !restaurantUserId) {
      console.error("Missing required data for reject order");
      alert("Missing required data");
      return;
    }

    if (!reason || !title || !description) {
      console.error("All cancellation fields are required");
      alert("Please fill in all fields");
      return;
    }

    const requestBody = {
      cancelled_by: "restaurant" as const,
      cancelled_by_id: restaurantUserId,
      reason,
      title,
      description,
    };

    console.log("Sending reject order request:", requestBody);

    try {
      setIsLoading(true);
      const response = await axiosInstance.post(
        `/orders/${latestOrder.orderId}/cancel`,
        requestBody
      );
      console.log("Reject order response:", response.data);
      if (response.data.EC === 0) {
        setIsRejectModalVisible(false);
        setIsShowIncomingOrderToast(false);
        setReason("");
        setTitle("");
        setDescription("");
      }
    } catch (error) {
      console.error("Error rejecting order:", error);
      alert("Failed to reject order");
    } finally {
      setIsLoading(false);
    }
  }, [latestOrder, restaurant_id, restaurantUserId, reason, title, description]);

  const handleToastTimeout = useCallback(async () => {
    console.log("Toast timeout - auto rejecting order");

    if (!latestOrder || !restaurant_id || !restaurantUserId) {
      console.error("Missing required data for auto reject");
      return;
    }

    const defaultReason = "No Response";
    const defaultTitle = "Restaurant Not Responding";
    const defaultDescription =
      "The restaurant did not respond to the order within the specified time limit.";

    const requestBody = {
      cancelled_by: "restaurant" as const,
      cancelled_by_id: restaurantUserId,
      reason: defaultReason,
      title: defaultTitle,
      description: defaultDescription,
    };

    try {
      console.log("Auto rejecting order with:", requestBody);
      const response = await axiosInstance.post(
        `/orders/${latestOrder.orderId}/cancel`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      console.log("Auto reject order response:", response.data);
      if (response.data.EC === 0) {
        setIsShowIncomingOrderToast(false);
      }
    } catch (error) {
      console.error("Error auto-rejecting order:", error);
    }
  }, [latestOrder, restaurant_id, restaurantUserId, accessToken]);

  if (isLoading) return <Spinner isVisible isOverlay />;

  return (
    <>
      <MainStack.Navigator>
        <MainStack.Screen
          options={{ headerShown: false }}
          name="BottomTabs"
          component={BottomTabs}
        />
        <MainStack.Screen
          options={{ headerShown: false }}
          name="Promotions"
          component={PromotionManagement}
        />
        <MainStack.Screen
          options={{ headerShown: false }}
          name="Notification"
          component={NotificationsScreen}
        />
        <MainStack.Screen
          options={{ headerShown: false }}
          name="MenuItemForm"
          component={MenuItemFormScreen}
        />
        <MainStack.Screen
          options={{ headerShown: false }}
          name="CreateInquiry"
          component={CreateInquiryScreen}
        />
        <MainStack.Screen
          options={{ headerShown: false }}
          name="Statistics"
          component={StatisticsScreen}
        />
        <MainStack.Screen
          options={{ headerShown: false }}
          name="CustomerFeedback"
          component={CustomerFeedback}
        />
        <MainStack.Screen
          options={{ headerShown: false }}
          name="PaymentMethod"
          component={PaymentMethodScreen}
        />
        <MainStack.Screen
          options={{ headerShown: false }}
          name="ChangePassword"
          component={ChangePasswordScreen}
        />
        <MainStack.Screen
          options={{ headerShown: false }}
          name="Profile"
          component={ProfileScreen}
        />
        <MainStack.Screen
          options={{ headerShown: false }}
          name="AddressDetails"
          component={AddressDetailsScreen}
        />
        <MainStack.Screen
          options={{ headerShown: false }}
          name="SupportCenter"
          component={SupportCenterScreen}
        />
        <MainStack.Screen
          options={{ headerShown: false }}
          name="FChat"
          component={FChatScreen}
        />
        <MainStack.Screen
          options={{ headerShown: false }}
          name="RatingsReviews"
          component={RatingsReviewsScreen}
        />
      </MainStack.Navigator>
      <FFToast
        disabledClose
        title="Incoming Order"
        onAccept={handleAcceptOrder}
        onReject={handleRejectOrder}
        onClose={() => setIsShowIncomingOrderToast(false)}
        onTimeout={handleToastTimeout}
        visible={isShowIncomingOrderToast}
        isApprovalType
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
            }}
          >
            <FFText
              style={{
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.medium,
              }}
            >
              Total:
            </FFText>
            <FFText
              style={{
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.bold,
                color: "#63c550",
              }}
            >
              ${latestOrder?.total_restaurant_earn ?? 0}
            </FFText>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
            }}
          >
            <FFText
              style={{
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.bold,
                color: "#63c550",
              }}
            >
              {latestOrder?.order_items?.length || 0}
            </FFText>
            <FFText
              style={{
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.medium,
              }}
            >
              items
            </FFText>
          </View>
        </View>
      </FFToast>
      <FFModal
        visible={isRejectModalVisible}
        onClose={() => {
          setIsRejectModalVisible(false);
          setReason("");
          setTitle("");
          setDescription("");
        }}
      >
        <FFText
          style={{
            fontSize: typography.fontSize.lg,
            fontFamily: typography.fontFamily.bold,
            marginBottom: spacing.md,
          }}
        >
          Reject Order
        </FFText>
        <FFInputControl
          label="Reason"
          value={reason}
          setValue={(value) => {
            console.log("Updating reason:", value);
            setReason(value);
          }}
          placeholder="Enter reason for cancellation"
        />
        <FFInputControl
          label="Title"
          value={title}
          setValue={(value) => {
            console.log("Updating title:", value);
            setTitle(value);
          }}
          placeholder="Enter cancellation title"
        />
        <FFInputControl
          label="Description"
          value={description}
          setValue={(value) => {
            console.log("Updating description:", value);
            setDescription(value);
          }}
          placeholder="Enter detailed description"
        />
        <TouchableOpacity
          style={{
            backgroundColor: "#63c550",
            padding: spacing.md,
            borderRadius: 8,
            alignItems: "center",
            marginTop: spacing.md,
          }}
          onPress={handleSubmitReject}
        >
          <FFText
            style={{
              color: "#fff",
              fontSize: typography.fontSize.md,
              fontFamily: typography.fontFamily.medium,
            }}
          >
            Submit
          </FFText>
        </TouchableOpacity>
      </FFModal>
    </>
  );
};

const AppNavigator = () => {
  const token = useSelector((state: RootState) => state.auth.accessToken);
  const [showSplash, setShowSplash] = useState(true);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(loadTokenFromAsyncStorage());
  }, [dispatch]);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

    if (showSplash) {
    return <FFSplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <RootStack.Navigator initialRouteName={token ? "Main" : "Login"}>
      <RootStack.Screen
        name="Login"
        options={{ headerShown: false }}
        component={LoginScreen}
      />
      <RootStack.Screen
        name="Signup"
        options={{ headerShown: false }}
        component={SignupScreen}
      />
      <RootStack.Screen
        name="Main"
        options={{ headerShown: false }}
        component={MainStackScreen}
      />
    </RootStack.Navigator>
  );
};

export default AppNavigator;
