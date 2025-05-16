import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import LocationPicker from "@/src/components/Maps/LocationPicker";
import SlideUpModal from "@/src/components/FFSlideUpModal";
import FFInputControl from "@/src/components/FFInputControl";
import FFText from "@/src/components/FFText";
import FFButton from "@/src/components/FFButton";
import { CountryPicker } from "react-native-country-codes-picker";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { MainStackParamList } from "@/src/navigation/AppNavigator";
import { Type_Address } from "@/src/types/Address";
import axiosInstance from "@/src/utils/axiosConfig";
import FFModal from "@/src/components/FFModal";
import { useDispatch, useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import FFToggle from "@/src/components/FFToggle";
import { spacing } from "@/src/theme";
import { setAuthState, saveTokenToAsyncStorage } from "@/src/store/authSlice";
import FFSpinner from "@/src/components/FFSpinner";
import { StackNavigationProp } from "@react-navigation/stack";

type AddressDetailRouteProp = RouteProp<MainStackParamList, "AddressDetails">;
type AddressDetailNavigationProp = StackNavigationProp<MainStackParamList>;

const AddressDetailsScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<AddressDetailNavigationProp>();
  const [isLoading, setIsLoading] = useState(false);
  const [isShowSlideUpModal, setIsShowSlideUpModal] = useState(false);
  const [isShowModalSuccess, setIsShowModalSuccess] = useState(false);
  const [isShowCountryPicker, setIsShowCountryPicker] = useState(false);
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);
  const [postalCode, setPostalCode] = useState("70000");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [nationality, setNationality] = useState("");
  const [addressTitle, setAddressTitle] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const { address, id, restaurant_id } = useSelector((state: RootState) => state.auth);

  const route = useRoute<AddressDetailRouteProp>();
  const addressDetail = route.params?.addressDetail;
  const is_create_type = route.params?.is_create_type;

  useEffect(() => {
    if (addressDetail && !is_create_type) {
      const { id, city, is_default, location, nationality, street, title, postal_code } = addressDetail;
      setAddressTitle(title);
      setCity(city);
      setNationality(nationality);
      setStreet(street);
      setSelectedLocation(location);
      setPostalCode(postal_code?.toString() || "70000");
      setIsDefaultAddress(is_default || false);
    }
  }, [addressDetail, is_create_type]);

  const handleCountrySelect = (item: any) => {
    setCountryCode(item.dial_code);
    setNationality(item.name.en);
    setIsShowCountryPicker(false);
  };

  const handleSubmit = async () => {
    if (!selectedLocation) {
      setModalMessage("Please select a location on the map");
      setIsShowModalSuccess(true);
      return;
    }

    setIsLoading(true);
    try {
      const addressData = {
        street,
        city,
        nationality,
        is_default: isDefaultAddress,
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000),
        postal_code: +postalCode,
        location: {
          lng: selectedLocation.lng,
          lat: selectedLocation.lat
        },
        title: addressTitle,
      };
      console.log('cehck adres data', addressData, 'adre detail',addressDetail)
      let addressResponse;
      if (is_create_type) {
        // Create new address
        addressResponse = await axiosInstance.post('/address_books', addressData);
      } else {
        // Update existing address
        addressResponse = await axiosInstance.patch(`/address_books/${addressDetail?.id}`, addressData);
      }

      console.log('cehck addre respo', addressResponse.data)
      if (addressResponse.data.EC === 0) {
        // Update restaurant with new address
        const restaurantResponse = await axiosInstance.patch(`/restaurants/${restaurant_id}`, {
          address_id: addressResponse.data.data.id
        });

        console.log('cehk res data', restaurantResponse.data)
        if (restaurantResponse.data.EC === 0) {
          const newAuthState = {
            ...restaurantResponse.data.data,
            address: {
              ...addressData,
              id: addressResponse.data.data.id
            }
          };

          // Update both Redux and AsyncStorage
          await Promise.all([
            dispatch(setAuthState(newAuthState)),
            dispatch(saveTokenToAsyncStorage(newAuthState))
          ]);

          setIsShowSlideUpModal(false);
          setIsShowModalSuccess(true);

          // Reset form if creating new address
          if (is_create_type) {
            setStreet("");
            setCity("");
            setNationality("");
            setAddressTitle("");
            setSelectedLocation(null);
            setPostalCode("70000");
            setIsDefaultAddress(false);
          }

          // Navigate back to settings after a short delay
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'BottomTabs' }],
            });
          }, 1500);
        } else {
          setModalMessage("Failed to update restaurant address");
          setIsShowModalSuccess(true);
        }
      } else {
        setModalMessage(addressResponse.data.EM || "Failed to save address");
        setIsShowModalSuccess(true);
      }
    } catch (error) {
      setModalMessage("An error occurred while saving the address");
      setIsShowModalSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  const [modalMessage, setModalMessage] = useState("");

  return (
    <FFSafeAreaView>
      <LocationPicker
        propsLocation={!is_create_type ? addressDetail?.location : undefined}
        setPropsLocation={setSelectedLocation}
      />
      <FFButton
        onPress={() => setIsShowSlideUpModal(true)}
        style={{ position: "absolute", bottom: 30, right: 30 }}
      >
        Next
      </FFButton>
      <FFModal
        onClose={() => setIsShowModalSuccess(false)}
        visible={isShowModalSuccess}
      >
        <FFText>
          {modalMessage || (is_create_type
            ? "Successfully added new address"
            : "Successfully updated address")}
        </FFText>
      </FFModal>
      <SlideUpModal
        isVisible={isShowSlideUpModal}
        onClose={() => {
          setIsShowSlideUpModal(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View>
              <FFInputControl
                error={""}
                label="Street Name"
                placeholder="102 Phan Van Teo"
                setValue={setStreet}
                value={street}
              />
              <FFInputControl
                error={""}
                label="City"
                placeholder="Saigon"
                setValue={setCity}
                value={city}
              />
              <FFInputControl
                error={""}
                label="Postal Code"
                placeholder="70000"
                setValue={setPostalCode}
                value={postalCode}
              />
              <FFInputControl
                error={""}
                label="Address Title"
                placeholder="Home"
                setValue={setAddressTitle}
                value={addressTitle}
              />
              <View>
                <FFText
                  style={{ color: "#333", fontSize: 14 }}
                  fontWeight="400"
                >
                  Nationality
                </FFText>
                <TouchableOpacity
                  onPress={() => setIsShowCountryPicker(true)}
                  style={styles.textInputContainer}
                >
                  <TextInput
                    style={styles.textInput}
                    editable={false}
                    placeholder="Select Country"
                    value={nationality}
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                className="flex flex-row items-center gap-2"
                onPress={() => setIsShowCountryPicker(true)}
              >
                <FFText fontWeight="400" fontSize="md">
                  Set this as default address
                </FFText>
                <FFToggle
                  onChange={() => setIsDefaultAddress(!isDefaultAddress)}
                />
              </TouchableOpacity>
            </View>

            <FFButton
              className="w-full"
              style={{ marginTop: spacing.lg }}
              onPress={handleSubmit}
              isLinear
            >
              {is_create_type ? "Add Address" : "Save Changes"}
            </FFButton>
          </ScrollView>
        </KeyboardAvoidingView>
        <CountryPicker
          show={isShowCountryPicker}
          pickerButtonOnPress={handleCountrySelect}
          inputPlaceholder="Select Country"
          lang="en"
          enableModalAvoiding={false}
          androidWindowSoftInputMode="adjustPan"
        />
      </SlideUpModal>
      <FFSpinner isVisible={isLoading} isOverlay />
    </FFSafeAreaView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  textInput: {
    height: 40,
    fontSize: 16,
    color: "black",
    paddingLeft: spacing.md,
  },
  textInputContainer: {
    marginBottom: spacing.lg,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: spacing.md,
  },
});

export default AddressDetailsScreen;
