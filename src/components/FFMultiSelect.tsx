import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
} from "react-native";
import { useTheme } from "@/src/hooks/useTheme";
import FFText from "./FFText";
import { spacing } from "../theme";

interface MultiSelectOption {
  value: string;
  label: string;
}

interface FFMultiSelectProps {
  options: MultiSelectOption[];
  selectedOptions: string[];
  onSelect: (options: string[]) => void;
  placeholder: string;
  style?: object;
  textStyle?: object;
  optionStyle?: object;
}

const FFMultiSelect: React.FC<FFMultiSelectProps> = ({
  options,
  selectedOptions,
  onSelect,
  placeholder,
  style,
  textStyle,
  optionStyle,
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleDropdown = () => setIsOpen(!isOpen);

  const toggleOption = (value: string) => {
    const newSelection = selectedOptions.includes(value)
      ? selectedOptions.filter((item) => item !== value)
      : [...selectedOptions, value];
    onSelect(newSelection);
  };

  const getSelectedLabels = () => {
    if (selectedOptions.length === 0) return placeholder;
    return selectedOptions
      .map(
        (value) => options.find((opt) => opt.value === value)?.label || value
      )
      .join(", ");
  };

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        ]}
        onPress={toggleDropdown}
      >
        <FFText
          fontWeight="400"
          style={{
            ...styles.selectedText,
            ...textStyle,
            color: theme === "light" ? "#000" : "#fff",
          }}
          //   numberOfLines={1}
        >
          {getSelectedLabels()}
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
              <TextInput
                style={[
                  styles.searchInput,
                  { color: theme === "light" ? "#000" : "#fff" },
                ]}
                placeholder="Search..."
                placeholderTextColor={theme === "light" ? "#666" : "#999"}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <FlatList
                data={filteredOptions}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.option, optionStyle]}
                    onPress={() => toggleOption(item.value)}
                  >
                    <View style={styles.optionContainer}>
                      <View style={styles.checkbox}>
                        {selectedOptions.includes(item.value) && (
                          <View style={styles.checked} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          { color: theme === "light" ? "#000" : "#fff" },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>
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
    padding: spacing.sm,
    borderRadius: 8,
    justifyContent: "center",
  },
  selectedText: {
    fontSize: 16,
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
    maxHeight: 400,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#666",
    borderRadius: 4,
    marginRight: spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  checked: {
    width: 12,
    height: 12,
    backgroundColor: "#666",
    borderRadius: 2,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
});

export default FFMultiSelect;
