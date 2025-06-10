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
  id: string;
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

export type Type_PushNotification_Order = {
  orderId: string;
  status: Enum_OrderStatus;
  tracking_info: Enum_OrderTrackingInfo;
  updated_at: number;
  customer_id: string;
  total_amount: number;
  total_restaurant_earn: number;
  customer_note?: string;
  order_items: {
    item_id: string;
    variant_id: string;
    variant_name?: string;
    name: string;
    quantity: number;
    price_at_time_of_order: string;
    price_after_applied_promotion: string;
  }[];
  driver_id: string | null;
  restaurant_id: string;
  restaurant_avatar: {
    key: string;
    url: string;
  };
  driver_avatar: {
    key: string;
    url: string;
  } | null;
  driverDetails?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar: any;
    rating: {
      average_rating: string;
    };
    vehicle: {
      color: string;
      model: string;
      license_plate: string;
    };
  };
  driver?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar: { url: string };
    rating: {
      average_rating: string;
    };
    vehicle: {
      color: string;
      model: string;
      license_plate: string;
    };
  };
  restaurantAddress: {
    id: string;
    street: string;
    city: string;
    nationality: string;
    is_default: boolean;
    created_at: number;
    updated_at: number;
    postal_code: number;
    location: {
      lat: number;
      lng: number;
    };
    title: string;
  };
  customerAddress: {
    id?: string;
    street: string;
    city: string;
    nationality?: string;
    is_default?: boolean;
    postal_code: number;
    location: {
      lat: number;
      lng: number;
    };
    title: string;
  };
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
  RESTAURANT_ACCEPTED = "RESTAURANT_ACCEPTED",
  ON_THE_WAY = "ON_THE_WAY",
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
  REJECTED = "REJECTED",
}
