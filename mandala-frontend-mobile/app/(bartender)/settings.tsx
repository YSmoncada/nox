import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';

export default function BartenderSettingsScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const clearAuth = useAuthStore(state => state.clearAuth);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
        if (window.confirm("¿Estás seguro de que deseas cerrar sesión?")) {
            clearAuth();
            router.replace("/(auth)/login");
        }
    } else {
        Alert.alert(
          "Cerrar Sesión",
          "¿Estás seguro de que deseas salir del sistema?",
          [
            { text: "Cancelar", style: "cancel" },
            { 
              text: "Salir", 
              style: "destructive",
              onPress: () => {
                clearAuth();
                router.replace('/(auth)/login');
              }
            }
          ]
        );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1A103C', '#000']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
            <Text style={styles.brandingNox}>Nox<Text style={styles.brandingOS}>OS</Text></Text>
            <Text style={styles.subtitle}>CONFIGURACIÓN DE PERFIL</Text>
        </View>

        <View style={styles.content}>
            <View style={styles.infoCard}>
                <View style={styles.avatarCircle}>
                    <Ionicons name="beer" size={40} color="#A944FF" />
                </View>
                <Text style={styles.userLabel}>BARTENDER ACTIVO</Text>
                <Text style={styles.userName}>{user?.username || 'PERFIL STAFF'}</Text>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#fff" style={{marginRight: 15}} />
                <Text style={styles.logoutText}>CERRAR SESIÓN</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Mandala Bartender v2.5</Text>
                <Text style={styles.footerText}>Sistema de Gestión de Barra</Text>
            </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safe: { flex: 1 },
  header: { paddingHorizontal: 30, paddingTop: 60, marginBottom: 40 },
  brandingNox: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  brandingOS: { color: '#71717a' },
  subtitle: { fontSize: 10, color: '#8A7BAF', fontWeight: '900', letterSpacing: 4, marginTop: 5 },
  
  content: { flex: 1, paddingHorizontal: 25, justifyContent: 'center' },
  infoCard: { 
    backgroundColor: '#0E0D23', 
    borderRadius: 30, 
    padding: 40, 
    alignItems: 'center', 
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  avatarCircle: { 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    backgroundColor: 'rgba(169, 68, 255, 0.1)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  userLabel: { color: '#444', fontSize: 10, fontWeight: '900', letterSpacing: 3, marginBottom: 5 },
  userName: { color: '#fff', fontSize: 24, fontWeight: 'bold', textTransform: 'uppercase' },

  logoutBtn: { 
    flexDirection: 'row',
    backgroundColor: '#f44336', 
    padding: 22, 
    borderRadius: 25, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#f44336',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5
  },
  logoutText: { color: '#fff', fontWeight: '900', letterSpacing: 2, fontSize: 14 },
  
  footer: { marginTop: 50, alignItems: 'center' },
  footerText: { color: '#444', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 5 }
});
