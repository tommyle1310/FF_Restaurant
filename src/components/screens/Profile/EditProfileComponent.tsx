import {
  View,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import FFAvatar from "../../FFAvatar";
import FFInputControl from "../../FFInputControl";
import FFDropdown from "../../FFDropdown";
import FFTimePicker from "../../FFTimePicker";
import axiosInstance from "@/src/utils/axiosConfig";
import { useDispatch, useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import * as ImagePicker from "expo-image-picker";
import useUploadImage from "@/src/hooks/useUploadImage";
import { colors, spacing } from "@/src/theme";
import { setAuthState, saveTokenToAsyncStorage } from "@/src/store/authSlice";
import FFText from "@/src/components/FFText";
import FFButton from "@/src/components/FFButton";
import FFMultiSelect from "../../FFMultiSelect";
import FFModal from "../../FFModal";
import FFSpinner from "../../FFSpinner";

interface ContactEmail {
  title: string;
  email: string;
  is_default: boolean;
}

interface ContactPhone {
  title: string;
  number: string;
  is_default: boolean;
}

interface OpeningHours {
  mon: { from: number; to: number };
  tue: { from: number; to: number };
  wed: { from: number; to: number };
  thu: { from: number; to: number };
  fri: { from: number; to: number };
  sat: { from: number; to: number };
  sun: { from: number; to: number };
}

interface Status {
  is_open: boolean;
  is_active: boolean;
  is_accepted_orders: boolean;
}

interface FoodCategory {
  id: string;
  name: string;
}

interface Address {
  id: string;
  title: string;
  street: string;
  city: string;
}

const EditProfileComponent = () => {
  const auth = useSelector((state: RootState) => state.auth);
  const { id, avatar, contact_email, contact_phone, restaurant_id } = auth;
  const dispatch = useDispatch();

  // Loading states
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [restaurantName, setRestaurantName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [description, setDescription] = useState("");
  const [addressId, setAddressId] = useState("");
  const [foodCategoryIds, setFoodCategoryIds] = useState<string[]>([]);

  const [contactEmails, setContactEmails] = useState<ContactEmail[]>(
    contact_email || [{ title: "Primary", email: "", is_default: true }]
  );

  const [contactPhones, setContactPhones] = useState<ContactPhone[]>(
    contact_phone || [{ title: "Primary", number: "", is_default: true }]
  );

  const [openingHours, setOpeningHours] = useState<OpeningHours>({
    mon: { from: 900, to: 2200 },
    tue: { from: 900, to: 2200 },
    wed: { from: 900, to: 2200 },
    thu: { from: 900, to: 2200 },
    fri: { from: 900, to: 2300 },
    sat: { from: 1000, to: 2300 },
    sun: { from: 1000, to: 2200 },
  });

  const [status, setStatus] = useState<Status>({
    is_open: true,
    is_active: true,
    is_accepted_orders: true,
  });

  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error">("success");

  // Options for dropdowns
  const [foodCategories, setFoodCategories] = useState<FoodCategory[]>([]);

  const {
    imageUri,
    setImageUri,
    uploadImage,
    responseData,
    loading: isUploading,
  } = useUploadImage("RESTAURANT_OWNER", id || "");

  useEffect(() => {
    Promise.all([axiosInstance.get("/food-categories")])
      .then(([foodCategoriesRes]) => {
        if (foodCategoriesRes.data.EC === 0) {
          setFoodCategories(foodCategoriesRes.data.data);
        }
      })
      .catch((error) => {
        showModal("Failed to fetch data", "error");
      });
  }, []);

  useEffect(() => {
    if (restaurant_id) {
      setIsLoading(true);
      axiosInstance
        .get(`/restaurants/${restaurant_id}`)
        .then((response) => {
          if (response.data.EC === 0) {
            const data = response.data.data;
            setRestaurantName(data.restaurant_name || "");
            setOwnerName(data.owner_name || "");
            setDescription(data.description || "");
            setAddressId(data.address_id || "");

            if (data.specialize_in && Array.isArray(data.specialize_in)) {
              const specializedIds = data.specialize_in.map(
                (item: any) => item.id
              );
              setFoodCategoryIds(specializedIds);
            }

            setContactEmails(data.contact_email || []);
            setContactPhones(data.contact_phone || []);
            setOpeningHours(data.opening_hours || openingHours);
            setStatus(data.status || status);
          }
        })
        .catch((error) => {
          showModal("Failed to fetch restaurant data", "error");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [restaurant_id]);

  const showModal = (message: string, type: "success" | "error") => {
    setModalMessage(message);
    setModalType(type);
    setIsModalVisible(true);
  };

  const selectImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (result && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        try {
          await uploadImage(asset.uri);
        } catch (uploadError: any) {
          console.log("Image Upload Error Details:", {
            message: uploadError.message,
            code: uploadError.code,
            name: uploadError.name,
            stack: uploadError.stack,
            config: uploadError.config
              ? {
                  url: uploadError.config.url,
                  method: uploadError.config.method,
                  headers: uploadError.config.headers,
                }
              : "No config available",
            response: uploadError.response
              ? {
                  status: uploadError.response.status,
                  data: uploadError.response.data,
                  headers: uploadError.response.headers,
                }
              : "No response available",
          });

          let errorMessage = "Failed to upload image: ";
          if (uploadError.message.includes("Network Error")) {
            errorMessage += "Please check your internet connection";
          } else if (uploadError.response?.status === 413) {
            errorMessage += "Image file is too large";
          } else if (uploadError.response?.status === 415) {
            errorMessage += "Unsupported image format";
          } else {
            errorMessage +=
              uploadError.response?.data?.message ||
              uploadError.message ||
              "Unknown error";
          }

          showModal(errorMessage, "error");
        }
      }
    } catch (error: any) {
      console.log("Image Picker Error Details:", {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack,
      });
      showModal(
        `Failed to select image: ${error.message || "Unknown error"}`,
        "error"
      );
    }
  };

  useEffect(() => {
    if (responseData) {
      const newAuthState = {
        ...auth,
        avatar: responseData.avatar,
      };

      // Update both Redux and AsyncStorage
      Promise.all([
        dispatch(setAuthState(newAuthState)),
        dispatch(saveTokenToAsyncStorage(newAuthState)),
      ])
        .then(() => {
          showModal("Avatar updated successfully", "success");
        })
        .catch(() => {
          showModal("Failed to update local state", "error");
        });
    }
  }, [responseData]);

  const handleContactEmailsChange = (newEmails: ContactEmail[]) => {
    setContactEmails(newEmails);
  };

  const handleContactPhonesChange = (newPhones: ContactPhone[]) => {
    setContactPhones(newPhones);
  };

  const addContactEmail = () => {
    const newEmails = [
      ...contactEmails,
      { title: "", email: "", is_default: false },
    ];
    handleContactEmailsChange(newEmails);
  };

  const addContactPhone = () => {
    const newPhones = [
      ...contactPhones,
      { title: "", number: "", is_default: false },
    ];
    handleContactPhonesChange(newPhones);
  };

  const updateContactEmail = (
    index: number,
    field: keyof ContactEmail,
    value: string
  ) => {
    const newEmails = [...contactEmails];
    newEmails[index] = { ...newEmails[index], [field]: value };
    handleContactEmailsChange(newEmails);
  };

  const updateContactPhone = (
    index: number,
    field: keyof ContactPhone,
    value: string
  ) => {
    const newPhones = [...contactPhones];
    newPhones[index] = { ...newPhones[index], [field]: value };
    handleContactPhonesChange(newPhones);
  };

  const removeContactEmail = (index: number) => {
    const newEmails = contactEmails.filter((_, i) => i !== index);
    handleContactEmailsChange(newEmails);
  };

  const removeContactPhone = (index: number) => {
    const newPhones = contactPhones.filter((_, i) => i !== index);
    handleContactPhonesChange(newPhones);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.patch(
        `/restaurants/${restaurant_id}`,
        {
          restaurant_name: restaurantName,
          owner_name: ownerName,
          description,
          address_id: addressId,
          specialize_in: foodCategoryIds,
          contact_email: contactEmails,
          contact_phone: contactPhones,
          opening_hours: openingHours,
          status,
          avatar: avatar,
        }
      );

      if (response.data.EC === 0) {
        const newAuthState = {
          ...auth,
          ...response.data.data,
        };

        // Update both Redux and AsyncStorage
        await Promise.all([
          dispatch(setAuthState(newAuthState)),
          dispatch(saveTokenToAsyncStorage(newAuthState)),
        ]);

        showModal("Restaurant updated successfully", "success");
      } else {
        showModal(response.data.EM || "Failed to update restaurant", "error");
      }
    } catch (error) {
      showModal("Failed to update restaurant", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ScrollView>
        <View style={styles.container}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={selectImage} disabled={isUploading}>
              {imageUri ? (
                <FFAvatar onPress={selectImage} size={80} avatar={imageUri} />
              ) : (
                <FFAvatar
                  onPress={selectImage}
                  avatar={avatar?.url}
                  size={80}
                />
              )}
            </TouchableOpacity>
          </View>

          <FFInputControl
            value={restaurantName}
            setValue={setRestaurantName}
            label="Restaurant Name"
            placeholder="Enter restaurant name"
            error=""
          />

          <FFInputControl
            value={ownerName}
            setValue={setOwnerName}
            label="Owner Name"
            placeholder="Enter owner name"
            error=""
          />

          <FFInputControl
            value={description}
            setValue={setDescription}
            label="Description"
            placeholder="Enter description"
            error=""
          />

          <View style={styles.dropdownContainer}>
            <FFText style={styles.dropdownLabel}>Food Categories</FFText>
            <FFMultiSelect
              options={foodCategories.map((cat) => ({
                value: cat.id,
                label: cat.name,
              }))}
              selectedOptions={foodCategoryIds}
              onSelect={setFoodCategoryIds}
              placeholder="Select food categories"
            />
          </View>

          <View style={styles.contactSection}>
            <FFText style={styles.sectionTitle}>Contact Emails</FFText>
            {contactEmails.map((email, index) => (
              <View key={index} style={styles.contactItem}>
                <FFInputControl
                  value={email.title}
                  setValue={(value) =>
                    updateContactEmail(
                      index,
                      "title",
                      typeof value === "function" ? value(email.title) : value
                    )
                  }
                  label="Title"
                  placeholder="e.g. Work, Home"
                  error=""
                />
                <FFInputControl
                  value={email.email}
                  setValue={(value) =>
                    updateContactEmail(
                      index,
                      "email",
                      typeof value === "function" ? value(email.email) : value
                    )
                  }
                  label="Email"
                  placeholder="email@example.com"
                  error=""
                />
                {index > 0 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeContactEmail(index)}
                  >
                    <FFText style={styles.removeButtonText}>Remove</FFText>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity
              style={styles.addButton}
              onPress={addContactEmail}
            >
              <FFText style={styles.addButtonText}>+ Add Email</FFText>
            </TouchableOpacity>
          </View>

          <View style={styles.contactSection}>
            <FFText style={styles.sectionTitle}>Contact Phones</FFText>
            {contactPhones.map((phone, index) => (
              <View key={index} style={styles.contactItem}>
                <FFInputControl
                  value={phone.title}
                  setValue={(value) =>
                    updateContactPhone(
                      index,
                      "title",
                      typeof value === "function" ? value(phone.title) : value
                    )
                  }
                  label="Title"
                  placeholder="e.g. Mobile, Work"
                  error=""
                />
                <FFInputControl
                  value={phone.number}
                  setValue={(value) =>
                    updateContactPhone(
                      index,
                      "number",
                      typeof value === "function" ? value(phone.number) : value
                    )
                  }
                  label="Number"
                  placeholder="(+84) XXXXXXXXX"
                  error=""
                />
                {index > 0 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeContactPhone(index)}
                  >
                    <FFText style={styles.removeButtonText}>Remove</FFText>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity
              style={styles.addButton}
              onPress={addContactPhone}
            >
              <FFText style={styles.addButtonText}>+ Add Phone</FFText>
            </TouchableOpacity>
          </View>

          <View style={styles.contactSection}>
            <FFText style={styles.sectionTitle}>Opening Hours</FFText>
            {Object.entries(openingHours).map(([day, hours]) => (
              <View key={day} style={styles.openingHoursItem}>
                <FFText style={styles.dayLabel}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </FFText>
                <View style={styles.timeInputsContainer}>
                  <View style={styles.timeInput}>
                    <FFTimePicker
                      label="From"
                      value={hours.from}
                      onChange={(value) => {
                        const newHours = { ...openingHours };
                        newHours[day as keyof OpeningHours] = {
                          ...hours,
                          from: value,
                        };
                        setOpeningHours(newHours);
                      }}
                      labelStyle={styles.timePickerLabel}
                      inputStyle={styles.timePickerInput}
                    />
                  </View>
                  <View style={styles.timeInput}>
                    <FFTimePicker
                      label="To"
                      value={hours.to}
                      onChange={(value) => {
                        const newHours = { ...openingHours };
                        newHours[day as keyof OpeningHours] = {
                          ...hours,
                          to: value,
                        };
                        setOpeningHours(newHours);
                      }}
                      labelStyle={styles.timePickerLabel}
                      inputStyle={styles.timePickerInput}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>

          <FFButton
            variant="primary"
            onPress={handleSubmit}
            style={styles.submitButton}
          >
            Update Restaurant
          </FFButton>
        </View>

        <FFModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
        >
          <View style={[styles.modalContent]}>
            <FFText style={styles.modalText}>{modalMessage}</FFText>
          </View>
        </FFModal>
      </ScrollView>

      <FFSpinner isVisible={isLoading || isUploading} isOverlay />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    elevation: 10,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: spacing.veryLarge,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  avatarContainer: {
    alignItems: "center",
  },
  contactSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  contactItem: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  addButton: {
    padding: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: colors.primary,
    fontWeight: "600",
  },
  removeButton: {
    alignSelf: "flex-end",
    padding: spacing.xs,
  },
  removeButtonText: {
    color: colors.error,
    fontSize: 14,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  dropdownContainer: {
    gap: spacing.xs,
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalContent: {
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
  modalText: {
    // color: colors.white,
    fontSize: 16,
    textAlign: "center",
  },
  openingHoursItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayLabel: {
    width: 80,
    fontSize: 16,
    fontWeight: "500",
  },
  timeInputsContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    gap: spacing.sm,
  },
  timeInput: {
    flex: 1,
    flexDirection: "column",
    gap: spacing.xs,
  },
  timePickerLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  timePickerInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});

export default EditProfileComponent;
