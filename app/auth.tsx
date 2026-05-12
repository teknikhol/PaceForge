import { useThemedAlert } from '@/components/themed-alert';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth } from '@/lib/firebase-config';
import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import { useAuthRequest } from 'expo-auth-session';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword } from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Google OAuth configuration
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://www.googleapis.com/oauth2/v4/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export default function AuthScreen() {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme];
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
  const [authMethod, setAuthMethod] = useState<'google' | 'email'>('google');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
      scopes: ['openid', 'profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri(),
      responseType: 'token',
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { access_token } = response.params;
      handleFirebaseSignIn(access_token);
    }
  }, [response]);

  const handleFirebaseSignIn = async (accessToken: string) => {
    try {
      const credential = GoogleAuthProvider.credential(null, accessToken);
      await signInWithCredential(auth, credential);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Firebase sign-in error:', error);
      setIsLoading(false);
      showAlert('Error', 'Failed to sign in with Google. Please try again.', 'error');
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      showAlert('Error', 'Please enter both email and password.', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        showAlert('Success', 'Account created successfully!', 'success');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.replace('/(tabs)');
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
      
      showAlert('Error', errorMessage, 'error');
    }
  };

  const handleAuthMethodChange = (method: 'google' | 'email') => {
    setAuthMethod(method);
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
      await promptAsync();
    } catch (error) {
      console.error('Authentication error:', error);
      setIsLoading(false);
      showAlert('Error', 'Failed to sign in with Google. Please try again.', 'error');
    }
  };

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
    inputIcon: {
      marginRight: 12,
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
  });

  return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      <Animated.View style={[
        styles.content, 
        { 
          paddingTop: insets.top + 40,
          paddingBottom: keyboardHeightAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, keyboardHeight],
            extrapolate: 'clamp',
          }),
        }
      ]}>
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

        {/* Animated Welcome Text */}
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
                outputRange: [1, 0.95], // Less aggressive scaling to prevent blur
              })
            }]
          }}>
            <Text style={[
              styles.title,
              { 
                color: theme.text,
              }
            ]}>
              🔨 PaceForge
            </Text>
          </Animated.View>
          <Animated.View style={{
            transform: [{
              scale: authMethodAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.95], // Less aggressive scaling to prevent blur
              })
            }]
          }}>
            <Text style={[
              styles.subtitle,
              { 
                color: theme.icon,
              }
            ]}>
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
          <View style={styles.toggleContainer}>
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
                color={authMethod === 'google' ? '#fff' : theme.icon} 
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
                color={authMethod === 'email' ? '#fff' : theme.icon} 
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
                  <Ionicons name="logo-google" size={24} color="#fff" />
                  <Text style={[styles.buttonText, { color: '#fff' }]}>
                    {isLoading ? 'Connecting...' : 'Continue with Google'}
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
              borderWidth: 0,
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
                color={theme.icon} 
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
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Animated.View>

            <Animated.View style={[styles.inputContainer, { 
              backgroundColor: theme.surface, 
              borderWidth: 0,
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
                color={theme.icon} 
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
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
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
                  <Ionicons name={isSignUp ? "person-add" : "log-in"} size={24} color="#fff" />
                  <Text style={[styles.buttonText, { color: '#fff' }]}>
                    {isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
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

        {/* Motivational Footer */}
        <Animated.View style={[
          styles.footer,
          {
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
    </View>
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
  inputIcon: {
    marginRight: 12,
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
});
