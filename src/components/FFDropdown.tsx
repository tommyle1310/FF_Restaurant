import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  Image,
} from "react-native";
import { useTheme } from "@/src/hooks/useTheme";
import FFText from "./FFText";
import { IMAGE_URL } from "../assets/imageUrls";
import { spacing } from "../theme";

// Type cho option mới
interface DropdownOption {
  value: string; // Giá trị để xác định option (dùng trong onSelect)
  label: string; // Tên hiển thị trong UI
  imageUrl?: string; // Optional: URL hình ảnh
  description?: string; // Optional: Mô tả ngắn
}

interface FFDropdownProps {
  options: string[] | DropdownOption[]; // Hỗ trợ cả string[] và DropdownOption[]
  selectedOption: string; // Giá trị hiện tại được chọn (vẫn là string)
  onSelect: (option: string) => void; // Callback trả về value
  placeholder: string; // Placeholder khi chưa chọn
  fallbackText?: string; // Text to display when options array is empty
  style?: object;
  textStyle?: object;
  optionStyle?: object;
}

const FFDropdown: React.FC<FFDropdownProps> = ({
  options,
  selectedOption,
  onSelect,
  placeholder,
  fallbackText,
  style,
  textStyle,
  optionStyle,
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const selectOption = (option: string) => {
    onSelect(option);
    setIsOpen(false);
  };

  // Type Guard để kiểm tra DropdownOption
  const isDropdownOption = (
    item: string | DropdownOption
  ): item is DropdownOption => {
    return typeof item === "object" && "value" in item && "label" in item;
  };

  // Tìm label tương ứng với selectedOption khi options là DropdownOption[]
  const getSelectedLabel = () => {
    if (options.length === 0) {
      return fallbackText || placeholder;
    }
    if (
      Array.isArray(options) &&
      options.length > 0 &&
      isDropdownOption(options[0])
    ) {
      const selected = (options as DropdownOption[]).find(
        (opt) => opt.value === selectedOption
      );
      return selected ? selected.label : placeholder;
    }
    return selectedOption || placeholder; // Trường hợp string[] hoặc chưa chọn
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: theme === "light" ? "#fff" : "#111",
            borderColor: theme === "light" ? "#111" : "#fff",
            borderWidth: 1,
          },
          options.length === 0 && styles.disabledButton,
        ]}
        onPress={toggleDropdown}
        disabled={options.length === 0}
      >
        <FFText
          fontWeight="500"
          style={{
            ...styles.selectedText,
            ...textStyle,
            ...(options.length === 0 && styles.disabledText),
            color: theme === "light" ? "#000" : "#fff",
          }}
        >
          {getSelectedLabel()}
        </FFText>
      </TouchableOpacity>

      {isOpen && (
        <Modal
          transparent
          animationType="fade"
          visible={isOpen}
          onRequestClose={() => setIsOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setIsOpen(false)}
          >
            <View
              style={[
                styles.dropdown,
                { backgroundColor: theme === "light" ? "#fff" : "#333" },
              ]}
            >
              <FlatList<string | DropdownOption>
                data={options}
                keyExtractor={(item, index) =>
                  isDropdownOption(item) ? item.value : index.toString()
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.option, optionStyle]}
                    onPress={() =>
                      selectOption(isDropdownOption(item) ? item.value : item)
                    }
                  >
                    {isDropdownOption(item) ? (
                      // Trường hợp DropdownOption
                      <View style={styles.optionContainer}>
                        {item.imageUrl && (
                          <Image
                            source={{
                              uri:
                                item.imageUrl ??
                                IMAGE_URL?.DEFAULT_FLASHFOOD_AVATAR,
                            }}
                            style={styles.optionImage}
                          />
                        )}
                        <View style={styles.optionTextContainer}>
                          <Text
                            style={[
                              styles.optionText,
                              { color: theme === "light" ? "#000" : "#fff" },
                            ]}
                          >
                            {item.label} {/* Dùng label thay vì value */}
                          </Text>
                          {item.description && (
                            <Text
                              style={[
                                styles.optionDescription,
                                { color: theme === "light" ? "#666" : "#bbb" },
                              ]}
                            >
                              {item.description}
                            </Text>
                          )}
                        </View>
                      </View>
                    ) : (
                      // Trường hợp string
                      <Text
                        style={[
                          styles.optionText,
                          { color: theme === "light" ? "#000" : "#fff" },
                        ]}
                      >
                        {item}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
  },
  button: {
    padding: spacing.md,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedText: {
    fontSize: 16,
    color: "#000",
  },
  disabledButton: {
    backgroundColor: "#E0E0E0",
    borderColor: "#CCCCCC",
  },
  disabledText: {
    color: "#888888",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dropdown: {
    width: "80%",
    borderRadius: 8,
    padding: spacing.md,
    maxHeight: 300,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: spacing.md,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  optionDescription: {
    fontSize: 14,
    marginTop: 2,
  },
});

export default FFDropdown;
