import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiClient from '../../utils/apiClient';
import { useAuthStore } from '../../store/authStore';

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pendiente:   { label: 'Pendiente',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  despachado:  { label: 'Despachado',  color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  finalizada:  { label: 'Finalizado',  color: '#8A7BAF', bg: 'rgba(138,123,175,0.1)' },
  finalizado:  { label: 'Finalizado',  color: '#8A7BAF', bg: 'rgba(138,123,175,0.1)' },
  pagado:      { label: 'Pagado',      color: '#8A7BAF', bg: 'rgba(138,123,175,0.1)' },
  cancelado:   { label: 'Cancelado',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

export default function MisPedidosScreen() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const user = useAuthStore(state => state.user);
  const clearAuth = useAuthStore(state => state.clearAuth);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [mesaAlerta, setMesaAlerta] = useState<any>(null);
  const [tab, setTab] = useState<'activas' | 'historial'>('activas');
  const router = useRouter();

  const fetchPedidos = async (uid?: string) => {
    const id = uid || user?.id;
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/pedidos/?usuario=${id}`);
      setPedidos(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Error fetching orders", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const checkBillRequests = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await apiClient.get('/mesas/');
      const mesas = Array.isArray(res.data) ? res.data : [];
      const pidiendo = mesas.find((m: any) => m.mesero_id === parseInt(user.id) && m.pidiendo_cuenta);
      if (pidiendo) {
        setMesaAlerta(pidiendo);
      }
    } catch (e) {
      console.error("Error checking bills", e);
    }
  }, [user?.id]);

  const handleLimpiarAlerta = async () => {
    if (!mesaAlerta) return;
    try {
      await apiClient.post(`/mesas/${mesaAlerta.id}/limpiar-cuenta/`);
      setMesaAlerta(null);
    } catch (e) {
      Alert.alert("Error", "No se pudo limpiar la alerta");
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchPedidos(user.id);
      const interval = setInterval(checkBillRequests, 5000);
      return () => clearInterval(interval);
    }
  }, [user?.id, checkBillRequests]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPedidos();
  }, [user?.id]);

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
              { text: "Salir", style: "destructive", onPress: () => {
                  clearAuth();
                  router.replace('/(auth)/login');
              }}
            ]
        );
    }
  };

  // AGRUPAR PEDIDOS POR MESA
  const activeGroups = React.useMemo(() => {
    const groups: Record<number, any> = {};
    
    // Primero identificamos qué mesas tienen ALGO pendiente o piden la cuenta
    const mesasActivasIds = new Set<number>();
    pedidos.forEach(p => {
      const statusLower = (p.estado_nombre || '').toLowerCase();
      
      // Verificación estricta: ¿Hay algún producto que no se haya llevado (despachado) totalmente?
      const tieneItemsPendientes = (p.productos_detalle || []).some(
        (prod: any) => (prod.cantidad_despachada || 0) < prod.cantidad
      );

      if (statusLower === 'pendiente' || tieneItemsPendientes || p.pidiendo_cuenta) {
        mesasActivasIds.add(p.mesa);
      }
    });

    pedidos.forEach(p => {
      const statusLower = (p.estado_nombre || '').toLowerCase();
      // Si la mesa está en el set de activas, agrupamos TODOS sus pedidos (incluso despachados)
      if (mesasActivasIds.has(p.mesa) && ['pendiente', 'despachado'].includes(statusLower)) {
        if (!groups[p.mesa]) {
          groups[p.mesa] = {
            mesa_id: p.mesa,
            mesa_numero: p.mesa_numero,
            total: 0,
            productos: [],
            pidiendo_cuenta: p.pidiendo_cuenta
          };
        }
        groups[p.mesa].total += parseFloat(p.total);
        if (p.pidiendo_cuenta) groups[p.mesa].pidiendo_cuenta = true;

        (p.productos_detalle || []).forEach((prod: any) => {
          const existing = groups[p.mesa].productos.find((x: any) => x.producto_id === prod.producto_id);
          if (existing) {
            existing.cantidad += prod.cantidad;
            existing.cantidad_despachada += prod.cantidad_despachada;
          } else {
            groups[p.mesa].productos.push({ ...prod });
          }
        });
      }
    });
    return Object.values(groups).sort((a, b) => a.mesa_numero - b.mesa_numero);
  }, [pedidos]);

  const historicalPedidos = React.useMemo(() => {
    // Identificamos las mesas que NO están activas para mostrar sus pedidos despachados aquí
    const activeMesaIds = new Set(activeGroups.map(g => g.mesa_id));
    
    return pedidos.filter(p => {
      const statusLower = (p.estado_nombre || '').toLowerCase();
      // Pasa a historial si:
      // 1. Está despachado pero su mesa no tiene nada pendiente (no está en activeMesaIds)
      // 2. O si ya está Finalizado/Pagado/Cancelado
      const isDespachadoMesaTerminada = statusLower === 'despachado' && !activeMesaIds.has(p.mesa);
      const isFinalizado = !['pendiente', 'despachado'].includes(statusLower);
      
      return isDespachadoMesaTerminada || isFinalizado;
    });
  }, [pedidos, activeGroups]);

  const renderMesaGroup = ({ item }: { item: any }) => (
    <View style={[styles.card, styles.cardActive]}>
      <View style={styles.cardHead}>
        <View style={styles.cardLeft}>
          <View style={[styles.estadoBadge, { backgroundColor: 'rgba(169,68,255,0.1)' }]}>
            <Text style={[styles.estadoText, { color: '#A944FF' }]}>CUENTA ACTIVA</Text>
          </View>
          <Text style={styles.pedidoId}>Mesa #{item.mesa_numero}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.mesaText}>Consumo Total</Text>
          <Text style={styles.totalText}>${item.total.toLocaleString()}</Text>
        </View>
      </View>

      {item.pidiendo_cuenta && (
        <View style={styles.billAlertInline}>
          <Ionicons name="notifications-outline" size={16} color="#A944FF" />
          <Text style={styles.billAlertText}>SOLICITÓ LA CUENTA</Text>
        </View>
      )}

      <View style={styles.detail}>
        <Text style={styles.detailLabel}>DETALLE DE PRODUCTOS</Text>
        {item.productos.map((prod: any, idx: number) => {
          const cantD = parseInt(prod.cantidad_despachada || 0);
          const cantT = parseInt(prod.cantidad || 0);
          const isLlevado = cantD >= cantT;
          return (
            <View key={idx} style={styles.prodRow}>
              <View style={[styles.statusDot, { backgroundColor: isLlevado ? '#10b981' : '#f59e0b' }]} />
              <Text style={[styles.prodName, isLlevado && { opacity: 0.6 }]} numberOfLines={1}>{prod.producto_nombre}</Text>
              <Text style={styles.prodQty}>x{prod.cantidad}</Text>
              <Text style={[styles.statusTextSmall, { color: isLlevado ? '#10b981' : '#f59e0b' }]}>
                {isLlevado ? 'LLEVADO' : (cantD > 0 ? `${cantD}/${cantT}` : 'PENDIENTE')}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderPedidoIndividual = ({ item }: { item: any }) => {
    const estado = ESTADO_CONFIG[(item.estado_nombre || '').toLowerCase()] || ESTADO_CONFIG.pendiente;
    const isExpanded = expandedId === item.id;
    const fecha = item.fecha_hora ? item.fecha_hora.split('T')[0] : '';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
      >
        <View style={styles.cardHead}>
          <View style={styles.cardLeft}>
            <View style={[styles.estadoBadge, { backgroundColor: estado.bg }]}>
              <Text style={[styles.estadoText, { color: estado.color }]}>{estado.label}</Text>
            </View>
            <Text style={styles.pedidoId}>Pedido #{item.id}</Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.mesaText}>Mesa {item.mesa_numero}</Text>
            <Text style={styles.totalText}>${parseFloat(item.total).toLocaleString()}</Text>
          </View>
        </View>
        <Text style={styles.metaText}>{fecha}</Text>

        {isExpanded && (
          <View style={styles.detail}>
            {(item.productos_detalle || []).map((prod: any, idx: number) => (
              <View key={idx} style={styles.prodRow}>
                <Text style={styles.prodName}>{prod.producto_nombre}</Text>
                <Text style={styles.prodQty}>x{prod.cantidad}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brandingNox}>Nox<Text style={styles.brandingOS}>OS</Text></Text>
          <Text style={styles.subtitle}>MIS PEDIDOS</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, tab === 'activas' && styles.tabActive]} onPress={() => setTab('activas')}>
          <Text style={[styles.tabText, tab === 'activas' && styles.tabTextActive]}>CUENTAS ACTIVAS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'historial' && styles.tabActive]} onPress={() => setTab('historial')}>
          <Text style={[styles.tabText, tab === 'historial' && styles.tabTextActive]}>HISTORIAL</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#A944FF" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={tab === 'activas' ? activeGroups : historicalPedidos}
          keyExtractor={item => String(item.id || item.mesa_id)}
          renderItem={tab === 'activas' ? renderMesaGroup : renderPedidoIndividual}
          contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A944FF" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={64} color="#1A103C" />
              <Text style={styles.emptyTitle}>Sin pedidos</Text>
            </View>
          }
        />
      )}

      <Modal visible={!!mesaAlerta} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <View style={styles.alertIcon}><Ionicons name="receipt" size={40} color="#fff" /></View>
            <Text style={styles.alertTitle}>¡SOLICITUD DE CUENTA!</Text>
            <Text style={styles.alertMsg}>La <Text style={{color: '#A944FF', fontWeight: '900'}}>MESA #{mesaAlerta?.numero}</Text> está solicitando su cuenta.</Text>
            <TouchableOpacity style={styles.alertBtn} onPress={handleLimpiarAlerta}>
              <Text style={styles.alertBtnText}>ENTENDIDO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 60, paddingBottom: 20 },
  brandingNox: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  brandingOS: { color: '#71717a' },
  subtitle: { fontSize: 10, color: '#8A7BAF', fontWeight: '900', letterSpacing: 3, marginTop: 4 },
  logoutBtn: { backgroundColor: '#1A103C', padding: 12, borderRadius: 15 },

  tabBar: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15, gap: 10 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 15, backgroundColor: '#0E0D23' },
  tabActive: { backgroundColor: '#1A103C', borderWidth: 1, borderColor: '#A944FF' },
  tabText: { color: '#71717a', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  tabTextActive: { color: '#fff' },

  card: { backgroundColor: '#0E0D23', borderRadius: 24, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardActive: { borderColor: 'rgba(169,68,255,0.3)' },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardLeft: { gap: 6 },
  cardRight: { alignItems: 'flex-end', gap: 4 },

  estadoBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  estadoText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  pedidoId: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  mesaText: { color: '#8A7BAF', fontSize: 12, fontWeight: '600' },
  totalText: { color: '#10b981', fontWeight: '900', fontSize: 18 },

  metaText: { color: '#8A7BAF', fontSize: 11, marginTop: 5 },

  detail: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  detailLabel: { fontSize: 9, fontWeight: '900', color: '#8A7BAF', letterSpacing: 2, marginBottom: 12 },
  prodRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  prodName: { flex: 1, color: '#fff', fontSize: 13 },
  prodQty: { color: '#8A7BAF', fontSize: 12, marginHorizontal: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  statusTextSmall: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5, marginLeft: 10, width: 85, textAlign: 'right' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  alertCard: { backgroundColor: '#0E0D23', borderRadius: 35, padding: 35, alignItems: 'center', borderWidth: 2, borderColor: '#A944FF', width: '100%' },
  alertIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#A944FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  alertTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 2, marginBottom: 15 },
  alertMsg: { color: '#8A7BAF', textAlign: 'center', fontSize: 15, marginBottom: 30 },
  alertBtn: { backgroundColor: '#A944FF', paddingVertical: 18, width: '100%', borderRadius: 20, alignItems: 'center' },
  alertBtnText: { color: '#fff', fontWeight: '900', fontSize: 12 },

  billAlertInline: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(169,68,255,0.1)', padding: 10, borderRadius: 12, marginTop: 10, marginBottom: 5, gap: 8 },
  billAlertText: { color: '#A944FF', fontSize: 10, fontWeight: '900', letterSpacing: 1 }
});
