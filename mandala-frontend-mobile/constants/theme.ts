/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const NoxColors = {
  aura: '#A944FF',       // Morado Neon (Acciones principales)
  background: '#050510', // Fondo Oscuro NoxOS
  card: '#0E0D23',       // Fondo de Tarjetas/Modales
  container: '#1A103C',  // Violeta Oscuro (Botones secundarios, inputs)
  muted: '#8A7BAF',      // Gris Lavanda (Labels, textos de apoyo)
  subtext: '#71717a',    // Gris Oscuro (Descripciones secundarias)
  border: 'rgba(255,255,255,0.05)', // Bordes sutiles
  emerald: '#10b981',    // Verde Dinero/Éxito (Stocks, confirmar)
  amber: '#f59e0b',      // Naranja Alerta
  rose: '#ff4444',       // Rojo Error/Peligro (Borrar, salir)
  text: '#ffffff',       // Blanco Puro (Títulos principales)
  deep: '#000000',       // Negro Absoluto
  gray: '#444444',       // Gris Medio/Cercano a placeholders
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
