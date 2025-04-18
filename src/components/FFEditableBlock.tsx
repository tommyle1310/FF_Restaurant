import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { colors, spacing } from "@/src/theme";
import FFText from "./FFText";
import FFInputControl from "./FFInputControl";
import IconIonicons from "react-native-vector-icons/Ionicons";

export interface MenuItemVariant {
  variant: string;
  description?: string;
  price: string;
}

interface FFEditableBlockProps {
  items: MenuItemVariant[];
  onItemsChange: (items: MenuItemVariant[]) => void;
}

const FFEditableBlock: React.FC<FFEditableBlockProps> = ({
  items,
  onItemsChange,
}) => {
  const handleAddItem = () => {
    onItemsChange([...items, { variant: "", description: "", price: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onItemsChange(newItems);
  };

  const createChangeHandler = (index: number, field: keyof MenuItemVariant) => {
    return (value: React.SetStateAction<string>) => {
      const newItems = [...items];
      const currentValue =
        field === "description"
          ? newItems[index][field] || ""
          : newItems[index][field];
      const actualValue =
        typeof value === "function" ? value(currentValue) : value;
      newItems[index] = { ...newItems[index], [field]: actualValue };
      onItemsChange(newItems);
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <FFText fontSize="md" fontWeight="600">
          Variants
        </FFText>
        <FFText fontSize="sm" style={styles.subtitle}>
          Add at least one variant for your menu item
        </FFText>
      </View>

      {items.map((item, index) => (
        <View key={index} style={styles.itemContainer}>
          <View style={styles.itemHeader}>
            <FFText fontSize="sm" fontWeight="600">
              Variant {index + 1}
            </FFText>
            {items.length > 1 && (
              <TouchableOpacity
                onPress={() => handleRemoveItem(index)}
                style={styles.removeButton}
              >
                <IconIonicons
                  name="trash-outline"
                  size={20}
                  color={colors.error}
                />
              </TouchableOpacity>
            )}
          </View>

          <FFInputControl<string>
            label="Variant Name *"
            value={item.variant}
            setValue={createChangeHandler(index, "variant")}
            placeholder="e.g., Small, Medium, Large"
            error={null}
          />

          <FFInputControl<string>
            label="Description"
            value={item.description || ""}
            setValue={createChangeHandler(index, "description")}
            placeholder="Enter variant description"
            error={null}
          />

          <FFInputControl<string>
            label="Price *"
            value={item.price}
            setValue={createChangeHandler(index, "price")}
            placeholder="Enter variant price"
            isNumeric={true}
            error={null}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
        <IconIonicons
          name="add-circle-outline"
          size={24}
          color={colors.primary}
        />
        <FFText fontSize="sm" style={styles.addButtonText}>
          Add Another Variant
        </FFText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: spacing.md,
  },
  headerContainer: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  itemContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.md,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  removeButton: {
    padding: spacing.xs,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.primary,
    borderRadius: 8,
    justifyContent: "center",
  },
  addButtonText: {
    color: colors.primary,
    marginLeft: spacing.xs,
  },
});

export default FFEditableBlock;
