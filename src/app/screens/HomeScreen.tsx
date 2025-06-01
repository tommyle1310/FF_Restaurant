import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import axiosInstance from "@/src/utils/axiosConfig";

import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFText from "@/src/components/FFText";
import { StackNavigationProp } from "@react-navigation/stack";
import { MainStackParamList } from "@/src/navigation/AppNavigator";
import { useSelector, useDispatch } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import FFAvatar from "@/src/components/FFAvatar";
import { colors } from "@/src/theme";
import {
  toggleAvailability,
  setAuthState,
  saveTokenToAsyncStorage,
} from "@/src/store/authSlice";
import FFModal from "@/src/components/FFModal";

type HomeNavigationProps = StackNavigationProp<
  MainStackParamList,
  "BottomTabs"
>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeNavigationProps>();
  const dispatch = useDispatch();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const { address, restaurant_name, avatar, status, restaurant_id } =
    useSelector((state: RootState) => state.auth);

  const [dailyStats, setDailyStats] = useState({
    revenue: 0,
    orders: 0,
    topDish: "",
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const handleToggleAvailability = async () => {
    try {
      const response = await axiosInstance.patch(
        `/restaurants/${restaurant_id}/availability`,
        {
          is_open: !status?.is_open,
        }
      );

      if (response.data.EC === 0) {
        const newAuthState = {
          ...response.data.data,
        };

        // Update both Redux and AsyncStorage
        await Promise.all([
          dispatch(setAuthState(newAuthState)),
          dispatch(saveTokenToAsyncStorage(newAuthState)),
        ]);
      } else {
        setModalMessage("Status can't be set at the moment");
        setIsModalVisible(true);
      }
    } catch (error) {
      setModalMessage("Status can't be set at the moment");
      setIsModalVisible(true);
    }
  };

  const fetchDailyStats = async () => {
    setIsLoadingStats(true);
    try {
      const now = new Date();

      // Start of today (local)
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

      // End is start of next day (local)
      const endOfNextDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );

      // Format YYYY-MM-DD using local timezone
      const formatDate = (date: Date) => date.toLocaleDateString("sv-SE"); // returns "YYYY-MM-DD"

      const startDateStr = formatDate(startOfDay);
      const endDateStr = formatDate(endOfNextDay);

      const response = await axiosInstance.get(
        `/restaurant-stats/${restaurant_id}?start_date=${startDateStr}&end_date=${endDateStr}&force_refresh=true`
      );

      console.log(
        "check respon",
        `/restaurant-stats/${restaurant_id}?start_date=${startDateStr}&end_date=${endDateStr}&force_refresh=true`
      );

      if (response.data.EC === 0) {
        const statsData = response.data.data;

        // Calculate total revenue and orders
        const totalStats = statsData.reduce(
          (acc: any, record: any) => ({
            revenue: acc.revenue + (record.total_revenue || 0),
            orders: acc.orders + (record.total_orders || 0),
          }),
          { revenue: 0, orders: 0 }
        );

        // Find the most popular item
        let topDish = "";
        let maxQuantity = 0;
        statsData.forEach((record: any) => {
          if (record.popular_items) {
            record.popular_items.forEach((item: any) => {
              if (item.quantity > maxQuantity) {
                maxQuantity = item.quantity;
                topDish = item.name;
              }
            });
          }
        });

        setDailyStats({
          revenue: totalStats.revenue,
          orders: totalStats.orders,
          topDish: topDish || "No data",
        });
      }
    } catch (error) {
      console.error("Error fetching daily stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (restaurant_id) {
      fetchDailyStats();
    }
  }, [restaurant_id]);

  // Menu grid items
  const menuItems = [
    {
      id: 1,
      icon: "pie-chart",
      label: "Analytics",
      onPress: () => navigation.navigate("Statistics"),
    },
    { id: 2, icon: "time", label: "History" },
    { id: 3, icon: "star", label: "Reviews" },
    {
      id: 4,
      icon: "pricetag",
      label: "Promotions",
      onPress: () => navigation.navigate("Promotions"),
    },
    {
      id: 5,
      icon: "wallet",
      label: "My Wallet",
      onPress: () => navigation.navigate("PaymentMethod"),
    },
    { id: 6, icon: "bulb", label: "Marketing" },
  ];

  return (
    <FFSafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <StatusBar barStyle="dark-content" />

      {/* Header Section stays outside ScrollView */}
      <View
        style={{
          padding: 20,
          backgroundColor: "#fff",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 15,
          elevation: 2,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ width: "70%" }}>
            <FFText
              style={{ fontSize: 24, fontWeight: "bold", color: "#1a1a1a" }}
            >
              {restaurant_name}
            </FFText>
            {address?.street && address?.city && address?.nationality ? (
              <FFText style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                {address?.street}, {address?.city}, {address?.nationality}
              </FFText>
            ) : (
              <FFText style={{ color: colors.grey }}>Unknown Address</FFText>
            )}
          </View>
          <FFAvatar size={40} avatar={avatar?.url} />
        </View>
        <View
          style={{
            marginTop: 12,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={handleToggleAvailability}
            style={{
              backgroundColor: status?.is_open ? "#dcfce7" : "#fee2e2",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: status?.is_open ? "#22c55e" : "#ef4444",
                marginRight: 6,
              }}
            />
            <FFText
              style={{
                color: status?.is_open ? "#22c55e" : "#ef4444",
                fontSize: 13,
              }}
            >
              {status?.is_open ? "Opening" : "Closed"}
            </FFText>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Daily Stats Card */}
        <LinearGradient
          colors={["#a3d98f", "#3e7c2a"]}
          style={{
            margin: 20,
            borderRadius: 20,
            padding: 20,
            shadowColor: "#fb923c",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          {/* First Row */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  backgroundColor: "#fff",
                  padding: 8,
                  borderRadius: 12,
                  marginRight: 12,
                }}
              >
                <Ionicons name="stats-chart" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <FFText style={{ color: "#eee", fontSize: 13 }}>
                  Today's Revenue
                </FFText>
                <FFText
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: "#fff",
                    marginTop: 2,
                  }}
                >
                  ${isLoadingStats ? "..." : dailyStats.revenue.toFixed(2)}
                </FFText>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: "rgba(0,0,0,0.06)",
              marginBottom: 16,
            }}
          />

          {/* Second Row */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  backgroundColor: "#fff",
                  padding: 8,
                  borderRadius: 12,
                  marginRight: 12,
                }}
              >
                <Ionicons
                  name="document-text"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <FFText style={{ color: "#eee" }}>Orders Today</FFText>
                <FFText
                  style={{
                    fontWeight: "600",
                    color: "#fff",
                    marginTop: 2,
                  }}
                >
                  {isLoadingStats ? "..." : dailyStats.orders}
                </FFText>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: "rgba(0,0,0,0.06)",
              marginBottom: 16,
            }}
          />

          {/* Third Row */}
          <View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  backgroundColor: "#fff",
                  padding: 8,
                  borderRadius: 12,
                  marginRight: 12,
                }}
              >
                <Ionicons name="restaurant" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <FFText style={{ color: "#eee" }}>Top Selling Item</FFText>
                <FFText
                  style={{
                    fontWeight: "600",
                    color: "#fff",
                    marginTop: 2,
                  }}
                >
                  {isLoadingStats ? "..." : dailyStats.topDish}
                </FFText>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Menu Grid */}
        <View style={{ padding: 20, paddingBottom: 100 }}>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 12,
            }}
          >
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={{
                  width: "30%",
                  aspectRatio: 1,
                  // flex: 1,
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 12,
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}
                onPress={item.onPress}
              >
                <View
                  style={{
                    backgroundColor: "#f8f9fa",
                    padding: 10,
                    borderRadius: 12,
                    marginBottom: 8,
                  }}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <FFText
                  style={{
                    fontSize: 12,
                    textAlign: "center",
                    color: "#1a1a1a",
                    fontWeight: "500",
                  }}
                >
                  {item.label}
                </FFText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <FFModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      >
        <View style={{ padding: 20, alignItems: "center" }}>
          <FFText style={{ fontSize: 16, textAlign: "center" }}>
            {modalMessage}
          </FFText>
        </View>
      </FFModal>
    </FFSafeAreaView>
  );
};

export default HomeScreen;
