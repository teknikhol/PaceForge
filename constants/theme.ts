/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A',         // Deep charcoal (Better readability than pure black)
    background: '#F8FAFC',   // Soft off-white (Reduces eye strain)
    tint: '#2962FF',         // Electric Blue (Focus & Trust)
    icon: '#64748B',
    tabIconDefault: '#64748B',
    tabIconSelected: '#2962FF',
    // New Semantic Colors
    surface: '#FFFFFF',      // Pure white for cards
    cardSecondary: '#E0E7FF', // Light blue tint for the "Motivation" box
    accent: '#EA580C',       // Burnt Orange (Dopamine/Energy)
    success: '#16A34A',
  },
  dark: {
    text: '#F1F5F9',         // Off-white
    background: '#0F1113',   // Deep slate (Easier on eyes than pure #000)
    tint: '#76FF03',         // Volt Green (Action/Alertness)
    icon: '#94A3B8',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#76FF03',
    // New Semantic Colors
    surface: '#1A1C1E',      // Elevation 1 background
    cardSecondary: '#24292E', // Subtle contrast for motivation cards
    accent: '#FB923C',       // Warm orange
    success: '#4ADE80',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'System',          // San Francisco is highly athletic/modern
    rounded: 'ui-rounded',   // Great for a "friendly coach" feel
  },
  android: {
    sans: 'Roboto',
  },
  default: {
    sans: 'sans-serif',
  }
});
