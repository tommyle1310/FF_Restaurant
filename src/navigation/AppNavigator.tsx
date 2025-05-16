import React, { useEffect, useState } from "react";
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
import { Order } from "../types/Orders";
import * as Notifications from "expo-notifications";

// Import your custom FFBottomTab
import FFBottomTab from "../components/FFBottomTab";
import PromotionManagement from "../app/screens/PromotionScreen";
import CustomerFeedback from "../app/screens/CustomerFeedback";
import useSearchNearbyDrivers from "../hooks/useSearchNearbyDrivers";
import { useSocket } from "../hooks/useSocket";
import { Type_PushNotification_Order } from "../types/pushNotification";
import FFToast from "../components/FFToast";
import FFText from "../components/FFText";
import Spinner from "../components/FFSpinner";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { sendPushNotification } from "../utils/functions/pushNotification";
import { View } from "react-native";
import socket from "../services/socket";
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

// Define the param lists for the navigators
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
  Statistics: undefined
};

export type BottomTabParamList = {
  Home: undefined;
  Orders: undefined;
  MenuManagement: undefined;
  Settings: undefined;
};

// Create the navigators
const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();
const BottomTab = createBottomTabNavigator<BottomTabParamList>();

type BottomNavigationProp = BottomTabNavigationProp<BottomTabParamList>;

// BottomTabs component with FFBottomTab
const BottomTabs = () => {
  const [currentScreen, setCurrentScreen] = useState(0); // Track the current tab index

  // Use useNavigation with the correct type for BottomTab navigation
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

// MainStack component
const MainStackScreen = () => {
  const [selectedLocation, setSelectedLocation] = useState({
    lat: 10.826411,
    lng: 106.617353,
  });
  const { restaurant_id } = useSelector((state: RootState) => state.auth);
  const { expoPushToken } = usePushNotifications();
  const [latestOrder, setLatestOrder] =
    useState<Type_PushNotification_Order | null>(null);
  const [isShowToast, setIsShowToast] = useState(false); // Đổi tên để rõ ràng hơn

  const [orders, setOrders] = useState<Type_PushNotification_Order[]>([]);
  const [isShowIncomingOrderToast, setIsShowIncomingOrderToast] =
    useState(false);
  useEffect(() => {
    if (orders.length > 0) {
      setIsShowIncomingOrderToast(true);
      let pushToken = expoPushToken as unknown as { data: string };
      sendPushNotification({
        order: orders[orders.length - 1],
        expoPushToken: pushToken,
      });
    }
  }, [orders]);
  useEffect(() => {
    if (orders.length > 0) {
      const order = orders[orders.length - 1] as unknown as Order;
      let buildLatestOrder = {
        _id: order._id,
        customer_id: order.customer_id,
        restaurant_id: order.restaurant_id,
        total_amount: order.total_amount,
        payment_method: order.payment_method,
        customer_location: order.customer_location,
        restaurant_location: order.restaurant_location,
        order_items: order.order_items,
        customer_note: order.customer_note,
        restaurant_note: order.restaurant_note,
        status: order.status,
        order_time: order.order_time,
        tracking_info: order.tracking_info,
      } as any;
      setLatestOrder(buildLatestOrder);
    }
  }, [orders]);
  let pushToken = expoPushToken as unknown as { data: string };
  useSocket(
    restaurant_id || "",
    setOrders,
    () =>
      sendPushNotification({
        order: orders[orders.length - 1],
        expoPushToken: pushToken,
      }),
    setLatestOrder,
    setIsShowToast // Truyền setter cho toast
  );
  const { nearbyDrivers, allDrivers } = useSearchNearbyDrivers({
    selectedLocation,
    tomtomKey: "e73LfeJGmk0feDJtiyifoYWpPANPJLhT",
    isCaptureDriverOnlyThisMoment: true,
  });

  const handleAcceptOrder = async () => {
    const requestBody = {
      availableDrivers: allDrivers,
      orderDetails: {
        ...latestOrder,
        customer_id: latestOrder?.customer_id, // Ensure customer_id is included
      },
    };
    // Emit the event to the backend via WebSocket
    socket.emit("restaurantAcceptWithAvailableDrivers", requestBody);
    setIsShowIncomingOrderToast(false);
  };

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
      {/* FFToast logic is commented for now */}
      <FFToast
        disabledClose
        onAccept={handleAcceptOrder}
        onClose={() => setIsShowIncomingOrderToast(false)}
        visible={isShowIncomingOrderToast}
        isApprovalType
      >
        <FFText>Incoming Order</FFText>
        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center gap-1">
            <FFText fontSize="sm" fontWeight="500">
              Total:
            </FFText>
            <FFText fontSize="sm" fontWeight="600" style={{ color: "#63c550" }}>
              ${latestOrder?.total_amount}
            </FFText>
          </View>
          <View className="flex-row items-center gap-1">
            <FFText fontSize="sm" fontWeight="600">
              {latestOrder?.order_items?.length || 0}
            </FFText>
            <FFText fontSize="sm" fontWeight="500" style={{ color: "#63c550" }}>
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
        name={"Main"}
        options={{ headerShown: false }}
        component={MainStackScreen}
      />
    </RootStack.Navigator>
  );
};

export default AppNavigator;
