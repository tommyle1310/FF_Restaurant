import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React from "react";
import FFAvatar from "../../FFAvatar";
import FFText from "../../FFText";
import IconFontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import { colors, spacing } from "@/src/theme";

const ReadonlyProfileComponents = ({
  toggleStatus,
}: {
  toggleStatus: () => void;
}) => {
  const { user_id, avatar, restaurant_name, email , contact_phone} = useSelector((state: RootState) => state.auth);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FFAvatar avatar={avatar?.url} />
        <View style={styles.userInfo}>
          <FFText fontSize="lg">{restaurant_name}</FFText>
          <FFText fontWeight="400" style={styles.emailText}>
            {email}
          </FFText>
        </View>
        <TouchableOpacity onPress={toggleStatus} style={styles.editButton}>
          <IconFontAwesome5 name="user-edit" size={10} color={colors.white} />
        </TouchableOpacity>
      </View>
      <View style={styles.infoRow}>
        <FFText style={styles.labelText} fontWeight="400">
          Phone Number:
        </FFText>
        <FFText fontWeight="400">{contact_phone?.find(item => item?.is_default)?.number || contact_phone?.[0]?.number || ''}</FFText>
      </View>
      <View style={styles.infoRow}>
        <FFText style={styles.labelText} fontWeight="400">
          Date Joined:
        </FFText>
        <FFText fontWeight="400">24/01/2025</FFText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    elevation: 10,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  emailText: {
    color: colors.textSecondary,
  },
  editButton: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: 25,
    alignSelf: "flex-start",
    flexShrink: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  infoRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  labelText: {
    color: colors.textSecondary,
  },
});

export default ReadonlyProfileComponents;
