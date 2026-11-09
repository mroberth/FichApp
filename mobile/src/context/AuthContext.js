import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import {
  guardarToken,
  obtenerToken,
  eliminarToken,
  guardarUsuario,
  obtenerUsuario,
  limpiarTodo,
} from '../services/storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Al abrir la aplicación, restaurar y verificar sesión existente
  useEffect(() => {
    const restaurarSesion = async () => {
      try {
        const tokenGuardado = await obtenerToken();
        const usuarioCache = await obtenerUsuario();

        if (tokenGuardado) {
          setToken(tokenGuardado);
          if (usuarioCache) {
            setUsuario(usuarioCache);
          }

          // Validar con el backend que el token siga vigente y no esté revocado
          try {
            const perfil = await apiService.obtenerPerfil(tokenGuardado);
            if (perfil?.usuario) {
              setUsuario(perfil.usuario);
              await guardarUsuario(perfil.usuario);
            }
          } catch (errPerfil) {
            console.warn('Token guardado ya no es válido en el servidor:', errPerfil.message);
            await limpiarTodo();
            setToken(null);
            setUsuario(null);
          }
        }
      } catch (err) {
        console.error('Error restaurando sesión:', err);
      } finally {
        setCargando(false);
      }
    };

    restaurarSesion();
  }, []);

  const iniciarSesion = async (identificadorAcceso, contrasena) => {
    setCargando(true);
    setError(null);

    try {
      const respuesta = await apiService.login(identificadorAcceso, contrasena);
      const nuevoToken = respuesta.token;
      const nuevoUsuario = respuesta.usuario;

      await guardarToken(nuevoToken);
      await guardarUsuario(nuevoUsuario);

      setToken(nuevoToken);
      setUsuario(nuevoUsuario);
      return { exito: true };
    } catch (err) {
      const mensaje = err.message || 'Error al iniciar sesión';
      setError(mensaje);
      return { exito: false, mensaje };
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = async () => {
    setCargando(true);
    try {
      if (token) {
        await apiService.logout(token);
      }
    } catch (err) {
      console.warn('Error notificando logout al servidor:', err.message);
    } finally {
      await limpiarTodo();
      setToken(null);
      setUsuario(null);
      setError(null);
      setCargando(false);
    }
  };

  const limpiarError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        cargando,
        error,
        estaAutenticado: !!usuario && !!token,
        esAdmin: usuario?.rol === 'administrador' || usuario?.rol === 'superadmin',
        esEntrenador: usuario?.rol === 'entrenador',
        iniciarSesion,
        cerrarSesion,
        limpiarError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return contexto;
};
