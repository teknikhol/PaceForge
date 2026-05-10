import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

/**
 * Single source of truth for light/dark mode (syncs with NativeWind + manual theme toggle).
 */
export function useColorScheme() {
  const nw = useNativeWindColorScheme() ?? { colorScheme: 'light' as const };

  return {
    colorScheme: (nw.colorScheme ?? 'light') as 'light' | 'dark',
    setColorScheme: nw.setColorScheme,
    toggleColorScheme: nw.toggleColorScheme,
  };
}
