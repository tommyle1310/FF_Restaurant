import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "@/src/store/types";
import { loadTokenFromAsyncStorage } from "@/src/store/authSlice";
import { RootState } from "@/src/store/store";
import { ThemeProvider } from "@/src/hooks/useTheme";
import AppNavigator, {
  RootStackParamList,
} from "@/src/navigation/AppNavigator";
import FFToast from "@/src/components/FFToast";
import FFText from "@/src/components/FFText";
import { usePushNotifications } from "@/src/hooks/usePushNotifications";
import { useSocket } from "@/src/hooks/useSocket";
import { Type_PushNotification_Order } from "@/src/types/pushNotification";
import { sendPushNotification } from "@/src/utils/functions/pushNotification";
import useSearchNearbyDrivers from "@/src/hooks/useSearchNearbyDrivers";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Spinner from "@/src/components/FFSpinner";

type RootNavigationProp = StackNavigationProp<RootStackParamList, "Main">;

const RootLayout = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  // Loading token on component mount
  useEffect(() => {
    const loadToken = async () => {
      await dispatch(loadTokenFromAsyncStorage());
      setIsLoading(false);
    };

    loadToken();
  }, [dispatch]);

  if (isLoading) {
    return <Spinner isVisible isOverlay />;
  }

  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
};

export default RootLayout;
