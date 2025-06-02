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
import { useNavigation, useFocusEffect } from "@react-navigation/native";
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
  const [isShowStatusModal, setIsShowStatusModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
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
        setStatusMessage("Failed to fetch menu items");
        setIsShowStatusModal(true);
      }
    } catch (error) {
      setStatusMessage("Failed to fetch menu items");
      setIsShowStatusModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (globalState.restaurant_id) {
        fetchMenuItems();
      }
    }, [globalState.restaurant_id])
  );

  const handleEditItem = (item: MenuItem) => {
    // navigation.navigate("EditMenuItem", { item });
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.patch(`/menu-items/${item.id}/toggle-availability`);

      if (response.data.EC === 0) {
        setMenuItems((prevItems) =>
          prevItems.map((menuItem) =>
            menuItem.id === item.id
              ? { ...menuItem, availability: !menuItem.availability }
              : menuItem
          )
        );
      } else {
        setStatusMessage(response.data.EM || "Failed to update menu item");
        setIsShowStatusModal(true);
      }
    } catch (error) {
      setStatusMessage("Failed to update menu item availability");
      setIsShowStatusModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Spinner isVisible isOverlay />;
  }

  return (
    <FFView style={styles.container} colorDark={colors.black}>
      <FFModal
        visible={isShowStatusModal}
        onClose={() => setIsShowStatusModal(false)}
      >
        <View style={styles.statusModalContent}>
          <FFText style={{ textAlign: "center" }}>{statusMessage}</FFText>
          <TouchableOpacity
            style={styles.statusModalButton}
            onPress={() => setIsShowStatusModal(false)}
          >
            <FFText style={styles.statusModalButtonText}>OK</FFText>
          </TouchableOpacity>
        </View>
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
                color: selectedCategory === tab ? colors.white : "#666",
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
          <FFView
            onPress={() => {
              navigation.navigate("MenuItemForm", {
                menuItemId: item.id, // Use item.id directly
              });
              setSelectedMenuItemId(item.id); // Optional, if needed for other logic
            }}
            key={item.id}
            style={styles.menuItem}
          >
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
                {/* <TouchableOpacity
                  onPress={() => {
                    setSelectedMenuItemId(item.id);
                    setIsShowModal(true);
                  }}
                  style={styles.moreButton}
                >
                  <IconMaterialIcons name="more-vert" size={24} color="#666" />
                </TouchableOpacity> */}
              </View>
            </View>
          </FFView>
        ))}
      </ScrollView>

      {/* Add Item Button */}
      <FFButton
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
    backgroundColor: colors.background || '#F8FAFC', // Light, modern background
  },
  tabContainer: {
    paddingVertical: spacing.sm,
    width: '100%',
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey || '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    justifyContent: 'center',
    flex: 1,
    alignItems: 'center',
    borderRadius: 8,
    // Smooth transition for active state
    transitionProperty: 'background-color, border-color',
    transitionDuration: '200ms',
  },
  activeTab: {
    backgroundColor: colors.primary || '#E6F0FF', // Subtle primary shade
    // borderBottomWidth: 3,
    // borderBottomColor: colors.primary || '#3B82F6',
  },
  menuList: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background || '#F8FAFC',
  },
  menuItem: {
    borderRadius: 12,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    // Subtle scale animation on press
    transitionProperty: 'transform',
    transitionDuration: '150ms',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align top for variants
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGrey || '#F1F5F9',
    // Smooth image loading
    resizeMode: 'cover',
  },
  itemDetails: {
    flex: 1,
    gap: spacing.xs,
  },
  price: {
    color: colors.info || '#10B981',
    fontSize: 16,
    fontWeight: '500',
    // marginTop: spacing.xs,
  },
  soldCount: {
    color: colors.textSecondary || '#6B7280',
    fontSize: 14,
    // marginTop: spacing.xs,
  },
  itemActions: {
    flexDirection: 'column', // Fixed typo from 'colu' to 'column'
    alignItems: 'center',
    gap: spacing.md,
  },
  moreButton: {
    padding: spacing.xs,
    borderRadius: 6,
    backgroundColor: colors.grey || '#F1F5F9',
    // Hover effect
    transitionProperty: 'background-color',
    transitionDuration: '150ms',
  },
  addButton: {
    margin: spacing.lg,
    marginBottom: spacing.veryLarge,
    borderRadius: 10,
    backgroundColor: `linear-gradient(90deg, ${colors.primary || '#3B82F6'} 0%, ${
      colors.primary_dark || '#2563EB'
    } 100%)`, // Gradient for modern look
    shadowColor: colors.primary || '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    // Scale animation on press
    transitionProperty: 'transform',
    transitionDuration: '150ms',
  },
  statusModalContent: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  statusModalButton: {
    backgroundColor: colors.primary || '#3B82F6',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
    // Hover effect
    transitionProperty: 'background-color',
    transitionDuration: '150ms',
  },
  statusModalButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default MenuManagement;