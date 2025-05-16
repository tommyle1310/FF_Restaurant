import FFToggle from "@/src/components/FFToggle";
import { useTheme } from "@/src/hooks/useTheme";
import { MainStackParamList } from "@/src/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import IconIonicons from "react-native-vector-icons/Ionicons";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import { Type_Address } from "@/src/types/Address";

type SettingNavigationProp = StackNavigationProp<
  MainStackParamList,
  "BottomTabs"
>;

const useSettingData = () => {
  const navigation = useNavigation<SettingNavigationProp>();
  const { theme } = useTheme();
  const { address } = useSelector((state: RootState) => state.auth);

  const settingsData = {
    "Account Settings": [
      {
        title: "Edit Profile",
        rightIcon: (
          <IconIonicons
            name="chevron-forward-outline"
            size={20}
            style={{ color: theme === "dark" ? "#eeee" : "#222" }}
          />
        ),
        onPress: () => {
          navigation.navigate("Profile");
        },
      },
      {
        title: "Change Password",
        rightIcon: (
          <IconIonicons
            name="chevron-forward-outline"
            size={20}
            style={{ color: theme === "dark" ? "#eeee" : "#222" }}
          />
        ),
        onPress: () => {
          navigation.navigate("ChangePassword");
        },
      },
      {
        title: "Address",
        rightIcon: (
          <IconIonicons
            name="chevron-forward-outline"
            size={20}
            style={{ color: theme === "dark" ? "#eeee" : "#222" }}
          />
        ),
        onPress: () => {
          navigation.navigate("AddressDetails", {
            is_create_type: !address,
            addressDetail: address as unknown as Type_Address 
          });
        },
      },
      {
        title: "Payment Method",
        rightIcon: (
          <IconIonicons
            name="chevron-forward-outline"
            size={20}
            style={{ color: theme === "dark" ? "#eeee" : "#222" }}
          />
        ),
        onPress: () => {
          navigation.navigate("PaymentMethod");
        },
      },
      {
        title: "Push Notifications",
        rightIcon: <FFToggle initialChecked />,
        onPress: () => {
          // Add the logic for enabling/disabling notifications
        },
      },
      {
        title: "Dark Mode",
        rightIcon: (
          <FFToggle
            initialChecked
            isChangeTheme={true}
            onChange={() => {
              // Add the logic for toggling dark mode
            }}
          />
        ),
        onPress: () => {
          // Add the logic for toggling dark mode
        },
      },
    ],
    More: [
      {
        title: "Support Center",
        rightIcon: (
          <IconIonicons
            name="chevron-forward-outline"
            size={20}
            style={{ color: theme === "dark" ? "#eeee" : "#222" }}
          />
        ),
        onPress: () => {
          navigation.navigate("SupportCenter");
        },
      },
      {
        title: "About Us",
        rightIcon: (
          <IconIonicons
            name="chevron-forward-outline"
            size={20}
            style={{ color: theme === "dark" ? "#eeee" : "#222" }}
          />
        ),
        onPress: () => {
          // Add the navigation logic for About Us
        },
      },
      {
        title: "Privacy Policy",
        rightIcon: (
          <IconIonicons
            name="chevron-forward-outline"
            size={20}
            style={{ color: theme === "dark" ? "#eeee" : "#222" }}
          />
        ),
        onPress: () => {
          // Add the navigation logic for Privacy Policy
        },
      },
    ],
  };

  return settingsData;
};

export default useSettingData;
