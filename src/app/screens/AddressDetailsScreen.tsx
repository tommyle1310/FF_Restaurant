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
import { RouteProp, useRoute } from "@react-navigation/native";
import { MainStackParamList } from "@/src/navigation/AppNavigator";
import { Type_Address } from "@/src/types/Address";
import axiosInstance from "@/src/utils/axiosConfig";
import FFModal from "@/src/components/FFModal";
import { useDispatch, useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import FFToggle from "@/src/components/FFToggle";
import { spacing } from "@/src/theme";

type AddressDetailRouteProp = RouteProp<MainStackParamList, "AddressDetails">;

const AddressDetailsScreen = () => {
  const dispatch = useDispatch();
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
  const { address, id } = useSelector((state: RootState) => state.auth);

  const route = useRoute<AddressDetailRouteProp>();

  const addressDetail = route.params?.addressDetail;
  const is_create_type = route.params?.is_create_type;

  useEffect(() => {
    if (addressDetail && !is_create_type) {
      const { id, city, is_default, location, nationality, street, title } =
        addressDetail;
      setAddressTitle(title);
      setCity(city);
      setNationality(nationality);
      setStreet(street);
      setSelectedLocation(location);
    }
  }, [addressDetail, is_create_type]);

  const handleCountrySelect = (item: any) => {
    setCountryCode(item.dial_code);
    setNationality(item.name.en);
    setIsShowCountryPicker(false);
  };

  // const handleSubmit = async () => {
  //   let requestBody = {
  //     city,
  //     street,
  //     nationality,
  //     is_default: isDefaultAddress,
  //     created_at: Math.floor(Date.now() / 1000),
  //     updated_at: Math.floor(Date.now() / 1000),
  //     title: addressTitle,
  //     postal_code: +postalCode,
  //     location: selectedLocation,
  //   } as Type_Address & { created_at: number; updated_at: number };

  //   let response: { data: { EC: number; EM: string; data: any } };

  //   try {
  //     if (is_create_type) {
  //       response = await axiosInstance.post(
  //         `/customers/address/${id}`,
  //         requestBody,
  //         {
  //           validateStatus: () => true,
  //         }
  //       );
  //       if (response.data.EC === 0) {
  //         dispatch(addAddress(response.data.data));
  //         dispatch(addAddressInAsyncStorage(response.data.data));
  //       }
  //     } else {
  //       response = await axiosInstance.patch(
  //         `/address_books/${addressDetail?.id}`,
  //         requestBody,
  //         {
  //           validateStatus: () => true,
  //         }
  //       );
  //       if (response.data.EC === 0) {
  //         dispatch(updateSingleAddress(response.data.data));
  //       }
  //     }

  //     const { EC, EM } = response.data;
  //     if (EC === 0) {
  //       setIsShowSlideUpModal(false);
  //       setIsShowModalSuccess(true);

  //       // Reset form if creating new address
  //       if (is_create_type) {
  //         setStreet("");
  //         setCity("");
  //         setNationality("");
  //         setAddressTitle("");
  //         setSelectedLocation(null);
  //         setPostalCode("70000");
  //         setIsDefaultAddress(false);
  //       }
  //     } else {
  //       console.log("Error:", EM);
  //     }
  //   } catch (error) {
  //     console.error("Error submitting address:", error);
  //   }
  // };

  return (
    <FFSafeAreaView>
      <LocationPicker
        propsLocation={!is_create_type ? addressDetail?.location : null}
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
          {is_create_type
            ? "Successfully added new address"
            : "Successfully updated address"}
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
