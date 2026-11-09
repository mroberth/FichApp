import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Users,
  CreditCard,
  CalendarCheck,
  FileText,
  LogOut,
  Wifi,
  WifiOff,
  Building2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA, SOMBRAS } from '../../theme';

export default function AdminDashboardScreen() {
  const { usuario, cerrarSesion } = useAuth();
  const [conexionBackend, setConexionBackend] = useState('verificando');

  useEffect(() => {
    const verificarSalud = async () => {
      try {
        await apiService.ping();
        setConexionBackend('conectado');
      } catch {
        setConexionBackend('desconectado');
      }
    };
    verificarSalud();
  }, []);

  const confirmarSalida = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Deseas salir del sistema?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: cerrarSesion },
      ]
    );
  };

  const modulos = [
    {
      id: 'jugadores',
      titulo: 'Jugadores y Familias',
      descripcion: 'Padrón de atletas, representantes y fichas médicas',
      icono: Users,
      sprint: 'Sprint 1',
    },
    {
      id: 'cobranzas',
      titulo: 'Cobranzas y Pagos',
      descripcion: 'Registro de pagos familiares y conversión oficial BCV',
      icono: CreditCard,
      sprint: 'Sprint 4',
    },
    {
      id: 'obligaciones',
      titulo: 'Obligaciones y Cuotas',
      descripcion: 'Generación mensual y políticas de pronto-pago',
      icono: CalendarCheck,
      sprint: 'Sprint 3',
    },
    {
      id: 'reportes',
      titulo: 'Cuadre Diario y Finanzas',
      descripcion: 'Balance consolidado de caja en USD y VES',
      icono: FileText,
      sprint: 'Sprint 5',
    },
  ];

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORES.surfaceBackground} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera del Tenant */}
        <View style={styles.cabecera}>
          <View style={styles.cabeceraInfo}>
            <View style={styles.organizacionFila}>
              <Building2 size={16} color={COLORES.brandPrimary} />
              <Text style={styles.academiaNombre}>
                {usuario?.academia?.nombre || 'Obelisco FC'}
              </Text>
            </View>
            <Text style={styles.usuarioNombre}>{usuario?.nombre}</Text>
            <View style={styles.rolBadge}>
              <ShieldCheck size={12} color={COLORES.brandPrimary} />
              <Text style={styles.rolTexto}>ADMINISTRADOR</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.botonSalir}
            onPress={confirmarSalida}
            activeOpacity={0.7}
            accessibilityLabel="Cerrar sesión"
          >
            <LogOut size={16} color={COLORES.danger} />
            <Text style={styles.botonSalirTexto}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Estado de Enlace con el Servidor */}
        <View style={styles.cajaEstado}>
          <View style={styles.estadoIzquierda}>
            {conexionBackend === 'conectado' ? (
              <Wifi size={16} color={COLORES.success} />
            ) : (
              <WifiOff size={16} color={COLORES.warning} />
            )}
            <Text style={styles.textoEstado}>
              {conexionBackend === 'conectado'
                ? 'Conectado al servidor de FichApp'
                : conexionBackend === 'desconectado'
                ? 'Sin conexión con el servidor (192.168.50.117:8000)'
                : 'Comprobando conectividad...'}
            </Text>
          </View>
          <View
            style={[
              styles.puntoConexion,
              conexionBackend === 'conectado' && styles.puntoVerde,
              conexionBackend === 'desconectado' && styles.puntoNaranja,
            ]}
          />
        </View>

        {/* Sección de Módulos Operativos */}
        <View style={styles.seccionEncabezado}>
          <Text style={styles.seccionTitulo}>Módulos de Gestión</Text>
          <Text style={styles.seccionSubtitulo}>Funcionalidades activas del roadmap</Text>
        </View>

        <View style={styles.listaModulos}>
          {modulos.map((m, idx) => {
            const Icono = m.icono;
            return (
              <View
                key={m.id}
                style={[
                  styles.moduloItem,
                  idx === modulos.length - 1 && styles.moduloItemUltimo,
                ]}
              >
                <View style={styles.moduloIconoContenedor}>
                  <Icono size={20} color={COLORES.brandPrimary} />
                </View>

                <View style={styles.moduloContenido}>
                  <View style={styles.moduloTituloFila}>
                    <Text style={styles.moduloTitulo}>{m.titulo}</Text>
                    <View style={styles.badgeSprint}>
                      <Text style={styles.badgeSprintTexto}>{m.sprint}</Text>
                    </View>
                  </View>
                  <Text style={styles.moduloDescripcion}>{m.descripcion}</Text>
                </View>

                <ChevronRight size={18} color={COLORES.textMuted} />
              </View>
            );
          })}
        </View>

        {/* Ficha Resumen de Cuenta */}
        <View style={styles.fichaCuenta}>
          <Text style={styles.fichaTitulo}>Detalles de la Cuenta</Text>
          <View style={styles.fichaFila}>
            <Text style={styles.fichaLabel}>Usuario</Text>
            <Text style={styles.fichaValor}>{usuario?.identificador_acceso}</Text>
          </View>
          <View style={styles.fichaFila}>
            <Text style={styles.fichaLabel}>Correo</Text>
            <Text style={styles.fichaValor}>{usuario?.correo || 'No asignado'}</Text>
          </View>
          <View style={styles.fichaFila}>
            <Text style={styles.fichaLabel}>ID Academia</Text>
            <Text style={styles.fichaValorMono} numberOfLines={1} ellipsizeMode="middle">
              {usuario?.academia_id}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.surfaceBackground,
  },
  scroll: {
    paddingHorizontal: ESPACIADO.space5,
    paddingVertical: ESPACIADO.space4,
  },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: COLORES.surfaceDefault,
    padding: ESPACIADO.space4,
    borderRadius: RADIOS.lg,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    marginBottom: ESPACIADO.space3,
    ...SOMBRAS.sutil,
  },
  cabeceraInfo: {
    flex: 1,
  },
  organizacionFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.space2,
    marginBottom: ESPACIADO.space1,
  },
  academiaNombre: {
    ...TIPOGRAFIA.heading3,
    color: COLORES.brandPrimary,
  },
  usuarioNombre: {
    ...TIPOGRAFIA.bodyMedium,
    color: COLORES.textPrimary,
  },
  rolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORES.brandPrimarySubtle,
    alignSelf: 'flex-start',
    paddingHorizontal: ESPACIADO.space2,
    paddingVertical: 3,
    borderRadius: RADIOS.sm,
    marginTop: ESPACIADO.space2,
  },
  rolTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORES.brandPrimary,
    letterSpacing: 0.5,
  },
  botonSalir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: ESPACIADO.space3,
    paddingVertical: ESPACIADO.space2,
    borderRadius: RADIOS.md,
    borderWidth: 1,
    borderColor: COLORES.dangerBg,
    backgroundColor: COLORES.dangerBg,
  },
  botonSalirTexto: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.danger,
    fontWeight: '600',
  },
  cajaEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORES.surfaceDefault,
    paddingHorizontal: ESPACIADO.space4,
    paddingVertical: ESPACIADO.space3,
    borderRadius: RADIOS.md,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    marginBottom: ESPACIADO.space5,
  },
  estadoIzquierda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.space2,
    flex: 1,
  },
  puntoConexion: {
    width: 8,
    height: 8,
    borderRadius: RADIOS.full,
    backgroundColor: COLORES.textMuted,
  },
  puntoVerde: {
    backgroundColor: COLORES.success,
  },
  puntoNaranja: {
    backgroundColor: COLORES.warning,
  },
  textoEstado: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    fontWeight: '500',
  },
  seccionEncabezado: {
    marginBottom: ESPACIADO.space3,
  },
  seccionTitulo: {
    ...TIPOGRAFIA.heading3,
    color: COLORES.textPrimary,
  },
  seccionSubtitulo: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    marginTop: 2,
  },
  listaModulos: {
    backgroundColor: COLORES.surfaceDefault,
    borderRadius: RADIOS.lg,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    marginBottom: ESPACIADO.space5,
    overflow: 'hidden',
    ...SOMBRAS.sutil,
  },
  moduloItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ESPACIADO.space4,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borderSubtle,
    gap: ESPACIADO.space3,
  },
  moduloItemUltimo: {
    borderBottomWidth: 0,
  },
  moduloIconoContenedor: {
    width: 40,
    height: 40,
    borderRadius: RADIOS.md,
    backgroundColor: COLORES.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduloContenido: {
    flex: 1,
  },
  moduloTituloFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  moduloTitulo: {
    ...TIPOGRAFIA.bodyMedium,
    color: COLORES.textPrimary,
    fontWeight: '600',
  },
  moduloDescripcion: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
  },
  badgeSprint: {
    backgroundColor: COLORES.brandAccentSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIOS.sm,
  },
  badgeSprintTexto: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORES.brandAccentDark,
  },
  fichaCuenta: {
    backgroundColor: COLORES.surfaceDefault,
    borderRadius: RADIOS.lg,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    padding: ESPACIADO.space4,
    marginBottom: ESPACIADO.space4,
  },
  fichaTitulo: {
    ...TIPOGRAFIA.label,
    color: COLORES.textMuted,
    textTransform: 'uppercase',
    marginBottom: ESPACIADO.space3,
  },
  fichaFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ESPACIADO.space2,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borderSubtle,
  },
  fichaLabel: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
  },
  fichaValor: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textPrimary,
    fontWeight: '600',
  },
  fichaValorMono: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textPrimary,
    fontFamily: 'monospace',
    maxWidth: 160,
  },
});
