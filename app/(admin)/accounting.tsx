import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../utils/apiClient';

const { width } = Dimensions.get('window');

export default function AdminAccountingScreen() {
  const [stats, setStats] = useState<any>({ total_ventas: 0, propinas: 0, cortesias: 0, gastos: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAccounting();
  }, []);

  const fetchAccounting = async () => {
    setLoading(true);
    try {
      // Endpoint simulado para contabilidad (ajustar según tu backend)
      const res = await apiClient.get('/pedidos/'); // Por ahora sumamos los totales de pedidos
      const total = res.data.reduce((acc: number, item: any) => acc + parseFloat(item.total), 0);
      setStats({
        total_ventas: total,
        propinas: total * 0.1,
        cortesias: 0,
        gastos: 250000
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Premium */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandingNox}>Nox<Text style={styles.brandingOS}>OS</Text></Text>
          <Text style={styles.subtitle}>CONTABILIDAD Y CIERRE</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchAccounting} disabled={loading}>
          <Ionicons name="stats-chart-outline" size={24} color={loading ? "#444" : "#A944FF"} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#A944FF" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView style={{ padding: 25 }} showsVerticalScrollIndicator={false}>
            {/* Resumen Principal */}
            <View style={styles.cardMain}>
                <Text style={styles.cardMainTitle}>VALOR TOTAL EN CAJA</Text>
                <Text style={styles.totalVal}>${stats.total_ventas.toLocaleString()}</Text>
                <View style={styles.lineGlow} />
                <View style={[styles.statusBadge, {backgroundColor: 'rgba(16, 185, 129, 0.1)'}]}>
                    <Text style={{color: '#10b981', fontSize: 10, fontWeight: '900', letterSpacing: 1}}>OPERACIÓN ABIERTA</Text>
                </View>
            </View>

            {/* Grid de Totales */}
            <View style={styles.grid}>
                <View style={styles.statBox}>
                    <Text style={styles.statLbl}>Ventas Brutas</Text>
                    <Text style={styles.statVal}>${stats.total_ventas.toLocaleString()}</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLbl}>Propinas (Sug)</Text>
                    <Text style={styles.statVal}>${stats.propinas.toLocaleString()}</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLbl}>Cortesías</Text>
                    <Text style={[styles.statVal, {color: '#f44336'}]}>$0</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLbl}>Gastos Caja</Text>
                    <Text style={[styles.statVal, {color: '#f44336'}]}>$0</Text>
                </View>
            </View>

            {/* Acciones de Cierre */}
            <TouchableOpacity style={styles.closeBtn} onPress={() => Alert.alert("Cierre de Caja", "¿Confirmar cierre de operación?")}>
                <Ionicons name="lock-closed-outline" size={24} color="#fff" />
                <Text style={styles.closeBtnText}>REALIZAR CORTE DE CAJA</Text>
            </TouchableOpacity>

            <View style={{height: 100}} />
        </ScrollView>
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

  cardMain: { 
    backgroundColor: '#0E0D23', 
    borderRadius: 35, 
    padding: 35, 
    marginBottom: 30, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#A944FF',
    shadowOpacity: 0.1,
    shadowRadius: 20
  },
  cardMainTitle: { color: '#8A7BAF', fontSize: 10, fontWeight: '900', letterSpacing: 3, marginBottom: 15 },
  totalVal: { color: '#fff', fontSize: 42, fontWeight: '900', textAlign: 'center' },
  lineGlow: { width: 60, height: 4, backgroundColor: '#A944FF', borderRadius: 2, marginVertical: 20 },
  statusBadge: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginBottom: 40 },
  statBox: { 
    width: (width - 65) / 2, 
    backgroundColor: '#0E0D23', 
    borderRadius: 24, 
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  statLbl: { color: '#444', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  statVal: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

  closeBtn: { 
    backgroundColor: '#1A103C', 
    padding: 22, 
    borderRadius: 25, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(169, 68, 255, 0.3)'
  },
  closeBtnText: { color: '#A944FF', fontWeight: '900', marginLeft: 15, fontSize: 12, letterSpacing: 2 }
});
