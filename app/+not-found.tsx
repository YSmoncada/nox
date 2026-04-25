import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'No encontrado' }} />
      <LinearGradient colors={['#1A103C', '#000']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.content}>
        <Ionicons name="compass-outline" size={80} color="#A944FF" style={styles.icon} />
        
        <Text style={styles.title}>404</Text>
        <Text style={styles.subtitle}>RUTA NO ENCONTRADA</Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.description}>
          Lo sentimos, la página que estás buscando no existe en el sistema NoxOS.
        </Text>

        <Link href="/" asChild>
          <TouchableOpacity style={styles.link}>
            <Text style={styles.linkText}>VOLVER AL INICIO</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  content: {
    alignItems: 'center',
    padding: 30,
    width: '100%',
  },
  icon: {
    marginBottom: 20,
    opacity: 0.8,
  },
  title: {
    fontSize: 72,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 10,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#8A7BAF',
    letterSpacing: 4,
    marginBottom: 20,
  },
  divider: {
    width: 60,
    height: 4,
    backgroundColor: '#A944FF',
    borderRadius: 2,
    marginBottom: 30,
  },
  description: {
    fontSize: 14,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  link: {
    backgroundColor: '#1A103C',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(169, 68, 255, 0.3)',
  },
  linkText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
});
