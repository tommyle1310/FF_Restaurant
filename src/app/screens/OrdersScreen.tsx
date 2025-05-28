import FFText from "@/src/components/FFText";
import FFView from "@/src/components/FFView";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFModal from "@/src/components/FFModal";
import React, { useState, useEffect, useCallback } from "react";
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
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { useWindowDimensions } from "react-native";
import axiosInstance from "@/src/utils/axiosConfig";
import { colors, spacing, typography, shadows, borderRadius } from "@/src/theme";
import { Enum_OrderStatus, Type_PushNotification_Order, Enum_OrderTrackingInfo } from "@/src/types/Orders";
import moment from "moment";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import {
  loadOrderTrackingFromAsyncStorage,
  updateAndSaveOrderTracking,
  removeOrderTracking,
} from "@/src/store/restaurantOrderTrackingSlice";
import { useSocket } from "@/src/hooks/useSocket";

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
    avatar: { url: string };
  };
  menu_item_variant: {
    id: string;
    menu_id: string;
    variant: string;
    description: string;
    avatar: null | { url: string };
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
    avatar: { url: string };
  };
  driver?: {
    id: string;
    avatar: { url: string };
  };
  customerAddress?: {
    id?: string;
    street: string;
    city: string;
    postal_code: number;
    title: string;
    nationality?: string;
    is_default?: boolean;
    created_at?: number;
    updated_at?: number;
    location?: { lat: number; lng: number };
  };
  restaurantAddress?: {
    id?: string;
    street: string;
    city: string;
    postal_code: number;
    title: string;
    nationality?: string;
    is_default?: boolean;
    created_at?: number;
    updated_at?: number;
    location?: { lat: number; lng: number };
  };
};

type ApiResponse = {
  EC: number;
  EM: string;
  data: { orders: Order[] };
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
  toastModal: ViewStyle;
  toastText: TextStyle;
};

const OrderCard = ({
  item,
  onUpdateStatus,
  showActions = true,
}: {
  item: Type_PushNotification_Order;
  onUpdateStatus: (orderId: string, status: string) => Promise<void>;
  showActions?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatOrderTime = (timestamp: number) => {
    return moment.unix(timestamp / 1000).format("MMM D, YYYY h:mm A");
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      PENDING: colors.error,
      RESTAURANT_ACCEPTED: colors.info,
      EN_ROUTE: colors.success,
      DELIVERED: colors.primary,
      CANCELLED: colors.grey,
      REJECTED: colors.grey,
      READY_FOR_PICKUP: colors.warning,
    };
    return statusColors[status] || colors.grey;
  };

  const handleActionPress = (e: any, action: () => void) => {
    e.stopPropagation();
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
          <FFView>
            <View style={styles.headerRow}>
              <FFText style={styles.orderTitle}>
                Order #{item.orderId.split("_").pop()?.slice(-8)}
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
                {formatOrderTime(item.updated_at)}
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
              {orderItem.variant_id && (
                <FFText style={styles.variantText}>
                  {" "}
                  (Variant: {orderItem.variant_id})
                </FFText>
              )}
            </FFText>
          ))}
        </FFView>
      </View>

      {showActions && item.status === Enum_OrderStatus.PENDING && (
        <FFView style={styles.buttonGroup}>
          <TouchableOpacity
            style={{
              ...styles.actionButtonContainer,
              backgroundColor: colors.transparent,
              borderWidth: 1,
              borderColor: colors.grey,
            }}
            onPress={(e) =>
              handleActionPress(e, () => onUpdateStatus(item.orderId, Enum_OrderStatus.REJECTED))
            }
          >
            <FFText style={{ color: colors.error }}>Reject</FFText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButtonContainer}
            onPress={(e) =>
              handleActionPress(e, () => onUpdateStatus(item.orderId, Enum_OrderStatus.RESTAURANT_ACCEPTED))
            }
          >
            <FFText style={{ color: colors.white }}>Accept</FFText>
          </TouchableOpacity>
        </FFView>
      )}

      {isExpanded && (
        <View pointerEvents="none">
          <FFView style={styles.expandedContent}>
            <FFView style={styles.customerInfo}>
              <FFText style={styles.sectionLabel}>Customer Address:</FFText>
              <FFText style={styles.detailText}>
                {item.customerAddress.street}, {item.customerAddress.city}
              </FFText>
            </FFView>
          </FFView>
        </View>
      )}

      {showActions && isExpanded && item.status === Enum_OrderStatus.RESTAURANT_ACCEPTED && (
        <TouchableOpacity
          style={[styles.updateButtonContainer, { marginTop: spacing.md }]}
          onPress={(e) =>
            handleActionPress(e, () => onUpdateStatus(item.orderId, Enum_OrderStatus.READY_FOR_PICKUP))
          }
        >
          <FFText style={{ color: colors.white }}>Mark as Ready for Pickup</FFText>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default function OrderScreen() {
  const layout = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: "", subtitle: "" });
  const [completedOrders, setCompletedOrders] = useState<Type_PushNotification_Order[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<Type_PushNotification_Order[]>([]);
  const { id } = useSelector((state: RootState) => state.auth);
  const orders = useSelector((state: RootState) => {
    console.log("Redux orders:", state.restaurantOrderTracking.orders);
    return state.restaurantOrderTracking.orders;
  });
  const dispatch = useDispatch();
  const { socket, latestOrder } = useSocket(id ?? "FF_RES_3b6fdece-9449-4192-a5d6-28a24720e927");

  const showModal = useCallback((title: string, subtitle: string) => {
    setModalMessage({ title, subtitle });
    setModalVisible(true);
    const timeout = setTimeout(() => {
      setModalVisible(false);
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  const fetchOrders = async () => {
    try {
      const restaurantId = id ?? "FF_RES_3b6fdece-9449-4192-a5d6-28a24720e927";
      const response = await axiosInstance.get<ApiResponse>(
        `/restaurants/${restaurantId}/orders?limit=50`
      );

      if (response.data.EC === 0) {
        const apiOrders = response.data.data.orders;
        console.log("Fetched orders:", apiOrders.length);

        const currentOrderStatuses = [
          Enum_OrderStatus.PENDING,
          Enum_OrderStatus.RESTAURANT_ACCEPTED,
          Enum_OrderStatus.EN_ROUTE,
          Enum_OrderStatus.READY_FOR_PICKUP,
        ];

        apiOrders.forEach((order) => {
          if (currentOrderStatuses.includes(order.status)) {
            dispatch(
              updateAndSaveOrderTracking({
                orderId: order.id,
                customer_id: order.customer_id,
                total_amount: parseFloat(order.total_amount) || 0,
                status: order.status,
                order_items: order.order_items.map((item) => ({
                  item_id: item.item_id,
                  variant_id: item.variant_id || "",
                  name: item.menu_item?.name || item.name || "Unknown Item",
                  quantity: item.quantity,
                  price_at_time_of_order: item.price_at_time_of_order.toString(),
                  price_after_applied_promotion: item.price_at_time_of_order.toString(),
                })),
                updated_at: moment(order.order_time).unix() * 1000 || Date.now(),
                tracking_info: order.status === Enum_OrderStatus.PENDING
                  ? Enum_OrderTrackingInfo.ORDER_PLACED
                  : order.status === Enum_OrderStatus.RESTAURANT_ACCEPTED
                  ? Enum_OrderTrackingInfo.RESTAURANT_ACCEPTED
                  : order.status === Enum_OrderStatus.EN_ROUTE
                  ? Enum_OrderTrackingInfo.EN_ROUTE
                  : order.status === Enum_OrderStatus.READY_FOR_PICKUP
                  ? Enum_OrderTrackingInfo.RESTAURANT_PICKUP
                  : Enum_OrderTrackingInfo.ORDER_PLACED,
                driver_id: order.driver_id || null,
                restaurant_id: order.restaurant_id,
                restaurant_avatar: { key: order.restaurant_id, url: order.restaurant_id },
                driver_avatar: order.driver?.avatar
                  ? { key: order.driver.id, url: order.driver.avatar.url }
                  : null,
                restaurantAddress: {
                  id: order.restaurantAddress?.id || "",
                  street: order.restaurantAddress?.street || "",
                  city: order.restaurantAddress?.city || "",
                  nationality: order.restaurantAddress?.nationality || "",
                  is_default: order.restaurantAddress?.is_default || false,
                  created_at: order.restaurantAddress?.created_at || Date.now(),
                  updated_at: order.restaurantAddress?.updated_at || Date.now(),
                  postal_code: order.restaurantAddress?.postal_code || 0,
                  location: order.restaurantAddress?.location || { lat: 0, lng: 0 },
                  title: order.restaurantAddress?.title || "",
                },
                customerAddress: order.customerAddress
                  ? {
                      id: order.customerAddress.id || "",
                      street: order.customerAddress.street || "",
                      city: order.customerAddress.city || "",
                      nationality: order.customerAddress.nationality || "",
                      is_default: order.customerAddress.is_default || false,
                      postal_code: order.customerAddress.postal_code || 0,
                      location: order.customerAddress.location || { lat: 0, lng: 0 },
                      title: order.customerAddress.title || "",
                    }
                  : {
                      id: "",
                      street: "",
                      city: "",
                      nationality: "",
                      is_default: false,
                      postal_code: 0,
                      location: { lat: 0, lng: 0 },
                      title: "",
                    },
              })
            );
          } else {
            dispatch(removeOrderTracking(order.id));
          }
        });
      } else {
        console.error("API error:", response.data.EM);
        Alert.alert("Error", "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Fetch orders error:", error);
      Alert.alert("Error", "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedOrders = async () => {
    try {
      const restaurantId = id ?? "FF_RES_3b6fdece-9449-4192-a5d6-28a24720e927";
      const response = await axiosInstance.get<ApiResponse>(
        `/restaurants/${restaurantId}/orders?limit=50&status=DELIVERED`
      );

      if (response.data.EC === 0) {
        const apiOrders = response.data.data.orders;
        console.log("Fetched completed orders:", apiOrders.length);
        const formattedOrders = apiOrders.map((order) => ({
          orderId: order.id,
          customer_id: order.customer_id,
          total_amount: parseFloat(order.total_amount) || 0,
          status: order.status,
          order_items: order.order_items.map((item) => ({
            item_id: item.item_id,
            variant_id: item.variant_id || "",
            name: item.menu_item?.name || item.name || "Unknown Item",
            quantity: item.quantity,
            price_at_time_of_order: item.price_at_time_of_order.toString(),
            price_after_applied_promotion: item.price_at_time_of_order.toString(),
          })),
          updated_at: moment(order.order_time).unix() * 1000 || Date.now(),
          tracking_info: Enum_OrderTrackingInfo.DELIVERED,
          driver_id: order.driver_id || null,
          restaurant_id: order.restaurant_id,
          restaurant_avatar: { key: order.restaurant_id, url: order.restaurant_id },
          driver_avatar: order.driver?.avatar
            ? { key: order.driver.id, url: order.driver.avatar.url }
            : null,
          restaurantAddress: {
            id: order.restaurantAddress?.id || "",
            street: order.restaurantAddress?.street || "",
            city: order.restaurantAddress?.city || "",
            nationality: order.restaurantAddress?.nationality || "",
            is_default: order.restaurantAddress?.is_default || false,
            created_at: order.restaurantAddress?.created_at || Date.now(),
            updated_at: order.restaurantAddress?.updated_at || Date.now(),
            postal_code: order.restaurantAddress?.postal_code || 0,
            location: order.restaurantAddress?.location || { lat: 0, lng: 0 },
            title: order.restaurantAddress?.title || "",
          },
          customerAddress: order.customerAddress
            ? {
                id: order.customerAddress.id || "",
                street: order.customerAddress.street || "",
                city: order.customerAddress.city || "",
                nationality: order.customerAddress.nationality || "",
                is_default: order.customerAddress.is_default || false,
                postal_code: order.customerAddress.postal_code || 0,
                location: order.customerAddress.location || { lat: 0, lng: 0 },
                title: order.customerAddress.title || "",
              }
            : {
                id: "",
                street: "",
                city: "",
                nationality: "",
                is_default: false,
                postal_code: 0,
                location: { lat: 0, lng: 0 },
                title: "",
              },
        }));
        setCompletedOrders(formattedOrders.filter(item => item.status === Enum_OrderStatus.DELIVERED));
      } else {
        console.error("API error:", response.data.EM);
        Alert.alert("Error", "Failed to fetch completed orders");
      }
    } catch (error) {
      console.error("Fetch completed orders error:", error);
      Alert.alert("Error", "Failed to fetch completed orders");
    }
  };

  const fetchCancelledOrders = async () => {
    try {
      const restaurantId = id ?? "FF_RES_3b6fdece-9449-4192-a5d6-28a24720e927";
      const response = await axiosInstance.get<ApiResponse>(
        `/restaurants/${restaurantId}/orders?limit=50&status=CANCELLED,REJECTED`
      );

      if (response.data.EC === 0) {
        const apiOrders = response.data.data.orders;
        console.log("Fetched cancelled orders:", apiOrders.length);
        const formattedOrders = apiOrders.map((order) => ({
          orderId: order.id,
          customer_id: order.customer_id,
          total_amount: parseFloat(order.total_amount) || 0,
          status: order.status,
          order_items: order.order_items.map((item) => ({
            item_id: item.item_id,
            variant_id: item.variant_id || "",
            name: item.menu_item?.name || item.name || "Unknown Item",
            quantity: item.quantity,
            price_at_time_of_order: item.price_at_time_of_order.toString(),
            price_after_applied_promotion: item.price_at_time_of_order.toString(),
          })),
          updated_at: moment(order.order_time).unix() * 1000 || Date.now(),
          tracking_info: order.status === Enum_OrderStatus.CANCELLED
            ? Enum_OrderTrackingInfo.CANCELLED
            : Enum_OrderTrackingInfo.CANCELLED,
          driver_id: order.driver_id || null,
          restaurant_id: order.restaurant_id,
          restaurant_avatar: { key: order.restaurant_id, url: order.restaurant_id },
          driver_avatar: order.driver?.avatar
            ? { key: order.driver.id, url: order.driver.avatar.url }
            : null,
          restaurantAddress: {
            id: order.restaurantAddress?.id || "",
            street: order.restaurantAddress?.street || "",
            city: order.restaurantAddress?.city || "",
            nationality: order.restaurantAddress?.nationality || "",
            is_default: order.restaurantAddress?.is_default || false,
            created_at: order.restaurantAddress?.created_at || Date.now(),
            updated_at: order.restaurantAddress?.updated_at || Date.now(),
            postal_code: order.restaurantAddress?.postal_code || 0,
            location: order.restaurantAddress?.location || { lat: 0, lng: 0 },
            title: order.restaurantAddress?.title || "",
          },
          customerAddress: order.customerAddress
            ? {
                id: order.customerAddress.id || "",
                street: order.customerAddress.street || "",
                city: order.customerAddress.city || "",
                nationality: order.customerAddress.nationality || "",
                is_default: order.customerAddress.is_default || false,
                postal_code: order.customerAddress.postal_code || 0,
                location: order.customerAddress.location || { lat: 0, lng: 0 },
                title: order.customerAddress.title || "",
              }
            : {
                id: "",
                street: "",
                city: "",
                nationality: "",
                is_default: false,
                postal_code: 0,
                location: { lat: 0, lng: 0 },
                title: "",
              },
        }));
        setCancelledOrders(formattedOrders.filter(item => item.status === Enum_OrderStatus.CANCELLED || item.status === Enum_OrderStatus.REJECTED));
      } else {
        console.error("API error:", response.data.EM);
        Alert.alert("Error", "Failed to fetch cancelled orders");
      }
    } catch (error) {
      console.error("Fetch cancelled orders error:", error);
      Alert.alert("Error", "Failed to fetch cancelled orders");
    }
  };

  useEffect(() => {
    console.log("Loading orders, restaurant_id:", id);
    const initializeOrders = async () => {
      await dispatch(loadOrderTrackingFromAsyncStorage()).unwrap();
      await fetchOrders();
      await fetchCompletedOrders();
      await fetchCancelledOrders();
    };
    initializeOrders();
  }, [id, dispatch]);

  useEffect(() => {
    if (latestOrder) {
      console.log("Latest order from socket:", latestOrder.orderId, "Status:", latestOrder.status);
      // showModal(
      //   `Order #${latestOrder.orderId.slice(-8)} Updated`,
      //   `Status: ${latestOrder.status}`
      // );
    }
  }, [latestOrder, showModal]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await axiosInstance.patch(`/orders/${orderId}/status`, { status: newStatus });
      const order = orders.find((o: Type_PushNotification_Order) => o.orderId === orderId);

      if (order) {
        if ([
          Enum_OrderStatus.PENDING,
          Enum_OrderStatus.RESTAURANT_ACCEPTED,
          Enum_OrderStatus.EN_ROUTE,
          Enum_OrderStatus.READY_FOR_PICKUP,
        ].includes(newStatus as Enum_OrderStatus)) {
          dispatch(
            updateAndSaveOrderTracking({
              ...order,
              status: newStatus as Enum_OrderStatus,
              updated_at: Date.now(),
              tracking_info: newStatus === Enum_OrderStatus.PENDING
                ? Enum_OrderTrackingInfo.ORDER_PLACED
                : newStatus === Enum_OrderStatus.RESTAURANT_ACCEPTED
                ? Enum_OrderTrackingInfo.RESTAURANT_ACCEPTED
                : newStatus === Enum_OrderStatus.EN_ROUTE
                ? Enum_OrderTrackingInfo.EN_ROUTE
                : newStatus === Enum_OrderStatus.READY_FOR_PICKUP
                ? Enum_OrderTrackingInfo.RESTAURANT_PICKUP
                : Enum_OrderTrackingInfo.ORDER_PLACED,
            })
          );
        } else {
          dispatch(removeOrderTracking(orderId));
        }
      }

      if ([Enum_OrderStatus.DELIVERED].includes(newStatus as Enum_OrderStatus)) {
        await fetchCompletedOrders();
      } else if ([Enum_OrderStatus.CANCELLED, Enum_OrderStatus.REJECTED].includes(newStatus as Enum_OrderStatus)) {
        await fetchCancelledOrders();
      }

      showModal("Success", `Order status updated to "${newStatus}"`);
    } catch (error) {
      console.error("Update status error:", error);
      showModal("Error", "Failed to update order status");
    }
  };

  const renderCurrentOrder = ({ item }: { item: Type_PushNotification_Order }) => (
    <OrderCard item={item} onUpdateStatus={updateOrderStatus} showActions={true} />
  );

  const renderCompletedOrder = ({ item }: { item: Type_PushNotification_Order }) => (
    <OrderCard item={item} onUpdateStatus={updateOrderStatus} showActions={false} />
  );

  const renderCancelledOrder = ({ item }: { item: Type_PushNotification_Order }) => (
    <OrderCard item={item} onUpdateStatus={updateOrderStatus} showActions={false} />
  );

  const CurrentOrders = () => {
    const currentOrders = orders.filter((order: Type_PushNotification_Order) =>
      [
        Enum_OrderStatus.PENDING,
        Enum_OrderStatus.RESTAURANT_ACCEPTED,
        Enum_OrderStatus.EN_ROUTE,
        Enum_OrderStatus.READY_FOR_PICKUP,
      ].includes(order.status)
    );
    console.log("Current orders:", currentOrders.map((o) => ({ id: o.orderId, status: o.status })));
    return (
      <FlatList
        data={currentOrders}
        renderItem={renderCurrentOrder}
        keyExtractor={(item: Type_PushNotification_Order) => item.orderId}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <FFView style={styles.emptyContainer}>
            <FFText style={styles.emptyText}>No current orders</FFText>
          </FFView>
        )}
      />
    );
  };

  const CompletedOrders = () => {
    console.log("Completed orders:", completedOrders.map((o) => ({ id: o.orderId, status: o.status })));
    return (
      <FlatList
        data={completedOrders}
        renderItem={renderCompletedOrder}
        keyExtractor={(item: Type_PushNotification_Order) => item.orderId}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <FFView style={styles.emptyContainer}>
            <FFText style={styles.emptyText}>No completed orders</FFText>
          </FFView>
        )}
      />
    );
  };

  const CancelledOrders = () => {
    console.log("Cancelled orders:", cancelledOrders.map((o) => ({ id: o.orderId, status: o.status })));
    return (
      <FlatList
        data={cancelledOrders}
        renderItem={renderCancelledOrder}
        keyExtractor={(item: Type_PushNotification_Order) => item.orderId}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <FFView style={styles.emptyContainer}>
            <FFText style={styles.emptyText}>No cancelled orders</FFText>
          </FFView>
        )}
      />
    );
  };

  const renderScene = SceneMap({
    current: CurrentOrders,
    completed: CompletedOrders,
    cancelled: CancelledOrders,
  });

  const [routes] = useState([
    { key: "current", title: "Current" },
    { key: "completed", title: "Completed" },
    { key: "cancelled", title: "Cancelled" },
  ]);

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
      style={{width: '100%'}}
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            style={styles.tabBar}
            activeColor={colors.primary}
            inactiveColor={colors.textSecondary}
            indicatorStyle={styles.tabIndicator}
            tabStyle={styles.tab}
            scrollEnabled
            // ={styles.tabLabel}
          />
        )}
      />
      <FFModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      >
        <FFView style={styles.toastModal}>
          <FFText style={styles.toastText}>{modalMessage.title}</FFText>
          <FFText style={styles.toastText}>{modalMessage.subtitle}</FFText>
        </FFView>
      </FFModal>
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
    fontSize: typography.fontSize.sm,
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
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  tabBar: {
    backgroundColor: colors.background,
    width: '100%',
    ...shadows.xs,
  },
  tab: {
    // width: "auto",
    paddingHorizontal: spacing.sm,
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
  toastModal: {
    padding: spacing.md,
    backgroundColor: colors.success,
    borderRadius: borderRadius.sm,
    alignItems: "center",
  },
  toastText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
});