import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NoxColors } from '../constants/theme';


export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'No encontrado' }} />
      <LinearGradient colors={[NoxColors.container, NoxColors.deep]} style={StyleSheet.absoluteFill} />
      
      <View style={styles.content}>
        <Ionicons name="compass-outline" size={80} color=NoxColors.aura style={styles.icon} />
        
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
    backgroundColor: NoxColors.deep,
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
    color: NoxColors.text,
    letterSpacing: 10,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '900',
    color: NoxColors.muted,
    letterSpacing: 4,
    marginBottom: 20,
  },
  divider: {
    width: 60,
    height: 4,
    backgroundColor: NoxColors.aura,
    borderRadius: 2,
    marginBottom: 30,
  },
  description: {
    fontSize: 14,
    color: NoxColors.subtext,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  link: {
    backgroundColor: NoxColors.container,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(169, 68, 255, 0.3)',
  },
  linkText: {
    fontSize: 12,
    fontWeight: '900',
    color: NoxColors.text,
    letterSpacing: 2,
  },
});
