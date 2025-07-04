import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import { BACKEND_URL } from "@/src/utils/constants";
import {
  Type_PushNotification_Order,
  Enum_OrderStatus,
  Enum_OrderTrackingInfo,
} from "@/src/types/Orders";
import {
  updateAndSaveOrderTracking,
  removeOrderTracking,
} from "@/src/store/restaurantOrderTrackingSlice";

// Global socket instance to prevent multiple connections
let globalSocket: Socket | null = null;
let globalSocketConnecting = false;

export const useSocket = (
  restaurantId: string,
  setOrders?: React.Dispatch<
    React.SetStateAction<Type_PushNotification_Order[]>
  >,
  sendPushNotification?: (
    order: Type_PushNotification_Order,
    expoPushToken?: { data: string }
  ) => void
) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [latestOrder, setLatestOrder] =
    useState<Type_PushNotification_Order | null>(null);
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const existingOrders = useSelector(
    (state: RootState) => state.restaurantOrderTracking.orders
  );
  const dispatch = useDispatch();

  // Restore all the missing refs
  const [isConnected, setIsConnected] = useState(false);
  const eventQueueRef = useRef<{ event: string; data: any; id: string }[]>([]);
  const processedEventIds = useRef<Map<string, number>>(new Map());
  const isProcessingRef = useRef(false);
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isReconnectingRef = useRef(false);
  const isConnectingRef = useRef(false);
  const maxReconnectAttempts = 10;

  // Ref to store latest orders for socket handlers
  const latestOrdersRef = useRef(existingOrders);

  // Update ref whenever existingOrders changes
  useEffect(() => {
    latestOrdersRef.current = existingOrders;
  }, [existingOrders]);

  const areOrdersEqual = useCallback(
    (
      newOrder: Type_PushNotification_Order,
      currentOrder: Type_PushNotification_Order | null
    ) => {
      if (!currentOrder) return false;
      return (
        newOrder.orderId === currentOrder.orderId &&
        newOrder.status === currentOrder.status &&
        newOrder.total_amount === currentOrder.total_amount &&
        JSON.stringify(newOrder.order_items) ===
          JSON.stringify(currentOrder.order_items) &&
        newOrder.updated_at === currentOrder.updated_at
      );
    },
    []
  );

  const resetResponseTimeout = () => {
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
    }
    responseTimeoutRef.current = setTimeout(() => {
      console.log("Response timeout, resetting isProcessing");
      isProcessingRef.current = false;
      if (eventQueueRef.current.length > 0) {
        console.warn(
          "Queue not empty after timeout, remaining events:",
          eventQueueRef.current.length
        );
        processEventQueue();
      }
    }, 5000);
  };

  const attemptReconnection = useCallback(() => {
    if (isReconnectingRef.current) {
      console.log("Reconnection already in progress, skipping...");
      return;
    }

    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      setSocket(null);
      setIsConnected(false);
      isReconnectingRef.current = false;
      return;
    }

    isReconnectingRef.current = true;
    reconnectAttemptsRef.current += 1;
    const delay = Math.min(
      1000 * Math.pow(2, reconnectAttemptsRef.current - 1),
      10000
    );

    console.log(
      `Attempting manual reconnection ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${delay}ms`
    );

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      if (!accessToken) {
        console.log("No access token for reconnection");
        isReconnectingRef.current = false;
        return;
      }

      console.log("Creating new socket connection...");
      const newSocket = createSocketConnection();
      // Socket events are set up in the main useEffect
      isReconnectingRef.current = false;
    }, delay);
  }, [accessToken]);

  const createSocketConnection = useCallback(() => {
    if (!accessToken) {
      console.log("No access token available for socket connection");
      return null;
    }

    console.log("Creating socket connection...");
    const socketInstance = io(`${BACKEND_URL}/restaurant`, {
      transports: ["websocket", "polling"],
      extraHeaders: {
        auth: `Bearer ${accessToken}`,
      },
      reconnection: false, // Disable automatic reconnection, we'll handle it manually
      autoConnect: true,
      withCredentials: true,
      timeout: 20000,
      forceNew: true, // Force new connection
    });

    return socketInstance;
  }, [accessToken]);

  const buildPushNotificationOrder = useCallback(
    (response: any): Type_PushNotification_Order => {
      if (!response || typeof response !== "object") {
        throw new Error("Invalid or missing response data");
      }

      console.log(
        "Building order from response:",
        JSON.stringify(response, null, 2)
      );

      const totalAmount = Number(response.total_amount) || 0;
      const orderItems = Array.isArray(response.order_items)
        ? response.order_items
        : [];

      const order: Type_PushNotification_Order = {
        orderId: response.orderId ?? response.id ?? "",
        customer_id: response.customer_id ?? "",
        total_amount: isNaN(totalAmount) ? 0 : totalAmount,
        total_restaurant_earn: Number(response.total_restaurant_earn) || 0,
        status: response.status ?? Enum_OrderStatus.PENDING,
        customer_note: response.customer_note ?? "",
        order_items: orderItems.map((item: any, index: number) => {
          if (!item || typeof item !== "object") {
            throw new Error(`Invalid order item at index ${index}`);
          }
          return {
            item_id: item.item_id ?? "",
            variant_id: item.variant_id ?? "",
            name: item.name ?? item.menu_item?.name ?? "Unknown Item",
            quantity: Number(item.quantity ?? 0),
            price_at_time_of_order:
              item.price_at_time_of_order?.toString() ?? "0",
            price_after_applied_promotion:
              item.price_after_applied_promotion?.toString() ?? "0",
            variant_name:
              item.variant_name ?? item.menu_item_variant?.variant ?? "",
          };
        }),
        updated_at: response.updated_at ?? Date.now(),
        tracking_info:
          response.status === Enum_OrderStatus.PENDING
            ? Enum_OrderTrackingInfo.ORDER_PLACED
            : response.status === Enum_OrderStatus.PREPARING
            ? Enum_OrderTrackingInfo.PREPARING
            : response.status === Enum_OrderStatus.RESTAURANT_ACCEPTED
            ? Enum_OrderTrackingInfo.RESTAURANT_ACCEPTED
            : response.status === Enum_OrderStatus.EN_ROUTE
            ? Enum_OrderTrackingInfo.EN_ROUTE
            : response.status === Enum_OrderStatus.READY_FOR_PICKUP
            ? Enum_OrderTrackingInfo.RESTAURANT_PICKUP
            : response.status === Enum_OrderStatus.RESTAURANT_PICKUP
            ? Enum_OrderTrackingInfo.RESTAURANT_PICKUP
            : response.status === Enum_OrderStatus.DELIVERED
            ? Enum_OrderTrackingInfo.DELIVERED
            : Enum_OrderTrackingInfo.CANCELLED,
        driver_id: response.driver_id ?? null,
        restaurant_id: response.restaurant_id ?? restaurantId,
        restaurant_avatar: response.restaurant_avatar ?? { key: "", url: "" },
        driver_avatar: response.driver_avatar ?? null,
        restaurantAddress: response.restaurantAddress ?? {
          id: "",
          street: "",
          city: "",
          nationality: "",
          is_default: false,
          created_at: Date.now(),
          updated_at: Date.now(),
          postal_code: 0,
          location: { lat: 0, lng: 0 },
          title: "",
        },
        customerAddress: response.customerAddress ?? {
          id: "",
          street: "",
          city: "",
          nationality: "",
          is_default: false,
          created_at: Date.now(),
          updated_at: Date.now(),
          postal_code: 0,
          location: { lat: 0, lng: 0 },
          title: "",
        },
        driverDetails: response.driverDetails ?? null,
      };

      console.log(`Constructed order:`, JSON.stringify(order, null, 2));
      return order;
    },
    [restaurantId]
  );

  const processEventQueue = useCallback(() => {
    if (isProcessingRef.current || eventQueueRef.current.length === 0) return;

    isProcessingRef.current = true;
    const { event, data, id } = eventQueueRef.current.shift()!;

    console.log(
      `Processing event: ${event}, ID: ${id}, Queue remaining: ${eventQueueRef.current.length}`
    );

    const eventKey = `${data.orderId ?? data.id ?? "unknown"}`;
    const lastUpdatedAt = processedEventIds.current.get(eventKey);

    if (lastUpdatedAt && lastUpdatedAt >= (data.updated_at ?? Date.now())) {
      console.log(
        `Skipping duplicate event (${event}) - same or older timestamp:`,
        id
      );
      isProcessingRef.current = false;
      processEventQueue();
      return;
    }

    processedEventIds.current.set(eventKey, data.updated_at ?? Date.now());

    try {
      let order;

      if (event === "notifyOrderStatus") {
        console.log("=== NOTIFY ORDER STATUS DEBUG ===");
        console.log("Existing orders in Redux:", existingOrders.length);
        console.log("Looking for orderId:", data.orderId ?? data.id);

        const existingOrder = existingOrders.find(
          (o) => o.orderId === (data.orderId ?? data.id)
        );

        if (existingOrder) {
          console.log("FOUND existing order in Redux:");
          console.log("- Order ID:", existingOrder.orderId);
          console.log("- Order items count:", existingOrder.order_items.length);
          console.log("- Total amount:", existingOrder.total_amount);
          console.log("- Current status:", existingOrder.status);
          console.log("- New status:", data.status);

          order = {
            ...existingOrder,
            status: data.status ?? existingOrder.status,
            tracking_info: data.tracking_info ?? existingOrder.tracking_info,
            updated_at: data.updated_at ?? Date.now(),
            ...(data.driverDetails && {
              driverDetails: {
                ...existingOrder.driverDetails,
                ...data.driverDetails,
              },
            }),
            ...(data.driver_id && { driver_id: data.driver_id }),
          };

          console.log("PRESERVED order data:");
          console.log("- Order items count:", order.order_items.length);
          console.log("- Total amount:", order.total_amount);
          console.log("- Customer note:", order.customer_note);
          console.log(
            "- Driver details:",
            order.driverDetails ? "Present" : "None"
          );
        } else {
          console.log("ERROR: No existing order found in Redux!");
          console.log(
            "Available order IDs in Redux:",
            existingOrders.map((o) => o.orderId)
          );
          console.log(
            "❌ SKIPPING: No existing order found for notifyOrderStatus - cannot update"
          );
          isProcessingRef.current = false;
          processEventQueue();
          return;
        }
        console.log("=== END NOTIFY ORDER STATUS DEBUG ===");
      } else {
        console.log("=== INCOMING ORDER DEBUG ===");
        order = buildPushNotificationOrder(data);
        console.log("Built new order for incoming order");
        console.log("New order items count:", order.order_items.length);
        console.log("=== END INCOMING ORDER DEBUG ===");
      }

      if (!order.orderId) {
        throw new Error("Missing orderId in constructed data");
      }

      console.log(`Processed ${event}:`, order.orderId, {
        total_amount: order.total_amount,
        order_items: order.order_items,
        updated_at: order.updated_at,
      });

      if (
        [
          Enum_OrderStatus.CANCELLED,
          Enum_OrderStatus.REJECTED,
          Enum_OrderStatus.DELIVERED,
        ].includes(order.status)
      ) {
        console.log(
          `Order ${order.orderId} is ${order.status}, removing from active orders`
        );
        dispatch(removeOrderTracking(order.orderId));
        if (setOrders) {
          setOrders((prev) => {
            const exists = prev.some((o) => o.orderId === order.orderId);
            if (exists) {
              return prev.map((o) => (o.orderId === order.orderId ? order : o));
            }
            return [...prev, order];
          });
        }
        if (sendPushNotification) {
          console.log("Calling sendPushNotification for completed order:", order.orderId);
          sendPushNotification(order);
        }
      } else {
        dispatch(updateAndSaveOrderTracking(order));
        setLatestOrder(order);

        if (setOrders) {
          setOrders((prev) => {
            const exists = prev.some((o) => o.orderId === order.orderId);
            if (exists) {
              return prev.map((o) => (o.orderId === order.orderId ? order : o));
            }
            return [...prev, order];
          });
        }

        if (sendPushNotification) {
          console.log("Calling sendPushNotification for new order:", order.orderId);
          sendPushNotification(order);
        }
      }
    } catch (error) {
      console.error(`Error processing ${event}:`, error);
    }

    isProcessingRef.current = false;
    processEventQueue();
  }, [
    dispatch,
    setOrders,
    sendPushNotification,
    existingOrders,
    buildPushNotificationOrder,
  ]);

  useEffect(() => {
    if (!accessToken || !restaurantId) {
      console.log("No access token or restaurantId available");
      return;
    }

    if (globalSocket && globalSocket.connected) {
      console.log("Using existing socket connection:", globalSocket.id);
      setSocket(globalSocket);
      setIsConnected(true);
      return;
    }

    if (globalSocketConnecting) {
      console.log("Socket connection already in progress, waiting...");
      return;
    }

    globalSocketConnecting = true;
    console.log("Creating new socket connection for restaurant:", restaurantId);

    const socketInstance = io(`${BACKEND_URL}/restaurant`, {
      transports: ["websocket", "polling"],
      extraHeaders: {
        auth: `Bearer ${accessToken}`,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      autoConnect: true,
      withCredentials: true,
      timeout: 10000,
    });

    globalSocket = socketInstance;
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("✅ Connected to restaurant server, ID:", socketInstance.id);
      globalSocketConnecting = false;
      setIsConnected(true);
      reconnectAttemptsRef.current = 0; // Reset reconnect attempts
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("❌ Disconnected:", reason);
      globalSocket = null;
      globalSocketConnecting = false;
      setSocket(null);
      setIsConnected(false);
      attemptReconnection();
    });

    socketInstance.on("connect_error", (error) => {
      console.error("❌ Connection error:", error);
      globalSocketConnecting = false;
      attemptReconnection();
    });

    socketInstance.on("incomingOrderForRestaurant", async (response) => {
      console.log("📥 New order received:", response.orderId || response.id);

      const justLoggedOut = await AsyncStorage.getItem("@just_logged_out");
      if (justLoggedOut === "true") {
        console.log("🚫 Ignoring socket order - just logged out");
        return;
      }

      const order = buildPushNotificationOrder(response);
      dispatch(updateAndSaveOrderTracking(order));
      setLatestOrder(order);

      if (setOrders) {
        setOrders((prev) => {
          const exists = prev.some((o) => o.orderId === order.orderId);
          if (exists) {
            return prev.map((o) => (o.orderId === order.orderId ? order : o));
          }
          return [...prev, order];
        });
      }

      if (sendPushNotification) {
        console.log("Calling sendPushNotification for incoming order:", order.orderId);
        sendPushNotification(order);
      }
    });

    socketInstance.on("notifyOrderStatus", async (response) => {
      console.log(
        "📝 Order status update:",
        response.orderId,
        "->",
        response.status
      );

      const justLoggedOut = await AsyncStorage.getItem("@just_logged_out");
      if (justLoggedOut === "true") {
        console.log("🚫 Ignoring socket status update - just logged out");
        return;
      }

      const currentOrders = latestOrdersRef.current;
      console.log("🔍 Looking for order:", response.orderId ?? response.id);
      console.log(
        "🔍 Available orders:",
        currentOrders.map((o) => o.orderId)
      );
      const existingOrder = currentOrders.find(
        (o) => o.orderId === (response.orderId ?? response.id)
      );
      console.log("🔍 Found existing order:", !!existingOrder);

      if (existingOrder) {
        console.log(
          "✅ Updating existing order status:",
          existingOrder.status,
          "->",
          response.status
        );
        console.log(
          "🔍 Preserving existing order_items with variant_name:",
          existingOrder.order_items.map((item: any) => ({
            name: item.name,
            variant_name: item.variant_name,
          }))
        );

        const updatedOrder = {
          ...existingOrder,
          status: response.status ?? existingOrder.status,
          tracking_info: response.tracking_info ?? existingOrder.tracking_info,
          updated_at: response.updated_at ?? Date.now(),
          ...(response.driverDetails && {
            driverDetails: response.driverDetails,
          }),
          ...(response.driver_id && { driver_id: response.driver_id }),
        };

        console.log(
          "✅ Updated order_items preserved:",
          updatedOrder.order_items.map((item: any) => ({
            name: item.name,
            variant_name: item.variant_name,
          }))
        );

        dispatch(updateAndSaveOrderTracking(updatedOrder));
        setLatestOrder(updatedOrder);

        if (setOrders) {
          setOrders((prev) =>
            prev.map((o) =>
              o.orderId === updatedOrder.orderId ? updatedOrder : o
            )
          );
        }

        if (sendPushNotification) {
          console.log("Calling sendPushNotification for status update:", updatedOrder.orderId);
          sendPushNotification(updatedOrder);
        }
      } else {
        console.log(
          "❌ Order not found in existingOrders, cannot update status"
        );
      }
    });

    return () => {
      console.log("🔌 Disconnecting socket...");
      if (socketInstance) {
        socketInstance.disconnect();
        globalSocket = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [accessToken, restaurantId, sendPushNotification]);

  return {
    socket,
    latestOrder,
  };
};