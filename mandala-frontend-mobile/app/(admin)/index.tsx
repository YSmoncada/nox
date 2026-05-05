import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, TouchableOpacity, Platform, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import apiClient from '../../utils/apiClient';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

const MODULES = [
  { id: 'inventory', label: 'INVENTARIO', sub: 'Control de Stock', icon: 'cube-outline', path: '/(admin)/inventory' },
  { id: 'orders', label: 'PEDIDOS', sub: 'Historial y Monitor', icon: 'receipt-outline', path: '/(admin)/orders' },
  { id: 'mesas', label: 'MESAS', sub: 'Configuración Salón', icon: 'grid-outline', path: '/(admin)/mesas' },
  { id: 'users', label: 'USUARIOS', sub: 'Gestión de Staff', icon: 'people-outline', path: '/(admin)/users' },
  { id: 'history', label: 'REPORTES', sub: 'Estadísticas Nox', icon: 'bar-chart-outline', path: '/(admin)/history' },
  { id: 'accounting', label: 'CAJA', sub: 'Flujo de Efectivo', icon: 'cash-outline', path: '/(admin)/accounting' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({ totalVentas: 0, pedidosHoy: 0, stockBajoCount: 0 });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { clearAuth, user } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
        fetchStats();
    }, [])
  );

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [prodRes, pedRes] = await Promise.all([
          apiClient.get('/productos/'),
          apiClient.get('/pedidos/') // Traemos todos para filtrar en frontend por fecha y estado
      ]);
      
      const prods = prodRes.data; 
      const stockBajo = Array.isArray(prods) ? prods.filter((p: any) => parseFloat(p.stock_actual || 0) <= 5).length : 0;
      
      const peds = Array.isArray(pedRes.data) ? pedRes.data : [];
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // Filtramos solo los de HOY que estén Pagados o Despachados
      const pedsHoy = peds.filter((p: any) => {
          const pDate = (p.fecha_hora || "").split('T')[0];
          const isToday = pDate === today || pDate === localToday;
          const isFinished = p.estado_nombre === 'Pagado' || p.estado_nombre === 'Despachado';
          return isToday && isFinished;
      });

      const totalVentas = pedsHoy.reduce((acc: number, p: any) => acc + parseFloat(p.total || 0), 0);

      setStats({
        totalVentas: totalVentas,
        pedidosHoy: pedsHoy.length,
        stockBajoCount: stockBajo
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
        if (window.confirm("¿Estás seguro de que deseas cerrar sesión?")) {
            clearAuth();
            router.replace("/(auth)/login");
        }
    } else {
        Alert.alert("Cerrar Sesión", "¿Estás seguro?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Salir", style: "destructive", onPress: () => {
                clearAuth();
                router.replace("/(auth)/login");
            }}
        ]);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStats} tintColor="#A944FF" />}
      >
        {/* Header - Premium NoxOS */}
        <View style={styles.header}>
            <View>
                <Text style={styles.welcomeText}>Panel de Administración</Text>
                <Text style={styles.brandingNox}>Nox<Text style={styles.brandingOS}>OS</Text></Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                <Ionicons name="power" size={20} color="#ff4444" />
            </TouchableOpacity>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
            <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>{user?.username ? user.username.substring(0,2).toUpperCase() : 'AD'}</Text>
            </View>
            <View>
                <Text style={styles.userName}>{user?.username || 'ADMIN'}</Text>
                <View style={styles.onlineBadge}>
                    <View style={styles.dot} />
                    <Text style={styles.onlineText}>SESIÓN ACTIVA</Text>
                </View>
            </View>
        </View>

        {/* Mini Stats Grid */}
        <View style={styles.statsSection}>
            <View style={styles.statsGrid}>
                <View style={[styles.statItem, { borderLeftColor: '#10b981' }]}>
                    <Ionicons name="trending-up" size={14} color="#10b981" />
                    <Text style={styles.statValue}>${stats.totalVentas.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Ventas Totales</Text>
                </View>
                <View style={[styles.statItem, { borderLeftColor: '#A944FF' }]}>
                    <Ionicons name="receipt" size={14} color="#A944FF" />
                    <Text style={styles.statValue}>{stats.pedidosHoy}</Text>
                    <Text style={styles.statLabel}>Pedidos Hoy</Text>
                </View>
                <View style={[styles.statItem, { borderLeftColor: '#ff4444' }]}>
                    <Ionicons name="alert-circle" size={14} color="#ff4444" />
                    <Text style={styles.statValue}>{stats.stockBajoCount}</Text>
                    <Text style={styles.statLabel}>Stock Crítico</Text>
                </View>
            </View>
        </View>

        {/* Modules Grid - Premium Cards */}
        <View style={styles.modulesSection}>
           <Text style={styles.sectionTitle}>Módulos Estratégicos</Text>
           <View style={styles.modulesGrid}>
             {MODULES.map((mod) => (
                <TouchableOpacity 
                    key={mod.id} 
                    style={styles.moduleCard}
                    onPress={() => router.push(mod.path as any)}
                >
                    <View style={styles.moduleIconContainer}>
                        <Ionicons name={mod.icon as any} size={28} color="#fff" />
                    </View>
                    <View style={styles.moduleInfo}>
                        <Text style={styles.moduleLabel}>{mod.label}</Text>
                        <Text style={styles.moduleSub}>{mod.sub}</Text>
                    </View>
                    <View style={styles.moduleArrow}>
                        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
                    </View>
                </TouchableOpacity>
             ))}
           </View>
        </View>

        <View style={{height: 120}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050510' },
  scrollContent: { paddingTop: Platform.OS === 'ios' ? 70 : 50 },
  header: { 
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 25, 
    marginBottom: 30
  },
  welcomeText: { color: '#8A7BAF', fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  brandingNox: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  brandingOS: { color: '#A944FF' },
  logoutBtn: { backgroundColor: 'rgba(255, 68, 68, 0.05)', padding: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255, 68, 68, 0.1)' },

  userCard: { 
    marginHorizontal: 25, 
    backgroundColor: '#0E0D23', 
    borderRadius: 30, 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 30, 
    borderWidth: 1, 
    borderColor: 'rgba(169, 68, 255, 0.1)' 
  },
  userAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#A944FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  userName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  onlineText: { color: '#10b981', fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  statsSection: { paddingHorizontal: 25, marginBottom: 40 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statItem: { 
    backgroundColor: '#0E0D23', 
    padding: 15, 
    borderRadius: 24, 
    flex: 1,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 8
  },
  statValue: { color: '#fff', fontSize: 14, fontWeight: '900' },
  statLabel: { color: '#8A7BAF', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },

  modulesSection: { paddingHorizontal: 25 },
  sectionTitle: { color: '#8A7BAF', fontSize: 10, fontWeight: '900', letterSpacing: 3, marginBottom: 20, textTransform: 'uppercase' },
  modulesGrid: { gap: 12 },
  moduleCard: { 
    backgroundColor: '#0E0D23', 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  moduleIconContainer: { 
    width: 58, 
    height: 58, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 18
  },
  moduleInfo: { flex: 1, gap: 2 },
  moduleLabel: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  moduleSub: { color: '#8A7BAF', fontSize: 11, fontWeight: '500' },
  moduleArrow: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 14 }
});
