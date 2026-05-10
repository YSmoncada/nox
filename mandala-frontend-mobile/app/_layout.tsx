import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '../store/authStore';
import { useAlertStore } from '../store/alertStore';
import NoxAlert from '../components/NoxAlert';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const navigationState = useRootNavigationState();
  
  // Global Alert State
  const alert = useAlertStore();

  useEffect(() => {
    if (!navigationState?.key) return;

    // Use a short timeout to ensure the Layout component has fully mounted
    const timer = setTimeout(() => {
      const inAuthGroup = segments[0] === '(auth)';
      const inClientGroup = segments[0] === '(client)';

      // 1. Si NO hay token y NO estamos en login o cliente, mandar a login
      if (!token && !inAuthGroup && !inClientGroup) {
        router.replace('/(auth)/login');
        return;
      }

      // 2. Si HAY token y estamos en la pantalla de login, mandar a su dashboard
      if (token && inAuthGroup) {
        const role = user?.role?.toLowerCase() || '';
        
        if (role === 'admin') {
          router.replace('/(admin)/orders');
        } else if (role === 'mesera' || role === 'mesero') {
          router.replace('/(mesera)/orders');
        } else if (role === 'bartender') {
          router.replace('/(bartender)/prep');
        } else {
          // Fallback si no hay rol definido
          router.replace('/(auth)/login');
        }
      }

      // 3. Protección de roles cruzados (opcional pero recomendado)
      if (token && user) {
          const role = user.role?.toLowerCase();
          const currentGroup = segments[0];

          if (currentGroup === '(admin)' && role !== 'admin') {
              router.replace('/(auth)/login');
          }
          if (currentGroup === '(bartender)' && role !== 'bartender' && role !== 'admin') {
              router.replace('/(auth)/login');
          }
      }
    }, 1);

    return () => clearTimeout(timer);
  }, [token, segments, user, navigationState?.key]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="(mesera)" options={{ headerShown: false }} />
        <Stack.Screen name="(bartender)" options={{ headerShown: false }} />
        <Stack.Screen name="(client)/[id]" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />

      {/* Global Alert System */}
      <NoxAlert 
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        confirmText={alert.confirmText}
        onConfirm={() => {
          if (alert.onConfirm) alert.onConfirm();
          alert.hideAlert();
        }}
      />
    </ThemeProvider>
  );
}
