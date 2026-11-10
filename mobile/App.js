import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { inicializarBaseDatosLocal } from './src/services/asistenciaOfflineRepository';

export default function App() {
  useEffect(() => {
    // Inicializar SQLite local para asistencia offline
    inicializarBaseDatosLocal().catch((err) => {
      console.warn('Advertencia inicializando SQLite local:', err);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
