import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import React from "react";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFText from "@/src/components/FFText";
import FFToggle from "@/src/components/FFToggle";
import FFButton from "@/src/components/FFButton";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/src/navigation/AppNavigator";
import { useDispatch, useSelector } from "@/src/store/types";
import { logout } from "@/src/store/authSlice";
import IconIonicons from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import FFAvatar from "@/src/components/FFAvatar";
import { RootState } from "@/src/store/store";
import useSettingData from "@/src/data/screens/Settings";
import FFView from "@/src/components/FFView";
import { spacing } from "@/src/theme";

type LogoutSreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Main"
>;

const SettingsScreen = () => {
  const navigation = useNavigation<LogoutSreenNavigationProp>();
  const dispatch = useDispatch();
  const {  avatar, email } = useSelector(
    (state: RootState) => state.auth
  );
  const { "Account Settings": data_account_setting, More: data_more } =
    useSettingData();

  return (
    <FFSafeAreaView>
      <FFView colorDark="#333" style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header Gradient Section */}
          <LinearGradient
            colors={["#63c550", "#a3d98f"]}
            start={[0, 0]}
            end={[1, 0]}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <IconIonicons name="settings" color={"#fff"} size={24} />
              <FFText style={styles.headerText}>Settings</FFText>
            </View>
          </LinearGradient>

          {/* Main Content Section */}
          <View style={styles.contentWrapper}>
            <FFView colorDark="#222" style={styles.contentContainer}>
              {/* Profile Section */}
              <View style={styles.profileSection}>
                <FFAvatar size={40} avatar={avatar?.url} />
                <FFText>{email}</FFText>
              </View>

              {/* Account Settings Section */}
              <View style={styles.settingsSection}>
                <FFText style={styles.sectionTitle}>Account Settings</FFText>
                {data_account_setting.map((item, i) => (
                  <Pressable
                    onPress={() => item.onPress()}
                    key={item.title}
                    style={{
                      ...styles.optionItem,
                      borderBottomWidth:
                        i === data_account_setting.length - 1 ? 0 : 1,
                    }}
                  >
                    <FFText>{item.title}</FFText>
                    {item.rightIcon}
                  </Pressable>
                ))}
              </View>

              {/* More Settings Section */}
              <View style={styles.settingsSection}>
                <FFText style={styles.sectionTitle}>More Settings</FFText>
                {data_more.map((item, i) => (
                  <Pressable
                    onPress={() => item.onPress()}
                    key={item.title}
                    style={{
                      ...styles.optionItem,
                      borderBottomWidth: i === data_more.length - 1 ? 0 : 1,
                    }}
                  >
                    <FFText>{item.title}</FFText>
                    {item.rightIcon}
                  </Pressable>
                ))}
                {/* Log Out Button */}
                <FFButton
                  onPress={() => {
                    dispatch(logout());
                    // dispatch(clear()); // Xóa AsyncStorage
                    navigation.navigate("Login");
                  }}
                  className="w-full"
                  variant="danger"
                >
                  Log Out
                </FFButton>
              </View>
            </FFView>
          </View>
        </ScrollView>
      </FFView>
    </FFSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "red", // Background color for the container
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100, // Ensuring content has padding at the bottom
  },
  headerGradient: {
    paddingHorizontal: 12,
    paddingVertical: 24,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    height: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerText: {
    color: "#fff",
    fontSize: 24,
  },
  contentWrapper: {
    marginTop: -60, // Ensuring content is visible when scrolled up
    alignItems: "center",
  },
  contentContainer: {
    width: "90%",
    paddingBottom: 60,
    borderRadius: 16,
    paddingTop: 24,
    paddingHorizontal: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  settingsSection: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontWeight: "400",
    color: "#aaa",
    marginBottom: spacing.sm,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  logoutButton: {
    marginTop: spacing.lg,
    width: "100%",
  },
});

export default SettingsScreen;
