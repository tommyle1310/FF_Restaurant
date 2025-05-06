import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "./screens/HomeScreen";
import MenuManagement from "./screens/MenuManagementScreen";
import PromotionList from "./screens/PromotionScreen";
import IncomingOrder from "./screens/OrdersScreen";
import Settings from "./screens/SettingsScreen";
import CustomerFeedback from "./screens/CustomerFeedback";

export type RootStackParamList = {
  MainTabs: undefined;
  MenuManagement: undefined;
  PromotionList: undefined;
  IncomingOrder: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "Promotions") {
            iconName = "pricetags";
          } else if (route.name === "Feedback") {
            iconName = "chatbubbles";
          } else {
            iconName = "ellipsis-horizontal";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "blue",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Promotions" component={PromotionList} />
      <Tab.Screen name="Feedback" component={CustomerFeedback} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerStyle: { backgroundColor: "#007bff" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MenuManagement"
          component={MenuManagement}
          options={{ title: "Menu Management" }}
        />
        <Stack.Screen
          name="PromotionList"
          component={PromotionList}
          options={{ title: "Promotions" }}
        />
        <Stack.Screen
          name="IncomingOrder"
          component={IncomingOrder}
          options={{ title: "Orders" }}
        />
        <Stack.Screen
          name="Settings"
          component={Settings}
          options={{ title: "Settings" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
