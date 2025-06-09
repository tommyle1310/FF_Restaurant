import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { debounce } from "lodash";
import {
  Enum_OrderStatus,
  Type_PushNotification_Order,
} from "@/src/types/Orders";

export type OrderTracking = Type_PushNotification_Order;

export interface RestaurantOrderTrackingState {
  orders: OrderTracking[];
}

const STORAGE_KEY = "@restaurant_order_tracking_v1";

const initialState: RestaurantOrderTrackingState = {
  orders: [],
};

const mapOrderToLog = (order: OrderTracking) => ({
  id: order.orderId,
  status: order.status,
  total_amount: order.total_amount,
});

const debouncedSaveToStorage = debounce(async (orders: OrderTracking[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    console.log(
      "Successfully saved restaurant orders to AsyncStorage:",
      orders.length
    );
  } catch (error) {
    console.error("Error saving to AsyncStorage:", error);
  }
}, 1000);

export const updateAndSaveOrderTracking = createAsyncThunk(
  "restaurantOrderTracking/updateAndSaveOrderTracking",
  async (order: OrderTracking, { getState }) => {
    const state = getState() as {
      restaurantOrderTracking: RestaurantOrderTrackingState;
    };
    const currentOrders = state.restaurantOrderTracking.orders;

    console.log("Current restaurant orders before update:", {
      count: currentOrders.length,
      orders: currentOrders.map(mapOrderToLog),
    });

    const existingIndex = currentOrders.findIndex(
      (o) => o.orderId === order.orderId
    );

    let updatedOrders: OrderTracking[];
    if (existingIndex !== -1) {
      updatedOrders = [...currentOrders];
      const existingOrder = currentOrders[existingIndex];

      console.log("=== REDUX UPDATE DEBUG ===");
      console.log("BEFORE update - existing order:");
      console.log("- Order items count:", existingOrder.order_items.length);
      console.log("- Total amount:", existingOrder.total_amount);
      console.log("- Customer note:", existingOrder.customer_note);

      console.log("NEW order data being saved:");
      console.log("- Order items count:", order.order_items.length);
      console.log("- Total amount:", order.total_amount);
      console.log("- Customer note:", order.customer_note);

      // CRITICAL: If new order has empty order_items but existing has items, preserve existing
      if (
        order.order_items.length === 0 &&
        existingOrder.order_items.length > 0
      ) {
        console.log(
          "PRESERVING existing order_items - new order has empty items!"
        );
        order = {
          ...order,
          order_items: existingOrder.order_items,
          total_amount: existingOrder.total_amount || order.total_amount,
          customer_note: existingOrder.customer_note || order.customer_note,
        };
      }

      updatedOrders[existingIndex] = order;
      console.log("Updated existing restaurant order:", {
        orderId: order.orderId,
        oldStatus: existingOrder.status,
        newStatus: order.status,
        finalOrderItemsCount: order.order_items.length,
      });
      console.log("=== END REDUX UPDATE DEBUG ===");
    } else {
      updatedOrders = [...currentOrders, order];
      console.log("Added new restaurant order:", {
        orderId: order.orderId,
        status: order.status,
      });
    }

    updatedOrders.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));

    const ordersToSave = updatedOrders.filter((o) =>
      [
        Enum_OrderStatus.PENDING,
        Enum_OrderStatus.RESTAURANT_ACCEPTED,
        Enum_OrderStatus.PREPARING,
        Enum_OrderStatus.EN_ROUTE,
        Enum_OrderStatus.READY_FOR_PICKUP,
        Enum_OrderStatus.RESTAURANT_PICKUP,
      ].includes(o.status)
    );

    console.log("Updated restaurant orders:", {
      count: updatedOrders.length,
      orders: updatedOrders.map(mapOrderToLog),
    });
    console.log("Orders to save in AsyncStorage:", {
      count: ordersToSave.length,
      orders: ordersToSave.map(mapOrderToLog),
    });

    await debouncedSaveToStorage(ordersToSave);
    return updatedOrders;
  }
);

export const loadOrderTrackingFromAsyncStorage = createAsyncThunk(
  "restaurantOrderTracking/loadOrderTracking",
  async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const orders = stored ? JSON.parse(stored) : [];

      const validOrders = orders
        .filter((order: OrderTracking) =>
          [
            Enum_OrderStatus.PENDING,
            Enum_OrderStatus.RESTAURANT_ACCEPTED,
            Enum_OrderStatus.PREPARING,
            Enum_OrderStatus.EN_ROUTE,
            Enum_OrderStatus.READY_FOR_PICKUP,
            Enum_OrderStatus.RESTAURANT_PICKUP,
          ].includes(order.status)
        )
        .sort(
          (a: OrderTracking, b: OrderTracking) =>
            (b.updated_at || 0) - (a.updated_at || 0)
        );

      console.log(
        "Loaded and filtered restaurant orders from AsyncStorage:",
        validOrders.length,
        validOrders.map(mapOrderToLog)
      );
      return validOrders;
    } catch (error) {
      console.error("Error loading from AsyncStorage:", error);
      return [];
    }
  }
);

const restaurantOrderTrackingSlice = createSlice({
  name: "restaurantOrderTracking",
  initialState,
  reducers: {
    removeOrderTracking: (state, action) => {
      const orderId = action.payload;
      console.log("Removing restaurant order:", orderId);
      state.orders = state.orders.filter((order) => order.orderId !== orderId);
      debouncedSaveToStorage(state.orders);
      console.log("Restaurant orders after removal:", state.orders.length);
    },
    clearOrderTracking: (state) => {
      console.log("Clearing all restaurant orders");
      state.orders = [];
      // AsyncStorage removal is handled in the async thunk
    },
    cleanupInactiveOrders: (state) => {
      console.log("Cleaning up inactive orders");
      const activeOrders = state.orders.filter((order) =>
        [
          Enum_OrderStatus.PENDING,
          Enum_OrderStatus.RESTAURANT_ACCEPTED,
          Enum_OrderStatus.PREPARING,
          Enum_OrderStatus.READY_FOR_PICKUP,
        ].includes(order.status)
      );
      state.orders = activeOrders;
      debouncedSaveToStorage(activeOrders);
      console.log("Active orders after cleanup:", activeOrders.length);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadOrderTrackingFromAsyncStorage.fulfilled, (state, action) => {
        state.orders = action.payload;
      })
      .addCase(updateAndSaveOrderTracking.fulfilled, (state, action) => {
        if (action.payload) {
          state.orders = action.payload;
        }
      });
  },
});

// Async thunk for clearing order tracking
export const clearOrderTrackingAsync = createAsyncThunk(
  "restaurantOrderTracking/clearAsync",
  async (_, { dispatch }) => {
    try {
      console.log("Clearing restaurant order tracking AsyncStorage...");
      await AsyncStorage.removeItem(STORAGE_KEY);
      dispatch(clearOrderTracking());
      console.log("Successfully cleared restaurant order tracking");
    } catch (error) {
      console.error("Error clearing restaurant order tracking:", error);
      throw error;
    }
  }
);

export const {
  removeOrderTracking,
  clearOrderTracking,
  cleanupInactiveOrders,
} = restaurantOrderTrackingSlice.actions;
export default restaurantOrderTrackingSlice.reducer;
