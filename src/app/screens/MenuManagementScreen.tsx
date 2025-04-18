import React, { useState, useEffect } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import FFInputControl from "@/src/components/FFInputControl";
import FFToggle from "@/src/components/FFToggle";
import FFButton from "@/src/components/FFButton";
import FFText from "@/src/components/FFText";
import FFView from "@/src/components/FFView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import IconIonicons from "react-native-vector-icons/Ionicons";
import IconMaterialIcons from "react-native-vector-icons/MaterialIcons";
import theme, { colors, spacing } from "@/src/theme";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { MainStackParamList } from "@/src/navigation/AppNavigator";
import axiosInstance from "@/src/utils/axiosConfig";
import Spinner from "@/src/components/FFSpinner";
import { Alert } from "react-native";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import FFModal from "@/src/components/FFModal";

interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  price: string;
  category: string[];
  avatar?: {
    key: string;
    url: string;
  };
  availability: boolean;
  suggest_notes: string[];
  purchase_count: number;
  discount?: {
    discount_type: "FIXED" | "PERCENTAGE";
    discount_value: number;
    start_date: number;
    end_date: number;
  } | null;
  variants: Array<{
    id: string;
    menu_id: string;
    variant: string;
    description: string;
    price: string;
    availability: boolean;
    avatar?: {
      key: string;
      url: string;
    };
  }>;
}

type MenuItemScreenNavigationProps = StackNavigationProp<
  MainStackParamList,
  "BottomTabs"
>;

const MenuManagement = () => {
  const navigation = useNavigation<MenuItemScreenNavigationProps>();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Menu Item");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>("");
  const [isShowModal, setIsShowModal] = useState(false);
  const [expandedVariants, setExpandedVariants] = useState<string | null>(null);
  const globalState = useSelector((state: RootState) => state.auth);
  const fetchMenuItems = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(
        `/restaurants/menu-items/${globalState.restaurant_id}`
      );
      const { EC, EM, data } = response.data;

      if (EC === 0) {
        setMenuItems(data);
      } else {
        Alert.alert("Error", "Failed to fetch menu items");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch menu items");
    } finally {
      setIsLoading(false);
    }
  };
  console.log("check id res", globalState.restaurant_id);

  useEffect(() => {
    fetchMenuItems();
  }, [globalState.restaurant_id]);

  const handleEditItem = (item: MenuItem) => {
    // navigation.navigate("EditMenuItem", { item });
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.patch(`/menu-items/${item.id}`, {
        availability: !item.availability,
      });

      if (response.data.EC === 0) {
        setMenuItems((prevItems) =>
          prevItems.map((menuItem) =>
            menuItem.id === item.id
              ? { ...menuItem, availability: !menuItem.availability }
              : menuItem
          )
        );
      } else {
        Alert.alert("Error", response.data.EM || "Failed to update menu item");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update menu item availability");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Spinner isVisible isOverlay />;
  }

  return (
    <FFView style={styles.container}>
      <FFModal visible={isShowModal} onClose={() => setIsShowModal(false)}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("MenuItemForm", {
              menuItemId: selectedMenuItemId,
            })
          }
        >
          <FFText style={{ textAlign: "center" }}>Edit this menu item</FFText>
        </TouchableOpacity>
      </FFModal>
      {/* Category Tabs */}
      <View style={styles.tabContainer}>
        {["Menu Item", "Recommended Menu Item"]?.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setSelectedCategory(tab)}
            style={[styles.tab, selectedCategory === tab && styles.activeTab]}
          >
            <FFText
              fontSize="sm"
              style={{
                color: selectedCategory === tab ? colors.primary : "#666",
              }}
            >
              {tab}
            </FFText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Menu Items List */}
      <ScrollView style={styles.menuList}>
        {menuItems?.map((item) => (
          <View key={item.id} style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <Image
                source={{
                  uri: item.avatar?.url || "https://via.placeholder.com/60",
                }}
                style={styles.itemImage}
              />
              <View style={styles.itemDetails}>
                <FFText fontSize="md" fontWeight="600">
                  {item.name}
                </FFText>
                <FFText fontSize="md" style={styles.price}>
                  ${parseFloat(item.price).toLocaleString()}
                </FFText>
                <FFText fontSize="sm" style={styles.soldCount}>
                  {item.purchase_count} sold
                </FFText>
                <TouchableOpacity
                  onPress={() => {
                    setExpandedVariants((prev) =>
                      prev === item.id ? null : item.id
                    );
                  }}
                >
                  <FFText fontSize="sm" style={styles.soldCount}>
                    Variants: {item.variants.length}
                  </FFText>
                </TouchableOpacity>
                {expandedVariants === item.id &&
                  item?.variants?.map((variant) => (
                    <View key={variant.id}>
                      <FFText fontSize="sm">
                        {variant.variant} - {variant.price}
                      </FFText>
                    </View>
                  ))}
              </View>
              <View style={styles.itemActions}>
                <FFToggle
                  initialChecked={item.availability}
                  onChange={(value) => {
                    handleToggleAvailability(item);
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    setSelectedMenuItemId(item.id);
                    setIsShowModal(true);
                  }}
                  style={styles.moreButton}
                >
                  <IconMaterialIcons name="more-vert" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add Item Button */}
      <FFButton
        variant="primary"
        className="w-full"
        style={styles.addButton}
        onPress={() => navigation.navigate("MenuItemForm")}
      >
        Add new menu item
      </FFButton>
    </FFView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  tabContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    width: "100%",
    flexDirection: "row",
    borderBottomColor: "#eee",
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    flex: 1,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    color: "#666",
  },
  activeTabText: {
    color: theme.colors.primary,
  },
  menuList: {
    flex: 1,
    padding: 16,
  },
  menuItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  menuItemContent: {
    flexDirection: "row",
    // alignItems: "center",
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  price: {
    color: colors.info,
    marginTop: 4,
  },
  soldCount: {
    color: "#999",
    marginTop: 2,
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  moreButton: {
    padding: 4,
  },
  addButton: {
    margin: 16,
    marginBottom: spacing.veryLarge,
    borderRadius: 8,
    paddingVertical: 12,
  },
});

export default MenuManagement;
