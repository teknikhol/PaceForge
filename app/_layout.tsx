import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

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
          <Stack.Screen
            name="active-run"
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
              headerShown: false,
            }}
          />
        </Stack>
      </ThemeProvider>
    </GluestackUIProvider>
  );
}