// src/screens/OrderScreen.tsx (partial)
import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import { Type_PushNotification_Order } from "@/src/types/Orders";
import { loadOrderTrackingFromAsyncStorage } from "@/src/store/restaurantOrderTrackingSlice";
import FFModal from "@/src/components/FFModal";
import FFText from "@/src/components/FFText";
import { spacing, colors, typography, borderRadius } from "@/src/theme";
import { View } from "react-native";

export default function OrderScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: "", subtitle: "" });
  const { id } = useSelector((state: RootState) => state.auth);
  const orders = useSelector((state: RootState) => state.restaurantOrderTracking.orders);
  const dispatch = useDispatch();

  const showModal = useCallback((title: string, subtitle: string) => {
    setModalMessage({ title, subtitle });
    setModalVisible(true);
    const timeout = setTimeout(() => {
      setModalVisible(false);
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    dispatch(loadOrderTrackingFromAsyncStorage());
    // fetchOrders(); // Uncomment if still needed
  }, [dispatch, id]);

  useEffect(() => {
    if (orders.length > 0) {
      const latestOrder = orders[orders.length - 1];
      const currentOrder = orders.find((o) => o.orderId === latestOrder.orderId);
      if (!currentOrder || currentOrder.status !== latestOrder.status) {
        showModal(
          `Order #${latestOrder.orderId.slice(-8)} Updated`,
          `Status: ${latestOrder.status}`
        );
      }
    }
  }, [orders, showModal]);

  // Rest of your OrderScreen code (FlatList, OrderCard, etc.)
  // ...

  return (
    // Your existing JSX with FFModal
    <FFModal visible={modalVisible} onClose={() => setModalVisible(false)}>
      <View style={{
        padding: spacing.md,
        backgroundColor: colors.success,
        borderRadius: borderRadius.sm,
        alignItems: "center",
      }}>
        <FFText style={{
          color: colors.white,
          fontSize: typography.fontSize.sm,
          fontFamily: typography.fontFamily.medium,
        }}>{modalMessage.title}</FFText>
        <FFText style={{
          color: colors.white,
          fontSize: typography.fontSize.sm,
          fontFamily: typography.fontFamily.medium,
        }}>{modalMessage.subtitle}</FFText>
      </View>
    </FFModal>
    // ...
  );
}