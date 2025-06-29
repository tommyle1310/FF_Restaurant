import FFText from "@/src/components/FFText";
import FFView from "@/src/components/FFView";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFModal from "@/src/components/FFModal";
import React, { useState, useEffect, useCallback } from "react";
import {
  FlatList,
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
import {
  colors,
  spacing,
  typography,
  shadows,
  borderRadius,
} from "@/src/theme";
import {
  Enum_OrderStatus,
  Type_PushNotification_Order,
  Enum_OrderTrackingInfo,
} from "@/src/types/Orders";

import { MaterialIcons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import {
  loadOrderTrackingFromAsyncStorage,
  updateAndSaveOrderTracking,
  cleanupInactiveOrders,
} from "@/src/store/restaurantOrderTrackingSlice";
import { useTheme } from "@/src/hooks/useTheme";
import FFInputControl from "@/src/components/FFInputControl";
import Spinner from "@/src/components/FFSpinner";
import { useSocket } from "@/src/hooks/useSocket";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  formatTimestampToDate,
  formatTimestampToDate2,
} from "@/src/utils/timeConverter";
import FFAvatar from "@/src/components/FFAvatar";

type OrderItem = {
  name: string;
  item_id: string;
  quantity: number;
  variant_id: string;
  price_at_time_of_order: number;
  variant_name?: string;
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
  updated_at?: number;
  total_amount: string;
  total_restaurant_earn: string;
  delivery_fee: string;
  payment_status: string;
  payment_method: string;
  customer_note: string;
  restaurant_note?: string;
  order_items: OrderItem[];
  order_time: string;
  cancellation_reason: string;
  cancellation_title: string;
  cancellation_description: string;
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
    first_name: string;
    last_name: string;
    rating: { average_rating: string };
    vehicle: { color: string; model: string; license_plate: string };
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
  driverInfoContainer: ViewStyle;
  driverRow: ViewStyle;
  driverName: TextStyle;
  ratingContainer: ViewStyle;
  ratingText: TextStyle;
  vehicleText: TextStyle;
  cancellationContainer: ViewStyle;
  cancellationHeader: ViewStyle;
  cancellationHeaderText: TextStyle;
  cancellationItem: ViewStyle;
  cancellationLabel: TextStyle;
  cancellationText: TextStyle;
};

const OrderCard = ({
  item,
  customer_note,
  onUpdateStatus,
  showActions = true,
  handleSubmitReject,
  handleSubmitAccept,
}: {
  item: Type_PushNotification_Order;
  customer_note?: string;
  handleSubmitReject?: (orderId: string) => void;
  handleSubmitAccept?: (orderId: string) => void;
  onUpdateStatus: (orderId: string, status: string) => Promise<void>;
  showActions?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    const statusColors: {
      [key: string]: { backgroundColor: string; textColor: string };
    } = {
      PENDING: {
        backgroundColor: colors.violet_light,
        textColor: colors.violet,
      },
      PREPARING: {
        backgroundColor: "#D0E8FF",
        textColor: colors.info,
      },
      DISPATCHED: {
        backgroundColor: "#FFE8B2",
        textColor: colors.warning,
      },
      READY_FOR_PICKUP: {
        backgroundColor: colors.beige_light,
        textColor: "#9E7E38",
      },
      RESTAURANT_PICKUP: {
        backgroundColor: colors.green_muted,
        textColor: colors.primary,
      },
      EN_ROUTE: {
        backgroundColor: "#D1FADF",
        textColor: colors.primary_dark,
      },
      DELIVERED: {
        backgroundColor: "#EBF9EF",
        textColor: "#2E7D32",
      },
      CANCELLED: {
        backgroundColor: colors.lightGrey,
        textColor: colors.grey,
      },
      REJECTED: {
        backgroundColor: "#FFD6D6",
        textColor: colors.error,
      },
    };

    return (
      statusColors[status] || {
        backgroundColor: colors.lightGrey,
        textColor: colors.grey,
      }
    );
  };

  const handleActionPress = (e: any, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <FFView onPress={() => setIsExpanded(!isExpanded)} style={styles.orderCard}>
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
                {formatTimestampToDate2(item?.updated_at ?? Date.now())}
              </FFText>
              <FFView
                style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(item.status).backgroundColor,
                }}
              >
                <FFText
                  style={{
                    ...styles.statusText,
                    color: getStatusColor(item.status).textColor,
                  }}
                >
                  {item.status}
                </FFText>
              </FFView>
            </View>
          </FFView>
        </FFView>

        <FFView style={styles.itemsList}>
          {item.order_items.map((orderItem, index) => (
          <View key={index} style={{alignItems: 'center', gap: spacing.sm, flexDirection: 'row'}}>
            <FFAvatar size={40} avatar={orderItem?.menu_item?.avatar?.url} />
              <FFText  style={styles.orderItem}>
              {orderItem.quantity} x {orderItem.name}
              {orderItem.variant_id && (
                <FFText style={styles.variantText}>
                  {" "}
                  (Variant: {orderItem.variant_name || "N/A"})
                </FFText>
              )}
            </FFText>
          </View>
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
              handleActionPress(e, () => {
                handleSubmitReject && handleSubmitReject(item.orderId);
              })
            }
          >
            <FFText style={{ color: colors.error }}>Reject</FFText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButtonContainer}
            onPress={(e) =>
              handleActionPress(e, () => {
                handleSubmitAccept && handleSubmitAccept(item.orderId);
              })
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
              <FFText style={styles.sectionLabel}>Restaurant Earn:</FFText>
              <FFText style={styles.detailText}>
                ${item.total_restaurant_earn.toFixed(2)}
              </FFText>
              {item.customer_note && (
                <>
                  <FFText style={styles.sectionLabel}>Customer Note:</FFText>
                  <FFText style={styles.detailText}>
                    {item.customer_note}
                  </FFText>
                </>
              )}
              {(item.driverDetails || item.driver) &&
                (() => {
                  const driverInfo = item.driverDetails || item.driver;
                  const vehicle =
                    item.driverDetails?.vehicle || item.driver?.vehicle;

                  return (
                    <FFView style={styles.driverInfoContainer}>
                      <FFView style={styles.driverRow}>
                        <FFAvatar
                          size={40}
                          avatar={
                            item?.driverDetails?.avatar?.url ||
                            item?.driver?.avatar?.url
                          }
                        />
                        <FFText style={styles.driverName}>
                          {driverInfo?.first_name || ""}{" "}
                          {driverInfo?.last_name || ""}
                        </FFText>
                        <FFView style={styles.ratingContainer}>
                          <FFText style={styles.ratingText}>
                            ⭐ {driverInfo?.rating?.average_rating || "5.0"}
                          </FFText>
                        </FFView>
                      </FFView>
                      {vehicle && (
                        <FFText style={styles.vehicleText}>
                          {vehicle.color} {vehicle.model}
                          {vehicle.license_plate &&
                            ` • ${vehicle.license_plate}`}
                        </FFText>
                      )}
                    </FFView>
                  );
                })()}
              {(item.cancellation_title ||
                item.cancellation_reason ||
                item.cancellation_description) &&
                (() => {
                  return (
                    <FFView style={styles.cancellationContainer}>
                      <View style={styles.cancellationHeader}>
                        <FFText style={styles.cancellationHeaderText}>
                          Cancellation Details
                        </FFText>
                      </View>

                      {item.cancellation_title && (
                        <View style={styles.cancellationItem}>
                          <FFText style={styles.cancellationLabel}>
                            Title:
                          </FFText>
                          <FFText style={styles.cancellationText}>
                            {item.cancellation_title}
                          </FFText>
                        </View>
                      )}

                      {item.cancellation_reason && (
                        <View style={styles.cancellationItem}>
                          <FFText style={styles.cancellationLabel}>
                            Reason:
                          </FFText>
                          <FFText style={styles.cancellationText}>
                            {item.cancellation_reason}
                          </FFText>
                        </View>
                      )}

                      {item.cancellation_description && (
                        <View style={styles.cancellationItem}>
                          <FFText style={styles.cancellationLabel}>
                            Description:
                          </FFText>
                          <FFText style={styles.cancellationText}>
                            {item.cancellation_description}
                          </FFText>
                        </View>
                      )}
                    </FFView>
                  );
                })()}
            </FFView>
          </FFView>
        </View>
      )}

      {showActions &&
        isExpanded &&
        item.status === Enum_OrderStatus.PREPARING && (
          <TouchableOpacity
            style={[styles.updateButtonContainer, { marginTop: spacing.md }]}
            onPress={(e) =>
              handleActionPress(e, () =>
                onUpdateStatus(item.orderId, Enum_OrderStatus.READY_FOR_PICKUP)
              )
            }
          >
            <FFText style={{ color: colors.white }}>
              Mark as Ready for Pickup
            </FFText>
          </TouchableOpacity>
        )}
    </FFView>
  );
};

export default function OrderScreen() {
  const layout = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: "", subtitle: "" });
  const [selectedCancelledOrderId, setSelectedCancelledOrderId] = useState<
    string | null
  >(null);
  const [selectedAcceptOrderId, setSelectedAcceptOrderId] = useState<
    string | null
  >(null);
  const [completedOrders, setCompletedOrders] = useState<
    Type_PushNotification_Order[]
  >([]);
  const [cancelledOrders, setCancelledOrders] = useState<
    Type_PushNotification_Order[]
  >([]);
  const { theme } = useTheme();
  const [reason, setReason] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);

  const { id: restaurantId, restaurant_id } = useSelector(
    (state: RootState) => state.auth
  );
  const orders = useSelector(
    (state: RootState) => state.restaurantOrderTracking.orders
  );

  const dispatch = useDispatch();

  const { socket, latestOrder } = useSocket(
    restaurantId ?? "",
    setCompletedOrders,
    undefined
  );

  const showModal = useCallback((title: string, subtitle: string) => {
    setModalMessage({ title, subtitle });
    setModalVisible(true);
    const timeout = setTimeout(() => {
      setModalVisible(false);
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  // FIXED: Current Orders now uses Redux data only, no API calls
  const fetchOrders = useCallback(async () => {
    console.log(
      "✅ Current Orders using Redux data only - no API fetch needed"
    );
    setLoading(false);
  }, []);

  const fetchCompletedOrders = useCallback(async () => {
    try {
      const response = await axiosInstance.get<ApiResponse>(
        `/restaurants/${restaurantId}/orders?limit=50&status=DELIVERED`
      );

      if (response.data.EC === 0) {
        const apiOrders = response.data.data.orders;
        const formattedOrders = apiOrders.map((order) => ({
          orderId: order.id,
          customer_id: order.customer_id,
          total_amount: parseFloat(order.total_amount) || 0,
          total_restaurant_earn: parseFloat(order.total_restaurant_earn) || 0,
          status: order.status,
          customer_note: order.customer_note || "",
          order_items: order.order_items.map((item) => ({
            item_id: item.item_id,
            menu_item: item.menu_item,
            variant_id: item.variant_id || "",
            variant_name: item.menu_item_variant?.variant || "",
            name: item.menu_item?.name || item.name || "Unknown Item",
            quantity: item.quantity,
            price_at_time_of_order: item.price_at_time_of_order.toString(),
            price_after_applied_promotion:
              item.price_at_time_of_order.toString(),
          })),
          updated_at: order.updated_at
            ? typeof order.updated_at === "number"
              ? order.updated_at
              : new Date(order.updated_at).getTime()
            : Date.now(),
          tracking_info: Enum_OrderTrackingInfo.DELIVERED,
          driver_id: order.driver_id || null,
          restaurant_id: order.restaurant_id,
          driver: order?.driver,
          restaurant_avatar: {
            key: order.restaurant_id,
            url: order.restaurant_id,
          },
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
        setCompletedOrders(
          formattedOrders.filter(
            (item) => item.status === Enum_OrderStatus.DELIVERED
          )
        );
      } else {
        console.error("API error:", response.data.EM);
        Alert.alert("Error", "Failed to fetch completed orders");
      }
    } catch (error) {
      console.error("Fetch completed orders error:", error);
      Alert.alert("Error", "Failed to fetch completed orders");
    }
  }, [restaurantId]);

  const fetchCancelledOrders = useCallback(async () => {
    try {
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
          total_restaurant_earn: parseFloat(order.total_restaurant_earn) || 0,
          status: order.status,
          customer_note: order.customer_note || "",
          order_items: order.order_items.map((item) => ({
            item_id: item.item_id,
            variant_id: item.variant_id || "",
            variant_name: item.menu_item_variant?.variant || "",
            name: item.menu_item?.name || item.name || "Unknown Item",
            quantity: item.quantity,
            price_at_time_of_order: item.price_at_time_of_order.toString(),
            price_after_applied_promotion:
              item.price_at_time_of_order.toString(),
          })),
          updated_at: order.updated_at
            ? typeof order.updated_at === "number"
              ? order.updated_at
              : new Date(order.updated_at).getTime()
            : Date.now(),
          tracking_info: Enum_OrderTrackingInfo.CANCELLED,
          cancellation_reason: order.cancellation_reason,
          cancellation_title: order.cancellation_title,
          cancellation_description: order.cancellation_description,
          driver_id: order.driver_id || null,
          restaurant_id: order.restaurant_id,
          restaurant_avatar: {
            key: order.restaurant_id,
            url: order.restaurant_id,
          },
          // driverDetails: order.driverDetails || order
          driver: order?.driver,
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
        setCancelledOrders(
          formattedOrders.filter(
            (item) => item.status === Enum_OrderStatus.CANCELLED
          )
        );
      } else {
        console.error("API error:", response.data.EM);
        Alert.alert("Error", "Failed to fetch cancelled orders");
      }
    } catch (error) {
      console.error("Fetch cancelled orders error:", error);
      Alert.alert("Error", "Failed to fetch cancelled orders");
    }
  }, [restaurantId]);

  useEffect(() => {
    console.log("Loading orders, restaurant_id:", restaurantId);
    const initializeOrders = async () => {
      // Check if we just logged out - if so, skip fetching orders
      const justLoggedOut = await AsyncStorage.getItem("@just_logged_out");
      if (justLoggedOut === "true") {
        console.log("🚫 Skipping order initialization - just logged out");
        // Clear the flag after checking it
        await AsyncStorage.removeItem("@just_logged_out");
        await AsyncStorage.removeItem("@logout_timestamp");
        console.log("🧹 Cleared logout flags after checking");
        return;
      }

      await dispatch(loadOrderTrackingFromAsyncStorage()).unwrap();
      dispatch(cleanupInactiveOrders());
      await fetchOrders();
      await fetchCompletedOrders();
      await fetchCancelledOrders();
    };
    initializeOrders();
  }, [
    restaurantId,
    dispatch,
    fetchOrders,
    fetchCompletedOrders,
    fetchCancelledOrders,
  ]);

  useEffect(() => {
    if (latestOrder) {
      console.log(
        "Latest order received from socket:",
        latestOrder.orderId,
        latestOrder.status
      );
      if (["CANCELLED", "REJECTED"].includes(latestOrder.status)) {
        fetchCancelledOrders();
      } else if (latestOrder.status === Enum_OrderStatus.DELIVERED) {
        fetchCompletedOrders();
      }
    }
  }, [latestOrder, fetchCancelledOrders, fetchCompletedOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setLoading(true);
      await axiosInstance.patch(`/orders/${orderId}/status`, {
        status: newStatus,
      });

      const order = orders.find(
        (o: Type_PushNotification_Order) => o.orderId === orderId
      );

      if (order) {
        dispatch(
          updateAndSaveOrderTracking({
            ...order,
            status: newStatus as Enum_OrderStatus,
            updated_at: Date.now(),
            tracking_info:
              newStatus === Enum_OrderStatus.PENDING
                ? Enum_OrderTrackingInfo.ORDER_PLACED
                : newStatus === Enum_OrderStatus.PREPARING
                ? Enum_OrderTrackingInfo.PREPARING
                : newStatus === Enum_OrderStatus.RESTAURANT_ACCEPTED
                ? Enum_OrderTrackingInfo.RESTAURANT_ACCEPTED
                : newStatus === Enum_OrderStatus.EN_ROUTE
                ? Enum_OrderTrackingInfo.EN_ROUTE
                : newStatus === Enum_OrderStatus.READY_FOR_PICKUP
                ? Enum_OrderTrackingInfo.RESTAURANT_PICKUP
                : newStatus === Enum_OrderStatus.RESTAURANT_PICKUP
                ? Enum_OrderTrackingInfo.RESTAURANT_PICKUP
                : newStatus === Enum_OrderStatus.DELIVERED
                ? Enum_OrderTrackingInfo.DELIVERED
                : Enum_OrderTrackingInfo.CANCELLED,
          })
        );
      }

      if (newStatus === Enum_OrderStatus.DELIVERED) {
        await fetchCompletedOrders();
      } else if (
        [Enum_OrderStatus.CANCELLED, Enum_OrderStatus.REJECTED].includes(
          newStatus as Enum_OrderStatus
        )
      ) {
        await fetchCancelledOrders();
      }
    } catch (error) {
      console.error("Update status error:", error);
      showModal("Error", "Failed to update order status");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAccept = useCallback(
    async (orderId: string) => {
      if (!orderId || !restaurant_id) {
        console.error("Missing orderId or restaurant_id", {
          orderId,
          restaurant_id,
        });
        alert("Invalid order or restaurant information");
        return;
      }

      try {
        setLoading(true);
        const response = await axiosInstance.post(
          `/restaurants/accept-order/${orderId}/${restaurant_id}`
        );
        console.log("Accept order response:", response.data);
        if (response.data.EC === 0) {
          const order = orders.find(
            (o: Type_PushNotification_Order) => o.orderId === orderId
          );
          if (order) {
            console.log(
              "🔍 ACCEPT ORDER: Preserving existing order_items with variant_name:",
              order.order_items.map((item) => ({
                name: item.name,
                variant_name: item.variant_name,
              }))
            );

            dispatch(
              updateAndSaveOrderTracking({
                ...order, // ✅ Preserve ALL existing data including order_items with variant_name
                status: Enum_OrderStatus.PREPARING,
                updated_at: Date.now(),
                tracking_info: Enum_OrderTrackingInfo.PREPARING,
                total_amount: parseFloat(response.data.data.total_amount) || 0,
                // ✅ Keep existing order_items - don't rebuild from API response
                // order_items: order.order_items, // Already preserved by ...order spread
              })
            );

            console.log(
              "✅ ACCEPT ORDER: Preserved order_items with variant_name:",
              order.order_items.map((item) => ({
                name: item.name,
                variant_name: item.variant_name,
              }))
            );
          }
          setSelectedAcceptOrderId(null);
          await fetchOrders();
        } else {
          throw new Error(response.data.EM || "Failed to accept order");
        }
      } catch (error) {
        console.error("Error accepting order:", error);
        alert("Failed to accept order");
      } finally {
        setLoading(false);
      }
    },
    [restaurant_id, orders, dispatch, showModal, fetchOrders]
  );

  const handleSubmitReject = useCallback(async () => {
    if (!selectedCancelledOrderId) {
      console.error("No order ID selected for cancellation");
      alert("No order selected");
      return;
    }

    if (!reason || !title || !description) {
      console.error("All cancellation fields are required");
      alert("Please fill in all fields");
      return;
    }

    const requestBody = {
      cancelled_by: "restaurant" as const,
      cancelled_by_id: restaurant_id,
      reason,
      title,
      description,
    };

    try {
      setLoading(true);
      const response = await axiosInstance.post(
        `/orders/${selectedCancelledOrderId}/cancel`,
        requestBody
      );
      console.log("Reject order response:", response.data);
      if (response.data.EC === 0) {
        setIsRejectModalVisible(false);
        setReason("");
        setTitle("");
        setDescription("");
        setSelectedCancelledOrderId(null);
        await fetchCancelledOrders();
      }
    } catch (error) {
      console.error("Error rejecting order:", error);
      alert("Failed to reject order");
    } finally {
      setLoading(false);
    }
  }, [
    restaurant_id,
    reason,
    title,
    description,
    selectedCancelledOrderId,
    fetchCancelledOrders,
    showModal,
  ]);

  const renderCurrentOrder = ({
    item,
  }: {
    item: Type_PushNotification_Order;
  }) => (
    <OrderCard
      item={item}
      onUpdateStatus={updateOrderStatus}
      showActions={true}
      handleSubmitReject={(orderId: string) => {
        setSelectedCancelledOrderId(orderId);
        setIsRejectModalVisible(true);
      }}
      handleSubmitAccept={(orderId: string) => {
        setSelectedAcceptOrderId(orderId);
        handleSubmitAccept(orderId);
      }}
    />
  );

  const renderCompletedOrder = ({
    item,
  }: {
    item: Type_PushNotification_Order;
  }) => (
    <OrderCard
      item={item}
      onUpdateStatus={updateOrderStatus}
      showActions={false}
    />
  );

  const renderCancelledOrder = ({
    item,
  }: {
    item: Type_PushNotification_Order;
  }) => (
    <OrderCard
      item={item}
      onUpdateStatus={updateOrderStatus}
      showActions={false}
    />
  );

  const CurrentOrders = () => {
    const currentOrders = orders.filter((order: Type_PushNotification_Order) =>
      [
        Enum_OrderStatus.PENDING,
        Enum_OrderStatus.RESTAURANT_ACCEPTED,
        Enum_OrderStatus.PREPARING,
        Enum_OrderStatus.READY_FOR_PICKUP,
        Enum_OrderStatus.DISPATCHED,
        Enum_OrderStatus.RESTAURANT_PICKUP,
        Enum_OrderStatus.EN_ROUTE,
      ].includes(order.status)
    );

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
    const filteredCompletedOrders = completedOrders.filter(
      (order: Type_PushNotification_Order) =>
        order.status === Enum_OrderStatus.DELIVERED
    );
    return (
      <FlatList
        data={filteredCompletedOrders}
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
    const filteredCancelledOrders = cancelledOrders.filter(
      (order: Type_PushNotification_Order) =>
        [Enum_OrderStatus.CANCELLED, Enum_OrderStatus.REJECTED].includes(
          order.status
        )
    );
    return (
      <FlatList
        data={filteredCancelledOrders}
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

  const handleIndexChange = async (newIndex: number) => {
    setIndex(newIndex);
    if (routes[newIndex].key === "completed") {
      await fetchCompletedOrders();
    } else if (routes[newIndex].key === "cancelled") {
      await fetchCancelledOrders();
    }
  };

  if (loading) return <Spinner isVisible isOverlay />;
  return (
    <FFSafeAreaView style={styles.container}>
      <TabView
        style={{ width: "100%" }}
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={handleIndexChange}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            style={{
              ...styles.tabBar,
              backgroundColor: theme === "light" ? colors.white : colors.black,
            }}
            activeColor={colors.primary}
            inactiveColor={colors.textSecondary}
            indicatorStyle={styles.tabIndicator}
            tabStyle={styles.tab}
            scrollEnabled
          />
        )}
      />
      <FFModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <FFView style={styles.toastModal}>
          <FFText style={styles.toastText}>{modalMessage.title}</FFText>
          <FFText style={styles.toastText}>{modalMessage.subtitle}</FFText>
        </FFView>
      </FFModal>
      <FFModal
        visible={isRejectModalVisible}
        onClose={() => {
          setIsRejectModalVisible(false);
          setReason("");
          setTitle("");
          setDescription("");
          setSelectedCancelledOrderId(null);
        }}
      >
        <FFText
          style={{
            fontSize: typography.fontSize.lg,
            fontFamily: typography.fontFamily.bold,
            marginBottom: spacing.md,
          }}
        >
          Reject Order
        </FFText>
        <FFInputControl
          label="Reason"
          value={reason}
          setValue={(value) => setReason(value)}
          placeholder="Enter reason for cancellation"
        />
        <FFInputControl
          label="Title"
          value={title}
          setValue={(value) => setTitle(value)}
          placeholder="Enter cancellation title"
        />
        <FFInputControl
          label="Description"
          value={description}
          setValue={(value) => setDescription(value)}
          placeholder="Enter detailed description"
        />
        <TouchableOpacity
          style={{
            backgroundColor: "#63c550",
            padding: spacing.md,
            borderRadius: 8,
            alignItems: "center",
            marginTop: spacing.md,
          }}
          onPress={handleSubmitReject}
        >
          <FFText
            style={{
              color: "#fff",
              fontSize: typography.fontSize.md,
              fontFamily: typography.fontFamily.medium,
            }}
          >
            Submit
          </FFText>
        </TouchableOpacity>
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
    width: "100%",
    ...shadows.xs,
  },
  tab: {
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
    borderRadius: spacing.md,
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
  driverInfoContainer: {
    marginTop: spacing.md,
    // backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
  },
  driverRow: {
    flexDirection: "row",
    // justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  driverName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text,
  },
  ratingContainer: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.badge,
  },
  ratingText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
  },
  vehicleText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
  },
  cancellationContainer: {
    marginTop: spacing.md,
    backgroundColor: "#FFF5F5", // Light red background
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "#FED7D7", // Light red border
    padding: spacing.md,
    ...shadows.xs,
  },
  cancellationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: "#FED7D7",
  },
  cancellationHeaderText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.error,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cancellationItem: {
    marginBottom: spacing.sm,
  },
  cancellationLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  cancellationText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text,
    lineHeight: typography.lineHeight.sm,
    backgroundColor: colors.white,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: "#FED7D7",
  },
});
