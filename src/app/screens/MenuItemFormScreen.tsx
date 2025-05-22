import React, { useState, useEffect } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { MainStackParamList } from "@/src/navigation/AppNavigator";
import FFView from "@/src/components/FFView";
import FFText from "@/src/components/FFText";
import FFInputControl from "@/src/components/FFInputControl";
import FFButton from "@/src/components/FFButton";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import IconIonicons from "react-native-vector-icons/Ionicons";
import theme, { colors, spacing } from "@/src/theme";
import axiosInstance from "@/src/utils/axiosConfig";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import Spinner from "@/src/components/FFSpinner";
import FFMultiSelect from "@/src/components/FFMultiSelect";
import useUploadImage from "@/src/hooks/useUploadImage";
import * as ImagePicker from "expo-image-picker";
import FFEditableBlock, {
  MenuItemVariant,
} from "@/src/components/FFEditableBlock";
import FFModal from "@/src/components/FFModal";

type MenuItemFormNavigationProp = StackNavigationProp<
  MainStackParamList,
  "MenuItemForm"
>;

interface FoodCategory {
  id: string;
  name: string;
}

interface MenuItemForm {
  name: string;
  description: string;
  price: string;
  discountPrice: string;
  categories: string[];
  image?: {
    uri: string;
    type: string;
    name: string;
  };
}

interface MenuItemRequestBody {
  name: string;
  description: string;
  price: number;
  restaurant_id: string;
  category: string[];
  variants: {
    variant: string;
    description?: string;
    price: number;
  }[];
  discount_price?: number;
}

const MenuItemFormScreen = () => {
  const navigation = useNavigation<MenuItemFormNavigationProp>();
  const route = useRoute();
  const menuItemId = (route.params as any)?.menuItemId;
  const globalState = useSelector((state: RootState) => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  const [foodCategories, setFoodCategories] = useState<FoodCategory[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [image, setImage] = useState<MenuItemForm["image"]>();
  const [variants, setVariants] = useState<MenuItemVariant[]>([
    { variant: "", description: "", price: "" },
  ]);
  const [isShowStatusModal, setIsShowStatusModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    fetchFoodCategories();
    if (menuItemId) {
      fetchMenuItemDetails();
    }
  }, [menuItemId]);

  const fetchFoodCategories = async () => {
    try {
      const response = await axiosInstance.get("/food-categories");
      if (response.data.EC === 0) {
        setFoodCategories(response.data.data);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch food categories");
    }
  };

  const fetchMenuItemDetails = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/menu-items/${menuItemId}`);
      if (response.data.EC === 0) {
        const { menuItem, variants } = response.data.data;
        console.log("chcek menu item cate", menuItem.category);
        setName(menuItem.name);
        setDescription(menuItem.description || "");
        setPrice(menuItem.price.toString());
        setDiscountPrice(menuItem.discount?.discount_value?.toString() || "");
        setSelectedCategories(menuItem.category.map((cat: any) => cat));
        if (menuItem.avatar) {
          setImage({
            uri: menuItem.avatar.url,
            type: "image/jpeg",
            name: "existing_image.jpg",
          });
        }
        // Set variants
        if (variants && variants.length > 0) {
          setVariants(
            variants.map((v: any) => ({
              variant: v.variant,
              description: v.description || "",
              price: v.price.toString(),
            }))
          );
        }
      } else {
        Alert.alert(
          "Error",
          response.data.EM || "Failed to fetch menu item details"
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch menu item details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (result && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImage({
          uri: asset.uri,
          type: "image/jpeg",
          name: "photo.jpg",
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleSubmit = async () => {
    if (
      !name ||
      !price ||
      variants.length === 0 ||
      !variants[0].variant ||
      !variants[0].price
    ) {
      setStatusMessage(
        "Please fill in all required fields including at least one variant"
      );
      setIsShowStatusModal(true);
      return;
    }

    if (!globalState.restaurant_id) {
      setStatusMessage("Restaurant ID not found");
      setIsShowStatusModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const reqBody: MenuItemRequestBody = {
        name,
        description,
        price: parseFloat(price),
        restaurant_id: globalState.restaurant_id.toString(),
        category: selectedCategories,
        variants: variants.map((variant) => ({
          variant: variant.variant,
          description: variant.description,
          price: parseFloat(variant.price),
        })),
      };

      if (discountPrice) {
        reqBody.discount_price = parseFloat(discountPrice);
      }

      const endpoint = menuItemId
        ? `/restaurants/menu-items/${globalState.restaurant_id}/${menuItemId}`
        : `/restaurants/menu-items/${globalState.restaurant_id}`;

      const method = menuItemId ? "patch" : "post";

      const response = await axiosInstance[method](endpoint, reqBody);
      console.log("cehc kresposne ", response.data);
      if (response.data.EC === 0) {
        // If we have an image to upload and the menu item was created successfully
        if (image) {
          try {
            const formData = new FormData();
            formData.append("file", {
              uri: image.uri,
              type: "image/jpeg",
              name: "photo.jpg",
            } as any);
            formData.append("userType", "MENU_ITEM");
            formData.append("entityId", menuItemId || response.data.data.id);

            const responseAvatar = await axiosInstance.post(
              "/upload/avatar",
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );
          } catch (error) {
            console.error("Failed to upload image:", error);
            // We don't show an error alert here since the menu item was created successfully
          }
        }

        setStatusMessage(
          `Menu item ${menuItemId ? "updated" : "created"} successfully`
        );
        setIsShowStatusModal(true);
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        setStatusMessage(
          response.data.EM ||
            `Failed to ${menuItemId ? "update" : "create"} menu item`
        );
        setIsShowStatusModal(true);
      }
    } catch (error) {
      setStatusMessage(
        `Failed to ${menuItemId ? "update" : "create"} menu item`
      );
      setIsShowStatusModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!menuItemId) return;

    setStatusMessage("Are you sure you want to delete this menu item?");
    setIsShowStatusModal(true);
  };

  const confirmDelete = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.delete(
        `/restaurants/menu-items/${menuItemId}`
      );
      if (response.data.EC === 0) {
        setStatusMessage("Menu item deleted successfully");
        setIsShowStatusModal(true);
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        setStatusMessage(response.data.EM || "Failed to delete menu item");
        setIsShowStatusModal(true);
      }
    } catch (error) {
      setStatusMessage("Failed to delete menu item");
      setIsShowStatusModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Spinner isVisible isOverlay />;
  }

  return (
    <FFView style={styles.container}>
      <FFModal
        visible={isShowStatusModal}
        onClose={() => setIsShowStatusModal(false)}
      >
        <View style={styles.statusModalContent}>
          <FFText style={{ textAlign: "center" }}>{statusMessage}</FFText>
          {statusMessage ===
          "Are you sure you want to delete this menu item?" ? (
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.statusModalButton, styles.cancelButton]}
                onPress={() => setIsShowStatusModal(false)}
              >
                <FFText style={styles.statusModalButtonText}>Cancel</FFText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusModalButton, styles.deleteButton]}
                onPress={confirmDelete}
              >
                <FFText style={styles.statusModalButtonText}>Delete</FFText>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.statusModalButton}
              onPress={() => setIsShowStatusModal(false)}
            >
              <FFText style={styles.statusModalButtonText}>OK</FFText>
            </TouchableOpacity>
          )}
        </View>
      </FFModal>

      <FFScreenTopSection
        navigation={navigation}
        title={menuItemId ? "Edit Menu Item" : "Add Menu Item"}
        titlePosition="left"
      />
      <ScrollView>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={handleImagePick}
          >
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <IconIonicons
                  name="image-outline"
                  size={40}
                  color={colors.textSecondary}
                />
                <FFText fontSize="sm" style={styles.imagePlaceholderText}>
                  Choose an image for your menu item. Max 2MB
                </FFText>
              </View>
            )}
          </TouchableOpacity>

          <FFInputControl
            label="Item Name *"
            value={name}
            setValue={setName}
            placeholder="Enter item name"
            error={null}
          />

          <FFInputControl
            label="Description"
            value={description}
            setValue={setDescription}
            placeholder="Enter description"
            error={null}
          />

          <FFInputControl<string>
            label="Price"
            value={price}
            setValue={setPrice}
            placeholder="Enter price"
            isNumeric={true}
          />

          <FFInputControl
            label="Discount Price"
            value={discountPrice}
            setValue={setDiscountPrice}
            placeholder="Enter discount price"
            error={null}
          />

          <View style={{ gap: 4 }}>
            <FFText style={{ fontSize: theme.typography.fontSize.sm }}>
              Categories
            </FFText>
            <FFMultiSelect
              options={foodCategories.map((cat) => ({
                value: cat.id,
                label: cat.name,
              }))}
              selectedOptions={selectedCategories}
              onSelect={setSelectedCategories}
              placeholder="Select categories"
            />
          </View>

          <FFEditableBlock items={variants} onItemsChange={setVariants} />

          <FFButton
            variant="primary"
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            {menuItemId ? "Update" : "Create"}
          </FFButton>

          {menuItemId && (
            <FFButton
              variant="outline"
              style={styles.deleteActionButton}
              onPress={handleDelete}
            >
              Delete Menu Item
            </FFButton>
          )}
        </View>
      </ScrollView>
    </FFView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  imageContainer: {
    width: 160,
    alignSelf: "center",
    aspectRatio: 1,
    borderWidth: 1,
    elevation: 2,
    borderColor: colors.border,
    marginBottom: spacing.md,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
  },
  imagePlaceholderText: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  submitButton: {
    marginTop: spacing.lg,
  },
  deleteActionButton: {
    marginTop: spacing.md,
  },
  statusModalContent: {
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.md,
  },
  statusModalButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginTop: spacing.sm,
    minWidth: 100,
  },
  statusModalButtonText: {
    color: colors.white,
    textAlign: "center",
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: colors.textSecondary,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
});

export default MenuItemFormScreen;
