import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from '../../store/authStore';
import apiClient from "../../utils/apiClient";

export default function LoginScreen() {
  const setAuth = useAuthStore(state => state.setAuth);
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Acceso Requerido", "Por favor ingresa tu usuario y clave de seguridad.");
      return;
    }

    setLoading(true);
    try {
      console.log("Intentando login para:", username);
      const response = await apiClient.post("/login/", { 
        username: username.trim(), 
        password: password 
      });
      
      console.log("Respuesta login:", response.data);
      const { token, refresh, role, username: responseUsername, user_id } = response.data;
      
      if (!token) {
        throw new Error("No se recibió el token de seguridad.");
      }

      // Guardar en el Store (Zustand se encarga del almacenamiento persistente)
      setAuth(token, refresh || '', {
        id: String(user_id || ''),
        username: responseUsername || username,
        role: role || 'usuario'
      });

      // Redirección inmediata según el rol
      if (role === 'admin') {
        router.replace("/(admin)");
      } else if (role === 'bartender') {
        router.replace("/(bartender)/prep");
      } else {
        router.replace("/(mesera)/orders");
      }
      
    } catch (error: any) {
      console.error("Login Error Details:", error.response?.data || error.message);
      // El interceptor en apiClient ya muestra un Alert, pero podemos añadir uno específico aquí si falla sin respuesta
      if (!error.response) {
        Alert.alert("Error de Red", "No se pudo conectar con el servidor NoxOS. Verifica tu conexión a internet.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {/* NoxOS Branding */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>Nox<Text style={styles.logoAltText}>OS</Text></Text>
              <View style={styles.logoLine} />
            </View>
            
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Usuario</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#8A7BAF" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Nombre de usuario" 
                  placeholderTextColor="#8A7BAF50"
                  style={styles.input} 
                  value={username} 
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Clave de Seguridad</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color="#8A7BAF" style={styles.inputIcon} />
                <TextInput 
                  placeholder="••••••••••••" 
                  placeholderTextColor="#8A7BAF50"
                  style={styles.input} 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#8A7BAF" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.btn, (!username || !password) && styles.btnDisabled]} 
              onPress={handleLogin}
              disabled={loading || !username || !password}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>ACCEDER AL SISTEMA</Text>
              )}
            </TouchableOpacity>

           
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  card: { 
    backgroundColor: '#1A103C', 
    marginHorizontal: 20,
    borderRadius: 40, 
    padding: 35, 
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000', 
    shadowOpacity: 0.5, 
    shadowRadius: 30,
    elevation: 10
  },
  header: { alignItems: 'center', marginBottom: 45 },
  logoContainer: { alignItems: 'center', marginBottom: 10 },
  logoText: { fontSize: 48, fontWeight: '900', color: '#fff', letterSpacing: 5 },
  logoAltText: { color: '#71717a' },
  logoLine: { width: 60, height: 4, backgroundColor: '#A944FF', borderRadius: 2, marginTop: -5, opacity: 0.5 },
  subtitle: { fontSize: 10, color: '#8A7BAF', fontWeight: '900', letterSpacing: 4 },
  
  form: { width: '100%' },
  inputGroup: { marginBottom: 25 },
  label: { fontSize: 10, color: '#8A7BAF', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, marginLeft: 5 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#0E0D23', 
    borderRadius: 20, 
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(108, 63, 168, 0.3)'
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 18, fontSize: 14, color: '#fff', fontWeight: '600' },
  eyeBtn: { padding: 10 },
  
  btn: { 
    backgroundColor: '#441E73', 
    padding: 22, 
    borderRadius: 20, 
    alignItems: 'center', 
    marginTop: 20,
    shadowColor: '#A944FF',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontWeight: '900', letterSpacing: 3, fontSize: 11 },
  
  footerInfo: { marginTop: 30, alignItems: 'center' },
  footerText: { color: 'rgba(138, 123, 175, 0.4)', fontSize: 8, fontWeight: 'bold', letterSpacing: 3 },
  
  devLinks: { marginTop: 40, alignItems: 'center' },
  devBtn: { padding: 15 },
  devText: { color: '#A944FF', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, textDecorationLine: 'underline' }
});
