// Signup.js
import React, { useState } from "react";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import { useNavigation } from "@react-navigation/native";
import FFAuthForm from "./FFAuthForm";
import { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import { RootStackParamList } from "@/src/navigation/AppNavigator";
import axiosInstance from "@/src/utils/axiosConfig";
import { useDispatch } from "@/src/store/types";
import { setAuthState } from "@/src/store/authSlice";
import FFModal from "@/src/components/FFModal";
import FFText from "@/src/components/FFText";
import {
  TextInput,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from "react-native";
import IconIonicon from "react-native-vector-icons/Ionicons";
import FFButton from "@/src/components/FFButton";
import Spinner from "@/src/components/FFSpinner";

type SignupScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Signup"
>;

const Signup = () => {
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [modalStatus, setModalStatus] = useState<
    "ENTER_CODE" | "VERIFIED_SUCCESS"
  >("ENTER_CODE");
  const [isOpenVerificationModal, setIsOpenVerificationModal] =
    useState<boolean>(false);

  const handleSignupSubmit = (formData: any) => {
    setLoading(true);
    const requestBody = {
      email: formData.email,
      first_name: formData.first_name,
      last_name: formData.last_name,
      password: formData.password,
      owner_name: formData.owner_name,
      restaurant_name: formData.restaurant_name,
      address_id: "FF_AB_40738608-fdb9-4173-b4dc-93d88e9c15c7",
      contact_email:
        formData.contact_email.length > 0
          ? formData.contact_email
          : [
              {
                title: "Main Contact",
                email: formData.email,
                is_default: true,
              },
            ],
      contact_phone:
        formData.contact_phone.length > 0
          ? formData.contact_phone
          : [
              {
                title: "Main Contact",
                number: "",
                is_default: true,
              },
            ],
      status: formData.status || {
        is_active: true,
        is_open: true,
        is_accepted_orders: true,
      },
      opening_hours: formData.opening_hours || {
        mon: { from: 900, to: 2200 },
        tue: { from: 900, to: 2200 },
        wed: { from: 900, to: 2200 },
        thu: { from: 900, to: 2200 },
        fri: { from: 900, to: 2300 },
        sat: { from: 1000, to: 2300 },
        sun: { from: 1000, to: 2200 },
      },
    };

    axiosInstance
      .post("/auth/register-restaurant", requestBody, {
        validateStatus: () => true,
      })
      .then((response) => {
        setLoading(false);
        if (response.data) {
          const { EC, EM } = response.data;
          if (EC === 0) {
            setEmail(formData.email);
            setIsOpenVerificationModal(true);
          } else {
            setError(EM);
          }
        } else {
          setError("Something went wrong. Please try again.");
        }
      })
      .catch((error) => {
        setLoading(false);
        setError("Network error. Please try again later.");
      });
  };

  const handleSubmitVerificationCode = () => {
    const requestBody = {
      email: email,
      code: verificationCode,
    };

    axiosInstance
      .post("/auth/verify-email", requestBody, {
        validateStatus: () => true,
      })
      .then((response) => {
        setLoading(false);
        if (response.data) {
          const { EC, EM } = response.data;
          if (EC === 0) {
            setModalStatus("VERIFIED_SUCCESS");
          } else {
            setError(EM);
          }
        } else {
          setError("Something went wrong. Please try again.");
        }
      })
      .catch((error) => {
        setLoading(false);
        setError("Network error. Please try again later.");
      });
  };

  return (
    <FFSafeAreaView>
      <LinearGradient
        colors={["#8fa3d9", "#b5b3a1", "#b5e1a1"]}
        start={[1, 0]}
        end={[0, 1]}
        style={styles.container}
      >
        <Spinner
          isVisible={loading}
          isOverlay={true}
          overlayColor="rgba(0, 0, 0, 0.5)"
        />
        <FFAuthForm
          isSignUp={true}
          onSubmit={handleSignupSubmit}
          navigation={navigation}
          error={error}
        />
      </LinearGradient>

      <FFModal
        disabledClose
        visible={isOpenVerificationModal}
        onClose={() => setIsOpenVerificationModal(false)}
      >
        {modalStatus === "ENTER_CODE" ? (
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>You're almost there!</Text>
            <View style={styles.modalSubtitleContainer}>
              <Text style={styles.modalSubtitle}>
                One last step before starting your wonderful journey in
                Flashfood!
              </Text>
              <View style={styles.modalEmailContainer}>
                <Text style={styles.modalEmailDescription}>
                  We have just sent you a verification code to{" "}
                </Text>
                <Text style={styles.modalEmail}>{email}!</Text>
              </View>
            </View>
            <View style={styles.verificationInputContainer}>
              <Text style={styles.verificationInputLabel}>
                Enter your verification code:
              </Text>
              <TextInput
                style={styles.verificationInput}
                keyboardType="number-pad"
                onChangeText={(text) =>
                  /^[0-9]*$/.test(text) && setVerificationCode(text)
                }
                value={verificationCode}
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
            <FFButton
              onPress={handleSubmitVerificationCode}
              style={styles.confirmButton}
              isLinear
            >
              Confirm
            </FFButton>
          </View>
        ) : (
          <View style={styles.modalContent}>
            <IconIonicon
              name="checkmark-circle"
              color="#63c550"
              size={30}
              style={styles.successIcon}
            />
            <View>
              <Text style={styles.successTitle}>Your email is verified</Text>
              <Text style={styles.successDescription}>
                Thank you for joining us at Flashfood! We're excited to have you
                on board and hope you have a wonderful experience with us!
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              style={styles.loginButtonContainer}
            >
              <Text style={styles.loginButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </FFModal>
    </FFSafeAreaView>
  );
};

export const styles = StyleSheet.create({
  // LinearGradient container
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Modal content container
  modalContent: {
    rowGap: 16, // Equivalent to gap-4
  },

  // Modal title
  modalTitle: {
    fontSize: 20, // Equivalent to text-xl
    fontWeight: "bold",
    textAlign: "center",
  },

  // Modal subtitle container
  modalSubtitleContainer: {
    rowGap: 8, // Equivalent to gap-2
  },

  // Modal subtitle text
  modalSubtitle: {
    fontSize: 12, // Equivalent to text-xs
    color: "#9CA3AF", // Equivalent to text-gray-400
  },

  // Modal email container
  modalEmailContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },

  // Modal email description
  modalEmailDescription: {
    fontSize: 14, // Equivalent to text-sm
    color: "#6B7280", // Equivalent to text-gray-500
  },

  // Modal email
  modalEmail: {
    fontWeight: "bold",
  },

  // Verification input container
  verificationInputContainer: {
    rowGap: 4, // Equivalent to gap-1
  },

  // Verification input label
  verificationInputLabel: {
    fontSize: 16, // Default size for <Text>
  },

  // Verification input
  verificationInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB", // Equivalent to border-gray-300
    paddingHorizontal: 12, // Equivalent to px-3
    paddingVertical: 8, // Equivalent to py-2
    borderRadius: 6, // Equivalent to rounded-md
  },

  // Error text
  errorText: {
    color: "#EF4444", // Equivalent to text-red-500
  },

  // Confirm button
  confirmButton: {
    width: "100%",
    marginTop: 16, // Equivalent to mt-4
  },

  // Success icon
  successIcon: {
    textAlign: "center",
  },

  // Success title
  successTitle: {
    fontSize: 18, // Equivalent to text-lg
    fontWeight: "bold",
    textAlign: "center",
  },

  // Success description
  successDescription: {
    fontSize: 14, // Equivalent to text-sm
    color: "#6B7280", // Equivalent to text-gray-500
  },

  // Login button container
  loginButtonContainer: {
    flexDirection: "row",
    columnGap: 4, // Equivalent to gap-1
    alignItems: "center",
    justifyContent: "center",
  },

  // Login button text
  loginButtonText: {
    color: "#A140E1", // Equivalent to text-[#a140e1]
    textDecorationLine: "underline",
    textAlign: "center",
    fontWeight: "600", // Equivalent to font-semibold
    fontSize: 18, // Equivalent to text-lg
  },
});

export default Signup;
