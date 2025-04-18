import React, { useState } from "react";
import { View, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFText from "@/src/components/FFText";
import { StackNavigationProp } from "@react-navigation/stack";
import { MainStackParamList } from "@/src/navigation/AppNavigator";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import FFAvatar from "@/src/components/FFAvatar";

type HomeNavigationProps = StackNavigationProp<
  MainStackParamList,
  "BottomTabs"
>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeNavigationProps>();

  const { address, restaurant_name, avatar, status } = useSelector(
    (state: RootState) => state.auth
  );

  // Function to return a greeting based on current hour.
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Daily stats section data
  const dailyStats = {
    revenue: 10,
    orders: "10",
    topDish: "Com Dai",
  };

  // Menu grid items
  const menuItems = [
    { id: 1, icon: "bag", label: "Đơn hàng" },
    { id: 2, icon: "time", label: "Lịch sử" },
    { id: 3, icon: "document-text", label: "Thực đơn" },
    { id: 4, icon: "star", label: "Đánh giá" },
    {
      id: 5,
      icon: "pricetag",
      label: "Khuyến mãi",
      onPress: () => navigation.navigate("Promotions"),
    },
    { id: 6, icon: "wallet", label: "Ví" },
    { id: 7, icon: "bulb", label: "Marketing" },
    { id: 8, icon: "megaphone", label: "Quảng cáo" },
    { id: 9, icon: "play", label: "Video VILL" },
    { id: 10, icon: "people", label: "Nhân viên" },
    { id: 11, icon: "pie-chart", label: "Báo cáo" },
    { id: 12, icon: "person", label: "Cá nhân" },
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
            <FFText style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
              {address?.street}, {address?.city}, {address?.nationality}
            </FFText>
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
          <View
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
          </View>
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
                <Ionicons name="stats-chart" size={20} color="#f97316" />
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
                  ${dailyStats.revenue}
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
                <Ionicons name="document-text" size={20} color="#f97316" />
              </View>
              <View style={{ flex: 1 }}>
                <FFText style={{ color: "#eee" }}>Số đơn/ngày</FFText>
                <FFText
                  style={{
                    fontWeight: "600",
                    color: "#fff",
                    marginTop: 2,
                  }}
                >
                  {dailyStats.orders}
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
                <Ionicons name="restaurant" size={20} color="#f97316" />
              </View>
              <View style={{ flex: 1 }}>
                <FFText style={{ color: "#eee" }}>Món bán chạy</FFText>
                <FFText
                  style={{
                    fontWeight: "600",
                    color: "#fff",
                    marginTop: 2,
                  }}
                >
                  {dailyStats.topDish}
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
                  <Ionicons name={item.icon as any} size={24} color="#f97316" />
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
    </FFSafeAreaView>
  );
};

export default HomeScreen;
