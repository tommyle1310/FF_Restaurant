import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  StyleSheet,
} from "react-native";
import React, { useEffect, useState } from "react";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { StackNavigationProp } from "@react-navigation/stack";
import { MainStackParamList } from "@/src/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import FFText from "@/src/components/FFText";
import axiosInstance from "@/src/utils/axiosConfig";
import FFSkeleton from "@/src/components/FFSkeleton";
import { spacing, colors, typography } from "@/src/theme";
import FFView from "@/src/components/FFView";
import { useTheme } from "@/src/hooks/useTheme";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";

type SupportCenterNavigationProp = StackNavigationProp<
  MainStackParamList,
  "BottomTabs"
>;

export enum FAQType {
  GENERAL = "GENERAL",
  ACCOUNT = "ACCOUNT",
  PAYMENT = "PAYMENT",
  SERVICE = "SERVICE",
}

type FAQContentBlock =
  | { type: "text"; value: string }
  | { type: "image"; value: { url: string; key: string } }
  | { type: "image_row"; value: { url: string; key: string }[] };

type FAQ = {
  id: string;
  question: string;
  answer: FAQContentBlock[];
  status: string;
  type: FAQType;
  created_at: string;
  updated_at: string | null;
};

const SupportCenterScreen = () => {
  const navigation = useNavigation<SupportCenterNavigationProp>();
  const [activeTab, setActiveTab] = useState<"FAQ" | "Contact Us">("FAQ");
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoadingFAQ, setIsLoadingFAQ] = useState(false);
  const { theme } = useTheme();
  // const [orders, setOrders] = useState<OrderTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const { id } = useSelector((state: RootState) => state.auth);

  const fetchFAQs = async () => {
    setIsLoadingFAQ(true);
    try {
      const response = await axiosInstance.get("/faqs");
      const { EC, EM, data } = response.data;
      if (EC === 0) {
        setFaqs(data);
        console.log("FAQs fetched:", data);
      } else {
        console.log("Error fetching FAQs:", EM);
      }
    } catch (error) {
      console.log("Fetch FAQs error:", error);
    } finally {
      setIsLoadingFAQ(false);
    }
  };

  const handleFilterFAQ = async (type: FAQType) => {
    setIsLoadingFAQ(true);
    try {
      const response = await axiosInstance.get(`/faqs/type/${type}`);
      const { EC, EM, data } = response.data;
      if (EC === 0) {
        setFaqs(data);
        console.log(`FAQs of type ${type} fetched:`, data);
      } else {
        console.log("Error fetching FAQs:", EM);
      }
    } catch (error) {
      console.log(`Fetch FAQs of type ${type} error:`, error);
    } finally {
      setIsLoadingFAQ(false);
    }
  };

  useEffect(() => {
    fetchFAQs();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [id]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/customers/orders/${id}`);
      const allOrders = res.data.data;
      // const lastThreeOrders = allOrders.slice(-Math.max(3, allOrders.length));
      // setOrders(lastThreeOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };
  // console.log("check orders", orders[0]?.order_items?.[0]?.menu_item?.avatar);

  const contactOptions = [
    {
      title: "Chat with customer care representative",
      icon: "headset",
      onPress: () => navigation.navigate("FChat", { type: "SUPPORT" }),
    },
    {
      title: "Submit a Request",
      icon: "document-text-outline",
      onPress: () => navigation.navigate("CreateInquiry"),
    },
    { title: "WhatsApp", icon: "logo-whatsapp" },
    { title: "Website", icon: "globe" },
    { title: "Facebook", icon: "logo-facebook" },
    { title: "Twitter", icon: "logo-twitter" },
    { title: "Instagram", icon: "logo-instagram" },
  ];

  const FAQSection = () => (
    <ScrollView style={styles.faqScrollView}>
      {faqs.map((item, index) => (
        <TouchableOpacity key={index} style={styles.faqItem}>
          <View style={styles.faqHeader}>
            <FFText style={styles.faqQuestion}>{item.question}</FFText>
            <Ionicons name="chevron-down" size={20} color={colors.text} />
          </View>
          {item.answer[0] &&
            (isLoadingFAQ ? (
              <View style={styles.skeletonContainer}>
                <FFSkeleton height={80} />
                <FFSkeleton height={80} />
                <FFSkeleton height={80} />
              </View>
            ) : (
              <>
                {item.answer[0].type === "text" && (
                  <FFText
                    colorLight={colors.textSecondary}
                    colorDark={colors.textSecondary}
                    fontSize="sm"
                    style={styles.faqAnswer}
                  >
                    {item.answer[0].value.replace(/\[(.*?)\]\((.*?)\)/g, "$1")}
                  </FFText>
                )}
              </>
            ))}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const ContactSection = () => (
    <ScrollView style={styles.contactScrollView}>
      {contactOptions.map((option, index) => (
        <TouchableOpacity
          key={index}
          onPress={option.onPress}
          style={styles.contactItem}
        >
          <Ionicons
            name={option.icon as any}
            size={24}
            color={theme === "light" ? colors.text : colors.textSecondary}
          />
          <FFText fontSize="sm" style={styles.contactText}>
            {option.title}
          </FFText>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <FFSafeAreaView style={styles.container}>
      <FFScreenTopSection title="Support Center" navigation={navigation} />

      <View style={styles.content}>
        {/* Tab Buttons */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "FAQ" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("FAQ")}
          >
            <FFText style={styles.tabText}>FAQ</FFText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "Contact Us" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("Contact Us")}
          >
            <FFText style={styles.tabText}>Contact Us</FFText>
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          {/* Category Pills */}
          {activeTab === "FAQ" && (
            <View style={styles.categoryContainer}>
              {[
                { value: FAQType.GENERAL, label: "General" },
                { value: FAQType.ACCOUNT, label: "Account" },
                { value: FAQType.PAYMENT, label: "Payment" },
                { value: FAQType.SERVICE, label: "Service" },
              ].map((category, index) => (
                <FFView
                  onPress={() => handleFilterFAQ(category.value)}
                  key={index}
                  style={styles.categoryPill}
                >
                  <FFText fontSize="sm">{category.label}</FFText>
                </FFView>
              ))}
            </View>
          )}

          {/* Content Section */}
          <View style={styles.contentSection}>
            {activeTab === "FAQ" ? <FAQSection /> : <ContactSection />}
          </View>
        </View>
      </View>
    </FFSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.md,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
  },
  tabText: {
    textAlign: "center",
  },
  mainContent: {
    flex: 1,
  },
  categoryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  categoryPill: {
    elevation: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    height: spacing.xl,
    borderRadius: 9999,
    backgroundColor: colors.background,
  },
  contentSection: {
    flex: 1,
  },
  faqScrollView: {
    paddingHorizontal: spacing.md,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    flex: 1,
  },
  faqAnswer: {
    marginTop: spacing.sm,
  },
  skeletonContainer: {
    gap: spacing.sm,
  },
  contactScrollView: {
    paddingHorizontal: spacing.md,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contactText: {
    marginLeft: spacing.sm,
  },
});

export default SupportCenterScreen;
