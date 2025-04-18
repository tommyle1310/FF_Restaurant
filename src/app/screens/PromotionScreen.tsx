import FFButton from "@/src/components/FFButton";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import Spinner from "@/src/components/FFSpinner";
import { MainStackParamList } from "@/src/navigation/AppNavigator";
import { Promotion } from "@/src/store/authSlice";
import { RootState } from "@/src/store/store";
import { useSelector } from "@/src/store/types";
import axiosInstance from "@/src/utils/axiosConfig";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Button,
  TouchableOpacity,
  Alert,
} from "react-native";

type PromotionScreenNavigationProps = StackNavigationProp<
  MainStackParamList,
  "Promotions"
>;

export default function PromotionListScreen() {
  const navigation = useNavigation<PromotionScreenNavigationProps>();
  const { promotions, restaurant_id } = useSelector(
    (state: RootState) => state.auth
  );
  const [isLoading, setIsLoading] = useState(false);
  const [currentPromotions, setCurrentPromotions] = useState<Promotion[]>([]);
  const [flashFoodPromotions, setFlashFoodPromotions] = useState<Promotion[]>(
    []
  );
  const [expiredPromotions, setExpiredPromotions] = useState<Promotion[]>([]);
  const [activeTab, setActiveTab] = useState<
    "Current" | "FlashFood" | "Expired"
  >("Current");

  const handleBuyPromotion = async (promotion: Promotion) => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post(
        "/restaurants/apply-promotion",
        {
          restaurantId: restaurant_id,
          promotionId: promotion.id,
        }
      );
      const responseData = response.data;
      const { EC, EM, data } = responseData;
      console.log("cehck res", responseData);

      if (EC === 0) {
        setCurrentPromotions([...currentPromotions, promotion]);
        setFlashFoodPromotions(
          flashFoodPromotions.filter((p) => p.id !== promotion.id)
        );
        fetchAllPromotions();
      } else {
        Alert.alert("Failed to purchase promotion");
      }
      setIsLoading(false);
      console.log("check promo", promotion);
    } catch (err) {
      setIsLoading(false);
      Alert.alert("Failed to purchase promotion");
    }
  };

  const renderPromotionItem = (
    { item }: { item: Promotion },
    type: "Current" | "FlashFood" | "Expired"
  ) => (
    <View style={styles.promotionItem}>
      <Text style={styles.promotionTitle}>{item.name}</Text>
      <Text style={styles.promotionDescription}>{item.description}</Text>
      <Text style={styles.promotionValid}>
        Valid Until:{" "}
        {new Date(parseInt(item.end_date) * 1000)
          .toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          .replace(/(\d+) (\w+) (\d+)/, "$1, $2, $3")}
      </Text>
      {type === "FlashFood" && (
        <FFButton
          variant={
            currentPromotions.some(
              (currentPromotion) => currentPromotion.id === item.id
            )
              ? "disabled"
              : "primary"
          }
          style={{}}
          className="w-full"
          onPress={() => handleBuyPromotion(item)}
        >
          {currentPromotions.some(
            (currentPromotion) => currentPromotion.id === item.id
          )
            ? "Purchased"
            : "Purchase"}
        </FFButton>
      )}
    </View>
  );

  const renderPromotions = () => {
    let data = [];
    switch (activeTab) {
      case "Current":
        data = currentPromotions;
        break;
      case "FlashFood":
        data = flashFoodPromotions;
        break;
      case "Expired":
        data = expiredPromotions;
        break;
    }

    return (
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderPromotionItem({ item }, activeTab)}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No promotions available.</Text>
        }
      />
    );
  };

  useEffect(() => {
    const validPromotions = promotions
      ?.map((p) =>
        parseInt(p.start_date) < Date.now() / 1000 &&
        parseInt(p.end_date) > Date.now() / 1000
          ? p
          : null
      )
      .filter((p) => p !== null);
    setCurrentPromotions(validPromotions as Promotion[]);
  }, [promotions]);

  useEffect(() => {
    fetchAllPromotions();
  }, []);

  const fetchAllPromotions = async () => {
    const response = await axiosInstance.get("/promotions");
    const responseData = response.data;
    const { EC, EM, data } = responseData;
    if (EC === 0) {
      console.log("cehc kdata", data);

      setFlashFoodPromotions(data);
    }
  };

  if (isLoading) {
    return <Spinner isVisible isOverlay />;
  }

  return (
    <FFSafeAreaView>
      <FFScreenTopSection navigation={navigation} title="Promotions" />
      <View style={styles.container}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "Current" && styles.activeTab]}
            onPress={() => setActiveTab("Current")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "Current" && styles.activeTabText,
              ]}
            >
              Current Promotions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "FlashFood" && styles.activeTab]}
            onPress={() => setActiveTab("FlashFood")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "FlashFood" && styles.activeTabText,
              ]}
            >
              Promotions by FlashFood
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "Expired" && styles.activeTab]}
            onPress={() => setActiveTab("Expired")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "Expired" && styles.activeTabText,
              ]}
            >
              Expired Promotions
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.promotionList}>{renderPromotions()}</View>
      </View>
    </FFSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    padding: 20,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  tab: {
    padding: 10,
    flex: 1,
    borderBottomWidth: 2,
    borderBottomColor: "#ccc",
  },
  activeTab: {
    borderBottomColor: "#4d9c39",
  },
  tabText: {
    color: "#666",
  },
  activeTabText: {
    color: "#4d9c39",
    fontWeight: "bold",
  },
  promotionList: {
    flex: 1,
  },
  promotionItem: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    elevation: 3,
  },
  promotionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  promotionDescription: {
    fontSize: 14,
    marginBottom: 5,
  },
  promotionValid: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
  },
});
