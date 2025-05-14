import React from "react";
import { View } from "react-native";
import FFInputControl from "./FFInputControl";
import { Dispatch, SetStateAction } from "react";

interface FFBasicInfoFormProps {
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
  firstName: string;
  setFirstName: Dispatch<SetStateAction<string>>;
  lastName: string;
  setLastName: Dispatch<SetStateAction<string>>;
  password: string;
  setPassword: Dispatch<SetStateAction<string>>;
  error?: string;
}

const FFBasicInfoForm: React.FC<FFBasicInfoFormProps> = ({
  email,
  setEmail,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  password,
  setPassword,
  error,
}) => {
  return (
    <View style={{ gap: 16 }}>
      <FFInputControl
        error={error}
        label="Email"
        placeholder="restaurant@gmail.com"
        setValue={setEmail}
        value={email}
      />
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
      <FFInputControl
        error={error}
        secureTextEntry
        label="Password"
        placeholder="******"
        setValue={setPassword}
        value={password}
      />
    </View>
  );
};

export default FFBasicInfoForm;
