import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, ScrollView, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../utils/apiClient';
import { formatImageUrl } from '../../utils/imageHelpers';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');



export default function PedidosScreen() {
  const [productos, setProductos] = useState<any[]>([]);
  const [mesas, setMesas] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any[]>([]);
  const [selectedMesa, setSelectedMesa] = useState<any>(null);
  const [filtro, setFiltro] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, mesasRes, catRes] = await Promise.all([
        apiClient.get('/productos/'),
        apiClient.get('/mesas/'),
        apiClient.get('/categorias/')
      ]);
      setProductos(prodRes.data);
      setMesas(mesasRes.data);
      if (Array.isArray(catRes.data)) {
        const dbCats = catRes.data.map((c: any) => ({
          id: c.id,
          label: c.nombre
        }));
        setCategorias([{ id: "", label: "Todos" }, ...dbCats]);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo sincronizar el menú');
    } finally {
      setLoading(false);
    }
  };

  const addToOrder = (producto: any) => {
    setOrder(prev => {
      const existing = prev.find(item => item.id === producto.id);
      if (existing) {
        return prev.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const updateCant = (id: any, delta: number) => {
    setOrder(prev => prev.map(item => {
      if (item.id === id) {
        const newCant = item.cantidad + delta;
        return newCant > 0 ? { ...item, cantidad: newCant } : item;
      }
      return item;
    }).filter(item => item.cantidad > 0));
  };

  const user = useAuthStore(state => state.user);
  const total = order.reduce((sum, item) => sum + (parseFloat(item.precio) * item.cantidad), 0);

  const handleFinalizar = async () => {
    if (!selectedMesa) return Alert.alert('Error', 'Debes seleccionar una mesa');
    if (order.length === 0) return Alert.alert('Error', 'El pedido está vacío');

    const payload = {
      mesa: selectedMesa.id,
      usuario: user?.id,
      productos: order.map(it => ({ 
        producto_id: it.id, 
        cantidad: it.cantidad,
        precio_unitario: parseFloat(it.precio)
      })),
      total: total
    };

    try {
      const res = await apiClient.post('/pedidos/', payload);
      if (res.status === 201 || res.status === 200) {
        Alert.alert('¡Excelente!', 'Pedido enviado a cocina/barra');
        setOrder([]);
        setSelectedMesa(null);
        setShowCheckout(false);
        fetchData(); 
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo procesar el pedido');
    }
  };

  const filtered = productos.filter(p => !filtro || p.categoria === filtro);

  return (
    <View style={styles.container}>
      {/* Header Premium */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandingNox}>Nox<Text style={styles.brandingOS}>OS</Text></Text>
          <Text style={styles.subtitle}>CARTA DE PRODUCTOS</Text>
        </View>
        <TouchableOpacity style={styles.cartBtn} onPress={() => setShowCheckout(true)}>
          <Ionicons name="cart-outline" size={24} color="#fff" />
          {order.length > 0 && (
            <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{order.length}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      {/* Categorías Flotantes */}
      <View style={{height: 60}}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {categorias.map(cat => (
            <TouchableOpacity 
                key={cat.id} 
                style={[styles.catBtn, filtro === cat.id && styles.catBtnActive]}
                onPress={() => setFiltro(cat.id)}
            >
                <Text style={[styles.catText, filtro === cat.id && styles.catTextActive]}>{cat.label}</Text>
            </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#A944FF" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.prodCard} onPress={() => addToOrder(item)}>
              <View style={styles.prodImageContainer}>
                {item.imagen ? (
                   <Image 
                    key={`img-${item.id}-${item.imagen}`}
                    source={{ uri: formatImageUrl(item.imagen) }} 
                    style={styles.prodImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="fast-food-outline" size={32} color="#8A7BAF" />
                )}
              </View>
              <Text style={styles.prodName} numberOfLines={1}>{item.nombre}</Text>
              <Text style={styles.prodPrice}>${parseFloat(item.precio).toLocaleString()}</Text>
              <View style={styles.addIcon}><Ionicons name="add" size={16} color="#fff" /></View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* MODAL CHECKOUT - NoxOS Style */}
      <Modal visible={showCheckout} animationType="slide" transparent>
        <View style={styles.modalBg}>
            <View style={styles.chkCard}>
                <View style={styles.chkHeader}>
                    <Text style={styles.chkTitle}>RESUMEN DEL PEDIDO</Text>
                    <TouchableOpacity onPress={() => setShowCheckout(false)}>
                        <Ionicons name="close-circle-outline" size={32} color="#71717a" />
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.label}>SELECCIONA LA MESA</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 60, flexGrow: 0, marginBottom: 25 }}>
                    {mesas.map(m => (
                    <TouchableOpacity 
                        key={m.id} 
                        style={[
                            styles.mesaMini, 
                            selectedMesa?.id === m.id && styles.mesaMiniActive, 
                            m.estado_nombre === 'Ocupada' && { backgroundColor: '#3f3f46', opacity: 0.5 }
                        ]}
                        onPress={() => setSelectedMesa(m)}
                        disabled={m.estado_nombre === 'Ocupada' && selectedMesa?.id !== m.id}
                    >
                        <Text style={[
                            styles.mesaMiniText, 
                            selectedMesa?.id === m.id && { color: '#fff' },
                            m.estado_nombre === 'Ocupada' && { color: '#71717a' }
                        ]}>#{m.numero}</Text>
                    </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={{ flex: 1 }}>
                    <Text style={styles.label}>PRODUCTOS SELECCIONADOS</Text>
                    <FlatList
                    data={order}
                    keyExtractor={item => String(item.id)}
                    renderItem={({ item }) => (
                        <View style={styles.orderItem}>
                            <View style={{flex: 1}}>
                                <Text style={styles.itemTitle}>{item.nombre}</Text>
                                <Text style={styles.itemPrice}>${(item.precio * item.cantidad).toLocaleString()}</Text>
                            </View>
                            <View style={styles.cantCtrl}>
                                <TouchableOpacity onPress={() => updateCant(item.id, -1)} style={styles.ctrlBtn}>
                                    <Ionicons name="remove" size={20} color="#fff" />
                                </TouchableOpacity>
                                <Text style={styles.cantNum}>{item.cantidad}</Text>
                                <TouchableOpacity onPress={() => updateCant(item.id, 1)} style={styles.ctrlBtn}>
                                    <Ionicons name="add" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    />
                </View>

                <View style={styles.footer}>
                    <View style={styles.totalContainer}>
                        <Text style={styles.totalLbl}>TOTAL A PAGAR</Text>
                        <Text style={styles.totalVal}>${total.toLocaleString()}</Text>
                    </View>
                    <TouchableOpacity style={styles.finishBtn} onPress={handleFinalizar}>
                        <Text style={styles.finishBtnText}>CONFIRMAR Y ENVIAR</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 25, paddingTop: 60, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandingNox: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  brandingOS: { color: '#71717a' },
  subtitle: { fontSize: 10, color: '#8A7BAF', fontWeight: '900', letterSpacing: 3, marginTop: 5 },
  cartBtn: { backgroundColor: '#1A103C', width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  cartBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#A944FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, borderWidth: 2, borderColor: '#000' },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  catScroll: { marginBottom: 15 },
  catBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#1A103C', marginRight: 10 },
  catBtnActive: { backgroundColor: '#A944FF' },
  catText: { fontSize: 11, fontWeight: 'bold', color: '#8A7BAF', textTransform: 'uppercase', letterSpacing: 1 },
  catTextActive: { color: '#fff' },

  prodCard: { 
    flex: 0.5, 
    backgroundColor: '#0E0D23', 
    margin: 8, 
    borderRadius: 24, 
    padding: 15, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)',
    position: 'relative' 
  },
  prodImageContainer: { 
    width: '100%', 
    height: 100, 
    backgroundColor: '#1A103C', 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12,
    overflow: 'hidden'
  },
  prodImage: {
    width: '100%',
    height: '100%',
  },
  prodName: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  prodPrice: { fontSize: 13, color: '#10b981', fontWeight: 'bold', marginTop: 5 },
  addIcon: { position: 'absolute', bottom: 12, right: 12, backgroundColor: '#A944FF', width: 28, height: 28, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  chkCard: { 
    backgroundColor: '#0E0D23', 
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    padding: 30, 
    height: '90%',
    borderWidth: 1,
    borderColor: 'rgba(171, 0, 255, 0.2)'
  },
  chkHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  chkTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
  label: { fontSize: 10, fontWeight: '900', color: '#8A7BAF', marginBottom: 15, letterSpacing: 2, textTransform: 'uppercase' },
  mesaMini: { 
    width: 55, 
    height: 55, 
    borderRadius: 18, 
    backgroundColor: '#1A103C', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  mesaMiniActive: { backgroundColor: '#A944FF', borderColor: '#fff' },
  mesaMiniText: { color: '#8A7BAF', fontWeight: 'bold' },
  
  orderItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 18, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.05)' 
  },
  itemTitle: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  itemPrice: { color: '#10b981', fontSize: 13, fontWeight: '600' },
  cantCtrl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A103C', borderRadius: 15, padding: 4 },
  ctrlBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#0E0D23', justifyContent: 'center', alignItems: 'center' },
  cantNum: { color: '#fff', marginHorizontal: 15, fontWeight: 'bold', fontSize: 16 },
  
  footer: { marginTop: 20, paddingTop: 20 },
  totalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 25 },
  totalLbl: { color: '#8A7BAF', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  totalVal: { color: '#fff', fontSize: 32, fontWeight: '900' },
  finishBtn: { backgroundColor: '#A944FF', padding: 22, borderRadius: 25, alignItems: 'center', shadowColor: '#A944FF', shadowOpacity: 0.3, shadowRadius: 15 },
  finishBtnText: { color: '#fff', fontWeight: '900', letterSpacing: 2, fontSize: 13 }
});
