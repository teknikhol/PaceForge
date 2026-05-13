import { useThemedAlert } from '@/components/themed-alert';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth, db } from '@/lib/firebase-config';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import { useAuthRequest } from 'expo-auth-session';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, enableNetwork, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Google OAuth configuration
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://www.googleapis.com/oauth2/v4/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// Validation functions moved outside component to fix TDZ errors and improve performance
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string, isSignUp: boolean): { isValid: boolean; error: string } => {
  if (!password) {
    return { isValid: false, error: 'Password cannot be empty' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }

  if (isSignUp) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      return { 
        isValid: false, 
        error: 'Password must contain at least one uppercase letter, one number, and one special character' 
      };
    }
  }

  return { isValid: true, error: '' };
};

export default function AuthScreen() {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert, AlertComponent } = useThemedAlert();
  
  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const authMethodAnim = useRef(new Animated.Value(0)).current;
  const keyboardHeightAnim = useRef(new Animated.Value(0)).current;
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDots, setLoadingDots] = useState('');
  const [authMethod, setAuthMethod] = useState<'google' | 'email'>('google');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isProfileSetup, setIsProfileSetup] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Validation errors state
  const [errors, setErrors] = useState<{ email: string; password: string }>({ email: '', password: '' });

  // Profile data state
  const [firstName, setFirstName] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('imperial');

  // Derived validation state for seamless real-time feedback
  const isEmailValid = email.length > 0 && validateEmail(email);
  const isPasswordValid = password.length > 0 && validatePassword(password, isSignUp).isValid;

  const validateForm = (): boolean => {
    if (authMethod === 'email') {
      if (!email.trim()) {
        setErrors(prev => ({ ...prev, email: 'Email is required' }));
        return false;
      }
      if (!validateEmail(email)) {
        setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
        return false;
      }
    }

    if (!password.trim()) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
      return false;
    }

    const passwordValidation = validatePassword(password, isSignUp);
    if (!passwordValidation.isValid) {
      setErrors(prev => ({ ...prev, password: passwordValidation.error }));
      return false;
    }

    // Clear errors if valid
    setErrors({ email: '', password: '' });
    return true;
  };

  // Start animations on mount
  useEffect(() => {
    const startAnimations = () => {
      // Pulse animation for the icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Slide up animation for content
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }).start();

      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    };

    startAnimations();
  }, []);

  // Animate auth method changes
  useEffect(() => {
    Animated.timing(authMethodAnim, {
      toValue: authMethod === 'email' ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [authMethod]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShow = (e: any) => {
      const height = e.endCoordinates.height;
      setKeyboardHeight(height + 50); // Add extra clearance for password field
      Animated.timing(keyboardHeightAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false, // Required for padding/layout properties
      }).start();
    };

    const keyboardDidHide = () => {
      setKeyboardHeight(0);
      Animated.timing(keyboardHeightAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false, // Required for padding/layout properties
      }).start();
    };

    const keyboardShowSubscription = Keyboard.addListener('keyboardDidShow', keyboardDidShow);
    const keyboardHideSubscription = Keyboard.addListener('keyboardDidHide', keyboardDidHide);

    return () => {
      keyboardShowSubscription.remove();
      keyboardHideSubscription.remove();
    };
  }, []);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: Platform.select({
        android: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
        ios: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
        default: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      }) || '',
      scopes: ['openid', 'profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri(),
      responseType: 'id_token token',
      extraParams: {
        nonce: 'paceforge_nonce_123' // Required for id_token
      }
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token, access_token } = response.params;
      handleFirebaseSignIn(id_token, access_token);
    }
  }, [response]);

  const handleFirebaseSignIn = async (idToken: string, accessToken: string) => {
    try {
      const credential = GoogleAuthProvider.credential(idToken, accessToken);
      await signInWithCredential(auth, credential);
      
      if (auth.currentUser) {
        setPhotoURL(auth.currentUser.photoURL);
        if (auth.currentUser.displayName) setFirstName(auth.currentUser.displayName.split(' ')[0]);
      }
      await checkUserSetupStatus();
    } catch (error: any) {
      console.error('Firebase sign-in error:', error.code, error.message);
      setIsLoading(false);
      
      if (error.code === 'auth/account-exists-with-different-credential') {
        showAlert('Account Exists', 'An account already exists with this email using a different login method. Please sign in with your email and password.', 'info');
      } else {
        showAlert('Error', 'Failed to sign in with Google. Please try again.', 'error');
      }
    }
  };

  const handleEmailAuth = async () => {
    // Run validation checks before calling Firebase
    if (!validateForm()) {
      showAlert('Error', 'Please fix the errors below and try again.', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Send email verification
        await sendEmailVerification(userCredential.user);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsVerificationSent(true);
        setIsLoading(false);
        return; // Don't redirect yet
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        await checkUserSetupStatus();
      }
    } catch (error: any) {
      setIsLoading(false);
      let errorMessage = 'Authentication failed. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      }
      
      showAlert('Error', errorMessage || 'Authentication failed. Please try again.', 'error');
    }
  };

  const checkVerificationStatus = async () => {
    setIsLoading(true);
    try {
      await auth.currentUser?.reload();
      if (auth.currentUser?.emailVerified) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await checkUserSetupStatus();
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        showAlert('Not Verified', 'We haven\'t detected the verification yet. Please click the link in your email.', 'error');
      }
    } catch (error) {
      showAlert('Error', 'Failed to check status. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserSetupStatus = async () => {
    if (!auth.currentUser) return;
    
    setIsLoading(true);
    const localSetupKey = `setup_completed_${auth.currentUser.uid}`;
    
    const performCheck = async (retryCount = 0): Promise<void> => {
      try {
        // 1. Check local storage first
        const localSetup = await AsyncStorage.getItem(localSetupKey);
        if (localSetup === 'true') {
          router.replace('/(tabs)');
          return;
        }

        // 2. Query Firestore
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
        
        if (userDoc.exists() && userDoc.data()?.setupCompleted) {
          const data = userDoc.data();
          await AsyncStorage.setItem(localSetupKey, 'true');
          // Cache profile data for returning users to prevent "Alex" flicker
          if (data.firstName) await AsyncStorage.setItem(`user_name_${auth.currentUser!.uid}`, data.firstName);
          if (data.photoURL) await AsyncStorage.setItem(`user_photo_${auth.currentUser!.uid}`, data.photoURL);
          if (data.unitSystem) await AsyncStorage.setItem(`unit_system_${auth.currentUser!.uid}`, data.unitSystem);
          router.replace('/(tabs)');
        } else {
          setIsProfileSetup(true);
        }
      } catch (error: any) {
        console.warn(`Attempt ${retryCount + 1} failed:`, error.code);

        const isNetworkError = 
          error.code === 'unavailable' || 
          error.code === 'failed-precondition' || 
          error.message?.toLowerCase().includes('offline');

        if (isNetworkError && retryCount < 1) {
          // Wake up the network and wait 1.5s for the handshake
          await enableNetwork(db).catch(() => {});
          await new Promise(resolve => setTimeout(resolve, 1500));
          return performCheck(retryCount + 1);
        }

        if (isNetworkError) {
          showAlert(
            'Connection Issues', 
            'PaceForge is struggling to reach the forge. Please check your signal and tap to retry.', 
            'error'
          );
        } else {
          // Fallback for new users or permission issues
          setIsProfileSetup(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    await performCheck();
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim()) {
      showAlert('Required', 'Please enter your name so we can greet you!', 'error');
      return;
    }

    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    // Validate Weight Range (e.g., 20kg - 400kg or 45lbs - 900lbs)
    const minWeight = unitSystem === 'metric' ? 20 : 45;
    const maxWeight = unitSystem === 'metric' ? 400 : 900;
    if (isNaN(weightNum) || weightNum < minWeight || weightNum > maxWeight) {
      showAlert('Invalid Weight', `Please enter a valid weight between ${minWeight} and ${maxWeight} ${unitSystem === 'metric' ? 'kg' : 'lbs'}.`, 'error');
      return;
    }

    // Validate Height Range (e.g., 60cm - 250cm or 24in - 100in)
    const minHeight = unitSystem === 'metric' ? 60 : 24;
    const maxHeight = unitSystem === 'metric' ? 250 : 100;
    if (isNaN(heightNum) || heightNum < minHeight || heightNum > maxHeight) {
      showAlert('Invalid Height', `Please enter a valid height between ${minHeight} and ${maxHeight} ${unitSystem === 'metric' ? 'cm' : 'in'}.`, 'error');
      return;
    }

    // Validate Birth Date Format and Values
    const dateParts = birthDate.split('/');
    if (dateParts.length !== 3 || birthDate.length !== 10) {
      showAlert('Invalid Date', 'Please use the MM/DD/YYYY format.', 'error');
      return;
    }

    const m = parseInt(dateParts[0]);
    const d = parseInt(dateParts[1]);
    const y = parseInt(dateParts[2]);
    const dateObj = new Date(y, m - 1, d);
    const currentYear = new Date().getFullYear();

    if (isNaN(dateObj.getTime()) || dateObj.getMonth() !== m - 1 || y < 1900 || y > currentYear - 5) {
      showAlert('Invalid Date', 'Please enter a valid birth date.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          firstName: firstName.trim(),
          weight: weightNum,
          height: heightNum,
          birthDate: birthDate.trim(),
          photoURL: photoURL,
          gender,
          unitSystem,
          setupCompleted: true,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        
        // Cache completion status locally so the user can enter the app offline next time
        await AsyncStorage.setItem(`setup_completed_${auth.currentUser.uid}`, 'true');
        await AsyncStorage.setItem(`unit_system_${auth.currentUser.uid}`, unitSystem);
        await AsyncStorage.setItem(`user_name_${auth.currentUser.uid}`, firstName.trim());
        if (photoURL) await AsyncStorage.setItem(`user_photo_${auth.currentUser.uid}`, photoURL);

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      showAlert('Error', 'Failed to save profile: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthMethodChange = (method: 'google' | 'email') => {
    setAuthMethod(method);
  };

  // Dot animation effect for loading states
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingDots(prev => (prev.length >= 3 ? '' : prev + '.'));
      }, 400);
    } else {
      setLoadingDots('');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  // Handle auto-formatting for MM/DD/YYYY with immediate slash injection
  const handleDateChange = (text: string) => {
    // Detect if user is deleting to allow removing slashes gracefully
    if (text.length < birthDate.length) {
      setBirthDate(text);
      return;
    }

    // Remove any non-numeric characters
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length >= 2) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    if (cleaned.length >= 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    }
    setBirthDate(formatted);
  };

  const handleForgotPassword = async () => {
    console.log('🔄 Starting password reset process');
    console.log('📧 Email being validated:', email);
    
    // Validate email field
    if (!email.trim()) {
      console.log('❌ Email validation failed: Empty email');
      setErrors(prev => ({ ...prev, email: 'Please enter your email address' }));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!validateEmail(email)) {
      console.log('❌ Email validation failed: Invalid format');
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    console.log('✅ Email validation passed');
    console.log('🔐 Firebase auth object:', auth);
    console.log('📤 Attempting to send password reset email to:', email);

    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent successfully');
      showAlert('Reset Link Sent', 'Please check your email for instructions to reset your password.', 'success');
    } catch (error: any) {
      console.error('❌ Password reset error:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      
      if (error.code === 'auth/user-not-found') {
        showAlert('Error', 'We couldn\'t find an account with that email address.', 'error');
      } else if (error.code === 'auth/invalid-email') {
        showAlert('Error', 'The email address is not valid.', 'error');
      } else if (error.code === 'auth/too-many-requests') {
        showAlert('Error', 'Too many requests. Please try again later.', 'error');
      } else {
        showAlert('Error', `Failed to send reset link: ${error.message}`, 'error');
      }
    }
  };
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    // Create a temporary animation that doesn't fight with the loop
    const tempPulseAnim = new Animated.Value(1);
    Animated.sequence([
      Animated.timing(tempPulseAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(tempPulseAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const result = await promptAsync();
      if (result.type !== 'success') {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setIsLoading(false);
      showAlert('Error', 'Failed to sign in with Google. Please try again.', 'error');
    }
  };

  return (
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
      
      <Animated.View style={[
        styles.content, 
        { 
          paddingTop: insets.top + 40,
          paddingBottom: keyboardHeightAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [insets.bottom + 80, keyboardHeight],
            extrapolate: 'clamp',
          }),
        }
      ]}>
        {/* Only show branding when NOT in setup or verification mode to save space */}
        {!isProfileSetup && !isVerificationSent && (
          <>
            <Animated.View style={[
              styles.iconContainer,
              {
                transform: [
                  { scale: pulseAnim },
                  { scale: authMethodAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.8],
                  })},
                  { translateY: authMethodAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20],
                  })}
                ],
                opacity: fadeAnim,
              }
            ]}>
              <View style={styles.iconBackground}>
                <Animated.View style={{
                  transform: [{
                    scale: authMethodAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.8],
                    })
                  }]
                }}>
                  <Ionicons 
                    name="fitness" 
                    size={100} 
                    color={theme.tint}
                    style={styles.appIcon}
                  />
                </Animated.View>
              </View>
              <Animated.View style={[
                styles.iconGlow,
                {
                  opacity: authMethodAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 0.1],
                  })
                }
              ]}>
                <Ionicons 
                  name="fitness-outline" 
                  size={120} 
                  color={theme.tint}
                  style={styles.iconGlowIcon}
                />
              </Animated.View>
            </Animated.View>

            <Animated.View style={[
              styles.textContainer,
              {
                transform: [
                  { translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  }) },
                  { translateY: authMethodAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -30],
                  })}
                ],
                opacity: fadeAnim,
              }
            ]}>
              <Animated.View style={{
                transform: [{
                  scale: authMethodAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.95],
                  })
                }]
              }}>
                <Text style={[styles.title, { color: theme.text }]}>
                  🔨 PaceForge
                </Text>
              </Animated.View>
              <Animated.View style={{
                transform: [{
                  scale: authMethodAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.95],
                  })
                }]
              }}>
                <Text style={[styles.subtitle, { color: theme.icon }]}>
                  Forge Your Running Legacy
                </Text>
              </Animated.View>
              <Animated.View style={{
                opacity: authMethodAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
                transform: [{
                  translateY: authMethodAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20],
                  })
                }]
              }}>
                <Text style={[styles.motivationText, { color: theme.text }]}>
                  Every strike shapes your strength. Every mile forges your spirit.
                </Text>
              </Animated.View>
            </Animated.View>
          </>
        )}

        {/* Post-Verification Profile Setup */}
        {isProfileSetup ? (
          <Animated.View style={[styles.emailContainer, { opacity: fadeAnim }]}>
            <Text style={[styles.title, { color: theme.text, textAlign: 'left', fontSize: 28 }]}>
              Welcome to the Forge
            </Text>
            <Text style={[styles.subtitle, { color: theme.icon, textAlign: 'left', marginBottom: 24 }]}>
              Let's customize your tracking for better accuracy.
            </Text>

            <View style={[styles.inputContainer, { backgroundColor: theme.surface }]}>
              <Ionicons name="person-outline" size={20} color={theme.icon} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="First Name"
                placeholderTextColor={theme.icon}
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.surface }]}>
              <Ionicons name="calendar-outline" size={20} color={theme.icon} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Birth Date (MM/DD/YYYY)"
                keyboardType="number-pad"
                maxLength={10}
                placeholderTextColor={theme.icon}
                value={birthDate}
                onChangeText={handleDateChange}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.inputContainer, styles.smallInputContainer, { backgroundColor: theme.surface, flex: 1 }]}>
                <Ionicons name="scale-outline" size={20} color={theme.icon} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Weight"
                  keyboardType="numeric"
                  placeholderTextColor={theme.icon}
                  value={weight}
                  onChangeText={setWeight}
                />
                <Text style={{ color: theme.icon, fontSize: 13, fontWeight: '700', marginLeft: 4 }}>
                  {unitSystem === 'metric' ? 'kg' : 'lbs'}
                </Text>
              </View>
              <View style={[styles.inputContainer, styles.smallInputContainer, { backgroundColor: theme.surface, flex: 1 }]}>
                <Ionicons name="resize-outline" size={20} color={theme.icon} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Height"
                  keyboardType="numeric"
                  placeholderTextColor={theme.icon}
                  value={height}
                  onChangeText={setHeight}
                />
                <Text style={{ color: theme.icon, fontSize: 13, fontWeight: '700', marginLeft: 4 }}>
                  {unitSystem === 'metric' ? 'cm' : 'in'}
                </Text>
              </View>
            </View>

            <View style={[styles.toggleContainer, { marginBottom: 16, backgroundColor: theme.surface }]}>
              {(['imperial', 'metric'] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setUnitSystem(u)}
                  style={[
                    styles.toggleButton,
                    { flex: 1, borderRadius: 8 },
                    unitSystem === u && { backgroundColor: theme.tint }
                  ]}
                >
                  <Text style={{ 
                    color: unitSystem === u ? (isDark ? '#000' : '#fff') : theme.icon, 
                    fontWeight: '700',
                    textTransform: 'capitalize' 
                  }}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.toggleContainer, { marginBottom: 24, backgroundColor: theme.surface }]}>
              {(['male', 'female'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGender(g)}
                  style={[
                    styles.toggleButton,
                    { flex: 1, borderRadius: 8 },
                    gender === g && { backgroundColor: theme.tint }
                  ]}
                >
                  <Text style={{ 
                    color: gender === g ? (isDark ? '#000' : '#fff') : theme.icon, 
                    fontWeight: '700',
                    textTransform: 'capitalize' 
                  }}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.privacyNoteContainer}>
              <Ionicons name="shield-checkmark-outline" size={16} color={theme.icon} />
              <Text style={[styles.privacyNoteText, { color: theme.icon }]}>
                We use this data strictly to calculate accurate health metrics (BMI, Calories). 
                We value your privacy and <Text style={{ fontWeight: 'bold' }}>never sell your data</Text>. 
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.tint }]}
              onPress={handleSaveProfile}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, { color: isDark ? '#000' : '#fff', marginLeft: 0 }]}>
                {isLoading ? `Saving${loadingDots}` : 'Begin Journey'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ) : isVerificationSent ? (
          <Animated.View style={[styles.emailContainer, { opacity: fadeAnim, alignItems: 'center' }]}>
            <View style={[styles.iconBackground, { width: 100, height: 100, borderRadius: 50, marginBottom: 20 }]}>
              <Ionicons name="mail-open" size={50} color={theme.tint} />
            </View>
            <Text style={[styles.subtitle, { color: theme.text, fontSize: 18, marginBottom: 12 }]}>
              Verify your email
            </Text>
            <Text style={[styles.motivationText, { color: theme.icon, marginBottom: 30 }]}>
              We've sent a link to {email}. Click it to forge your account and start your journey.
            </Text>
            
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.tint }]}
              onPress={checkVerificationStatus}
              disabled={isLoading}
            >
              <View style={styles.buttonContent}>
                {isLoading ? (
                  <Text style={[styles.buttonText, { color: isDark ? '#000' : '#fff', marginLeft: 0 }]}>{`Checking${loadingDots}`}</Text>
                ) : (
                  <>
                    <Ionicons name="refresh" size={20} color={isDark ? '#000' : '#fff'} />
                    <Text style={[styles.buttonText, { color: isDark ? '#000' : '#fff' }]}>I've Verified</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchAuthButton}
              onPress={async () => {
                setIsLoading(true);
                try {
                  if (auth.currentUser) {
                    await sendEmailVerification(auth.currentUser);
                    showAlert('Sent', 'A new verification link has been sent. Please check your spam folder.', 'success');
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  } else {
                    showAlert('Error', 'User session not found. Please try signing in.', 'error');
                  }
                } catch (error: any) {
                  showAlert('Error', error.message || 'Failed to resend email.', 'error');
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              <Text style={[styles.switchAuthText, { color: theme.tint }]}>
                Resend Email
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <>
            {/* Auth Method Toggle */}
            <Animated.View style={[
              styles.authMethodContainer, 
          { 
            opacity: fadeAnim, 
            transform: [{
              translateY: authMethodAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -10],
              })
            }]
          }
        ]}>
          <View style={[
            styles.toggleContainer, 
            { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
            isDark && { borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }
          ]}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                authMethod === 'google' && { backgroundColor: theme.tint }
              ]}
              onPress={() => handleAuthMethodChange('google')}
            >
              <Ionicons 
                name="logo-google" 
                size={20} 
                color={authMethod === 'google' ? (isDark ? '#000' : '#fff') : theme.icon} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                authMethod === 'email' && { backgroundColor: theme.tint }
              ]}
              onPress={() => handleAuthMethodChange('email')}
            >
              <Ionicons 
                name="mail" 
                size={20} 
                color={authMethod === 'email' ? (isDark ? '#000' : '#fff') : theme.icon} 
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Google Sign In */}
        {authMethod === 'google' && (
          <Animated.View style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: authMethodAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 120],
                })},
                { scale: authMethodAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                })}
              ],
              overflow: 'hidden',
            }
          ]}>
            <Animated.View style={{
              opacity: authMethodAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
              transform: [{
                scale: authMethodAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.8],
                })
              }]
            }}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: theme.tint,
                    shadowColor: theme.tint,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 8,
                  }
                ]}
                onPress={handleGoogleSignIn}
                disabled={isLoading}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="logo-google" size={24} color={isDark ? '#000' : '#fff'} />
                  <Text style={[styles.buttonText, { color: isDark ? '#000' : '#fff' }]}>
                    {isLoading ? `Connecting${loadingDots}` : 'Continue with Google'}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        )}

        {/* Email/Password Auth */}
        {authMethod === 'email' && (
          <Animated.View style={[
            styles.emailContainer, 
            { 
              opacity: fadeAnim,
              transform: [
                { translateY: authMethodAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                })},
                { scale: authMethodAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                })}
              ],
              overflow: 'hidden',
            }
          ]}>
            <Animated.View style={[styles.inputContainer, { 
              backgroundColor: theme.surface, 
              borderWidth: 1,
              borderColor: errors.email ? theme.error : (isEmailValid ? theme.success : 'transparent'),
              opacity: authMethodAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
              transform: [{
                translateY: authMethodAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                })
              }]
            }]}>
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={isEmailValid ? theme.success : theme.icon} 
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  { 
                    color: theme.text,
                    backgroundColor: 'transparent',
                  }
                ]}
                placeholder="Email"
                placeholderTextColor={theme.icon}
                value={email}
                onChangeText={text => {
                  setEmail(text);
                  // Clear email error when user starts typing
                  if (errors.email) {
                    setErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
                onBlur={() => {
                  if (email && !validateEmail(email)) {
                    setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {isEmailValid && (
                <Ionicons name="checkmark-circle" size={18} color={theme.success} />
              )}
            </Animated.View>
            {/* Display email error message */}
            {errors.email && (
              <View style={styles.errorContainer}>
                <Ionicons 
                  name="alert-circle-outline" 
                  size={12} 
                  color={theme.error} 
                  style={styles.errorIcon}
                />
                <Text style={[styles.errorText, { color: theme.error }]}>
                  {errors.email}
                </Text>
              </View>
            )}

            <Animated.View style={[styles.inputContainer, { 
              backgroundColor: theme.surface, 
              borderWidth: 1,
              borderColor: errors.password ? theme.error : (isSignUp && isPasswordValid ? theme.success : 'transparent'),
              opacity: authMethodAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
              transform: [{
                translateY: authMethodAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                })
              }]
            }]}>
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color={isSignUp && isPasswordValid ? theme.success : theme.icon} 
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  { 
                    color: theme.text,
                    backgroundColor: 'transparent',
                  }
                ]}
                placeholder="Password"
                placeholderTextColor={theme.icon}
                value={password}
                onChangeText={text => {
                  setPassword(text);
                  // Clear password error when user starts typing
                  if (errors.password) {
                    setErrors(prev => ({ ...prev, password: '' }));
                  }
                }}
                onBlur={() => {
                  if (password) {
                    const validation = validatePassword(password, isSignUp);
                    if (!validation.isValid) {
                      setErrors(prev => ({ ...prev, password: validation.error }));
                    }
                  }
                }}
                secureTextEntry={!showPassword}
              />
              {isSignUp && isPasswordValid && (
                <Ionicons name="checkmark-circle" size={18} color={theme.success} style={{ marginRight: 8 }} />
              )}
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color={theme.icon} 
                />
              </TouchableOpacity>
            </Animated.View>
            {/* Display password error message */}
            {errors.password && (
              <View style={styles.errorContainer}>
                <Ionicons 
                  name="alert-circle-outline" 
                  size={12} 
                  color={theme.error} 
                  style={styles.errorIcon}
                />
                <Text style={[styles.errorText, { color: theme.error }]}>
                  {errors.password}
                </Text>
              </View>
            )}

            {/* Forgot Password Link */}
            {!isSignUp && (
              <TouchableOpacity 
                onPress={handleForgotPassword}
                style={styles.forgotPasswordContainer}
              >
                <Text style={[styles.forgotPasswordText, { color: theme.tint }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            )}

            <Animated.View style={{
              opacity: authMethodAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
              transform: [{
                translateY: authMethodAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                })
              }]
            }}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: theme.tint,
                    shadowColor: theme.tint,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 8,
                  }
                ]}
                onPress={handleEmailAuth}
                disabled={isLoading}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name={isSignUp ? "person-add" : "log-in"} size={24} color={isDark ? '#000' : '#fff'} />
                  <Text style={[styles.buttonText, { color: isDark ? '#000' : '#fff' }]}>
                    {isLoading ? `Processing${loadingDots}` : (isSignUp ? 'Create Account' : 'Sign In')}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchAuthButton}
                onPress={() => setIsSignUp(!isSignUp)}
              >
                <Text style={[styles.switchAuthText, { color: theme.tint }]}>
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
        </Animated.View>
            )}
          </>
        )}

        {/* Motivational Footer */}
        <Animated.View style={[
          styles.footer,
          {
            bottom: insets.bottom + 20,
            transform: [
              { translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0]
              })},
              { translateY: authMethodAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 20],
              })}
            ],
            opacity: fadeAnim,
          }
        ]}>
          <Animated.View style={{
            transform: [{
              scale: authMethodAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.95], // Less aggressive scaling to prevent blur
              })
            }]
          }}>
            <Text style={[
              styles.footerText,
              { 
                color: theme.icon,
              }
            ]}>
              ⚡ Your running greatness is forged here
            </Text>
          </Animated.View>
          <Animated.View style={{
            opacity: authMethodAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
            transform: [{
              translateY: authMethodAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -10],
              })
            }]
          }}>
            <Text style={[styles.footerSubtext, { color: theme.icon }]}>
              Join thousands of runners forging their destiny
            </Text>
          </Animated.View>
        </Animated.View>
      </Animated.View>
      
      {/* Alert Component */}
      <AlertComponent />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24, // Reduced padding for smaller screens
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
    minHeight: '100%', // Ensure full height on small screens
  },
  iconContainer: {
    marginBottom: 30, // Reduced margin for smaller screens
    position: 'relative',
    alignItems: 'center',
  },
  iconBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  iconGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.3,
  },
  iconGlowIcon: {
    position: 'absolute',
  },
  appIcon: {
    opacity: 0.9,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 20, // Reduced margin for smaller screens
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 8,
    fontWeight: '600',
  },
  motivationText: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  authMethodContainer: {
    marginBottom: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 25,
    padding: 4,
  },
  toggleButton: {
    width: 50,
    height: 50,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    width: width - 64,
    marginBottom: 16,
  },
  primaryButton: {
    width: width - 64,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  emailContainer: {
    width: width - 64,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  smallInputContainer: {
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  switchAuthButton: {
    alignItems: 'center',
    padding: 16,
  },
  switchAuthText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  footer: {
    position: 'absolute',
    bottom: 30, // Reduced bottom margin for smaller screens
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 0,
      marginBottom: 16,
      paddingLeft: 16,
    },
    errorIcon: {
      marginRight: 6,
    },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
      textAlign: 'left',
      flex: 1,
    },
    forgotPasswordContainer: {
      alignSelf: 'flex-end',
      marginTop: 4,
      marginBottom: 16,
    },
    forgotPasswordText: {
      fontSize: 14,
      fontWeight: '500',
  },
  privacyNoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 40, // Increased buffer between note and footer
    paddingHorizontal: 4,
    gap: 8,
  },
  privacyNoteText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});
