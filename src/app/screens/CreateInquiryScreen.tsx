import React, { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity, Alert } from "react-native";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { StackNavigationProp } from "@react-navigation/stack";
import { MainStackParamList } from "@/src/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import FFText from "@/src/components/FFText";
import FFInputControl from "@/src/components/FFInputControl";
import FFDropdown from "@/src/components/FFDropdown";
import FFButton from "@/src/components/FFButton";
import axiosInstance from "@/src/utils/axiosConfig";
import { spacing } from "@/src/theme";
import { useTheme } from "@/src/hooks/useTheme";
// import OrdersSliderSection from "@/src/components/screens/Support/OrdersSliderSection";
// import { OrderTracking } from "@/src/types/screens/Order";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import FFModal from "@/src/components/FFModal";
import Spinner from "@/src/components/FFSpinner";

type CreateInquiryScreenNavigationProp = StackNavigationProp<
  MainStackParamList,
  "CreateInquiry"
>;

type Priority = "LOW" | "MEDIUM" | "HIGH";

interface Props_ProfileData {
  id: string;
  user_Id: string;
  avatar: { url: string; key: string };
  address: string[];
  first_name: string;
  last_name: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    is_verified: boolean;
  };
}

const CreateInquiryScreen = () => {
  const navigation = useNavigation<CreateInquiryScreenNavigationProp>();
  const { theme } = useTheme();
  const { id } = useSelector((state: RootState) => state.auth);

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [orders, setOrders] = useState<OrderTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalDetails, setModalDetails] = useState<{
    status: "SUCCESS" | "ERROR" | "HIDDEN" | "INFO" | "YESNO";
    title: string;
    desc: string;
  }>({ status: "HIDDEN", title: "", desc: "" });

  const priorityOptions = [
    { label: "Low", value: "LOW" },
    { label: "Medium", value: "MEDIUM" },
    { label: "High", value: "HIGH" },
  ];

  useEffect(() => {
    fetchOrders();
  }, [id]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/customers/orders/${id}`);
      const allOrders = res.data.data;
      // setOrders(allOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      setModalDetails({
        status: "ERROR",
        title: "Please fill all fields",
        desc: "Please specify subject & description for this inquiry.",
      });
      return;
    }

    setIsSubmitting(true);
    const requestData = {
      subject,
      description,
      status: "OPEN",
      customer_id: id,
      priority,
      order_id: selectedOrderId || undefined,
    };
    // console.log("check rq da", requestData);
    try {
      const response = await axiosInstance.post(
        "/customer-care-inquiries",
        requestData
      );

      const { EC, EM } = response.data;
      if (EC === 0) {
        setModalDetails({
          status: "SUCCESS",
          desc: "Your inquiry has been submitted successfully",
          title: "Success",
        });
      } else {
        setModalDetails({ status: "ERROR", title: "Error", desc: EM });
      }
    } catch (error) {
      console.error("Submit inquiry error:", error);
      setModalDetails({
        status: "ERROR",
        desc: error as string,
        title: "Error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting || loading) {
    return <Spinner isVisible isOverlay />;
  }
  return (
    <FFSafeAreaView>
      <FFScreenTopSection title="Create Inquiry" navigation={navigation} />

      <ScrollView className="flex-1 px-4 py-4">
        <View style={{ gap: spacing.lg }}>
          <FFText style={{ fontSize: 18, fontWeight: "bold" }}>
            Submit a Support Request
          </FFText>

          <FFInputControl
            label="Subject"
            placeholder="Enter the subject of your inquiry"
            value={subject}
            setValue={setSubject}
          />

          <FFInputControl
            label="Description"
            placeholder="Describe your issue in detail"
            value={description}
            setValue={setDescription}
          />

          {/* <FFDropdown
            options={priorityOptions}
            selectedOption={priority}
            onSelect={(value) => setPriority(value as Priority)}
            placeholder="Select priority level"
          /> */}

          {/* {orders.length > 0 && (
            <OrdersSliderSection
              orders={orders}
              onSelectOrder={setSelectedOrderId}
              selectedOrderId={selectedOrderId}
            />
          )} */}

          <View style={{ marginTop: spacing.xl }}>
            <FFButton onPress={handleSubmit} style={{ width: "100%" }}>
              {isSubmitting ? "Submitting..." : "Submit Inquiry"}
            </FFButton>
          </View>
        </View>
      </ScrollView>
      <FFModal
        visible={modalDetails.status !== "HIDDEN"}
        onClose={() =>
          setModalDetails({ status: "HIDDEN", desc: "", title: "" })
        }
      >
        <FFText fontSize="lg" style={{ textAlign: "center" }}>
          {modalDetails?.title}
        </FFText>
        <FFText
          fontSize="sm"
          style={{ textAlign: "center", color: "#aaa", marginTop: spacing.md }}
        >
          {modalDetails?.desc}
        </FFText>
      </FFModal>
    </FFSafeAreaView>
  );
};

export default CreateInquiryScreen;
