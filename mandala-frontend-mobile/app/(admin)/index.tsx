import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, TouchableOpacity, Platform, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import apiClient from '../../utils/apiClient';
import { useAuthStore } from '../../store/authStore';
import LogoutModal from '../../components/LogoutModal';
import { NoxColors } from '../../constants/theme';


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
  const [showLogout, setShowLogout] = useState(false);

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
    setShowLogout(true);
  };

  const confirmLogout = () => {
    setShowLogout(false);
    clearAuth();
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStats} tintColor=NoxColors.aura />}
      >
        {/* Header - Premium NoxOS */}
        <View style={styles.header}>
            <View>
                <Text style={styles.welcomeText}>Panel de Administración</Text>
                <Text style={styles.brandingNox}>Nox<Text style={styles.brandingOS}>OS</Text></Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                <Ionicons name="power" size={20} color=NoxColors.rose />
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
                <View style={[styles.statItem, { borderLeftColor: NoxColors.emerald }]}>
                    <Ionicons name="trending-up" size={14} color=NoxColors.emerald />
                    <Text style={styles.statValue}>${stats.totalVentas.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Ventas Totales</Text>
                </View>
                <View style={[styles.statItem, { borderLeftColor: NoxColors.aura }]}>
                    <Ionicons name="receipt" size={14} color=NoxColors.aura />
                    <Text style={styles.statValue}>{stats.pedidosHoy}</Text>
                    <Text style={styles.statLabel}>Pedidos Hoy</Text>
                </View>
                <View style={[styles.statItem, { borderLeftColor: NoxColors.rose }]}>
                    <Ionicons name="alert-circle" size={14} color=NoxColors.rose />
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
                        <Ionicons name={mod.icon as any} size={28} color=NoxColors.text />
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

      <LogoutModal 
        visible={showLogout} 
        onCancel={() => setShowLogout(false)} 
        onConfirm={confirmLogout} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NoxColors.background },
  scrollContent: { paddingTop: Platform.OS === 'ios' ? 70 : 50 },
  header: { 
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 25, 
    marginBottom: 30
  },
  welcomeText: { color: NoxColors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  brandingNox: { fontSize: 36, fontWeight: '900', color: NoxColors.text, letterSpacing: -1 },
  brandingOS: { color: NoxColors.aura },
  logoutBtn: { backgroundColor: 'rgba(255, 68, 68, 0.05)', padding: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255, 68, 68, 0.1)' },

  userCard: { 
    marginHorizontal: 25, 
    backgroundColor: NoxColors.card, 
    borderRadius: 30, 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 30, 
    borderWidth: 1, 
    borderColor: 'rgba(169, 68, 255, 0.1)' 
  },
  userAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: NoxColors.aura, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: NoxColors.text, fontWeight: '900', fontSize: 18 },
  userName: { color: NoxColors.text, fontSize: 18, fontWeight: 'bold' },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: NoxColors.emerald },
  onlineText: { color: NoxColors.emerald, fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  statsSection: { paddingHorizontal: 25, marginBottom: 40 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statItem: { 
    backgroundColor: NoxColors.card, 
    padding: 15, 
    borderRadius: 24, 
    flex: 1,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: NoxColors.border,
    gap: 8
  },
  statValue: { color: NoxColors.text, fontSize: 14, fontWeight: '900' },
  statLabel: { color: NoxColors.muted, fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },

  modulesSection: { paddingHorizontal: 25 },
  sectionTitle: { color: NoxColors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 3, marginBottom: 20, textTransform: 'uppercase' },
  modulesGrid: { gap: 12 },
  moduleCard: { 
    backgroundColor: NoxColors.card, 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    borderRadius: 28,
    borderWidth: 1,
    borderColor: NoxColors.border
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
  moduleLabel: { color: NoxColors.text, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  moduleSub: { color: NoxColors.muted, fontSize: 11, fontWeight: '500' },
  moduleArrow: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 14 }
});
