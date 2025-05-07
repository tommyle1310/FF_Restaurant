// screens/Login.tsx
import React, { useEffect, useState } from "react";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import { useNavigation } from "@react-navigation/native";
import FFAuthForm from "./FFAuthForm";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  AuthStackParamList,
  RootStackParamList,
} from "@/src/navigation/AppNavigator"; // Make sure you have this path correct
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch, useSelector } from "@/src/store/types";
import {
  loadTokenFromAsyncStorage,
  saveTokenToAsyncStorage,
  setAuthState,
} from "@/src/store/authSlice";
import axiosInstance from "@/src/utils/axiosConfig";
import { decodeJWT } from "@/src/utils/functions";
import Spinner from "@/src/components/FFSpinner";
import { spacing } from "@/src/theme";

type LoginScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  "Login"
>;
type RootNavigationProp = StackNavigationProp<RootStackParamList, "Login">;

const Login = () => {
  const authNavigation = useNavigation<LoginScreenNavigationProp>();
  const rootNavigation = useNavigation<RootNavigationProp>();
  const dispatch = useDispatch();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const handleLoginSubmit = async (email: string, password: string) => {
    const requestBody = {
      email: email,
      password: password,
    };
    setIsLoading(true);
    try {
      const response = await axiosInstance.post(
        "/auth/login-restaurant",
        requestBody,
        {
          validateStatus: () => true,
        }
      );

      const { EC, EM, data } = response.data;

      if (EC === 0) {
        const userData = decodeJWT(data.access_token); // Giả sử decodeJWT trả về dữ liệu giống JSON bạn cung cấp

        dispatch(
          saveTokenToAsyncStorage({
            accessToken: data.access_token,
            user_id: userData.user_id || null,
            email: userData.email || null,
            promotions: userData.promotions || null,
            user_type: userData.user_type || null,
            first_name: userData.first_name || null,
            last_name: userData.last_name || null,
            app_preferences: userData.app_preferences || null,
            id: userData.id || null,
            logged_in_as: userData.logged_in_as || null,
            owner_id: userData.owner_id || null,
            owner_name: userData.owner_name || null,
            restaurant_id: userData.restaurant_id || null,
            address: userData.address || null,
            restaurant_name: userData.restaurant_name || null,
            contact_email: userData.contact_email || null,
            contact_phone: userData.contact_phone || null,
            created_at: userData.created_at || null,
            updated_at: userData.updated_at || null,
            avatar: userData.avatar || null,
            images_gallery: userData.images_gallery || null,
            status: userData.status || null,
            ratings: userData.ratings || null,
            specialize_in: userData.specialize_in || null,
            opening_hours: userData.opening_hours || null,
            iat: userData.iat || null,
            exp: userData.exp || null,
            fWallet_balance: userData.fWallet_balance || null,
            fWallet_id: userData.fWallet_id || null,
          })
        );

        // Các dispatch khác nếu cần
        // dispatch(saveFavoriteRestaurantsToAsyncStorage(userData.favorite_restaurants));
        // dispatch(saveCartItemsToAsyncStorage(userData.cart_items));

        rootNavigation.navigate("Main");
      } else {
        setError(EM);
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error("Login failed:", error);
      setError("An unexpected error occurred during login.");
    }
  };

  if (isLoading) {
    return <Spinner isVisible isOverlay />;
  }
  return (
    <FFSafeAreaView>
      <LinearGradient
        colors={["#8fa3d9", "#b5b3a1", "#b5e1a1"]}
        start={[1, 0]}
        end={[0, 1]}
        style={{ padding: spacing.md, flex: 1, paddingTop: spacing.xxl }}
        className="flex-1 items-center justify-center"
      >
        <FFAuthForm
          error={error}
          isSignUp={false}
          onSubmit={handleLoginSubmit}
          navigation={authNavigation}
        />
      </LinearGradient>
    </FFSafeAreaView>
  );
};

export default Login;
