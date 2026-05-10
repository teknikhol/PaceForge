import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';
import { useColorScheme } from 'nativewind';

export default function RootLayout() {
  // 1. Destructure with a fallback to avoid the "next of undefined" error
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady) return null;

  const currentTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const gluestackMode = (colorScheme as "light" | "dark") || "light";

  return (
    <GluestackUIProvider mode={gluestackMode}>
      <ThemeProvider value={currentTheme}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          {/* Main Tab Navigation */}
          <Stack.Screen name="(tabs)" />
          
          {/* Profile & Settings Modal */}
          <Stack.Screen 
            name="modal" 
            options={{ 
              presentation: 'modal', // On iOS, this creates the card-stack effect
              animation: 'slide_from_bottom',
              headerShown: false, // We use our custom header inside modal.tsx
            }} 
          />
        </Stack>
      </ThemeProvider>
    </GluestackUIProvider>
  );
}