import React, { useState } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import FFText from "./FFText";
import FFInputControl from "./FFInputControl";

interface FFTimePickerProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  labelStyle?: any;
  inputStyle?: any;
}

const FFTimePicker: React.FC<FFTimePickerProps> = ({
  label,
  value,
  onChange,
  labelStyle,
  inputStyle,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHour, setSelectedHour] = useState(
    Math.floor(value / 100) || 0
  );
  const [selectedMinute, setSelectedMinute] = useState(value % 100 || 0);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleSubmit = () => {
    const combinedValue = selectedHour * 100 + selectedMinute;
    onChange(combinedValue);
    setModalVisible(false);
  };

  const formatTimeDisplay = (value: number) => {
    const hour = Math.floor(value / 100)
      .toString()
      .padStart(2, "0");
    const minute = (value % 100).toString().padStart(2, "0");
    return `${hour}:${minute}`;
  };

  return (
    <View>
      <Pressable onPress={() => setModalVisible(true)}>
        <FFInputControl
          label={label}
          value={formatTimeDisplay(value)}
          readonly
          labelStyle={labelStyle}
          inputStyle={inputStyle}
        />
      </Pressable>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <FFText fontSize="lg" style={styles.modalTitle}>
              Select Time
            </FFText>

            <View style={styles.pickerContainer}>
              {/* Hours */}
              <View style={styles.pickerColumn}>
                <FFText style={styles.pickerLabel}>Hour</FFText>
                <ScrollView style={styles.scrollView}>
                  {hours.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timeOption,
                        selectedHour === hour && styles.selectedOption,
                      ]}
                      onPress={() => setSelectedHour(hour)}
                    >
                      <FFText
                        style={StyleSheet.flatten([
                          styles.timeText,
                          selectedHour === hour && styles.selectedText,
                        ])}
                      >
                        {hour.toString().padStart(2, "0")}
                      </FFText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Minutes */}
              <View style={styles.pickerColumn}>
                <FFText style={styles.pickerLabel}>Minute</FFText>
                <ScrollView style={styles.scrollView}>
                  {minutes.map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.timeOption,
                        selectedMinute === minute && styles.selectedOption,
                      ]}
                      onPress={() => setSelectedMinute(minute)}
                    >
                      <FFText
                        style={StyleSheet.flatten([
                          styles.timeText,
                          selectedMinute === minute && styles.selectedText,
                        ])}
                      >
                        {minute.toString().padStart(2, "0")}
                      </FFText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <FFText style={styles.buttonText}>Cancel</FFText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
              >
                <FFText style={styles.buttonText}>Submit</FFText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "80%",
    maxHeight: "80%",
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
  },
  pickerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 10,
  },
  pickerLabel: {
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
  },
  scrollView: {
    height: 200,
  },
  timeOption: {
    padding: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  selectedOption: {
    backgroundColor: "#63c550",
  },
  timeText: {
    fontSize: 16,
  },
  selectedText: {
    color: "white",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  submitButton: {
    backgroundColor: "#63c550",
  },
  cancelButton: {
    backgroundColor: "#ff4444",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default FFTimePicker;
