import React, { useEffect } from 'react';
import { View, Modal, StyleSheet, Text, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/src/theme';
import { IMAGE_URL } from '@/src/assets/imageUrls';

interface SpinnerProps {
  isOverlay?: boolean; // Determines whether to show an overlay or not
  overlayColor?: string; // Color of the overlay (default: rgba(0, 0, 0, 0.25))
  isVisible: boolean; // Controls visibility of the spinner
  type?: 'spinner' | 'icon'; // Type of loading indicator
  text?: string; // Optional text to display below the spinner
  size?: 'small' | 'medium' | 'large'; // Size of the spinner
}

const Spinner: React.FC<SpinnerProps> = ({
  isOverlay = true,
  overlayColor = 'rgba(0, 0, 0, 0.25)',
  isVisible,
  type = 'spinner',
  text,
  size = 'large',
}) => {
  if (!isVisible) return null;

  // Animation for the spinner
  const spinValue = new Animated.Value(0);
  
  // Animation for the pulsing effect
  const pulseValue = new Animated.Value(1);

  useEffect(() => {
    // Rotation animation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Interpolate rotation value
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Size mapping
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60,
  };

  const iconSize = sizeMap[size];

  return (
    <Modal transparent={true} animationType="fade" visible={isVisible}>
      {isOverlay && (
        <View
          style={[styles.overlay, { backgroundColor: overlayColor }]}
        />
      )}
      <View style={styles.spinnerContainer}>
        <View style={styles.loaderContainer}>
          {type === 'spinner' ? (
            // Modern spinner with gradient background
            <LinearGradient
              colors={[colors.white, colors.beige_light]}
              style={styles.spinnerBackground}
              start={[0, 0]}
              end={[1, 1]}
            >
              <Animated.View
                style={[{
                  transform: [{ rotate: spin }],
                }]}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primary_dark]}
                  style={[styles.spinnerRing, { width: iconSize * 1.5, height: iconSize * 1.5 }]}
                  start={[0, 0]}
                  end={[1, 1]}
                />
              </Animated.View>
              <View style={[styles.spinnerCenter, { width: iconSize, height: iconSize }]} />
            </LinearGradient>
          ) : (
            // Icon-based loader with pulsing animation
            <Animated.View
              style={[{
                transform: [{ scale: pulseValue }],
              }]}
            >
              <LinearGradient
                colors={[colors.white, colors.beige_light]}
                style={[styles.iconContainer, { width: iconSize * 1.8, height: iconSize * 1.8 }]}
                start={[0, 0]}
                end={[1, 1]}
              >
                <Ionicons name="restaurant" size={iconSize} color={colors.primary} />
              </LinearGradient>
            </Animated.View>
          )}
          
          {text && <Text style={styles.loadingText}>{text}</Text>}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backdropFilter: 'blur(3px)',
  },
  spinnerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
  },
  spinnerBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  spinnerRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 6,
    borderColor: 'transparent',
    borderTopColor: colors.primary,
    borderRightColor: colors.primary_dark,
    position: 'absolute',
  },
  spinnerCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default Spinner;
