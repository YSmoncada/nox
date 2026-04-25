import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../utils/apiClient';

export default function AdmUsersScreen() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('operativo');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProfileForm, setNewProfileForm] = useState({ username: '', password: '' });
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newCredentials, setNewCredentials] = useState('');
  const [selectedRole, setSelectedRole] = useState('mesera');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/usuarios/');
      const data = Array.isArray(res.data) ? res.data : [];
      setUsuarios(data);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo cargar la lista de usuarios.');
    } finally {
      setLoading(false);
    }
  };

  const roleCategories = {
    operativo: ['mesera', 'bartender'],
    sistema: ['admin', 'administrador', 'gerente']
  };

  const getFilteredUsers = () => {
    return usuarios.filter(u => {
      const uRole = (u.user_role || 'usuario').toLowerCase();
      if (activeTab === 'operativo') {
        return roleCategories.operativo.includes(uRole) || (!roleCategories.sistema.includes(uRole) && uRole !== 'admin');
      } else {
        return roleCategories.sistema.includes(uRole);
      }
    });
  };

  const handleAddProfile = async () => {
    if (!newProfileForm.username || newProfileForm.password.length < 4) {
      Alert.alert('Error', 'Usuario y contraseña obligatorios (Mín: 4 caracteres).');
      return;
    }
    
    try {
      await apiClient.post('/usuarios/', {
        username: newProfileForm.username,
        password: newProfileForm.password,
        role: selectedRole
      });
      setShowAddModal(false);
      setNewProfileForm({ username: '', password: '' });
      fetchData();
      Alert.alert('Éxito', 'Identidad creada correctamente.');
    } catch (err: any) { 
      const detail = err.response?.data?.detail || 'No se pudo crear el usuario';
      Alert.alert('Error', detail);
    }
  };

  const handleOpenReset = (user: any) => {
    setSelectedUser(user);
    setNewCredentials('');
    setShowResetModal(true);
  };

  const handleUpdateCredentials = async () => {
    if (newCredentials.length < 4) return Alert.alert('Error', 'Mínimo 4 caracteres requeridos.');
    try {
      await apiClient.post(`/usuarios/${selectedUser.id}/cambiar-password/`, { password: newCredentials });
      setShowResetModal(false);
      Alert.alert('Éxito', 'Credenciales actualizadas.');
      fetchData();
    } catch(err) { 
      Alert.alert('Error', 'No se pudo actualizar la clave.');
    }
  };

  const handleDelete = (id: any) => {
    Alert.alert("Confirmación", "¿Eliminar permanentemente este usuario?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => {
          try {
            await apiClient.delete(`/usuarios/${id}/`);
            fetchData();
          } catch (error) { console.error(error); }
      }}
    ]);
  };

  const renderItem = ({ item }: { item: any }) => {
    const roleText = (item.user_role || 'SISTEMA').toUpperCase();
    const roleColor = roleCategories.sistema.includes(roleText.toLowerCase()) ? '#f59e0b' : '#A944FF';
    
    return (
      <View style={styles.card}>
        <View style={[styles.cardAccent, { backgroundColor: roleColor }]} />
        <View style={[styles.avatar, { backgroundColor: `${roleColor}15` }]}>
            <Text style={[styles.avatarText, { color: roleColor }]}>{(item.username || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cardMain}>
          <Text style={styles.cardTitle}>{item.username}</Text>
          <View style={styles.roleTag}>
             <Text style={[styles.roleTagText, { color: roleColor }]}>{roleText}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleOpenReset(item)} style={styles.iconBtn}>
            <Ionicons name="key-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtnDanger}>
            <Ionicons name="trash-outline" size={18} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Premium */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.brandingNox}>Nox<Text style={styles.brandingOS}>OS</Text></Text>
          <Text style={styles.subtitle}>GESTIÓN DE PERSONAL</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Ionicons name="person-add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
            style={[styles.tab, activeTab === 'operativo' && styles.tabActive]} 
            onPress={() => setActiveTab('operativo')}
        >
            <Text style={[styles.tabText, activeTab === 'operativo' && styles.tabTextActive]}>PERSONAL</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.tab, activeTab === 'sistema' && styles.tabActive]} 
            onPress={() => setActiveTab('sistema')}
        >
            <Text style={[styles.tabText, activeTab === 'sistema' && styles.tabTextActive]}>SISTEMA</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#A944FF" style={{marginTop:50}} />
      ) : (
        <FlatList 
          data={getFilteredUsers()} 
          keyExtractor={it => String(it.id)} 
          renderItem={renderItem} 
          contentContainerStyle={styles.listContent} 
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal Agregar Usuario */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalBg}>
            <View style={styles.glassCard}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>NUEVA IDENTIDAD</Text>
                    <TouchableOpacity onPress={() => setShowAddModal(false)}>
                        <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.2)" />
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.label}>NOMBRE DE USUARIO</Text>
                <TextInput 
                    placeholder="Ej: Mesera01" placeholderTextColor="#444" 
                    style={styles.input} value={newProfileForm.username} 
                    onChangeText={t => setNewProfileForm({...newProfileForm, username: t})} 
                    autoCapitalize="none"
                />

                <Text style={styles.label}>CONTRASEÑA / PIN</Text>
                <TextInput 
                    placeholder="Mínimo 4 caracteres" placeholderTextColor="#444" 
                    secureTextEntry style={styles.input} 
                    value={newProfileForm.password} 
                    onChangeText={t => setNewProfileForm({...newProfileForm, password: t})} 
                />

                <Text style={styles.label}>ROL ASIGNADO</Text>
                <View style={styles.row}>
                    {['mesera', 'bartender', 'admin'].map((r) => (
                    <TouchableOpacity 
                        key={r} onPress={() => setSelectedRole(r)}
                        style={[styles.chip, selectedRole === r && styles.chipActive]}
                    >
                        <Text style={[styles.chipText, selectedRole === r && {color:'#fff'}]}>{r.toUpperCase()}</Text>
                    </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleAddProfile}>
                    <Text style={styles.saveBtnText}>REGISTRAR USUARIO</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {/* Modal Reset Password */}
      <Modal visible={showResetModal} transparent animationType="fade">
        <View style={styles.modalBg}>
            <View style={styles.glassCard}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>ACTUALIZAR CLAVE</Text>
                    <TouchableOpacity onPress={() => setShowResetModal(false)}>
                        <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.2)" />
                    </TouchableOpacity>
                </View>
                <Text style={[styles.label, {color: '#A944FF'}]}>USUARIO: {selectedUser?.username?.toUpperCase()}</Text>
                
                <View style={{marginTop: 15}}>
                    <Text style={styles.label}>NUEVA CONTRASEÑA O PIN</Text>
                    <TextInput 
                        placeholder="Mínimo 4 dígitos" placeholderTextColor="#444" 
                        secureTextEntry style={styles.input} 
                        value={newCredentials} onChangeText={setNewCredentials} 
                    />
                </View>

                <TouchableOpacity style={[styles.saveBtn, {backgroundColor: '#3b82f6'}]} onPress={handleUpdateCredentials}>
                    <Text style={styles.saveBtnText}>CAMBIAR CREDENCIALES</Text>
                </TouchableOpacity>
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
    paddingBottom: 25,
  },
  headerTitleContainer: { gap: 4 },
  brandingNox: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  brandingOS: { color: '#A944FF' },
  subtitle: { fontSize: 10, color: '#8A7BAF', fontWeight: '900', letterSpacing: 4, textTransform: 'uppercase' },
  addBtn: { backgroundColor: '#A944FF', width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#A944FF', shadowOpacity: 0.5, shadowRadius: 15 },

  tabsContainer: { flexDirection: 'row', paddingHorizontal: 25, gap: 12, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 14, borderRadius: 18, backgroundColor: '#0E0D23', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  tabActive: { backgroundColor: '#1A103C', borderColor: 'rgba(169, 68, 255, 0.4)' },
  tabText: { color: '#8A7BAF', fontWeight: 'bold', fontSize: 10, letterSpacing: 2 },
  tabTextActive: { color: '#A944FF' },

  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { 
    backgroundColor: '#0E0D23', 
    padding: 16, 
    borderRadius: 28, 
    marginBottom: 12, 
    flexDirection: 'row', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  cardAccent: { position: 'absolute', left: 0, top: 25, bottom: 25, width: 4, borderTopRightRadius: 10, borderBottomRightRadius: 10 },
  avatar: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 22, fontWeight: '900' },
  
  cardMain: { flex: 1, marginLeft: 15 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
  roleTag: { marginTop: 4 },
  roleTagText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#1A103C', justifyContent: 'center', alignItems: 'center' },
  iconBtnDanger: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center' },

  modalBg: { flex: 1, backgroundColor: 'rgba(5, 5, 16, 0.95)', justifyContent: 'center', padding: 25 },
  glassCard: { backgroundColor: '#0E0D23', borderRadius: 40, padding: 30, borderWidth: 1, borderColor: 'rgba(169, 68, 255, 0.2)', shadowColor: '#A944FF', shadowOpacity: 0.1, shadowRadius: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  
  label: { fontSize: 9, fontWeight: '900', color: '#8A7BAF', marginBottom: 12, letterSpacing: 2, textTransform: 'uppercase' },
  input: { backgroundColor: '#1A103C', color: '#fff', borderRadius: 20, padding: 20, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 20 },
  
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: '#1A103C', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  chipActive: { backgroundColor: '#A944FF', borderColor: 'rgba(169, 68, 255, 0.3)' },
  chipText: { fontSize: 10, fontWeight: 'bold', color: '#8A7BAF' },

  saveBtn: { backgroundColor: '#A944FF', padding: 22, borderRadius: 25, alignItems: 'center', marginTop: 10, shadowColor: '#A944FF', shadowOpacity: 0.5, shadowRadius: 15 },
  saveBtnText: { color: '#fff', fontWeight: '900', letterSpacing: 2, fontSize: 14 }
});
