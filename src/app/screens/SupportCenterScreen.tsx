import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '@/src/navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import FFSafeAreaView from '@/src/components/FFSafeAreaView';
import FFScreenTopSection from '@/src/components/FFScreenTopSection';
import FFText from '@/src/components/FFText';
import FFView from '@/src/components/FFView';
import { colors, spacing } from '@/src/theme';
import { useSelector } from '@/src/store/types';
import { RootState } from '@/src/store/store';
import { useFChatSocket } from '@/src/hooks/useFChatSocket';

type SupportCenterNavigationProp = StackNavigationProp<MainStackParamList, 'SupportCenter'>;

const SupportCenterScreen = () => {
  const navigation = useNavigation<SupportCenterNavigationProp>();
  const { id: restaurantId } = useSelector((state: RootState) => state.auth);
  const { startSupportChat } = useFChatSocket();

  const handleStartChatWithSupport = () => {
    // Start a chatbot session and navigate to the chat screen
    startSupportChat('restaurant_support', 'medium', { userType: 'restaurant_owner' });
    navigation.navigate('FChat', {
      type: 'CHATBOT',
      title: 'Customer Support'
    });
  };

  const supportOptions = [
    {
      id: 'chat',
      title: 'Chat with Support',
      description: 'Get help from our support team via chat',
      icon: 'chatbubble-ellipses-outline',
      onPress: handleStartChatWithSupport,
    },
    {
      id: 'inquiry',
      title: 'Submit an Inquiry',
      description: 'Create a new support ticket',
      icon: 'create-outline',
      onPress: () => navigation.navigate('CreateInquiry'),
    },
    {
      id: 'faq',
      title: 'Frequently Asked Questions',
      description: 'Find answers to common questions',
      icon: 'help-circle-outline',
      onPress: () => {},
    },
  ];

  return (
    <FFSafeAreaView style={styles.container}>
      <FFScreenTopSection
        title="Support Center"
        navigation={navigation}
      />
      
      <ScrollView style={styles.scrollView}>
        <FFView style={styles.header}>
          <FFText style={styles.headerTitle}>How can we help you?</FFText>
          <FFText style={styles.headerSubtitle}>
            Choose an option below to get assistance
          </FFText>
        </FFView>

        <FFView style={styles.optionsContainer}>
          {supportOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionCard}
              onPress={option.onPress}
            >
              <View style={styles.iconContainer}>
                <Ionicons name={option.icon as any} size={24} color={colors.primary} />
              </View>
              <View style={styles.optionContent}>
                <FFText style={styles.optionTitle}>{option.title}</FFText>
                <FFText style={styles.optionDescription}>{option.description}</FFText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </FFView>

        <FFView style={styles.contactInfo}>
          <FFText style={styles.contactTitle}>Contact Information</FFText>
          <View style={styles.contactItem}>
            <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
            <FFText style={styles.contactText}>+1 (800) 123-4567</FFText>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
            <FFText style={styles.contactText}>support@ffrestaurant.com</FFText>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
            <FFText style={styles.contactText}>Available 24/7</FFText>
          </View>
        </FFView>
      </ScrollView>
    </FFSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  optionsContainer: {
    padding: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  contactInfo: {
    padding: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    margin: spacing.md,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  contactText: {
    marginLeft: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default SupportCenterScreen;
