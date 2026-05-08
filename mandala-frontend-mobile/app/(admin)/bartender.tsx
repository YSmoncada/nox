import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../utils/apiClient';

export default function AdminBartenderScreen() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPending();
    const timer = setInterval(fetchPending, 10000); 
    return () => clearInterval(timer);
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/pedidos/?estado=pendiente');
      setPedidos(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEstado = async (pedidoId: number, nuevoEstado: string) => {
    setLoading(true);
    try {
      const res = await apiClient.patch(`/pedidos/${pedidoId}/`, { estado: nuevoEstado });
      if (res.status === 200 || res.status === 201) {
        Alert.alert('¡Excelente!', `Pedido #${pedidoId} marcado como ${nuevoEstado === 'despachado' ? 'LISTO' : 'RECHAZADO'}.`);
        fetchPending();
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar el pedido');
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = (pedidoId: number, estado: string) => {
    const isDespacho = estado === 'despachado';
    Alert.alert(
      'Confirmación', 
      isDespacho ? `¿Marcar pedido #${pedidoId} como listo?` : `¿RECHAZAR el pedido #${pedidoId}?`, 
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Sí, Confirmar', 
          style: isDespacho ? 'default' : 'destructive',
          onPress: () => handleUpdateEstado(pedidoId, estado) 
        },
      ]
    );
  };

  const renderPedido = ({ item }: { item: any }) => {
    // FALLBACK PARA MESA
    const mesaNum = item.mesa_numero || (typeof item.mesa === 'object' ? item.mesa.numero : item.mesa) || "??";
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.mesaBadge}>
            <Text style={styles.mesaText}>Mesa #{mesaNum}</Text>
          </View>
          <Text style={styles.timeText}>{new Date(item.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>

        <View style={styles.itemsList}>
          {(item.productos_detalle || []).map((it: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.cantCircle}><Text style={styles.cantNum}>{it.cantidad}</Text></View>
              <Text style={styles.itemName}>{it.producto_nombre}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity 
            style={[styles.readyBtn, { flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: '#ef4444' }]} 
            onPress={() => confirmAction(item.id, 'cancelado')}
          >
            <Text style={[styles.readyBtnText, { color: '#ef4444' }]}>RECHAZAR</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.readyBtn, { flex: 2 }]} 
            onPress={() => confirmAction(item.id, 'despachado')}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.readyBtnText}>¡PREPARADO!</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brandingNox}>Nox<Text style={styles.brandingOS}>OS</Text></Text>
          <Text style={styles.subtitle}>PREPARACIÓN EN BARRA</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchPending} disabled={loading}>
          <Ionicons name="reload" size={24} color={loading ? "#444" : "#A944FF"} />
        </TouchableOpacity>
      </View>

      {loading && pedidos.length === 0 ? (
        <ActivityIndicator size="large" color="#A944FF" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={pedidos}
          keyExtractor={item => String(item.id)}
          renderItem={renderPedido}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="beer-outline" size={64} color="#1A103C" />
              <Text style={{ color: '#8A7BAF', marginTop: 15, fontWeight:'bold', letterSpacing: 2 }}>TODO AL DÍA</Text>
              <Text style={{ color: '#444', fontSize: 10, marginTop: 5 }}>NO HAY PEDIDOS PENDIENTES</Text>
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
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 25, 
    paddingTop: 60,
    paddingBottom: 20
  },
  brandingNox: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  brandingOS: { color: '#71717a' },
  subtitle: { fontSize: 10, color: '#8A7BAF', fontWeight: '900', letterSpacing: 3, marginTop: 5 },
  refreshBtn: { backgroundColor: '#1A103C', width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },

  card: { 
    backgroundColor: '#0E0D23', 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 20, 
    borderLeftWidth: 5, 
    borderLeftColor: '#A944FF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  mesaBadge: { backgroundColor: 'rgba(169, 68, 255, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  mesaText: { color: '#A944FF', fontWeight: '900', fontSize: 14 },
  timeText: { color: '#444', fontSize: 10, fontWeight: 'bold' },
  
  itemsList: { marginBottom: 20 },
  itemRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'center' },
  cantCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1A103C', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cantNum: { fontWeight: 'bold', color: '#A944FF', fontSize: 12 },
  itemName: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  
  readyBtn: { backgroundColor: '#10b981', padding: 18, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  readyBtnText: { color: '#fff', fontWeight: '900', marginLeft: 10, fontSize: 11, letterSpacing: 1 },
  
  empty: { alignItems: 'center', marginTop: 120 }
});
