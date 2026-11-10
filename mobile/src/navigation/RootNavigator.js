import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { COLORES, TIPOGRAFIA } from '../theme';

// Pantallas
import LoginScreen from '../screens/auth/LoginScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import CoachDashboardScreen from '../screens/coach/CoachDashboardScreen';
import PlayerDirectoryScreen from '../screens/players/PlayerDirectoryScreen';
import PlayerDetailScreen from '../screens/players/PlayerDetailScreen';
import CreatePlayerScreen from '../screens/players/CreatePlayerScreen';

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
      ) : (
        // Stack Autenticado (Administrador o Entrenador)
        <>
          {usuario?.rol === 'entrenador' ? (
            <Stack.Screen name="CoachDashboard" component={CoachDashboardScreen} />
          ) : (
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
          )}
          <Stack.Screen
            name="PlayerDirectory"
            component={PlayerDirectoryScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="PlayerDetail"
            component={PlayerDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="CreatePlayer"
            component={CreatePlayerScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
        </>
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
