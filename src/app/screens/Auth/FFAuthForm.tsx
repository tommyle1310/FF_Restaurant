// components/FFAuthForm.tsx
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import IconIonicons from "react-native-vector-icons/Ionicons";
import FFAvatar from "@/src/components/FFAvatar";
import FFInputControl from "@/src/components/FFInputControl";
import FFTab from "@/src/components/FFTab";
import FFBasicInfoForm from "@/src/components/FFBasicInfoForm";
import FFRestaurantInfoForm from "@/src/components/FFRestaurantInfoForm";
import { spacing } from "@/src/theme";
import { IMAGE_URL } from "@/src/assets/imageUrls";

interface ContactItem {
  title: string;
  email?: string;
  number?: string;
  is_default: boolean;
}

interface OpeningHours {
  from: number;
  to: number;
}

interface RestaurantStatus {
  is_active: boolean;
  is_open: boolean;
  is_accepted_orders: boolean;
}

type FFAuthFormProps = {
  isSignUp: boolean;
  onSubmit: (formData: any) => void;
  navigation?: any;
  error?: string;
};

const FFAuthForm = ({
  isSignUp,
  onSubmit,
  navigation,
  error,
}: FFAuthFormProps) => {
  // Basic Info State
  const [email, setEmail] = useState("testres@gmail.com");
  const [password, setPassword] = useState("000000");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // Restaurant Info State
  const [ownerName, setOwnerName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [contactEmail, setContactEmail] = useState<ContactItem[]>([]);
  const [contactPhone, setContactPhone] = useState<ContactItem[]>([]);
  const [status, setStatus] = useState<RestaurantStatus>({
    is_active: true,
    is_open: true,
    is_accepted_orders: true,
  });
  const [openingHours, setOpeningHours] = useState<
    Record<string, OpeningHours>
  >({
    mon: { from: 900, to: 2200 },
    tue: { from: 900, to: 2200 },
    wed: { from: 900, to: 2200 },
    thu: { from: 900, to: 2200 },
    fri: { from: 900, to: 2300 },
    sat: { from: 1000, to: 2300 },
    sun: { from: 1000, to: 2200 },
  });

  const handleSubmit = () => {
    if (isSignUp) {
      // Ensure we have at least one contact email
      const finalContactEmail =
        contactEmail.length > 0
          ? contactEmail
          : [
              {
                title: "Main Contact",
                email: email,
                is_default: true,
              },
            ];

      // Ensure we have at least one contact phone
      const finalContactPhone =
        contactPhone.length > 0
          ? contactPhone
          : [
              {
                title: "Main Contact",
                number: "",
                is_default: true,
              },
            ];

      onSubmit({
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        owner_name: ownerName,
        restaurant_name: restaurantName,
        contact_email: finalContactEmail,
        contact_phone: finalContactPhone,
        status,
        opening_hours: openingHours,
      });
    } else {
      onSubmit({ email, password });
    }
  };

  const renderLoginForm = () => (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <FFAvatar avatar={IMAGE_URL.DEFAULT_LOGO} />
      </View>
      <Text style={styles.headerText}>Login</Text>
      <View style={styles.switchAuthContainer}>
        <Text style={styles.switchAuthText}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => navigation?.navigate("Signup")}>
          <Text style={styles.switchAuthLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      <FFInputControl
        error={error}
        label="Email"
        placeholder="teo@gmail.com"
        setValue={setEmail}
        value={email}
      />

      <FFInputControl
        error={error}
        secureTextEntry
        label="Password"
        placeholder="******"
        setValue={setPassword}
        value={password}
      />

      <Pressable onPress={handleSubmit}>
        <LinearGradient
          colors={["#63c550", "#a3d98f"]}
          start={[0, 0]}
          end={[1, 0]}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Log In</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );

  const renderSignUpForm = () => (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <FFAvatar avatar={IMAGE_URL.DEFAULT_LOGO} />
      </View>
      <Text style={styles.headerText}>Sign Up</Text>
      <View style={styles.switchAuthContainer}>
        <Text style={styles.switchAuthText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => navigation?.navigate("Login")}>
          <Text style={styles.switchAuthLink}>Log In</Text>
        </TouchableOpacity>
      </View>

      <FFTab
        tabTitles={["Basic Info", "Restaurant Info"]}
        tabContent={[
          <FFBasicInfoForm
            email={email}
            setEmail={setEmail}
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            password={password}
            setPassword={setPassword}
            error={error}
          />,
          <FFRestaurantInfoForm
            ownerName={ownerName}
            setOwnerName={setOwnerName}
            restaurantName={restaurantName}
            setRestaurantName={setRestaurantName}
            contactEmail={contactEmail}
            setContactEmail={setContactEmail}
            contactPhone={contactPhone}
            setContactPhone={setContactPhone}
            status={status}
            setStatus={setStatus}
            openingHours={openingHours}
            setOpeningHours={setOpeningHours}
            error={error}
          />,
        ]}
      />

      <Pressable onPress={handleSubmit}>
        <LinearGradient
          colors={["#63c550", "#a3d98f"]}
          start={[0, 0]}
          end={[1, 0]}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );

  return isSignUp ? renderSignUpForm() : renderLoginForm();
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: spacing.md,
    borderRadius: 16,
    position: "relative",
    paddingTop: 40,
    marginVertical: spacing.veryLarge,
    marginHorizontal: "auto",
    width: "90%",
    shadowColor: "#b5b3a1",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    gap: 16,
  },
  logoContainer: {
    position: "absolute",
    right: 0,
    left: 0,
    top: -40,
    alignItems: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  switchAuthContainer: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  switchAuthText: {
    fontSize: 14,
  },
  switchAuthLink: {
    color: "#63c550",
    fontWeight: "600",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    marginTop: spacing.md,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default FFAuthForm;
