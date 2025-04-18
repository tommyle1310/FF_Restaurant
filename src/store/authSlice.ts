import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Định nghĩa các interface
interface Address {
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
    lon: number;
  };
  title: string;
}

interface ContactEmail {
  email: string;
  title: string;
  is_default: boolean;
}

interface ContactPhone {
  title: string;
  number: string;
  is_default: boolean;
}

interface Avatar {
  key: string;
  url: string;
}

interface Status {
  is_open: boolean;
  is_active: boolean;
  is_accepted_orders: boolean;
}

interface OpeningHours {
  fri: { to: number; from: number };
  mon: { to: number; from: number };
  sat: { to: number; from: number };
  sun: { to: number; from: number };
  thu: { to: number; from: number };
  tue: { to: number; from: number };
  wed: { to: number; from: number };
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  discount_type: string;
  discount_value: string;
  promotion_cost_price: string;
  minimum_order_value: string;
  avatar: Avatar | null;
  status: string;
  bogo_details: any | null;
  created_at: string;
  updated_at: string;
}

interface SpecializeIn {
  id: string;
  name: string;
  description: string;
  avatar: Avatar | null;
  created_at: number;
  updated_at: number;
}

interface AuthState {
  accessToken: string | null;
  user_id: string | null;
  email: string | null;
  user_type: string[] | null;
  first_name: string | null;
  last_name: string | null;
  app_preferences: object | null;
  id: string | null;
  logged_in_as: string | null;
  owner_id: string | null;
  owner_name: string | null;
  restaurant_id: string | null;
  address: Address | null;
  restaurant_name: string | null;
  contact_email: ContactEmail[] | null;
  contact_phone: ContactPhone[] | null;
  created_at: number | null;
  updated_at: number | null;
  avatar: Avatar | null;
  images_gallery: any[] | null;
  status: Status | null;
  promotions: Promotion[] | null; // Thêm promotions
  ratings: object | null;
  specialize_in: SpecializeIn[] | null;
  opening_hours: OpeningHours | null;
  iat: number | null;
  exp: number | null;
}

// Initial state
const initialState: AuthState = {
  accessToken: null,
  user_id: null,
  email: null,
  user_type: null,
  first_name: null,
  last_name: null,
  app_preferences: null,
  id: null,
  logged_in_as: null,
  owner_id: null,
  owner_name: null,
  restaurant_id: null,
  address: null,
  restaurant_name: null,
  contact_email: null,
  contact_phone: null,
  created_at: null,
  updated_at: null,
  avatar: null,
  images_gallery: null,
  status: null,
  promotions: null, // Khởi tạo promotions
  ratings: null,
  specialize_in: null,
  opening_hours: null,
  iat: null,
  exp: null,
};

// Load token từ AsyncStorage
export const loadTokenFromAsyncStorage = createAsyncThunk(
  "auth/loadToken",
  async () => {
    const keys = [
      "accessToken",
      "user_id",
      "email",
      "user_type",
      "first_name",
      "last_name",
      "app_preferences",
      "id",
      "logged_in_as",
      "owner_id",
      "owner_name",
      "restaurant_id",
      "address",
      "restaurant_name",
      "contact_email",
      "contact_phone",
      "created_at",
      "updated_at",
      "avatar",
      "images_gallery",
      "status",
      "promotions", // Thêm promotions
      "ratings",
      "specialize_in",
      "opening_hours",
      "iat",
      "exp",
    ];
    const values = await Promise.all(
      keys.map((key) => AsyncStorage.getItem(key))
    );
    const result = Object.fromEntries(keys.map((key, i) => [key, values[i]]));

    return {
      accessToken: result.accessToken || null,
      user_id: result.user_id || null,
      email: result.email || null,
      user_type: result.user_type ? JSON.parse(result.user_type) : null,
      first_name: result.first_name || null,
      last_name: result.last_name || null,
      app_preferences: result.app_preferences
        ? JSON.parse(result.app_preferences)
        : null,
      id: result.id || null,
      logged_in_as: result.logged_in_as || null,
      owner_id: result.owner_id || null,
      owner_name: result.owner_name || null,
      restaurant_id: result.restaurant_id || null,
      address: result.address ? JSON.parse(result.address) : null,
      restaurant_name: result.restaurant_name || null,
      contact_email: result.contact_email
        ? JSON.parse(result.contact_email)
        : null,
      contact_phone: result.contact_phone
        ? JSON.parse(result.contact_phone)
        : null,
      created_at: result.created_at ? Number(result.created_at) : null,
      updated_at: result.updated_at ? Number(result.updated_at) : null,
      avatar: result.avatar ? JSON.parse(result.avatar) : null,
      images_gallery: result.images_gallery
        ? JSON.parse(result.images_gallery)
        : null,
      status: result.status ? JSON.parse(result.status) : null,
      promotions: result.promotions ? JSON.parse(result.promotions) : null, // Parse promotions
      ratings: result.ratings ? JSON.parse(result.ratings) : null,
      specialize_in: result.specialize_in
        ? JSON.parse(result.specialize_in)
        : null,
      opening_hours: result.opening_hours
        ? JSON.parse(result.opening_hours)
        : null,
      iat: result.iat ? Number(result.iat) : null,
      exp: result.exp ? Number(result.exp) : null,
    };
  }
);

// Save token vào AsyncStorage
export const saveTokenToAsyncStorage = createAsyncThunk(
  "auth/saveToken",
  async (data: AuthState) => {
    const entries = [
      ["accessToken", data.accessToken || ""],
      ["user_id", data.user_id || ""],
      ["email", data.email || ""],
      ["user_type", JSON.stringify(data.user_type || [])],
      ["first_name", data.first_name || ""],
      ["last_name", data.last_name || ""],
      ["app_preferences", JSON.stringify(data.app_preferences || null)],
      ["id", data.id || ""],
      ["logged_in_as", data.logged_in_as || ""],
      ["owner_id", data.owner_id || ""],
      ["owner_name", data.owner_name || ""],
      ["restaurant_id", data.restaurant_id || ""],
      ["address", JSON.stringify(data.address || null)],
      ["restaurant_name", data.restaurant_name || ""],
      ["contact_email", JSON.stringify(data.contact_email || [])],
      ["contact_phone", JSON.stringify(data.contact_phone || [])],
      ["created_at", data.created_at?.toString() || ""],
      ["updated_at", data.updated_at?.toString() || ""],
      ["avatar", JSON.stringify(data.avatar || null)],
      ["images_gallery", JSON.stringify(data.images_gallery || null)],
      ["status", JSON.stringify(data.status || null)],
      ["promotions", JSON.stringify(data.promotions || null)], // Stringify promotions
      ["ratings", JSON.stringify(data.ratings || null)],
      ["specialize_in", JSON.stringify(data.specialize_in || [])],
      ["opening_hours", JSON.stringify(data.opening_hours || null)],
      ["iat", data.iat?.toString() || ""],
      ["exp", data.exp?.toString() || ""],
    ];
    await Promise.all(
      entries.map(([key, value]) => AsyncStorage.setItem(key, value))
    );
    return data;
  }
);

// Logout
export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    const keys = [
      "accessToken",
      "user_id",
      "email",
      "user_type",
      "first_name",
      "last_name",
      "app_preferences",
      "id",
      "logged_in_as",
      "owner_id",
      "owner_name",
      "restaurant_id",
      "address",
      "restaurant_name",
      "contact_email",
      "contact_phone",
      "created_at",
      "updated_at",
      "avatar",
      "images_gallery",
      "status",
      "promotions", // Thêm promotions
      "ratings",
      "specialize_in",
      "opening_hours",
      "iat",
      "exp",
    ];
    await Promise.all(keys.map((key) => AsyncStorage.removeItem(key)));
    dispatch(clearAuthState());
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthState: (state, action) => {
      return { ...state, ...action.payload };
    },
    clearAuthState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTokenFromAsyncStorage.fulfilled, (state, action) => {
        return { ...state, ...action.payload };
      })
      .addCase(saveTokenToAsyncStorage.fulfilled, (state, action) => {
        return { ...state, ...action.payload };
      })
      .addCase(logout.fulfilled, () => initialState);
  },
});

export const { setAuthState, clearAuthState } = authSlice.actions;
export default authSlice.reducer;
