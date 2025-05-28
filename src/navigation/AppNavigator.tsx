// src/navigation/AppNavigator.tsx
import React, { useCallback, useEffect, useState } from "react";
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
import { View } from "react-native";
import MenuItemFormScreen from "../app/screens/MenuItemFormScreen";
import { Type_Address } from "../types/Address";
import PaymentMethodScreen from "../app/screens/PaymentMethodScreen";
import ChangePasswordScreen from "../app/screens/ChangePasswordScreen";
import ProfileScreen from "../app/screens/ProfileScreen";
import AddressDetailsScreen from "../app/screens/AddressDetailsScreen";
import SupportCenterScreen from "../app/screens/SupportCenterScreen";
import FChatScreen from "../app/screens/FChatScreen";
import CreateInquiryScreen from "../app/screens/CreateInquiryScreen";
import StatisticsScreen from "../app/screens/StatisticsScreen";
import { spacing, typography } from "../theme";

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
  FChat: { withUserId?: string; type?: "SUPPORT" | "ORDER"; orderId?: string };
  SupportCenter: undefined;
  Profile: undefined;
  CreateInquiry: undefined;
  ChangePassword: undefined;
  PaymentMethod: undefined;
  AddressDetails?: { addressDetail?: Type_Address; is_create_type?: boolean };
  Statistics: undefined;
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
  const [selectedLocation, setSelectedLocation] = useState({
    lat: 10.826411,
    lng: 106.617353,
  });
  const { restaurant_id } = useSelector((state: RootState) => state.auth);
  const { expoPushToken } = usePushNotifications();
  const [latestOrder, setLatestOrder] = useState<Type_PushNotification_Order | null>(null);
  const [isShowIncomingOrderToast, setIsShowIncomingOrderToast] = useState(false);
  const [orders, setOrders] = useState<Type_PushNotification_Order[]>([]);

  const sendPushNotification = useCallback(
    (order: Type_PushNotification_Order, expoPushToken?: { data: string }) => {
      console.log("Sending push notification for order:", order.orderId);
      if (expoPushToken) {
        // Implement Expo push notification logic
        console.log("Push notification payload:", {
          to: expoPushToken.data,
          title: `Order #${order.orderId.slice(-8)}`,
          body: `Status: ${order.status}`,
        });
        // Uncomment to enable actual push notification
        // fetch("https://exp.host/--/api/v2/push/send", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({
        //     to: expoPushToken.data,
        //     title: `Order #${order.orderId.slice(-8)}`,
        //     body: `Status: ${order.status}`,
        //   }),
        // });
      }
      // Trigger FFToast for incoming orders
      if (order.status === "PENDING") {
        setIsShowIncomingOrderToast(true);
      }
    },
    []
  );

  const { socket, latestOrder: socketLatestOrder } = useSocket(
    restaurant_id || "",
    setOrders,
    sendPushNotification
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
      </MainStack.Navigator>
      <FFToast
        disabledClose
        onAccept={handleAcceptOrder}
        onClose={() => setIsShowIncomingOrderToast(false)}
        visible={isShowIncomingOrderToast}
        isApprovalType
      >
        <FFText>Incoming Order</FFText>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <FFText style={{ fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.medium }}>
              Total:
            </FFText>
            <FFText
              style={{
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.bold,
                color: "#63c550",
              }}
            >
              ${latestOrder?.total_amount ?? 0}
            </FFText>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <FFText
              style={{
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.bold,
                color: "#63c550",
              }}
            >
              {latestOrder?.order_items?.length || 0}
            </FFText>
            <FFText style={{ fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.medium }}>
              items
            </FFText>
          </View>
        </View>
      </FFToast>
    </>
  );
};


const AppNavigator = () => {
  const token = useSelector((state: RootState) => state.auth.accessToken);
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