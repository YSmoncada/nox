import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AdminLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#333',
          height: 60,
          paddingBottom: 10,
        },
        headerStyle: {
          backgroundColor: '#000',
        },
        headerTintColor: '#FFF',
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: "Inicio",
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="inventory" 
        options={{ 
          title: "Inventario",
          tabBarIcon: ({ color }) => <Ionicons name="cube" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="orders" 
        options={{ 
          title: "Órdenes",
          tabBarIcon: ({ color }) => <Ionicons name="receipt" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="settings" 
        options={{ 
          title: "Ajustes",
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />
        }} 
      />
      {/* Ocultar pantallas secundarias de la barra inferior */}
      <Tabs.Screen name="users" options={{ href: null }} />
      <Tabs.Screen name="mesas" options={{ href: null }} />
      <Tabs.Screen name="bartender" options={{ href: null }} />
      <Tabs.Screen name="accounting" options={{ href: null }} />
      <Tabs.Screen name="history" options={{ href: null }} />
    </Tabs>
  );
}
