import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function MeseraLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#A944FF',
        tabBarInactiveTintColor: '#4a4a6a',
        tabBarStyle: {
          backgroundColor: '#0E0D23',
          borderTopColor: 'rgba(169,68,255,0.15)',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
        headerShown: false,
      }}
    >
      {/* TAB 1: Realizar pedidos — aparece primero */}
      <Tabs.Screen
        name="orders"
        options={{
          title: "Pedidos",
          tabBarIcon: ({ color }) => <Ionicons name="fast-food-outline" size={24} color={color} />,
        }}
      />

      {/* TAB 2: Historial de mis pedidos */}
      <Tabs.Screen
        name="history"
        options={{
          title: "Mis Pedidos",
          tabBarIcon: ({ color }) => <Ionicons name="receipt-outline" size={24} color={color} />,
        }}
      />

      {/* TAB 3: Perfil y Ajustes de mesero */}
      <Tabs.Screen
        name="settings"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <Ionicons name="person-circle-outline" size={24} color={color} />,
        }}
      />

      {/* Ocultar index (pantalla de Mesas) de la navegación del mesero */}
      <Tabs.Screen
        name="index"
        options={{ href: null }}
      />
    </Tabs>
  );
}
