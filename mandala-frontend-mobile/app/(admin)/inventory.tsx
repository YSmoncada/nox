import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, ScrollView, Image, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import apiClient from '../../utils/apiClient';
import { formatImageUrl } from '../../utils/imageHelpers';

const INITIAL_FORM = { nombre: "", categoria_id: "", precio: "0", stock_actual: "0", imagen: "" };

export default function AdmInventarioScreen() {
  const [productos, setProductos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editId, setEditId] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para Movimientos
  const [movModalOpen, setMovModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [tiposMov, setTiposMov] = useState<any[]>([]);
  const [movForm, setMovForm] = useState({ tipo_id: "", cantidad: "", motivo: "" });

  useFocusEffect(
    useCallback(() => {
      fetchData();
      fetchTipos();
      const interval = setInterval(fetchData, 30000); 
      return () => clearInterval(interval);
    }, [])
  );
  
  const fetchTipos = async () => {
    try {
        const res = await apiClient.get('/tipos-movimiento/');
        setTiposMov(res.data);
    } catch (e) { console.error(e); }
  }

  const fetchData = async (isRef = false) => {
    if (isRef) setRefreshing(true);
    else if (productos.length === 0) setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
          apiClient.get('/productos/'),
          apiClient.get('/categorias/')
      ]);
      setProductos(Array.isArray(prodRes.data) ? prodRes.data : []);
      if (Array.isArray(catRes.data)) {
        setCategorias(catRes.data);
      }
    } catch (err) {
      console.error("Error al cargar inventario:", err);
    } finally { 
        setIsLoading(false); 
        setRefreshing(false); 
    }
  };

  const handleOpenMov = (prod: any) => {
      setSelectedProduct(prod);
      setMovForm({ tipo_id: "", cantidad: "", motivo: "" });
      setMovModalOpen(true);
  };

  const handleSaveMov = async () => {
      if(!movForm.tipo_id || !movForm.cantidad) return Alert.alert('Error', 'Completa los campos obligatorios.');
      try {
          await apiClient.post('/movimientos/', {
              producto_id: selectedProduct.id,
              tipo_id: parseInt(movForm.tipo_id),
              cantidad: parseInt(movForm.cantidad),
              motivo: movForm.motivo
          });
          setMovModalOpen(false);
          fetchData();
          Alert.alert('Éxito', 'Movimiento registrado correctamente.');
      } catch (e: any) {
          Alert.alert('Error', e.response?.data?.detail || 'No se pudo registrar.');
      }
  };

  const handleEdit = (producto: any) => {
    setForm({
      nombre: producto.nombre || "",
      categoria_id: String(producto.categoria || ''),
      precio: String(producto.precio || 0),
      stock_actual: String(producto.stock_actual || 0),
      imagen: producto.imagen || "",
    });
    setEditId(producto.id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if(!form.nombre || !form.categoria_id) return Alert.alert('Error', 'Completa los campos.');
    try {
      const payload = { 
          nombre: form.nombre,
          categoria: parseInt(form.categoria_id),
          precio: parseFloat(form.precio) || 0,
          stock_actual: parseInt(form.stock_actual) || 0,
          activo: true
      };
      if (editId) await apiClient.patch(`/productos/${editId}/`, payload);
      else await apiClient.post('/productos/', payload);
      setModalOpen(false);
      fetchData();
      Alert.alert('¡Hecho!', 'Catálogo actualizado.');
    } catch(e: any) { 
        Alert.alert('Error', 'No se pudo guardar.');
    }
  };

  const handleDelete = (id: any) => {
    const performDelete = async () => {
      try {
        await apiClient.delete(`/productos/${id}/`);
        fetchData();
      } catch (e) {
        Alert.alert('Error', 'No se pudo eliminar.');
      }
    };
    Alert.alert("¿Eliminar?", "Esta acción es irreversible.", [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: performDelete }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header Premium con Gradiente Visual */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.brandingNox}>Nox<Text style={styles.brandingOS}>OS</Text></Text>
          <Text style={styles.subtitle}>CONTROL DE EXISTENCIAS</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => {setForm(INITIAL_FORM); setEditId(null); setModalOpen(true);}}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#A944FF" style={{marginTop:50}} />
      ) : (
        <FlatList 
          data={productos} 
          keyExtractor={it => String(it.id)} 
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor="#A944FF" />}
          renderItem={({item}) => (
          <View style={styles.card}>
            <View style={styles.cardAccent} />
            <View style={styles.cardIcon}>
                {item.imagen ? (
                    <Image source={{ uri: formatImageUrl(item.imagen) }} style={styles.cardImage} />
                ) : (
                    <Ionicons name="cube-outline" size={26} color="#A944FF" />
                )}
            </View>
            <View style={styles.cardMain}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.nombre}</Text>
                <View style={styles.tagRow}>
                   <View style={styles.tag}><Text style={styles.tagText}>{item.categoria_nombre || 'N/A'}</Text></View>
                   <Text style={[styles.stockText, item.stock_actual < 10 && {color: '#ff4444'}]}>STOCK: {item.stock_actual}</Text>
                </View>
                <Text style={styles.cardPrice}>${parseFloat(item.precio || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleOpenMov(item)} style={styles.iconBtnMov}>
                <Ionicons name="git-compare-outline" size={18} color="#A944FF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconBtn}>
                <Ionicons name="pencil-outline" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtnDanger}>
                <Ionicons name="trash-outline" size={18} color="#ff4444" />
              </TouchableOpacity>
            </View>
          </View>
        )} />
      )}

      {/* MODAL MOVIMIENTO AJUSTADO */}
      <Modal visible={movModalOpen} animationType="fade" transparent>
        <View style={styles.modalBg}>
            <View style={styles.glassCard}>
                <View style={styles.modalHeader}>
                    <View>
                        <Text style={styles.modalTitle}>AJUSTE DE STOCK</Text>
                        <Text style={styles.selectedProdName}>{selectedProduct?.nombre}</Text>
                    </View>
                    <TouchableOpacity onPress={()=>setMovModalOpen(false)}>
                        <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.2)" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>TIPO DE OPERACIÓN</Text>
                <View style={styles.row}>
                    {tiposMov.map((t: any) => (
                        <TouchableOpacity 
                            key={t.id} 
                            style={[styles.chip, movForm.tipo_id === String(t.id) && styles.chipActiveMov]} 
                            onPress={()=>setMovForm({...movForm, tipo_id: String(t.id)})}
                        >
                            <Text style={[styles.chipText, movForm.tipo_id === String(t.id) && {color:'#fff'}]}>{t.nombre}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>CANTIDAD</Text>
                    <TextInput 
                        style={styles.input} keyboardType="numeric" placeholder="0" placeholderTextColor="#444"
                        value={movForm.cantidad} onChangeText={t => setMovForm({...movForm, cantidad: t})} 
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>OBSERVACIONES</Text>
                    <TextInput 
                        style={[styles.input, {height: 80, textAlignVertical: 'top'}]} 
                        multiline placeholder="Escribe el motivo..." placeholderTextColor="#444"
                        value={movForm.motivo} onChangeText={t => setMovForm({...movForm, motivo: t})} 
                    />
                </View>

                <TouchableOpacity style={styles.saveBtnMov} onPress={handleSaveMov}>
                    <Text style={styles.saveBtnText}>REGISTRAR CAMBIO</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {/* MODAL FORM PRODUCTO AJUSTADO */}
      <Modal visible={modalOpen} animationType="fade" transparent>
        <View style={styles.modalBg}>
            <View style={styles.glassCard}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{editId ? 'EDITAR' : 'NUEVO'} ITEM</Text>
                    <TouchableOpacity onPress={()=>setModalOpen(false)}>
                        <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.2)" />
                    </TouchableOpacity>
                </View>
                
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.label}>NOMBRE DEL PRODUCTO</Text>
                    <TextInput 
                        placeholder="Ej: Ron Añejo..." placeholderTextColor="#444"
                        style={styles.input} value={form.nombre} onChangeText={t => setForm({...form, nombre: t})} 
                    />
                    
                    <Text style={styles.label}>CATEGORÍA</Text>
                    <View style={styles.row}>
                        {categorias.map((c: any) => (
                            <TouchableOpacity 
                                key={c.id} 
                                style={[styles.chip, form.categoria_id === String(c.id) && styles.chipActive]} 
                                onPress={()=>setForm({...form, categoria_id: String(c.id)})}
                            >
                                <Text style={[styles.chipText, form.categoria_id === String(c.id) && {color:'#fff'}]}>{c.nombre}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.formRow}>
                        <View style={{flex:1, marginRight:10}}>
                            <Text style={styles.label}>PRECIO VENTA</Text>
                            <TextInput 
                                style={styles.input} keyboardType="numeric" 
                                value={form.precio} onChangeText={t => setForm({...form, precio: t})} 
                            />
                        </View>
                        <View style={{flex:1}}>
                            <Text style={styles.label}>STOCK INICIAL</Text>
                            <TextInput 
                                style={styles.input} keyboardType="numeric" 
                                value={form.stock_actual} onChangeText={t => setForm({...form, stock_actual: t})} 
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Text style={styles.saveBtnText}>GUARDAR EN CATÁLOGO</Text>
                    </TouchableOpacity>
                    <View style={{height: 40}} />
                </ScrollView>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050510' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 25, 
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 30,
    backgroundColor: '#050510'
  },
  headerTitleContainer: { gap: 4 },
  brandingNox: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  brandingOS: { color: '#A944FF' },
  subtitle: { fontSize: 10, color: '#8A7BAF', fontWeight: '900', letterSpacing: 4, textTransform: 'uppercase' },
  addBtn: { backgroundColor: '#A944FF', width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#A944FF', shadowOpacity: 0.5, shadowRadius: 15, shadowOffset: {width:0, height:5} },
  
  listContent: { padding: 20, paddingBottom: 100 },
  card: { 
    backgroundColor: '#0E0D23', 
    marginBottom: 16, 
    padding: 16, 
    borderRadius: 28, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardAccent: { position: 'absolute', left: 0, top: 25, bottom: 25, width: 4, backgroundColor: '#A944FF', borderTopRightRadius: 10, borderBottomRightRadius: 10 },
  cardIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.02)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  cardMain: { flex: 1, marginHorizontal: 15 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  tagRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: 'rgba(169, 68, 255, 0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { color: '#A944FF', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  stockText: { color: '#10b981', fontSize: 10, fontWeight: 'bold' },
  cardPrice: { color: '#fff', fontWeight: '900', fontSize: 16, marginTop: 4 },
  
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#1A103C', justifyContent: 'center', alignItems: 'center' },
  iconBtnMov: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(169, 68, 255, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(169, 68, 255, 0.2)' },
  iconBtnDanger: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center' },
  
  modalBg: { flex: 1, backgroundColor: 'rgba(5, 5, 16, 0.95)', justifyContent: 'center', padding: 25 },
  glassCard: { backgroundColor: '#0E0D23', borderRadius: 40, padding: 30, borderWidth: 1, borderColor: 'rgba(169, 68, 255, 0.2)', shadowColor: '#A944FF', shadowOpacity: 0.1, shadowRadius: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  selectedProdName: { color: '#A944FF', fontSize: 12, fontWeight: 'bold', marginTop: 4, textTransform: 'uppercase' },
  
  label: { fontSize: 9, fontWeight: '900', color: '#8A7BAF', marginBottom: 12, letterSpacing: 2, textTransform: 'uppercase' },
  inputGroup: { marginBottom: 20 },
  input: { backgroundColor: '#1A103C', color: '#fff', borderRadius: 20, padding: 20, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 30, gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: '#1A103C', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  chipActive: { backgroundColor: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' },
  chipActiveMov: { backgroundColor: '#A944FF', borderColor: 'rgba(169, 68, 255, 0.3)' },
  chipText: { fontSize: 11, fontWeight: 'bold', color: '#8A7BAF', textTransform: 'uppercase' },
  
  saveBtn: { backgroundColor: '#10b981', padding: 22, borderRadius: 25, alignItems: 'center', marginTop: 20 },
  saveBtnMov: { backgroundColor: '#A944FF', padding: 22, borderRadius: 25, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontWeight: '900', letterSpacing: 2, fontSize: 14 },
  formRow: { flexDirection: 'row', gap: 10 }
});
