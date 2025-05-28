import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useDispatch, useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import { BACKEND_URL } from "@/src/utils/constants";
import { Type_PushNotification_Order, Enum_OrderTrackingInfo } from "@/src/types/Orders";
import { updateAndSaveOrderTracking } from "@/src/store/restaurantOrderTrackingSlice";

export const useSocket = (
  restaurantId: string,
  setOrders?: React.Dispatch<React.SetStateAction<Type_PushNotification_Order[]>>,
  sendPushNotification?: (order: Type_PushNotification_Order, expoPushToken?: { data: string }) => void
) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [latestOrder, setLatestOrder] = useState<Type_PushNotification_Order | null>(null);
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const eventQueueRef = useRef<{ event: string; data: any; id: string }[]>([]);
  const processedEventIds = useRef<Map<string, number>>(new Map());
  const isProcessingRef = useRef(false);
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const areOrdersEqual = useCallback(
    (newOrder: Type_PushNotification_Order, currentOrder: Type_PushNotification_Order | null) => {
      if (!currentOrder) return false;
      return (
        newOrder.orderId === currentOrder.orderId &&
        newOrder.status === currentOrder.status &&
        newOrder.updated_at === currentOrder.updated_at &&
        newOrder.total_amount === currentOrder.total_amount &&
        JSON.stringify(newOrder.order_items) === JSON.stringify(currentOrder.order_items)
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
        console.warn("Queue not empty after timeout, remaining events:", eventQueueRef.current.length);
        processEventQueue();
      }
    }, 5000);
  };

  const buildPushNotificationOrder = useCallback((response: any): Type_PushNotification_Order => {
    if (!response || typeof response !== "object") {
      throw new Error("Invalid or missing response data");
    }

    console.log("Building order from response:", JSON.stringify(response, null, 2));

    const totalAmount = Number(response.total_amount) || 0;
    const orderItems = Array.isArray(response.order_items) ? response.order_items : [];

    return {
      orderId: response.orderId ?? response.id ?? "",
      customer_id: response.customer_id ?? "",
      total_amount: isNaN(totalAmount) ? 0 : totalAmount,
      status: response.status ?? "PENDING",
      order_items: orderItems.map((item: any, index: number) => {
        if (!item || typeof item !== "object") {
          throw new Error(`Invalid order item at index ${index}`);
        }
        return {
          item_id: item.item_id ?? "",
          variant_id: item.variant_id ?? "",
          name: item.name ?? "",
          quantity: Number(item.quantity ?? 0),
          price_at_time_of_order: item.price_at_time_of_order?.toString() ?? "0",
          price_after_applied_promotion: item.price_after_applied_promotion?.toString() ?? "0",
        };
      }),
      updated_at: response.updated_at ?? Date.now(),
      tracking_info: response.tracking_info ?? Enum_OrderTrackingInfo.ORDER_PLACED,
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
    };
  }, [restaurantId]);

  const processEventQueue = useCallback(() => {
    if (isProcessingRef.current || eventQueueRef.current.length === 0) return;

    isProcessingRef.current = true;
    const { event, data, id } = eventQueueRef.current.shift()!;

    console.log(`Processing event: ${event}, ID: ${id}, Queue remaining: ${eventQueueRef.current.length}`);

    const eventKey = `${data.orderId ?? data.id ?? "unknown"}`;
    const lastUpdatedAt = processedEventIds.current.get(eventKey);

    if (lastUpdatedAt && lastUpdatedAt >= (data.updated_at ?? Date.now())) {
      console.log(`Skipping duplicate or older event (${event}):`, id);
      isProcessingRef.current = false;
      processEventQueue();
      return;
    }

    processedEventIds.current.set(eventKey, data.updated_at ?? Date.now());

    try {
      const order = buildPushNotificationOrder(data);

      if (!order.orderId) {
        throw new Error("Missing orderId in constructed data");
      }

      console.log(`Constructed order:`, JSON.stringify(order, null, 2));

      if (!areOrdersEqual(order, latestOrder)) {
        console.log(`Processed ${event}:`, order.orderId, {
          total_amount: order.total_amount,
          order_items: order.order_items,
          updated_at: order.updated_at,
        });
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
          sendPushNotification(order);
        }

        console.log("Updated latestOrder:", JSON.stringify(order, null, 2));
      } else {
        console.log(`Duplicate ${event} ignored:`, order.orderId);
      }
    } catch (error) {
      console.error(`Error processing ${event}:`, error);
    }

    isProcessingRef.current = false;
    processEventQueue();
  }, [dispatch, setOrders, sendPushNotification, latestOrder, areOrdersEqual, buildPushNotificationOrder]);

  useEffect(() => {
    if (!accessToken) {
      console.log("No access token available");
      return;
    }

    const socketInstance = io(`${BACKEND_URL}/restaurant`, {
      transports: ["websocket"],
      extraHeaders: {
        auth: `Bearer ${accessToken}`,
      },
    });

    socketInstance.on("connect", () => {
      console.log("Connected to restaurant order tracking server, ID:", socketInstance.id);
      setSocket(socketInstance);
      eventQueueRef.current = [];
      processedEventIds.current.clear();
      processEventQueue();
    });

    socketInstance.on("incomingOrderForRestaurant", (response) => {
      console.log("Received incomingOrderForRestaurant at:", new Date().toISOString());
      console.log("Response data:", JSON.stringify(response, null, 2));
      const eventId = `${response.orderId ?? response.id ?? "unknown"}_${response.updated_at ?? Date.now()}`;
      eventQueueRef.current.push({
        event: "incomingOrderForRestaurant",
        data: response,
        id: eventId,
      });
      console.log("Pushed to queue, length:", eventQueueRef.current.length);
      resetResponseTimeout();
      processEventQueue();
    });

    socketInstance.on("notifyOrderStatus", (response) => {
      console.log("Received notifyOrderStatus:", JSON.stringify(response, null, 2));
      const eventId = `${response.orderId}_${response.updated_at}`;
      eventQueueRef.current.push({
        event: "notifyOrderStatus",
        data: response,
        id: eventId,
      });
      console.log("Pushed to queue, length:", eventQueueRef.current.length);
      resetResponseTimeout();
      processEventQueue();
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Disconnected from restaurant order tracking server:", reason);
      setSocket(null);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Restaurant socket connection error:", error);
      setSocket(null);
    });

    return () => {
      if (socketInstance) socketInstance.disconnect();
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }
    };
  }, [accessToken, restaurantId]);

  console.log("check latest order:", JSON.stringify(latestOrder, null, 2));

  return {
    socket,
    latestOrder,
  };
};