import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSelector, useDispatch } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import axiosInstance from "@/src/utils/axiosConfig";
import { useEffect, useState } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { MainStackParamList } from "@/src/navigation/AppNavigator";
import FFButton from "@/src/components/FFButton";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import FFText from "@/src/components/FFText";
import FFModal from "@/src/components/FFModal";
import Spinner from "@/src/components/FFSpinner";
import IntentLauncher from "expo-intent-launcher";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { spacing } from "@/src/theme";

interface Promotion {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  [key: string]: any;
}

type PromotionScreenNavigationProps = StackNavigationProp<
  MainStackParamList,
  "Promotions"
>;

export default function PromotionListScreen() {
  const navigation = useNavigation<PromotionScreenNavigationProps>();
  const dispatch = useDispatch();
  const { restaurant_id, promotions } = useSelector((state: RootState) => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPromotions, setCurrentPromotions] = useState<Promotion[]>([]);
  const [flashFoodPromotions, setFlashFoodPromotions] = useState<Promotion[]>([]);
  const [expiredPromotions, setExpiredPromotions] = useState<Promotion[]>([]);
  const [activeTab, setActiveTab] = useState<"Current" | "FlashFood" | "Expired">("Current");
  const [isShowInsufficientModal, setIsShowInsufficientModal] = useState(false);
  const [isShowPromotionExpiredModal, setIsShowPromotionExpiredModal] = useState(false);

  // Lưu và khôi phục promotions từ AsyncStorage
  const savePromotions = async (promotions: Promotion[]) => {
    try {
      await AsyncStorage.setItem("currentPromotions", JSON.stringify(promotions));
    } catch (error) {
      console.error("Error saving promotions:", error);
    }
  };

  const loadPromotions = async () => {
    try {
      const data = await AsyncStorage.getItem("currentPromotions");
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error loading promotions:", error);
      return [];
    }
  };

  // Cập nhật Redux store
  const updatePromotionsInStore = (newPromotions: Promotion[]) => {
    dispatch({
      type: "auth/updatePromotions",
      payload: newPromotions,
    });
  };

  const fetchAllPromotions = async () => {
    setIsLoading(true);
    try {
      // Lấy tất cả promotions có sẵn
      const response = await axiosInstance.get("/promotions");
      const responseData = response.data;
      if (responseData.EC !== 0) {
        console.error("Error fetching available promotions:", responseData.EM);
        return;
      }
      const allPromotions = responseData.data;
      console.log("check available promotions", allPromotions);

      // Phân loại promotions
      const currentTime = Date.now() / 1000;
      const current = currentPromotions; // Giữ currentPromotions từ state hoặc AsyncStorage
      const expired: Promotion[] = [];
      const flashFood: Promotion[] = [];

      allPromotions.forEach((promo: Promotion) => {
        const isApplied = current.some((p: Promotion) => p.id === promo.id);
        const isExpired = parseInt(promo.end_date) < currentTime;

        if (isApplied && isExpired) {
          expired.push(promo);
        } else if (!isApplied && !isExpired) {
          flashFood.push(promo);
        }
      });

      setFlashFoodPromotions(flashFood);
      setExpiredPromotions(expired);
    } catch (error) {
      console.error("Error in fetchAllPromotions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyPromotion = async (promotion: Promotion) => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post("/restaurants/apply-promotion", {
        restaurantId: restaurant_id,
        promotionId: promotion.id,
      });
      const responseData = response.data;
      console.log("check res", responseData);

      if (!responseData || typeof responseData.EC !== "number") {
        throw new Error("Invalid response format");
      }

      const { EC, EM, data } = responseData;

      if (EC === 0) {
        console.log("check step: EC === 0");

        // Cập nhật currentPromotions
        let updatedCurrentPromotions = [...currentPromotions];
        if (data.restaurant.promotions) {
          // Giả sử data.restaurant.promotions chứa danh sách promotions đầy đủ
          updatedCurrentPromotions = data.restaurant.promotions;
        } else {
          // Nếu không có promotions trong response, thêm promotion vừa mua
          updatedCurrentPromotions = [...currentPromotions, promotion];
        }
        const updatedFlashFoodPromotions = flashFoodPromotions.filter(
          (p) => p.id !== promotion.id
        );
        console.log("check step: updated currentPromotions", updatedCurrentPromotions);
        console.log("check step: updated flashFoodPromotions", updatedFlashFoodPromotions);

        // Cập nhật state
        setCurrentPromotions(updatedCurrentPromotions);
        setFlashFoodPromotions(updatedFlashFoodPromotions);

        // Lưu vào AsyncStorage
        await savePromotions(updatedCurrentPromotions);

        // Cập nhật Redux store
        updatePromotionsInStore(updatedCurrentPromotions);

        // Làm mới danh sách promotions
        try {
          console.log("check step: calling fetchAllPromotions");
          await fetchAllPromotions();
          console.log("check step: fetchAllPromotions completed");
        } catch (fetchError) {
          console.error("Error in fetchAllPromotions:", fetchError);
        }
      } else if (EC === -8) {
        console.log("check step: EC === -8, showing insufficient modal");
        setIsShowInsufficientModal(true);
      } else if (EC === -9) {
        console.log("check step: EC === -9, showing expired modal");
        setIsShowPromotionExpiredModal(true);
      } else {
        console.log("check step: EC else, showing alert", EC);
        Alert.alert("Failed to purchase promotion", EM || "Unknown error");
      }
    } catch (err: any) {
      console.error("Error in handleBuyPromotion:", err);
      Alert.alert("Failed to purchase promotion", err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
      console.log("check promo", promotion);
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
            currentPromotions.some((p) => p.id === item.id) ? "disabled" : "primary"
          }
          style={{ width: "100%", flex: 1 }}
          onPress={() => handleBuyPromotion(item)}
        >
          {currentPromotions.some((p) => p.id === item.id) ? "Purchased" : "Purchase"}
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

  const openFWallet = async () => {
    try {
      await IntentLauncher.startActivityAsync("android.intent.action.MAIN", {
        packageName: "com.tommyle1310.FWallet",
        className: "com.tommyle1310.FWallet.MainActivity",
      });
    } catch (error) {
      console.log("Error opening FWallet:", error);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        // Khôi phục currentPromotions từ AsyncStorage
        const savedPromotions = await loadPromotions();
        setCurrentPromotions(savedPromotions);

        // Lấy promotions từ Redux store (nếu có)
        if (promotions && promotions.length > 0) {
          setCurrentPromotions(promotions);
          await savePromotions(promotions);
        }

        // Lấy danh sách promotions có sẵn
        await fetchAllPromotions();
      } catch (error) {
        console.error("Error initializing promotions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, [restaurant_id, promotions]);

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
      <FFModal
        visible={isShowInsufficientModal}
        onClose={() => setIsShowInsufficientModal(false)}
      >
        <View style={styles.modalContent}>
          <FFText style={styles.modalText}>Insufficient balance</FFText>
          <FFButton
            onPress={() => {
              setIsShowInsufficientModal(false);
              openFWallet();
            }}
            style={styles.modalButton}
            isLinear
          >
            Open FWallet
          </FFButton>
        </View>
      </FFModal>
      <FFModal
        visible={isShowPromotionExpiredModal}
        onClose={() => setIsShowPromotionExpiredModal(false)}
      >
        <View style={styles.modalContent}>
          <FFText style={styles.modalText}>This promotion has expired.</FFText>
        </View>
      </FFModal>
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
  modalContent: {
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.md,
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  modalButton: {
    minWidth: 120,
    paddingHorizontal: spacing.md,
  },
});
