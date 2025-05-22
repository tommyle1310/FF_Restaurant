import FFText from "@/src/components/FFText";
import FFView from "@/src/components/FFView";
import FFButton from "@/src/components/FFButton";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import React, { useState, useEffect } from "react";
import {
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  View,
} from "react-native";
import { TabView, SceneMap, TabBar, TabBarProps } from "react-native-tab-view";
import { useWindowDimensions } from "react-native";
import axiosInstance from "@/src/utils/axiosConfig";
import {
  colors,
  spacing,
  typography,
  shadows,
  borderRadius,
} from "@/src/theme";
import { Enum_OrderStatus } from "@/src/types/Orders";
import moment from "moment";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";

type OrderItem = {
  name: string;
  item_id: string;
  quantity: number;
  variant_id: string;
  price_at_time_of_order: number;
  menu_item: {
    id: string;
    restaurant_id: string;
    name: string;
    price: string;
    avatar: {
      url: string;
    };
  };
  menu_item_variant: {
    id: string;
    menu_id: string;
    variant: string;
    description: string;
    avatar: null | {
      url: string;
    };
    availability: boolean;
    default_restaurant_notes: string[];
    price: string;
    discount_rate: string;
    created_at: number;
    updated_at: number;
  };
};

type Order = {
  id: string;
  customer_id: string;
  restaurant_id: string;
  driver_id: string | null;
  status: Enum_OrderStatus;
  total_amount: string;
  delivery_fee: string;
  payment_status: string;
  payment_method: string;
  customer_note: string;
  restaurant_note?: string;
  order_items: OrderItem[];
  order_time: string;
  delivery_time: string;
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    avatar: {
      url: string;
    };
  };
  driver?: {
    id: string;
    avatar: {
      url: string;
    };
  };
  customerAddress?: {
    street: string;
    city: string;
    postal_code: number;
    title: string;
  };
};

type ApiResponse = {
  EC: number;
  EM: string;
  data: {
    orders: Order[];
  };
};

type Styles = {
  container: ViewStyle;
  loadingContainer: ViewStyle;
  list: ViewStyle;
  orderCard: ViewStyle;
  orderTitle: TextStyle;
  orderAmount: ViewStyle;
  amount: TextStyle;
  statusBadge: ViewStyle;
  statusText: TextStyle;
  itemsList: ViewStyle;
  orderItem: TextStyle;
  noteContainer: ViewStyle;
  noteLabel: TextStyle;
  noteText: TextStyle;
  buttonGroup: ViewStyle;
  actionButtonContainer: ViewStyle;
  updateButtonContainer: ViewStyle;
  tabBar: ViewStyle;
  tab: ViewStyle;
  tabIndicator: ViewStyle;
  tabLabel: TextStyle;
  emptyContainer: ViewStyle;
  emptyText: TextStyle;
  orderHeader: ViewStyle;
  orderBasicInfo: ViewStyle;
  orderTime: TextStyle;
  expandedContent: ViewStyle;
  variantText: TextStyle;
  sectionLabel: TextStyle;
  detailText: TextStyle;
  customerInfo: ViewStyle;
  headerRow: ViewStyle;
};

const OrderCard = ({
  item,
  onUpdateStatus,
}: {
  item: Order;
  onUpdateStatus: (orderId: string, status: string) => Promise<void>;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatOrderTime = (timestamp: string) => {
    return moment.unix(parseInt(timestamp)).format("MMM D, YYYY h:mm A");
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      PENDING: colors.error,
      ACCEPTED: colors.info,
      EN_ROUTE: colors.success,
      DELIVERED: colors.primary,
      CANCELLED: colors.grey,
      REJECTED: colors.grey,
    };

    return statusColors[status] || colors.grey;
  };

  const handleActionPress = (e: any, action: () => void) => {
    e.stopPropagation(); // Prevent parent TouchableOpacity from triggering
    action();
  };

  return (
    <TouchableOpacity
      onPress={() => setIsExpanded(!isExpanded)}
      activeOpacity={0.7}
      style={styles.orderCard}
    >
      <View pointerEvents="none">
        <FFView style={styles.orderHeader}>
          <FFView style={{}}>
            <View style={styles.headerRow}>
              <FFText style={styles.orderTitle}>
                Order #{item.id.split("_").pop()?.slice(-8)}
              </FFText>
              <MaterialIcons
                name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                size={24}
                color={colors.textSecondary}
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                gap: spacing.sm,
                width: "100%",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <FFText style={styles.orderTime}>
                {formatOrderTime(item.order_time)}
              </FFText>
              <FFView
                style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(item.status),
                }}
              >
                <FFText style={styles.statusText}>{item.status}</FFText>
              </FFView>
            </View>
          </FFView>
        </FFView>

        <FFView style={styles.itemsList}>
          {item.order_items.map((orderItem, index) => (
            <FFText key={index} style={styles.orderItem}>
              {orderItem.quantity}x {orderItem.name}
              {orderItem.menu_item_variant && (
                <FFText style={styles.variantText}>
                  {" "}
                  (Variant: {orderItem.menu_item_variant.variant})
                </FFText>
              )}
            </FFText>
          ))}
        </FFView>
      </View>

      {item.status === "PENDING" && (
        <FFView style={styles.buttonGroup}>
          <TouchableOpacity
            style={{
              ...styles.actionButtonContainer,
              backgroundColor: colors.transparent,
              borderWidth: 1,
              borderColor: colors.grey,
            }}
            onPress={(e) =>
              handleActionPress(e, () => onUpdateStatus(item.id, "REJECTED"))
            }
          >
            <FFText style={{ color: colors.error }}>Reject</FFText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButtonContainer}
            onPress={(e) =>
              handleActionPress(e, () => onUpdateStatus(item.id, "ACCEPTED"))
            }
          >
            <FFText style={{ color: colors.white }}>Accept</FFText>
          </TouchableOpacity>
        </FFView>
      )}

      {isExpanded && (
        <View pointerEvents="none">
          <FFView style={styles.expandedContent}>
            {item.customer_note && (
              <FFView style={{...styles.noteContainer, backgroundColor: '#f5f4da'}}>
                <FFText style={styles.noteLabel}>Customer Note:</FFText>
                <FFText style={styles.noteText}>{item.customer_note}</FFText>
              </FFView>
            )}

            {item.restaurant_note && (
              <FFView style={{...styles.noteContainer, backgroundColor: '#e7fce3'}}>
                <FFText style={styles.noteLabel}>Restaurant Note:</FFText>
                <FFText style={styles.noteText}>{item.restaurant_note}</FFText>
              </FFView>
            )}

            <FFView style={styles.customerInfo}>
              <FFText style={styles.sectionLabel}>Customer Details:</FFText>
              <FFText style={styles.detailText}>
                {item.customer.first_name} {item.customer.last_name}
              </FFText>
              {item.customerAddress && (
                <FFText style={styles.detailText}>
                  {item.customerAddress.street}, {item.customerAddress.city}
                </FFText>
              )}
            </FFView>
          </FFView>
        </View>
      )}

      {isExpanded && item.status === Enum_OrderStatus.RESTAURANT_ACCEPTED && (
        <TouchableOpacity
          style={[styles.updateButtonContainer, { marginTop: spacing.md }]}
          onPress={(e) =>
            handleActionPress(e, () => onUpdateStatus(item.id, "EN_ROUTE"))
          }
        >
          <FFText style={{ color: colors.white }}>Mark as Delivering</FFText>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default function OrderScreen() {
  const layout = useWindowDimensions();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "current", title: "Current" },
    { key: "completed", title: "Completed" },
    { key: "cancelled", title: "Cancelled" },
  ]);
  const { id } = useSelector((state: RootState) => state.auth);
  const fetchOrders = async () => {
    try {
      const restaurantId = id || "FF_RES_3b6fdece-9449-4192-a5d6-28a24720e927"; // This should come from your auth context
      const response = await axiosInstance.get<ApiResponse>(
        `/restaurants/${restaurantId}/orders?limit=50`
      );
      console.log("check res", response);

      if (response.data.EC === 0) {
        setOrders(response.data.data.orders);
      } else {
        Alert.alert("Error", "Failed to fetch orders");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [id]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Here you would typically make an API call to update the status
      // For now, we'll just update the local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? { ...order, status: newStatus as Enum_OrderStatus }
            : order
        )
      );
      Alert.alert("Success", `Order status updated to "${newStatus}"`);
    } catch (error) {
      Alert.alert("Error", "Failed to update order status");
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <OrderCard item={item} onUpdateStatus={updateOrderStatus} />
  );

  const CurrentOrders = () => (
    <FlatList
      data={orders.filter((order) =>
        [
          Enum_OrderStatus.PENDING,
          Enum_OrderStatus.RESTAURANT_ACCEPTED,
          Enum_OrderStatus.EN_ROUTE,
        ].includes(order.status)
      )}
      renderItem={renderOrder}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={() => (
        <FFView style={styles.emptyContainer}>
          <FFText style={styles.emptyText}>No current orders</FFText>
        </FFView>
      )}
    />
  );

  const CompletedOrders = () => (
    <FlatList
      data={orders.filter((order) => order.status === "DELIVERED")}
      renderItem={renderOrder}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={() => (
        <FFView style={styles.emptyContainer}>
          <FFText style={styles.emptyText}>No completed orders</FFText>
        </FFView>
      )}
    />
  );

  const CancelledOrders = () => (
    <FlatList
      data={orders.filter((order) =>
        [Enum_OrderStatus.CANCELLED].includes(order.status)
      )}
      renderItem={renderOrder}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={() => (
        <FFView style={styles.emptyContainer}>
          <FFText style={styles.emptyText}>No cancelled orders</FFText>
        </FFView>
      )}
    />
  );

  const renderScene = SceneMap({
    current: CurrentOrders,
    completed: CompletedOrders,
    cancelled: CancelledOrders,
  });

  if (loading) {
    return (
      <FFView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </FFView>
    );
  }

  return (
    <FFSafeAreaView style={styles.container}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props: TabBarProps<any>) => (
          <TabBar
            {...props}
            style={styles.tabBar}
            activeColor={colors.primary}
            inactiveColor={colors.textSecondary}
            indicatorStyle={styles.tabIndicator}
            tabStyle={styles.tab}
            scrollEnabled
          />
        )}
      />
    </FFSafeAreaView>
  );
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.veryLarge,
  },
  orderCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  orderTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.grey,
    marginBottom: spacing.sm,
  },
  orderAmount: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  amount: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.badge,
  },
  statusText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
  },
  itemsList: {
    marginVertical: spacing.sm,
  },
  orderItem: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontFamily: typography.fontFamily.regular,
  },
  noteContainer: {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.sm,
  },
  noteLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  noteText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    // marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionButtonContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  updateButtonContainer: {
    marginTop: spacing.md,
  },
  tabBar: {
    backgroundColor: colors.background,
    ...shadows.xs,
  },
  tab: {
    height: spacing.xl + spacing.md,
  },
  tabIndicator: {
    backgroundColor: colors.primary,
    height: 3,
  },
  tabLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    textTransform: "none",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    borderRadius: spacing.md,
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  orderBasicInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  orderTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
  },
  expandedContent: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  variantText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
    marginBottom: spacing.xs,
  },
  customerInfo: {
    marginTop: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
});
