// Define the enum for Payment Methods
export enum Enum_PaymentMethod {
  COD = "COD",
  FWallet = "FWALLET",
}

// Define the enum for Payment Status
export enum Enum_PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export enum Enum_TrackingInfo {
  ORDER_PLACED = "ORDER_PLACED",
  PREPARING = "PREPARING",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERED = "DELIVERED",
}

// Define the item structure in the order
export type OrderItem = {
  item_id: string | null;
  name: string | null;
  quantity: number | null;
  price_at_time_of_order: number | null;
  variant_id: string | null;
  item: {
    _id: string;
    name: string;
    avatar: { url: string; key: string };
  };
};

// Define the main order type
export type Order = {
  _id: string;
  customer_id: string | null;
  restaurant_id: string;
  customer_location: string | undefined; // Assuming it's a string  ID from an address
  restaurant_location: string; // Assuming it's the restaurant's address
  status: Enum_PaymentStatus;
  payment_method: Enum_PaymentMethod;
  total_amount: number;
  order_items: OrderItem[];
  tracking_info: Enum_TrackingInfo;
  customer_note: string;
  restaurant_note: string;
  order_time: number; // Unix timestamp
};

export enum Enum_OrderTrackingInfo {
  ORDER_PLACED = "ORDER_PLACED",
  ORDER_RECEIVED = "ORDER_RECEIVED",
  PREPARING = "PREPARING",
  IN_PROGRESS = "IN_PROGRESS",
  RESTAURANT_PICKUP = "RESTAURANT_PICKUP",
  DISPATCHED = "DISPATCHED",
  EN_ROUTE = "EN_ROUTE",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERY_FAILED = "DELIVERY_FAILED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  RETURNED = "RETURNED",
}

export enum Enum_OrderStatus {
  PENDING = "PENDING",
  RESTAURANT_ACCEPTED = "RESTAURANT_ACCEPTED",
  PREPARING = "PREPARING",
  IN_PROGRESS = "IN_PROGRESS",
  READY_FOR_PICKUP = "READY_FOR_PICKUP",
  RESTAURANT_PICKUP = "RESTAURANT_PICKUP",
  DISPATCHED = "DISPATCHED",
  EN_ROUTE = "EN_ROUTE",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  RETURNED = "RETURNED",
  DELIVERY_FAILED = "DELIVERY_FAILED",
}
