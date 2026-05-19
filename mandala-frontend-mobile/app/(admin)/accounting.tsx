import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, TouchableOpacity, Alert, TextInput, Modal, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../utils/apiClient';
import { useAlertStore } from '../../store/alertStore';

const { width } = Dimensions.get('window');

export default function AdminAccountingScreen() {
  const [turno, setTurno] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showAbrir, setShowAbrir] = useState(false);
  const [showCerrar, setShowCerrar] = useState(false);
  
  const [baseInicial, setBaseInicial] = useState("0");
  const [efectivoReal, setEfectivoReal] = useState("0");
  const [observaciones, setObservaciones] = useState("");

  const { showAlert } = useAlertStore();

  useEffect(() => {
    fetchTurnoActual();
  }, []);

  const fetchTurnoActual = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/contabilidad/turno/actual/');
      setTurno(res.data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirTurno = async () => {
    try {
        await apiClient.post('/contabilidad/turno/abrir/', {
            base_inicial: parseFloat(baseInicial) || 0,
            observaciones: observaciones
        });
        setShowAbrir(false);
        setBaseInicial("0");
        setObservaciones("");
        showAlert("¡Éxito!", "Turno iniciado correctamente. Los meseros ya pueden realizar pedidos.", "success");
        fetchTurnoActual();
    } catch (e: any) {
        showAlert("Error", e.response?.data?.detail || "No se pudo abrir el turno", "error");
    }
  };

  const handleCerrarTurno = async () => {
    try {
        await apiClient.post('/contabilidad/turno/cerrar/', {
            efectivo_real: parseFloat(efectivoReal) || 0,
            observaciones: observaciones
        });
        setShowCerrar(false);
        setEfectivoReal("0");
        setObservaciones("");
        showAlert("¡Cierre Completado!", "El turno ha sido cerrado y las ventas se han bloqueado.", "success");
        fetchTurnoActual();
    } catch (e: any) {
        showAlert("Error", e.response?.data?.detail || "No se pudo cerrar el turno", "error");
    }
  };

  return (
    <View style={styles.container}>
      {/* Encabezado Premium */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandingNox}>Nox<Text style={styles.brandingOS}>OS</Text></Text>
          <Text style={styles.subtitle}>CONTABILIDAD Y CIERRE</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchTurnoActual} disabled={loading}>
          <Ionicons name="sync-outline" size={24} color={loading ? "#444" : "#A944FF"} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#A944FF" />
        </View>
      ) : (
        <ScrollView style={{ padding: 25 }} showsVerticalScrollIndicator={false}>
            {turno ? (
                <>
                {/* Resumen Principal Turno Abierto */}
                <View style={styles.cardMain}>
                    <Text style={styles.cardMainTitle}>VENTAS ACUMULADAS EN TURNO</Text>
                    <Text style={styles.totalVal}>${parseFloat(turno.total_ventas || 0).toLocaleString()}</Text>
                    <View style={styles.lineGlow} />
                    <View style={[styles.statusBadge, {backgroundColor: 'rgba(16, 185, 129, 0.1)'}]}>
                        <Text style={{color: '#10b981', fontSize: 10, fontWeight: '900', letterSpacing: 1}}>TURNO ABIERTO</Text>
                    </View>
                    <Text style={styles.metaText}>Iniciado por: {turno.usuario_apertura_nombre}</Text>
                </View>

                {/* Rejilla de Totales */}
                <View style={styles.grid}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLbl}>Base Inicial</Text>
                        <Text style={styles.statVal}>${parseFloat(turno.base_inicial).toLocaleString()}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLbl}>Efectivo Esperado</Text>
                        <Text style={styles.statVal}>${(parseFloat(turno.base_inicial) + parseFloat(turno.total_ventas)).toLocaleString()}</Text>
                    </View>
                </View>

                {/* Acciones de Cierre */}
                <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCerrar(true)}>
                    <Ionicons name="lock-closed-outline" size={24} color="#fff" />
                    <Text style={styles.closeBtnText}>REALIZAR CORTE DE CAJA</Text>
                </TouchableOpacity>
                </>
            ) : (
                <View style={styles.closedState}>
                    <Ionicons name="calendar-outline" size={80} color="#1A103C" />
                    <Text style={styles.closedTitle}>SISTEMA FUERA DE TURNO</Text>
                    <Text style={styles.closedMsg}>No hay una operación activa. Abre un nuevo turno para habilitar las ventas.</Text>
                    
                    <TouchableOpacity style={styles.openBtn} onPress={() => setShowAbrir(true)}>
                        <Text style={styles.openBtnText}>INICIAR NUEVA JORNADA</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={{height: 100}} />
        </ScrollView>
      )}

      {/* Modal Abrir Turno */}
      <Modal visible={showAbrir} transparent animationType="slide">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalBg}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ width: '100%' }}
                >
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>INICIAR TURNO</Text>
                        <Text style={styles.modalLabel}>BASE INICIAL (EFECTIVO)</Text>
                        <TextInput 
                            style={styles.modalInput} 
                            keyboardType="numeric" 
                            value={baseInicial} 
                            onChangeText={setBaseInicial}
                            placeholder="0"
                            placeholderTextColor="#444"
                            returnKeyType="done"
                        />
                        <Text style={styles.modalLabel}>OBSERVACIONES</Text>
                        <TextInput 
                            style={[styles.modalInput, {height: 80}]} 
                            multiline 
                            value={observaciones} 
                            onChangeText={setObservaciones}
                            placeholder="Ej: Turno nocturno viernes"
                            placeholderTextColor="#444"
                        />
                        
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAbrir(false)}>
                                <Text style={{color: '#fff', fontWeight: 'bold'}}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalConfirm} onPress={handleAbrirTurno}>
                                <Text style={{color: '#fff', fontWeight: '900'}}>ABRIR TURNO</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
      </Modal>

      {/* Modal Cerrar Turno */}
      <Modal visible={showCerrar} transparent animationType="slide">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalBg}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ width: '100%' }}
                >
                    <View style={styles.modalCard}>
                        <Text style={[styles.modalTitle, {color: '#f44336'}]}>CIERRE DE CAJA</Text>
                        <Text style={styles.modalLabel}>EFECTIVO REAL EN CAJA</Text>
                        <TextInput 
                            style={styles.modalInput} 
                            keyboardType="numeric" 
                            value={efectivoReal} 
                            onChangeText={setEfectivoReal}
                            placeholder="Cuenta el dinero físico..."
                            placeholderTextColor="#444"
                            returnKeyType="done"
                        />
                        <Text style={styles.modalLabel}>NOTAS DE CIERRE</Text>
                        <TextInput 
                            style={[styles.modalInput, {height: 80}]} 
                            multiline 
                            value={observaciones} 
                            onChangeText={setObservaciones}
                            placeholder="Diferencias, novedades, etc."
                            placeholderTextColor="#444"
                        />
                        
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowCerrar(false)}>
                                <Text style={{color: '#fff', fontWeight: 'bold'}}>VOLVER</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalConfirm, {backgroundColor: '#f44336'}]} onPress={handleCerrarTurno}>
                                <Text style={{color: '#fff', fontWeight: '900'}}>CERRAR TURNO</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
      </Modal>
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
  closeBtnText: { color: '#A944FF', fontWeight: '900', marginLeft: 15, fontSize: 12, letterSpacing: 2 },

  metaText: { color: '#8A7BAF', fontSize: 10, marginTop: 10, fontWeight: '600' },
  
  closedState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 20 },
  closedTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 2, marginTop: 25, marginBottom: 15 },
  closedMsg: { color: '#8A7BAF', textAlign: 'center', fontSize: 13, lineHeight: 20, marginBottom: 40 },
  
  openBtn: { backgroundColor: '#A944FF', paddingVertical: 20, paddingHorizontal: 40, borderRadius: 25, shadowColor: '#A944FF', shadowOpacity: 0.3, shadowRadius: 15 },
  openBtnText: { color: '#fff', fontWeight: '900', letterSpacing: 2, fontSize: 13 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 25 },
  modalCard: { backgroundColor: '#0E0D23', borderRadius: 35, padding: 30, width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  modalTitle: { color: '#A944FF', fontSize: 20, fontWeight: '900', letterSpacing: 2, marginBottom: 25, textAlign: 'center' },
  modalLabel: { color: '#8A7BAF', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
  modalInput: { backgroundColor: '#000', borderRadius: 15, padding: 18, color: '#fff', fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  modalActions: { flexDirection: 'row', gap: 15, marginTop: 10 },
  modalCancel: { flex: 1, padding: 20, borderRadius: 20, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  modalConfirm: { flex: 1.5, padding: 20, borderRadius: 20, alignItems: 'center', backgroundColor: '#A944FF' }
});
