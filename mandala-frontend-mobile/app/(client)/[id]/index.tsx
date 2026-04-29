import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView, TextInput, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import apiClient from '../../../utils/apiClient';
import { formatImageUrl } from '../../../utils/imageHelpers';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: "", label: "Todos" },
  { id: "cerveza", label: "Cervezas" },
  { id: "vinos", label: "Vinos" },
  { id: "destilados", label: "Destilados" },
  { id: "cocteles", label: "Cócteles" },
  { id: "bebidas", label: "Bebidas" },
];

export default function ClientMenuScreen() {
  const { id: rawId } = useGlobalSearchParams();
  const mesaId = Array.isArray(rawId) ? rawId[0] : rawId;
  const [productos, setProductos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>(CATEGORIES);
  const [mesaInfo, setMesaInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any[]>([]);
  const [filtro, setFiltro] = useState<any>("");
  const [filtroNombre, setFiltroNombre] = useState("");
  const [showCart, setShowCart] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!mesaId || mesaId === 'undefined') {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
    fetchData();
  }, [mesaId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, mesaRes, catRes] = await Promise.all([
        apiClient.get('/productos/'),
        apiClient.get(`/mesas/${mesaId}/`),
        apiClient.get('/categorias/')
      ]);
      setProductos(prodRes.data);
      setMesaInfo(mesaRes.data);
      if (Array.isArray(catRes.data)) {
        const dbCats = catRes.data.map((c: any) => ({
          id: c.id,
          label: c.nombre
        }));
        setCategorias([{ id: "", label: "Todos" }, ...dbCats]);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const addToOrder = (prod: any) => {
    const existing = order.find(i => i.id === prod.id);
    if (existing) {
      setOrder(order.map(i => i.id === prod.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setOrder([...order, { ...prod, qty: 1 }]);
    }
  };

  const removeFromOrder = (prodId: number) => {
    const existing = order.find(i => i.id === prodId);
    if (existing.qty > 1) {
      setOrder(order.map(i => i.id === prodId ? { ...i, qty: i.qty - 1 } : i));
    } else {
      setOrder(order.filter(i => i.id !== prodId));
    }
  };

  const calculateTotal = () => order.reduce((acc, i) => acc + (i.precio * i.qty), 0);

  const handleSendOrder = async () => {
    if (order.length === 0) return;
    try {
      const payload = {
        mesa: mesaId,
        productos: order.map(i => ({ producto_id: i.id, cantidad: i.qty })),
        force_append: true  // Permite agregar a la cuenta existente de la mesa
      };
      await apiClient.post('/pedidos/', payload);
      setOrder([]);
      setShowCart(false);
      Alert.alert("¡Enviado!", "Tu pedido está siendo preparado.");
      router.push(`/(client)/${mesaId}/history`);
    } catch (e) {
      Alert.alert("Error", "No se pudo enviar el pedido.");
    }
  };


  const filteredProds = productos.filter(p => {
    const matchCat = !filtro || p.categoria === filtro;
    const matchName = !filtroNombre || p.nombre.toLowerCase().includes(filtroNombre.toLowerCase());
    return matchCat && matchName;
  });

  if (loading) return (
    <View style={styles.loader}>
        <ActivityIndicator size="large" color="#A944FF" />
        <Text style={styles.loaderText}>CARGANDO MENÚ...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.branding}>Nox<Text style={{color:'#71717a'}}>OS</Text></Text>
          <Text style={styles.mesaTitle}>MESA #{mesaInfo?.numero || '?'}</Text>
          {mesaInfo?.mesero_nombre && (
            <Text style={styles.meseroAsignado}>Atendido por: <Text style={{color:'#fff'}}>{mesaInfo.mesero_nombre}</Text></Text>
          )}
        </View>
        <TouchableOpacity style={styles.cartBtnHeader} onPress={() => setShowCart(true)}>
           <Ionicons name="bag-handle" size={24} color="#A944FF" />
           {order.length > 0 && <View style={styles.badge}><Text style={styles.badgeTxt}>{order.length}</Text></View>}
        </TouchableOpacity>
      </View>

      {/* Buscador y Categorías */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#8A7BAF" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Buscar producto..."
            placeholderTextColor="#8A7BAF"
            value={filtroNombre}
            onChangeText={setFiltroNombre}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingRight: 10 }}>
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

      {/* Productos */}
      <FlatList
        data={filteredProds}
        numColumns={2}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: 15, paddingBottom: 180 }}
        renderItem={({ item }) => (
          <View style={styles.prodCard}>
             <View style={styles.imgContainer}>
                {item.imagen ? <Image source={{uri: formatImageUrl(item.imagen)}} style={styles.prodImg} /> : <Ionicons name="beer-outline" size={32} color="#8A7BAF" />}
             </View>
             <View style={styles.infoContainer}>
                <Text style={styles.prodName} numberOfLines={2}>{item.nombre}</Text>
                <Text style={styles.prodPrice}>${parseFloat(item.precio).toLocaleString()}</Text>
             </View>
             <TouchableOpacity style={styles.addBtn} onPress={() => addToOrder(item)}>
                <Ionicons name="add" size={20} color="#fff" />
             </TouchableOpacity>
          </View>
        )}
      />

      {/* Flotante Carrito — box-none para no bloquear toques del fondo */}
      {order.length > 0 && !showCart && (
        <View style={styles.floatingWrapper} pointerEvents="box-none">
          <TouchableOpacity style={styles.floatingCart} onPress={() => setShowCart(true)} activeOpacity={0.85}>
            <Text style={styles.cartTotal}>${calculateTotal().toLocaleString()}</Text>
            <Text style={styles.cartConfirm}>VER PEDIDO</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal Carrito */}
      <Modal visible={showCart} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.cartOverlay}>
          <View style={styles.cartContent}>
            <View style={styles.cartHead}>
              <Text style={styles.cartTitle}>TU PEDIDO</Text>
              <TouchableOpacity onPress={() => setShowCart(false)}>
                <Ionicons name="close-circle" size={30} color="#71717a" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.cartList} contentContainerStyle={{ paddingBottom: 10 }}>
              {order.map(i => (
                <View key={i.id} style={styles.cartItem}>
                  <View style={{flex:1}}>
                    <Text style={styles.cartItemName}>{i.nombre}</Text>
                    <Text style={styles.cartItemPrice}>${(i.precio * i.qty).toLocaleString()}</Text>
                  </View>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity onPress={() => removeFromOrder(i.id)} style={styles.qtyBtn}><Ionicons name="remove" size={18} color="#fff" /></TouchableOpacity>
                    <Text style={styles.qtyVal}>{i.qty}</Text>
                    <TouchableOpacity onPress={() => addToOrder(i)} style={styles.qtyBtn}><Ionicons name="add" size={18} color="#fff" /></TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.cartBottom}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLbl}>TOTAL</Text>
                <Text style={styles.totalVal}>${calculateTotal().toLocaleString()}</Text>
              </View>
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendOrder}>
                <Text style={styles.sendBtnText}>REALIZAR PEDIDO</Text>
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
  loader: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  loaderText: { color: '#8A7BAF', fontWeight: '900', marginTop: 15, fontSize: 10, letterSpacing: 2 },
  header: { paddingHorizontal: 25, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  branding: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  mesaTitle: { color: '#A944FF', fontWeight: '900', fontSize: 10, letterSpacing: 2, marginTop: 4 },
  meseroAsignado: { color: '#8A7BAF', fontSize: 9, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },
  cartBtnHeader: { backgroundColor: '#1A103C', width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  badge: { position:'absolute', top: -5, right: -5, backgroundColor: '#A944FF', width: 18, height: 18, borderRadius: 9, justifyContent:'center', alignItems:'center' },
  badgeTxt: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  catBtn: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 12, backgroundColor: '#1A103C', height: 34, justifyContent:'center' },
  catBtnActive: { backgroundColor: '#A944FF' },
  catText: { color: '#8A7BAF', fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  catTextActive: { color: '#fff' },

  searchSection: { marginTop: 15, marginBottom: 5 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0E0D23', marginHorizontal: 20, marginBottom: 15, paddingHorizontal: 15, height: 45, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  searchInput: { flex: 1, marginLeft: 10, color: '#fff', fontSize: 14 },

  prodCard: { width: (width - 60) / 2, backgroundColor: '#0E0D23', margin: 8, padding: 15, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', height: 230, alignItems: 'center' },
  imgContainer: { width: 110, height: 110, backgroundColor: '#1A103C', borderRadius: 25, justifyContent:'center', alignItems:'center', marginBottom: 12 },
  prodImg: { width: 110, height: 110, borderRadius: 25 },
  infoContainer: { alignItems: 'center', width: '100%' },
  prodName: { color: '#fff', fontWeight: 'bold', fontSize: 13, textAlign: 'center', height: 36, lineHeight: 18 },
  prodPrice: { color: '#10b981', fontSize: 14, fontWeight: '900', marginTop: 5 },
  addBtn: { position: 'absolute', bottom: 12, right: 12, backgroundColor: '#A944FF', width: 34, height: 34, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#A944FF', shadowOpacity: 0.4, shadowRadius: 10 },

  floatingWrapper: { position: 'absolute', bottom: 85, left: 20, right: 20, zIndex: 99, elevation: 15 },
  floatingCart: { backgroundColor: '#A944FF', padding: 20, borderRadius: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#A944FF', shadowOpacity: 0.5, shadowRadius: 20, elevation: 15 },
  cartTotal: { color:'#fff', fontSize: 20, fontWeight:'900' },
  cartConfirm: { color:'#fff', fontWeight: '900', letterSpacing: 2, fontSize: 12 },

  cartOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  cartContent: { backgroundColor: '#0E0D23', borderTopLeftRadius: 35, borderTopRightRadius: 35, maxHeight: '85%', padding: 30, paddingBottom: 40 },
  cartHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  cartTitle: { color:'#fff', fontSize: 20, fontWeight:'bold', letterSpacing: 2 },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth:1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 15 },
  cartItemName: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  cartItemPrice: { color: '#8A7BAF', fontSize: 14 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  qtyBtn: { backgroundColor: '#1A103C', width: 30, height: 30, borderRadius: 10, justifyContent:'center', alignItems:'center' },
  qtyVal: { color: '#fff', fontWeight:'bold', fontSize: 16 },
  cartList: { flexShrink: 1, maxHeight: 300 },
  cartBottom: { paddingTop: 20, paddingBottom: 10 },
  totalRow: { flexDirection: 'row', justifyContent:'space-between', alignItems: 'center', marginBottom: 15 },
  totalLbl: { color: '#8A7BAF', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  totalVal: { color: '#fff', fontSize: 28, fontWeight: '900' },
  sendBtn: { backgroundColor: '#A944FF', padding: 22, borderRadius: 20, alignItems: 'center' },
  sendBtnText: { color: '#fff', fontWeight: '900', letterSpacing: 2, fontSize: 14 },
});
