// src/hooks/useSocket.ts
import { useEffect, useState, useCallback } from "react";
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

  const areOrdersEqual = useCallback(
    (newOrder: Type_PushNotification_Order, currentOrder: Type_PushNotification_Order | null) => {
      if (!currentOrder) return false;
      return (
        newOrder.orderId === currentOrder.orderId &&
        newOrder.status === currentOrder.status &&
        newOrder.updated_at === currentOrder.updated_at
      );
    },
    []
  );

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
    });

    socketInstance.on("incomingOrderForRestaurant", (response) => {
      console.log("Received incoming order:", JSON.stringify(response, null, 2));
      const buildDataToPushNotificationType: Type_PushNotification_Order = {
        orderId: response?.orderId ?? response?.id ?? "",
        customer_id: response?.customer_id ?? "",
        total_amount: response?.total_amount ?? response?.orderDetails?.total_amount ?? 0,
        status: response?.status ?? "PENDING",
        order_items: (response?.order_items ?? response?.orderDetails?.order_items ?? []).map(
          (item: any) => ({
            item_id: item.item_id ?? "",
            variant_id: item.variant_id ?? "",
            name: item.name ?? "",
            quantity: item.quantity ?? 0,
            price_at_time_of_order: item.price_at_time_of_order?.toString() ?? "0",
            price_after_applied_promotion: item.price_after_applied_promotion?.toString() ?? "0",
          })
        ),
        updated_at: response?.updated_at ?? Date.now(),
        tracking_info: response?.tracking_info ?? Enum_OrderTrackingInfo.ORDER_PLACED,
        driver_id: response?.driver_id ?? null,
        restaurant_id: response?.restaurant_id ?? restaurantId,
        restaurant_avatar: response?.restaurant_avatar ?? { key: "", url: "" },
        driver_avatar: response?.driver_avatar ?? null,
        restaurantAddress: response?.restaurantAddress ?? {
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
        customerAddress: response?.customerAddress ?? {
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

      if (!areOrdersEqual(buildDataToPushNotificationType, latestOrder)) {
        console.log("Processed order:", buildDataToPushNotificationType.orderId);
        dispatch(updateAndSaveOrderTracking(buildDataToPushNotificationType));
        setLatestOrder(buildDataToPushNotificationType);
        if (setOrders) {
          setOrders((prev) => {
            const exists = prev.some((order) => order.orderId === buildDataToPushNotificationType.orderId);
            if (exists) {
              return prev.map((order) =>
                order.orderId === buildDataToPushNotificationType.orderId
                  ? buildDataToPushNotificationType
                  : order
              );
            }
            return [...prev, buildDataToPushNotificationType];
          });
        }
        if (sendPushNotification) sendPushNotification(buildDataToPushNotificationType);
      } else {
        console.log("Duplicate order ignored:", buildDataToPushNotificationType.orderId);
      }
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
    };
  }, [accessToken, restaurantId, dispatch, setOrders, sendPushNotification, areOrdersEqual]);

  return {
    socket,
    latestOrder,
  };
};