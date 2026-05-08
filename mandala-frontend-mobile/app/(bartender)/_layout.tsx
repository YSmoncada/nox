import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function BartenderLayout() {
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
      {/* TAB 1: Monitor de pedidos pendientes */}
      <Tabs.Screen
        name="prep"
        options={{
          title: "Pendientes",
          tabBarIcon: ({ color }) => <Ionicons name="beer-outline" size={24} color={color} />,
        }}
      />

      {/* TAB 2: Nuevo pedido (bartender también puede tomar pedidos) */}
      <Tabs.Screen
        name="orders"
        options={{
          title: "Pedidos",
          tabBarIcon: ({ color }) => <Ionicons name="fast-food-outline" size={24} color={color} />,
        }}
      />

      {/* TAB 3: Mis pedidos / historial */}
      <Tabs.Screen
        name="history"
        options={{
          title: "Mis Pedidos",
          tabBarIcon: ({ color }) => <Ionicons name="receipt-outline" size={24} color={color} />,
        }}
      />

      {/* TAB 4: Perfil y Cierre de sesión */}
      <Tabs.Screen
        name="settings"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <Ionicons name="person-circle-outline" size={24} color={color} />,
        }}
      />

      {/* Ocultar index genérico */}
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}
