import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { COLORES, TIPOGRAFIA } from '../theme';

// Pantallas
import LoginScreen from '../screens/auth/LoginScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import CoachDashboardScreen from '../screens/coach/CoachDashboardScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { usuario, estaAutenticado, cargando } = useAuth();

  // Pantalla de carga mientras se verifica el token en SecureStore
  if (cargando) {
    return (
      <View style={styles.pantallaCarga}>
        <ActivityIndicator size="large" color={COLORES.brandPrimary} />
        <Text style={styles.textoCarga}>Iniciando FichApp...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      {!estaAutenticado ? (
        // Stack de Autenticación
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : usuario?.rol === 'entrenador' ? (
        // Stack del Entrenador (Cuerpo Técnico)
        <Stack.Screen name="CoachDashboard" component={CoachDashboardScreen} />
      ) : (
        // Stack del Administrador / Superadmin
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  pantallaCarga: {
    flex: 1,
    backgroundColor: COLORES.surfaceBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoCarga: {
    ...TIPOGRAFIA.bodyMedium,
    color: COLORES.textSecondary,
    marginTop: 14,
  },
});
