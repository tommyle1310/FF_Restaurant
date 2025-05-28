import {
  FlatList,
  Image,
  TouchableOpacity,
  View,
  StyleSheet,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import axiosInstance from "@/src/utils/axiosConfig";
import IconAntDesign from "react-native-vector-icons/AntDesign";
import EditProfileComponent from "@/src/components/screens/Profile/EditProfileComponent";
import ReadonlyProfileComponents from "@/src/components/screens/Profile/ReadonlyProfileComponents";
import FFText from "@/src/components/FFText";
import IconMaterialIcons from "react-native-vector-icons/MaterialIcons";
import IconMaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import FFAvatar from "@/src/components/FFAvatar";
import { colors, spacing, typography } from "@/src/theme";
import FFModal from "@/src/components/FFModal";
import { MainStackParamList } from "@/src/navigation/AppNavigator";

type ProfileSreenNavigationProp = StackNavigationProp<
  MainStackParamList,
  "Profile"
>;

type ReviewItem = {
  id: string;
  reviewer: {
    avatar: { url: string; key: string };
    first_name: string;
    last_name: string;
  };
  rating: number;
  review: string;
  updated_at: string;
  images: { url: string; key: string }[];
};

interface Props_ProfileData {
  _id: string;
  user_Id: string;
  avatar: { url: string; key: string };
  address: string[];
  first_name: string;
  last_name: string;
  contact_phone: { number: string; title: string; is_default: boolean }[];
  contact_email: { email: string; title: string; is_default: boolean }[];
  user?: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    is_verified: boolean;
  };
}

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileSreenNavigationProp>();
  const [screenStatus, setScreenStatus] = useState<"READONLY" | "EDIT_PROFILE">(
    "READONLY"
  );
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const { id, email: emailRedux } = useSelector(
    (state: RootState) => state.auth
  );
  const [profileData, setProfileData] = useState<Props_ProfileData | null>(
    null
  );
  const [reviewsData, setReviewsData] = useState<any>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await axiosInstance.get(`/restaurants/${id}`);
        const { EC, EM, data } = response.data;
        if (EC === 0) {
          setProfileData(data);
        } else {
          console.error("Error fetching profile data:", EM);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };
    fetchProfileData();
  }, [id]);

  useEffect(() => {
    if (profileData) {
      console.log("Profile data is defined");

      const { first_name, last_name, user, contact_email, contact_phone } =
        profileData;
      let firstNameState = first_name || (user && user.first_name) || "";
      let lastNameState = last_name || (user && user.last_name) || "";
      let emailState = user
        ? user.email
        : contact_email.find((item) => item.is_default)?.email ||
          emailRedux ||
          "";
      let phoneState = user
        ? user.phone
        : contact_phone.find((item) => item.is_default)?.number || "";

      console.log(
        "check here",
        contact_email.find((item) => item.is_default)?.email
      );

      setEmail(emailState);
      setPhone(phoneState);
      setFirstName(firstNameState);
      setLastName(lastNameState);
    }
  }, [profileData]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axiosInstance.get(
          `/restaurants/${id}/ratings-reviews`
        );
        const { EC, EM, data } = response.data;
        if (EC === 0) {
          console.log('check data' , data)
          setReviewsData(data);
        } else {
          setErrorMessage(EM);
          setShowErrorModal(true);
        }
      } catch (error) {
        setErrorMessage("Error fetching reviews");
        setShowErrorModal(true);
      }
    };
    fetchReviews();
  }, [id]);

  console.log("Check profile data", email, phone);

  return (
    <FFSafeAreaView>
      <FFScreenTopSection title="My Profile" navigation={navigation} />
      <ScrollView style={styles.container}>
        {screenStatus === "READONLY" ? (
          <>
            <ReadonlyProfileComponents
              toggleStatus={() => setScreenStatus("EDIT_PROFILE")}
            />
            <View style={styles.section}>
              <FFText>Overview</FFText>
              <View style={styles.overviewContainer}>
                <View style={styles.overviewCard}>
                  <View style={styles.iconContainer}>
                    <IconAntDesign name="star" size={12} color={colors.white} />
                  </View>
                  <FFText>
                    {reviewsData?.average_food_rating?.toFixed(1) || "0.0"}
                  </FFText>
                  <FFText fontSize="sm" fontWeight="400">
                    Ratings
                  </FFText>
                </View>
                <View style={styles.overviewCard}>
                  <View style={[styles.iconContainer, styles.deliveryIcon]}>
                    <IconMaterialIcons
                      name="delivery-dining"
                      size={12}
                      color={colors.white}
                    />
                  </View>
                  <FFText>{reviewsData?.total_reviews || 0}</FFText>
                  <FFText fontSize="sm" fontWeight="400">
                    Reviews
                  </FFText>
                </View>
                <View style={styles.overviewCard}>
                  <View style={[styles.iconContainer, styles.cancelIcon]}>
                    <IconMaterialCommunityIcons
                      name="cancel"
                      size={12}
                      color={colors.white}
                    />
                  </View>
                  <FFText>10%</FFText>
                  <FFText fontSize="sm" fontWeight="400">
                    Cancel Rate
                  </FFText>
                </View>
              </View>
            </View>
            <View style={styles.section}>
              <View style={styles.reviewsHeader}>
                <FFText>Reviews</FFText>
                <TouchableOpacity>
                  <FFText fontWeight="400" style={styles.seeAllText}>
                    See All
                  </FFText>
                </TouchableOpacity>
              </View>
              <FlatList
                horizontal
                style={styles.reviewsList}
                data={reviewsData?.reviews || []}
                renderItem={({ item }) => (
                  <View style={styles.reviewCard}>
                    <View style={styles.reviewerInfo}>
                      {item.reviewer?.avatar ? (
                        <Image
                          source={{ uri: item.reviewer.avatar.url }}
                          style={styles.avatar}
                        />
                      ) : (
                        <FFAvatar size={40} />
                      )}
                      <FFText>
                        {item.reviewer
                          ? `${item.reviewer.first_name} ${item.reviewer.last_name}`
                          : "Anonymous"}
                      </FFText>
                    </View>
                    <View style={styles.reviewMeta}>
                      <View style={styles.ratingContainer}>
                        <IconAntDesign
                          name="star"
                          size={12}
                          color={colors.primary}
                        />
                        <FFText fontWeight="400" fontSize="sm">
                          {item.delivery_rating}
                        </FFText>
                      </View>
                      <FFText
                        fontWeight="400"
                        fontSize="sm"
                        style={styles.reviewDate}
                      >
                        {new Date(item.created_at * 1000).toLocaleDateString()}
                      </FFText>
                    </View>
                    <View style={styles.reviewTextContainer}>
                      <FFText
                        fontSize="sm"
                        fontWeight="500"
                        style={styles.reviewText}
                      >
                        {item.delivery_review ||
                          item.food_review ||
                          "No review text"}
                      </FFText>
                    </View>
                  </View>
                )}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.reviewsListContent}
              />
            </View>
          </>
        ) : (
          <EditProfileComponent />
        )}
      </ScrollView>
      <FFModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalContent}>
          <FFText fontSize="lg" fontWeight="600" style={styles.modalTitle}>
            Error
          </FFText>
          <FFText style={styles.modalMessage}>{errorMessage}</FFText>
          <TouchableOpacity
            onPress={() => setShowErrorModal(false)}
            style={styles.modalButton}
          >
            <FFText style={styles.modalButtonText}>OK</FFText>
          </TouchableOpacity>
        </View>
      </FFModal>
    </FFSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
  },
  section: {
    gap: spacing.sm,
    marginTop: spacing.md
  },
  overviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  overviewCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: colors.white,
    elevation: 3,
  },
  iconContainer: {
    padding: 4,
    borderRadius: 9999,
    backgroundColor: "#cdcd0c",
  },
  deliveryIcon: {
    backgroundColor: "#4d9c39",
  },
  cancelIcon: {
    backgroundColor: "#d21f3c",
  },
  reviewsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  seeAllText: {
    color: colors.primary,
  },
  reviewsList: {
    paddingVertical: spacing.sm,
  },
  reviewsListContent: {
    gap: spacing.sm,
  },
  reviewCard: {
    elevation: 3,
    maxWidth: 200,
    flex: 1,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  reviewerInfo: {
    flexDirection: "row",
    justifyContent: "flex-start",
    width: "100%",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewMeta: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reviewDate: {
    color: colors.textSecondary,
  },
  reviewTextContainer: {
    width: "100%",
  },
  reviewText: {
    textAlign: "left",
  },
  modalContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  modalTitle: {
    textAlign: "center",
  },
  modalMessage: {
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    color: colors.white,
  },
});

export default ProfileScreen;
