import { Redirect } from "expo-router";
import { useAuthStore } from "../store/authStore";
import { View, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";

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
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#A944FF" size="large" />
      </View>
    );
  }

  // Si ya tenemos token y usuario, redireccionamos directo a su panel
  if (token && user) {
    if (user.role === 'admin') {
      return <Redirect href="/(admin)" />;
    } else if (user.role === 'bartender') {
      return <Redirect href="/(bartender)" />;
    } else if (user.role === 'mesera') {
      return <Redirect href="/(mesera)/orders" />;
    }
  }

  // Por defecto, mandamos al login
  return <Redirect href="/(auth)" />;
}
