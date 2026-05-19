import { Redirect } from "expo-router";
import { useAuthStore, getDashboardRoute } from "../store/authStore";
import { View, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { NoxColors } from '../constants/theme';


export default function Index() {
  const [hydrated, setHydrated] = useState(false);
  const user = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    // Escuchar cuando el storage de Zustand esté listo
    const checkHydration = async () => {
      await useAuthStore.persist.rehydrate();
      setHydrated(true);
    };
    checkHydration();
  }, []);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: NoxColors.deep, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={NoxColors.aura} size="large" />
      </View>
    );
  }

  // Si ya tenemos token y usuario, redireccionamos directo a su panel
  if (token && user) {
    return <Redirect href={getDashboardRoute(user.role) as any} />;
  }

  // Por defecto, mandamos al login
  return <Redirect href="/(auth)/login" />;

}

