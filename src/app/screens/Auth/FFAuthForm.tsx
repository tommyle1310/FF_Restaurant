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
import { spacing } from "@/src/theme";

type FFAuthFormProps = {
  isSignUp: boolean;
  onSubmit: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => void;
  navigation?: any; // Optional navigation prop, used only in SignUp for navigation,
  error?: string;
};

const FFAuthForm = ({
  isSignUp,
  onSubmit,
  navigation,
  error,
}: FFAuthFormProps) => {
  const [email, setEmail] = useState("restaurant@gmail.com");
  const [password, setPassword] = useState("000000");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // State to toggle password visibility
  const passwordInputRef = useRef<TextInput>(null);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prevState) => !prevState);
  };

  const handleSubmit = () => {
    onSubmit(email, password, firstName, lastName);
  };

  const handleInputContainerPress = () => {
    if (passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={{
          position: "absolute",
          right: 0,
          left: 0,
          top: -40,

          transform: [{ translateX: "40%" }],
        }}
      >
        <FFAvatar avatar="https://res.cloudinary.com/dpubnzap3/image/upload/v1738820317/g2nvwg7zrqkevpdarn3r.png" />
      </View>
      <Text style={styles.headerText}>{isSignUp ? "Sign Up" : "Login"}</Text>
      <View style={styles.switchAuthContainer}>
        <Text style={styles.switchAuthText}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
        </Text>
        <TouchableOpacity
          onPress={() => navigation?.navigate(isSignUp ? "Login" : "Signup")}
        >
          <Text style={styles.switchAuthLink}>
            {isSignUp ? "Log In" : "Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>

      <FFInputControl
        error={error}
        label="Email"
        placeholder="teo@gmail.com"
        setValue={setEmail}
        value={email}
      />
      {isSignUp && (
        <>
          <FFInputControl
            error={error}
            label="First name"
            placeholder="Tom"
            setValue={setFirstName}
            value={firstName}
          />
          <FFInputControl
            error={error}
            label="Last name"
            placeholder="Morn"
            setValue={setLastName}
            value={lastName}
          />
        </>
      )}

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
          <Text style={styles.buttonText}>
            {isSignUp ? "Sign Up" : "Log In"}
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
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
    // height: "100%",
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    gap: 16,
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchAuthText: {
    fontSize: 14,
  },
  switchAuthLink: {
    color: "#63c550",
    fontWeight: "600",
  },
  inputContainer: {
    marginTop: spacing.sm,
  },
  inputLabel: {
    fontSize: 14,
    color: "#333",
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    fontSize: 14,
    color: "#333",
    marginTop: -spacing.sm,
  },
  iconButton: {
    position: "absolute",
    right: 16,
    top: 16,
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
