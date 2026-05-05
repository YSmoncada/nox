import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function BartenderMenu() {
  const router = useRouter();

  const clearAuth = useAuthStore(state => state.clearAuth);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
        if (window.confirm("¿Estás seguro de que deseas cerrar sesión?")) {
            clearAuth();
            router.replace("/(auth)/login");
        }
    } else {
        clearAuth();
        router.replace("/(auth)/login");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brandingNox}>Nox<Text style={styles.brandingOS}>OS</Text></Text>
          <Text style={styles.subtitle}>PANEL DE BARTENDER</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#f44336" />
        </TouchableOpacity>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuCard} onPress={() => router.push("/(bartender)/prep" as any)}>
            <View style={styles.iconContainer}>
                <Ionicons name="beer-outline" size={42} color="#fff" />
            </View>
            <Text style={styles.menuLabel}>PREPARACIÓN</Text>
            <Text style={styles.menuDesc}>Ver pedidos por preparar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuCard, {marginTop: 20}]} onPress={() => router.push("/(bartender)/orders" as any)}>
            <View style={[styles.iconContainer, {backgroundColor: '#1E1B4B'}]}>
                <Ionicons name="receipt-outline" size={42} color="#fff" />
            </View>
            <Text style={styles.menuLabel}>NUEVO PEDIDO</Text>
            <Text style={styles.menuDesc}>Registrar venta directa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 25, 
    paddingTop: 60,
    paddingBottom: 40
  },
  brandingNox: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  brandingOS: { color: '#71717a' },
  subtitle: { fontSize: 10, color: '#8A7BAF', fontWeight: '900', letterSpacing: 3, marginTop: 5 },
  logoutBtn: { backgroundColor: '#1A103C', padding: 12, borderRadius: 15 },

  menuContainer: { padding: 25 },
  menuCard: { 
    backgroundColor: '#0E0D23', 
    borderRadius: 35, 
    padding: 30, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    elevation: 5
  },
  iconContainer: { 
    width: 90, 
    height: 90, 
    borderRadius: 30, 
    backgroundColor: '#A944FF', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 20
  },
  menuLabel: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  menuDesc: { color: '#8A7BAF', fontSize: 12, fontWeight: 'bold', marginTop: 5, opacity: 0.6 }
});
