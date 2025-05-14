import React, { useState, Dispatch, SetStateAction } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import FFInputControl from "./FFInputControl";
import FFMultiSelect from "./FFMultiSelect";
import FFToggle from "./FFToggle";
import FFText from "./FFText";
import FFTimePicker from "./FFTimePicker";

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

interface FFRestaurantInfoFormProps {
  ownerName: string;
  setOwnerName: Dispatch<SetStateAction<string>>;
  restaurantName: string;
  setRestaurantName: Dispatch<SetStateAction<string>>;
  contactEmail: ContactItem[];
  setContactEmail: Dispatch<SetStateAction<ContactItem[]>>;
  contactPhone: ContactItem[];
  setContactPhone: Dispatch<SetStateAction<ContactItem[]>>;
  status: RestaurantStatus;
  setStatus: Dispatch<SetStateAction<RestaurantStatus>>;
  openingHours: Record<string, OpeningHours>;
  setOpeningHours: Dispatch<SetStateAction<Record<string, OpeningHours>>>;
  error?: string;
}

const FFRestaurantInfoForm: React.FC<FFRestaurantInfoFormProps> = ({
  ownerName,
  setOwnerName,
  restaurantName,
  setRestaurantName,
  contactEmail,
  setContactEmail,
  contactPhone,
  setContactPhone,
  status,
  setStatus,
  openingHours,
  setOpeningHours,
  error,
}) => {
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const handleAddEmail = () => {
    if (newEmail) {
      setContactEmail([
        ...contactEmail,
        {
          title: `Contact ${contactEmail.length + 1}`,
          email: newEmail,
          is_default: contactEmail.length === 0,
        },
      ]);
      setNewEmail("");
    }
  };

  const handleAddPhone = () => {
    if (newPhone) {
      setContactPhone([
        ...contactPhone,
        {
          title: `Contact ${contactPhone.length + 1}`,
          number: newPhone,
          is_default: contactPhone.length === 0,
        },
      ]);
      setNewPhone("");
    }
  };

  const weekDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  const createTimeChangeHandler = (
    day: string,
    field: "from" | "to"
  ): Dispatch<SetStateAction<string>> => {
    return (value) => {
      if (typeof value === "function") {
        // Handle function updates if needed
        return;
      }
      const numericValue = parseInt(value) || 0;
      setOpeningHours((prev) => ({
        ...prev,
        [day]: { ...prev[day], [field]: numericValue },
      }));
    };
  };

  return (
    <View style={{ gap: 16, paddingBottom: 20 }}>
      <FFInputControl<string>
        error={error}
        label="Owner Name"
        placeholder="John Doe"
        setValue={setOwnerName}
        value={ownerName}
      />
      <FFInputControl<string>
        error={error}
        label="Restaurant Name"
        placeholder="Amazing Restaurant"
        setValue={setRestaurantName}
        value={restaurantName}
      />

      {/* Contact Email Section */}
      <View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <FFInputControl<string>
              error={error}
              label="Add Contact Email"
              placeholder="contact@restaurant.com"
              setValue={setNewEmail}
              value={newEmail}
            />
          </View>
          <TouchableOpacity
            onPress={handleAddEmail}
            style={{
              backgroundColor: "#63c550",
              padding: 8,
              borderRadius: 8,
              marginTop: 20,
            }}
          >
            <FFText style={{ color: "white" }}>Add</FFText>
          </TouchableOpacity>
        </View>
        {contactEmail.map((contact, index) => (
          <View key={index} style={{ marginTop: 8 }}>
            <FFInputControl<string>
              label={contact.title}
              value={contact.email || ""}
              readonly
            />
          </View>
        ))}
      </View>

      {/* Contact Phone Section */}
      <View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <FFInputControl<string>
              error={error}
              label="Add Contact Phone"
              placeholder="+1234567890"
              setValue={setNewPhone}
              value={newPhone}
            />
          </View>
          <TouchableOpacity
            onPress={handleAddPhone}
            style={{
              backgroundColor: "#63c550",
              padding: 8,
              borderRadius: 8,
              marginTop: 20,
            }}
          >
            <FFText style={{ color: "white" }}>Add</FFText>
          </TouchableOpacity>
        </View>
        {contactPhone.map((contact, index) => (
          <View key={index} style={{ marginTop: 8 }}>
            <FFInputControl<string>
              label={contact.title}
              value={contact.number || ""}
              readonly
            />
          </View>
        ))}
      </View>

      {/* Status Toggles */}
      <View style={{ gap: 8 }}>
        <FFToggle
          label="Active"
          initialChecked={status.is_active}
          onChange={(value) => setStatus({ ...status, is_active: value })}
        />
        <FFToggle
          label="Open"
          initialChecked={status.is_open}
          onChange={(value) => setStatus({ ...status, is_open: value })}
        />
        <FFToggle
          label="Accept Orders"
          initialChecked={status.is_accepted_orders}
          onChange={(value) =>
            setStatus({ ...status, is_accepted_orders: value })
          }
        />
      </View>

      {/* Opening Hours */}
      <View style={{ gap: 8 }}>
        {weekDays.map((day) => (
          <View key={day} style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <FFTimePicker
                label={`${day.toUpperCase()} Opening Time`}
                value={openingHours[day]?.from || 0}
                onChange={(value) => {
                  setOpeningHours((prev) => ({
                    ...prev,
                    [day]: { ...prev[day], from: value },
                  }));
                }}
                labelStyle={{ fontSize: 12, color: "#666" }}
                inputStyle={{
                  backgroundColor: "#f5f5f5",
                  borderColor: "#ddd",
                  minHeight: 36,
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <FFTimePicker
                label={`${day.toUpperCase()} Closing Time`}
                value={openingHours[day]?.to || 0}
                onChange={(value) => {
                  setOpeningHours((prev) => ({
                    ...prev,
                    [day]: { ...prev[day], to: value },
                  }));
                }}
                labelStyle={{ fontSize: 12, color: "#666" }}
                inputStyle={{
                  backgroundColor: "#f5f5f5",
                  borderColor: "#ddd",
                  minHeight: 36,
                }}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default FFRestaurantInfoForm;
