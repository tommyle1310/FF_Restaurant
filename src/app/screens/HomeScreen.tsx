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
import { colors, spacing } from "@/src/theme";
import {
  toggleAvailability,
  setAuthState,
  saveTokenToAsyncStorage,
} from "@/src/store/authSlice";
import FFModal from "@/src/components/FFModal";
import { useTheme } from "@/src/hooks/useTheme";
import FFView from "@/src/components/FFView";
import { Type_Address } from "@/src/types/Address";
import { useFChatSocket } from "@/src/hooks/useFChatSocket";

type HomeNavigationProps = StackNavigationProp<
  MainStackParamList,
  "BottomTabs"
>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeNavigationProps>();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { startSupportChat } = useFChatSocket();

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

  const handleStartChatWithSupport = () => {
    // Start a chatbot session and navigate to the chat screen
    startSupportChat('restaurant_support', 'medium', { userType: 'restaurant_owner' });
    navigation.navigate('FChat', {
      type: 'CHATBOT',
      title: 'Customer Support'
    });
  };

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
    { 
      id: 6, 
      icon: "chatbubble-ellipses", 
      label: "Support Chat",
      onPress: handleStartChatWithSupport,
    }, 
  ];

  return (
    <FFSafeAreaView style={{ flex: 1, backgroundColor: "#fafbfc" }}>
      <StatusBar barStyle="dark-content" />

      {/* Header Section */}
      <LinearGradient
        colors={[
          theme === "light" ? colors.beige : colors.grey,
          theme === "light" ? colors.white : "#444",
        ]}
        style={{
          paddingHorizontal: 24,
          paddingVertical: 28,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          shadowColor: "#1f2937",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 24,
          elevation: 8,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 20,
          }}
        >
          <View style={{ flex: 1, marginRight: 16 }}>
            <FFText
              style={{
                fontSize: 28,
                fontWeight: "800",
                letterSpacing: -0.5,
                lineHeight: 34,
              }}
            >
              {restaurant_name}
            </FFText>
          </View>

          <View
            style={{
              shadowColor: "#1f2937",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <FFAvatar
              onPress={() => {
                navigation.navigate("Profile");
              }}
              size={48}
              avatar={avatar?.url}
            />
          </View>
        </View>

        {/* Status Toggle */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {address?.street && address?.city && address?.nationality ? (
            <FFView
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 8,
                backgroundColor: "#f1f5f9",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                alignSelf: "flex-start",
              }}
              onPress={() => {
                navigation.navigate("AddressDetails", {
                  is_create_type: !address,
                  addressDetail: address as unknown as Type_Address,
                });
              }}
            >
              <Ionicons
                name="location-outline"
                size={14}
                color="#64748b"
                style={{ marginRight: 6 }}
              />
              <FFText
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  fontWeight: "500",
                }}
              >
                {address?.street}, {address?.city}
              </FFText>
            </FFView>
          ) : (
            <FFText style={{ color: colors.grey, fontSize: 13, marginTop: 8 }}>
              Unknown Address
            </FFText>
          )}
          <TouchableOpacity
            onPress={handleToggleAvailability}
            style={{
              backgroundColor: status?.is_open
                ? theme === "light"
                  ? "rgba(34, 197, 94, 0.12)"
                  : "rgba(34, 197, 94, 0.4)"
                : theme === "light"
                ? "rgba(239, 68, 68, 0.12)"
                : "rgba(239, 68, 68, 0.4)",
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 20,
              flexDirection: "row",
              alignItems: "center",
              alignSelf: "flex-start",
              borderWidth: 1,
              borderColor: status?.is_open
                ? "rgba(34, 197, 94, 0.2)"
                : "rgba(239, 68, 68, 0.2)",
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: status?.is_open ? "#22c55e" : "#ef4444",
                marginRight: 8,
              }}
            />
            <FFText
              style={{
                color: status?.is_open ? "#16a34a" : "#dc2626",
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              {status?.is_open ? "Open Now" : "Closed"}
            </FFText>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Daily Stats Card */}
        <View
          style={{
            marginHorizontal: 24,
            marginTop: 24,
          }}
        >
          <LinearGradient
            colors={[
              theme === "light" ? colors.info : "#444",
              theme === "light" ? colors.primary : colors.primary_dark,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 24,
              shadowColor: "#667eea",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.25,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            <View style={{ marginBottom: 20 }}>
              <FFText
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: 14,
                  fontWeight: "500",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Today's Performance
              </FFText>
            </View>

            {/* Revenue Section */}
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.25)",
                        padding: spacing.sm,
                        borderRadius: 16,
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name="trending-up" size={22} color="#ffffff" />
                    </View>
                    <FFText
                      style={{
                        color: "rgba(255, 255, 255, 0.9)",
                        fontSize: 15,
                        fontWeight: "500",
                      }}
                    >
                      Revenue
                    </FFText>
                  </View>
                  <FFText
                    fontSize="xl"
                    style={{
                      fontWeight: "800",
                      color: "#ffffff",
                      letterSpacing: -1,
                    }}
                  >
                    ${isLoadingStats ? "..." : dailyStats.revenue.toFixed(2)}
                  </FFText>
                </View>
              </View>
            </View>

            {/* Orders and Top Dish Row */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              {/* Orders */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  borderRadius: 18,
                  padding: 18,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      padding: 8,
                      borderRadius: 12,
                      marginRight: 8,
                    }}
                  >
                    <Ionicons
                      name="receipt-outline"
                      size={18}
                      color="#ffffff"
                    />
                  </View>
                </View>
                <FFText
                  style={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: 13,
                    fontWeight: "500",
                    marginBottom: 4,
                  }}
                >
                  Orders
                </FFText>
                <FFText
                  fontSize="lg"
                  style={{
                    fontWeight: "700",
                    color: "#ffffff",
                    letterSpacing: -0.5,
                  }}
                >
                  {isLoadingStats ? "..." : dailyStats.orders}
                </FFText>
              </View>

              {/* Top Dish */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  borderRadius: 18,
                  padding: 18,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      padding: 8,
                      borderRadius: 12,
                      marginRight: 8,
                    }}
                  >
                    <Ionicons name="star" size={18} color="#ffffff" />
                  </View>
                </View>
                <FFText
                  style={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: 13,
                    fontWeight: "500",
                    marginBottom: 4,
                  }}
                >
                  Top Item
                </FFText>
                <FFText
                  style={{
                    fontWeight: "600",
                    color: "#ffffff",
                    fontSize: 14,
                    lineHeight: 20,
                  }}
                >
                  {isLoadingStats ? "..." : dailyStats.topDish}
                </FFText>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Menu Grid */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 32,
          }}
        >
          <FFText
            style={{
              fontWeight: "700",
              marginBottom: 20,
              letterSpacing: -0.3,
            }}
            fontSize="lg"
          >
            Quick Actions
          </FFText>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              paddingBottom: spacing.veryLarge,
              justifyContent: "space-between",
              // gap: 16,
            }}
          >
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={{
                  width: "30%",
                  aspectRatio: 1,
                  // backgroundColor: "#ffffff",
                  borderRadius: 20,
                  paddingVertical: 16,
                  marginBottom: spacing.md,
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: "#1f2937",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.06,
                  shadowRadius: 16,
                  // elevation: 4,
                  // borderWidth: 0.5,
                  // borderColor: "rgba(241, 245, 249, 0.8)",
                }}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[colors.green_muted, colors.beige_light]}
                  style={{
                    padding: spacing.sm,
                    borderRadius: 16,
                    marginBottom: spacing.sm,
                  }}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={26}
                    color={colors.primary}
                  />
                </LinearGradient>
                <FFText
                  style={{
                    fontSize: 12,
                    textAlign: "center",
                    // color: "#374151",
                    fontWeight: "600",
                    lineHeight: 18,
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
        <View
          style={{
            padding: 24,
            alignItems: "center",
            backgroundColor: "#ffffff",
            borderRadius: 24,
            margin: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#fee2e2",
              padding: 16,
              borderRadius: 20,
              marginBottom: 16,
            }}
          >
            <Ionicons name="alert-circle" size={32} color="#ef4444" />
          </View>
          <FFText
            style={{
              fontSize: 16,
              textAlign: "center",
              color: "#374151",
              fontWeight: "500",
              lineHeight: 24,
            }}
          >
            {modalMessage}
          </FFText>
        </View>
      </FFModal>
    </FFSafeAreaView>
  );
};

export default HomeScreen;
