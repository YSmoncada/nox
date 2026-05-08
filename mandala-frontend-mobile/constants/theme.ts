/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const NoxColors = {
  aura: '#A944FF',       // Morado Neon
  deep: '#000000',       // Negro Puro
  card: '#0E0D23',       // Fondo de Tarjetas
  muted: '#8A7BAF',      // Gris Lavanda
  border: 'rgba(255,255,255,0.05)', 
  emerald: '#10b981',    // Verde Dinero/Exito
  amber: '#f59e0b',      // Naranja Alerta
  rose: '#ef4444',       // Rojo Error
  text: '#ECEDEE',
  subtext: '#71717a'
};

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: NoxColors.aura,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: NoxColors.aura,
  },
  dark: {
    text: NoxColors.text,
    background: NoxColors.deep,
    tint: NoxColors.aura,
    icon: NoxColors.muted,
    tabIconDefault: NoxColors.muted,
    tabIconSelected: NoxColors.aura,
    card: NoxColors.card,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
