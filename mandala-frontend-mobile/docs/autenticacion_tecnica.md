# Documento Técnico: Implementación de Autenticación y Autorización en NoxOS Mobile

## 1. Introducción
Este documento describe la arquitectura e implementación del sistema de seguridad para la aplicación móvil NoxOS, evolucionando de una gestión de sesiones básica hacia un sistema robusto basado en **JSON Web Tokens (JWT)** y un estado global persistente.

---

## 2. Integración con el Backend (JWT)

### 2.1. Flujo de Autenticación
La aplicación se comunica con el backend (FastAPI) a través de un cliente API centralizado basado en **Axios**. El proceso de autenticación sigue estos pasos:
1. **Envío de Credenciales**: El usuario ingresa `username` y `password` en la vista de Login.
2. **Emisión de Tokens**: El backend valida las credenciales y devuelve un par de tokens:
   - `access_token`: Token de vida corta (1 día) para autorizar peticiones.
   - `refresh_token`: Token de vida larga (7 días) para renovar el acceso sin re-autenticar al usuario.
3. **Recepción de Datos**: Se recibe además el rol del usuario, ID y nombre completo.

### 2.2. Cliente API y Middleware
Se implementó un `apiClient.ts` que actúa como middleware en el frontend mediante interceptores:
- **Interceptor de Petición**: Adjunta automáticamente el `Authorization: Bearer <token>` a cada solicitud saliente.
- **Interceptor de Respuesta**: Captura errores `401 Unauthorized`. Si el error es por expiración, intenta renovar el token usando el `refresh_token`. Si falla, redirige automáticamente al login.

---

## 3. Gestión de Estado Global (Zustand)

### 3.1. Almacenamiento Global
Se utiliza **Zustand** para gestionar el estado de autenticación de forma centralizada. El store (`authStore.ts`) contiene:
- `token`: El access token actual.
- `refreshToken`: El token de refresco.
- `user`: Objeto con datos del perfil (id, username, role).
- `isLoading`: Estado de carga global.

### 3.2. Acciones del Store
- `setAuth()`: Establece la sesión al iniciar sesión exitosamente.
- `clearAuth()`: Elimina toda la información de sesión (Logout).
- `updateToken()`: Actualiza únicamente el access token (durante el refresco).

### 3.3. Persistencia Local
Se integra el middleware `persist` de Zustand con `@react-native-async-storage/async-storage`. Esto garantiza que la sesión se mantenga incluso después de cerrar la aplicación o reiniciar el dispositivo.

---

## 4. Control de Navegación y Guards

### 4.1. Estructura de Grupos
La navegación está organizada en grupos de rutas (Expo Router):
- `(auth)`: Rutas públicas (Login).
- `(admin)`, `(mesera)`, `(bartender)`: Rutas protegidas por rol.
- `(client)`: Rutas de acceso público restringido (menú).

### 4.2. Guards de Navegación (Root Layout)
En el archivo `_layout.tsx`, se implementó un efecto global que monitorea el estado de sesión y los segmentos de navegación:
- **Validación de Sesión**: Si un usuario intenta acceder a una ruta protegida sin un token válido, es redirigido inmediatamente a `/(auth)/login`.
- **Redirección por Rol**: Al iniciar sesión, el sistema detecta el rol del usuario (`admin`, `mesera`, `bartender`) y lo dirige automáticamente a su dashboard correspondiente.
- **Protección de Roles Cruzados**: Se valida que un usuario con rol `mesera` no pueda acceder manualmente a rutas del grupo `(admin)`.

---

## 5. Seguridad en el Backend

### 5.1. Protección mediante Middleware
El backend utiliza dependencias de FastAPI (`Depends`) para proteger los endpoints:
- `get_current_user`: Decodifica y valida la firma del JWT. Verifica que el token no haya expirado.
- `check_admin_role`: Valida específicamente que el usuario tenga el rol de administrador en la base de datos antes de permitir acciones críticas.

### 5.2. Manejo de Errores
- **401 Unauthorized**: Devuelto cuando el token es inválido, ha expirado o no se proporciona.
- **403 Forbidden**: Devuelto cuando el usuario está autenticado pero no tiene permisos suficientes (ej. un mesero intentando acceder a reportes de administrador).

---

## 6. Conclusión
La implementación actual cumple con los estándares de seguridad modernos para aplicaciones móviles, garantizando la persistencia de sesión, la protección de rutas críticas y una experiencia de usuario fluida mediante el refresco automático de tokens.
