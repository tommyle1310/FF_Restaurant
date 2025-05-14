import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import React, { useState, useRef } from "react";
import IconIonicons from "react-native-vector-icons/Ionicons";
import FFText from "@/src/components/FFText";
import { useTheme } from "@/src/hooks/useTheme";
import colors from "../theme/colors";
import theme, { spacing } from "../theme";

// Dùng generic T để type của value và setValue khớp nhau
interface FFInputControlProps<T extends string | number> {
  value: T; // value có thể là string hoặc number
  setValue?: React.Dispatch<React.SetStateAction<T>>; // setValue khớp với type của value
  error?: string | null | undefined;
  placeholder?: string;
  secureTextEntry?: boolean;
  label?: string;
  disabled?: boolean;
  readonly?: boolean;
  isNumeric?: boolean; // Thêm prop để ép kiểu number (optional)
  style?: StyleProp<ViewStyle>; // Thêm prop style cho container chính
  labelStyle?: StyleProp<TextStyle>; // New prop for label styling
  inputStyle?: StyleProp<ViewStyle>; // New prop for input container styling
  colorDark?: string;
  colorLight?: string;
  borderColorDark?: string;
  borderColorLight?: string;
  textColorDark?: string;
  textColorLight?: string;
}

const FFInputControl = <T extends string | number>({
  value,
  setValue,
  error,
  placeholder,
  secureTextEntry = false,
  label,
  disabled = false,
  readonly = false,
  isNumeric = false,
  style, // Thêm style vào destructuring
  labelStyle, // Add to destructuring
  inputStyle, // Add to destructuring
  colorDark = "#333",
  colorLight = "#fff",
  borderColorDark = "#666",
  borderColorLight = "#d1d1d1",
  textColorDark = "#fff",
  textColorLight = "#333",
}: FFInputControlProps<T>) => {
  const { theme } = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const inputRef = useRef<TextInput>(null);

  const backgroundColor = theme === "light" ? colorLight : colors.black;
  const borderColor = error
    ? "red"
    : disabled
    ? borderColorLight
    : theme === "light"
    ? borderColorLight
    : borderColorDark;
  const textColor = theme === "light" ? textColorLight : textColorDark;
  const disabledBackgroundColor =
    theme === "light" ? "#f0f0f0" : colors.textSecondary;

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  // Handle press to focus input
  const handleInputContainerPress = () => {
    if (!disabled && !readonly && inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Xử lý giá trị nhập vào
  const handleChangeText = (text: string) => {
    if (!setValue) return; // Nếu không có setValue thì bỏ qua

    if (isNumeric) {
      // Chuyển text thành number, cho phép thập phân
      const numericValue = text === "" ? "" : parseFloat(text);
      setValue((Number.isNaN(numericValue) ? "" : numericValue) as T);
    } else {
      setValue(text as T); // Giữ nguyên string, ép về T
    }
  };

  // Chuyển value thành string để hiển thị trong TextInput
  const displayValue =
    value === undefined || value === null ? "" : String(value);

  const combinedLabelStyle = StyleSheet.flatten([
    styles.inputLabel,
    labelStyle,
  ]) as TextStyle;

  const combinedInputStyle = StyleSheet.flatten([
    styles.inputFieldContainer,
    {
      borderColor,
      backgroundColor: disabled ? disabledBackgroundColor : backgroundColor,
    },
    inputStyle,
  ]) as ViewStyle;

  const containerStyle = StyleSheet.flatten([style]) as ViewStyle;

  // Nếu readonly, dùng FFText
  if (readonly) {
    return (
      <View style={containerStyle}>
        <FFText
          fontSize="sm"
          colorDark={textColorDark}
          colorLight={textColorLight}
          style={combinedLabelStyle}
        >
          {label}
        </FFText>
        <FFText
          fontSize="sm"
          fontWeight="400"
          colorDark={textColorDark}
          colorLight={textColorLight}
          style={styles.readonlyText}
        >
          {displayValue}
        </FFText>
        {error && (
          <FFText
            fontSize="sm"
            colorDark="#ff4444"
            colorLight="#ff4444"
            style={styles.errorText}
          >
            {error}
          </FFText>
        )}
      </View>
    );
  }

  // Nếu không readonly, dùng TextInput
  return (
    <Pressable
      onPress={handleInputContainerPress}
      disabled={disabled}
      style={containerStyle}
    >
      <FFText
        fontSize="sm"
        colorDark={textColorDark}
        colorLight={textColorLight}
        style={combinedLabelStyle}
      >
        {label}
      </FFText>
      <View style={combinedInputStyle}>
        <TextInput
          ref={inputRef}
          placeholder={placeholder}
          value={displayValue} // Hiển thị string từ value
          onChangeText={handleChangeText} // Xử lý input theo kiểu
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          style={[styles.inputField, { color: textColor }]}
          editable={!disabled}
          autoCapitalize="none"
          keyboardType={isNumeric ? "decimal-pad" : "default"} // Bàn phím số thập phân nếu là numeric
          returnKeyType={isNumeric ? "done" : "next"} // Nút Done cho số
          placeholderTextColor={theme === "light" ? "#999" : "#666"}
        />
        {secureTextEntry && !disabled && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.iconButton}
            disabled={disabled}
          >
            <IconIonicons
              name={isPasswordVisible ? "eye-off" : "eye"}
              size={20}
              color={textColor}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <FFText
          fontSize="sm"
          colorDark="#ff4444"
          colorLight="#ff4444"
          style={styles.errorText}
        >
          {error}
        </FFText>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  inputLabel: {
    fontSize: theme.typography.fontSize.sm,
  },
  inputFieldContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    alignItems: "center",
    marginTop: spacing.xs,
    minHeight: 40,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  iconButton: {
    padding: spacing.sm,
  },
  errorText: {
    fontSize: 12,
    marginTop: -spacing.sm,
  },
  readonlyText: {
    marginTop: -2,
  },
});

export default FFInputControl;
