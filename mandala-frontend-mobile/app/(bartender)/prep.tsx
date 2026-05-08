import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../utils/apiClient';

export default function BartenderPrepScreen() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPending();
    const timer = setInterval(fetchPending, 60000); // refresca cada 60s
    return () => clearInterval(timer);
  }, []);

  const fetchPending = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await apiClient.get('/pedidos/?estado=pendiente');
      setPedidos(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleUpdateEstado = async (pedidoId: number, nuevoEstado: string) => {
    setUpdatingId(pedidoId);
    try {
      // Usar PATCH como lo pide el backend para cambios de estado
      const res = await apiClient.patch(`/pedidos/${pedidoId}/`, { estado: nuevoEstado });
      console.log(`DEBUG BARTENDER: Respuesta patch pedido ${pedidoId}:`, res.status);
      if (res.status === 200 || res.status === 201) {
        // Refrescar inmediatamente
        fetchPending();
        Alert.alert('¡Excelente!', `Pedido #${pedidoId} marcado como ${nuevoEstado === 'despachado' ? 'LISTO' : 'RECHAZADO'}.`);
      }
    } catch (e) {
      console.error("Error actualizando pedido:", e);
      Alert.alert('Error', 'No se pudo actualizar el estado del pedido. Verifica tu conexión.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDespacharProducto = async (pedidoId: number, itemId: number) => {
    try {
      await apiClient.post(`/pedidos/${pedidoId}/despachar_producto/`, { item_id: itemId });
      fetchPending();
    } catch (e) {
      Alert.alert('Error', 'No se pudo despachar el producto');
    }
  };

  const confirmAction = (pedidoId: number, estado: string) => {
    const isDespacho = estado === 'despachado';
    const label = isDespacho ? 'MARCAR COMO LISTO' : 'RECHAZAR PEDIDO';
    const message = isDespacho 
      ? `¿Confirmas que el pedido #${pedidoId} está listo para ser entregado?`
      : `¿Estás seguro de RECHAZAR el pedido #${pedidoId}? Esta acción no se puede deshacer.`;

    Alert.alert('Confirmación', message, [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: isDespacho ? 'SÍ, LISTO' : 'SÍ, RECHAZAR', 
        style: isDespacho ? 'default' : 'destructive',
        onPress: () => handleUpdateEstado(pedidoId, estado) 
      },
    ]);
  };

  const renderPedido = ({ item }: { item: any }) => {
    const hora = new Date(item.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isUpdating = updatingId === item.id;
    
    // FALLBACK PARA MESA: Intentar encontrar el numero de mesa de varias formas
    const mesaNum = item.mesa_numero || (typeof item.mesa === 'object' ? item.mesa.numero : item.mesa) || "??";

    return (
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.leftInfo}>
            <View style={styles.mesaBadge}>
              <Text style={styles.mesaLabel}>MESA</Text>
              <Text style={styles.mesaNum}>#{mesaNum}</Text>
            </View>
            <View style={styles.pedidoInfo}>
              <Text style={styles.pedidoId}>Pedido #{item.id}</Text>
              <Text style={styles.responsable}>{item.mesera_nombre || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.rightInfo}>
            <Ionicons name="time-outline" size={12} color="#8A7BAF" />
            <Text style={styles.timeText}>{hora}</Text>
          </View>
        </View>

        {/* Comanda */}
        <View style={styles.comandaHeader}>
          <Text style={styles.comandaLabel}>COMANDA</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.itemsList}>
          {(item.productos_detalle || []).map((prod: any, index: number) => {
            const pendiente = prod.cantidad - (prod.cantidad_despachada || 0);
            return (
              <View key={index} style={styles.itemRow}>
                <View style={styles.cantCircle}>
                  <Text style={styles.cantNum}>x{prod.cantidad}</Text>
                </View>
                <Text style={styles.itemName} numberOfLines={1}>{prod.producto_nombre}</Text>
                {pendiente > 0 ? (
                  <TouchableOpacity
                    onPress={() => handleDespacharProducto(item.id, prod.id)}
                    style={styles.checkBtn}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.doneBtn}>
                    <Ionicons name="checkmark-done" size={16} color="#10b981" />
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Actions */}
        {isUpdating ? (
          <ActivityIndicator color="#A944FF" style={{ marginTop: 15 }} />
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => confirmAction(item.id, 'cancelado')}
            >
              <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
              <Text style={styles.cancelBtnText}>RECHAZAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.listoBtn}
              onPress={() => confirmAction(item.id, 'despachado')}
            >
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.listoBtnText}>¡PREPARADO!</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brandingNox}>Nox<Text style={styles.brandingOS}>OS</Text></Text>
          <Text style={styles.subtitle}>MONITOR DE PEDIDOS</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchPending()} disabled={loading}>
          <Ionicons name="reload" size={22} color={loading ? '#333' : '#A944FF'} />
        </TouchableOpacity>
      </View>

      {/* Contador */}
      {pedidos.length > 0 && (
        <View style={styles.countBanner}>
          <View style={styles.countDot} />
          <Text style={styles.countText}>{pedidos.length} PEDIDO{pedidos.length !== 1 ? 'S' : ''} PENDIENTE{pedidos.length !== 1 ? 'S' : ''}</Text>
        </View>
      )}

      {loading && pedidos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#A944FF" />
          <Text style={styles.emptyText}>MONITOR ACTIVO...</Text>
        </View>
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={item => String(item.id)}
          renderItem={renderPedido}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPending(true)} tintColor="#A944FF" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="beer-outline" size={64} color="#1A103C" />
              <Text style={styles.emptyTitle}>SILENCIO EN LA BARRA</Text>
              <Text style={styles.emptyText}>No hay pedidos pendientes</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 25, paddingTop: 60, paddingBottom: 20,
  },
  brandingNox: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  brandingOS: { color: '#71717a' },
  subtitle: { fontSize: 10, color: '#8A7BAF', fontWeight: '900', letterSpacing: 3, marginTop: 5 },
  refreshBtn: { backgroundColor: '#1A103C', width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },

  countBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 10,
    backgroundColor: 'rgba(169,68,255,0.1)',
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(169,68,255,0.2)',
  },
  countDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#A944FF' },
  countText: { color: '#A944FF', fontSize: 10, fontWeight: '900', letterSpacing: 2 },

  card: {
    backgroundColor: '#0E0D23',
    borderRadius: 24, padding: 20, marginBottom: 20,
    borderLeftWidth: 4, borderLeftColor: '#A944FF',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  leftInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mesaBadge: {
    backgroundColor: 'rgba(169,68,255,0.1)', padding: 10, borderRadius: 14,
    alignItems: 'center', minWidth: 55,
  },
  mesaLabel: { color: '#8A7BAF', fontSize: 8, fontWeight: '900', letterSpacing: 2 },
  mesaNum: { color: '#A944FF', fontSize: 20, fontWeight: '900' },
  pedidoInfo: { gap: 3 },
  pedidoId: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  responsable: { color: '#8A7BAF', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  rightInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { color: '#8A7BAF', fontSize: 11, fontWeight: 'bold' },

  comandaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  comandaLabel: { color: '#8A7BAF', fontSize: 9, fontWeight: '900', letterSpacing: 3 },
  divider: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },

  itemsList: { marginBottom: 20, gap: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cantCircle: {
    width: 34, height: 34, borderRadius: 12,
    backgroundColor: '#1A103C', justifyContent: 'center', alignItems: 'center',
  },
  cantNum: { fontWeight: '900', color: '#A944FF', fontSize: 13 },
  itemName: { flex: 1, color: '#fff', fontWeight: 'bold', fontSize: 14 },
  checkBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center',
  },
  doneBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(16,185,129,0.1)', justifyContent: 'center', alignItems: 'center',
  },

  actions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 16,
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  cancelBtnText: { color: '#ef4444', fontWeight: '900', fontSize: 10, letterSpacing: 2 },
  listoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 16,
    backgroundColor: '#10b981',
  },
  listoBtnText: { color: '#fff', fontWeight: '900', fontSize: 10, letterSpacing: 2 },

  emptyContainer: { alignItems: 'center', marginTop: 100, gap: 15 },
  emptyTitle: { color: '#8A7BAF', fontWeight: '900', fontSize: 14, letterSpacing: 3 },
  emptyText: { color: '#444', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
});
