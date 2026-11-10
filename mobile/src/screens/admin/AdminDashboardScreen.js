import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  ArrowUpRight,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { FichAppModalFeedback } from '../../components';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA, SOMBRAS } from '../../theme';

export default function AdminDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { usuario, cerrarSesion } = useAuth();
  const [conexionBackend, setConexionBackend] = useState('verificando');
  const [modalFeedback, setModalFeedback] = useState({
    visible: false,
    tipo: 'confirmacion',
    titulo: '',
    mensaje: '',
    textoConfirmar: 'Aceptar',
    textoCancelar: 'Cancelar',
    onConfirmar: null,
    onCancelar: null,
  });

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
    setModalFeedback({
      visible: true,
      tipo: 'peligro',
      titulo: 'Cerrar Sesión',
      mensaje: '¿Deseas salir del panel administrativo de FichApp?',
      textoConfirmar: 'Cerrar Sesión',
      textoCancelar: 'Cancelar',
      onConfirmar: async () => {
        setModalFeedback((prev) => ({ ...prev, visible: false }));
        await cerrarSesion();
      },
      onCancelar: () => setModalFeedback((prev) => ({ ...prev, visible: false })),
    });
  };

  const modulos = [
    {
      id: 'jugadores',
      titulo: 'Jugadores y Familias',
      descripcion: 'Padrón de atletas, representantes y fichas médicas',
      icono: Users,
      sprint: 'Sprint 1',
      ruta: 'PlayerDirectory',
      activo: true,
    },
    {
      id: 'obligaciones',
      titulo: 'Obligaciones y Cuotas',
      descripcion: 'Generación mensual y políticas de pronto-pago',
      icono: CalendarCheck,
      sprint: 'Sprint 3',
      activo: false,
    },
    {
      id: 'cobranzas',
      titulo: 'Cobranzas y Pagos',
      descripcion: 'Registro de pagos familiares y conversión oficial BCV',
      icono: CreditCard,
      sprint: 'Sprint 4',
      activo: false,
    },
    {
      id: 'reportes',
      titulo: 'Cuadre Diario y Finanzas',
      descripcion: 'Balance consolidado de caja en USD y VES',
      icono: FileText,
      sprint: 'Sprint 5',
      activo: false,
    },
  ];

  return (
    <View style={styles.contenedorPrincipal}>
      <StatusBar barStyle="light-content" backgroundColor={COLORES.brandPrimaryDark} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* =========================================================
            1. HERO BRANDING SUPERIOR (Azul Petróleo Institucional)
           ========================================================= */}
        <View style={[styles.heroSuperior, { paddingTop: Math.max(insets.top, 20) + ESPACIADO.space5 }]}>
          <View style={styles.circuloDecorativo1} />
          <View style={styles.circuloDecorativo2} />

          {/* Barra Superior del Hero: Tenant y Botón Salir */}
          <View style={styles.heroBarraSuperior}>
            <View style={styles.academiaBadge}>
              <Building2 size={14} color={COLORES.brandAccent} />
              <Text style={styles.academiaNombre} numberOfLines={1}>
                {usuario?.academia?.nombre || 'Obelisco FC'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.botonSalirHero}
              onPress={confirmarSalida}
              activeOpacity={0.7}
              accessibilityLabel="Cerrar sesión"
            >
              <LogOut size={15} color="#FFFFFF" />
              <Text style={styles.botonSalirTexto}>Salir</Text>
            </TouchableOpacity>
          </View>

          {/* Saludo y Rol Administrativo */}
          <View style={styles.heroInfoUsuario}>
            <View style={styles.rolPill}>
              <ShieldCheck size={12} color={COLORES.brandAccent} strokeWidth={2.5} />
              <Text style={styles.rolPillTexto}>ADMINISTRADOR</Text>
            </View>
            <Text style={styles.usuarioSaludo}>Hola, {usuario?.nombre || 'Administrador'}</Text>
            <Text style={styles.heroSubtitulo}>Panel de control y gestión operativa</Text>
          </View>

          {/* Estado de Enlace / Ping en Vivo */}
          <View style={styles.cajaEstadoHero}>
            <View style={styles.estadoIzquierda}>
              {conexionBackend === 'conectado' ? (
                <Wifi size={14} color={COLORES.brandAccent} />
              ) : (
                <WifiOff size={14} color={COLORES.warning} />
              )}
              <Text style={styles.textoEstadoHero}>
                {conexionBackend === 'conectado'
                  ? 'Conexión activa con el servidor'
                  : 'Sin conexión con el backend (offline)'}
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
        </View>

        {/* =========================================================
            2. HOJA INFERIOR CURVADA (Superficie Blanca Táctil)
           ========================================================= */}
        <View style={[styles.hojaInferior, { paddingBottom: Math.max(insets.bottom, 24) + ESPACIADO.space6 }]}>
          {/* Acceso Destacado al Directorio de Jugadores */}
          <View style={styles.seccionEncabezado}>
            <Text style={styles.seccionTitulo}>Módulos del Sistema</Text>
            <Text style={styles.seccionSubtitulo}>Selecciona un área para comenzar la gestión</Text>
          </View>

          {/* Lista de Módulos */}
          <View style={styles.listaModulos}>
            {modulos.map((m, idx) => {
              const Icono = m.icono;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.moduloItem,
                    m.activo && styles.moduloItemActivo,
                    idx === modulos.length - 1 && styles.moduloItemUltimo,
                  ]}
                  activeOpacity={m.activo ? 0.75 : 0.9}
                  onPress={() => {
                    if (m.ruta) {
                      navigation.navigate(m.ruta);
                    } else {
                      setModalFeedback({
                        visible: true,
                        tipo: 'confirmacion',
                        titulo: 'Módulo en Desarrollo',
                        mensaje: `${m.titulo} se activará en el ${m.sprint}.`,
                        textoConfirmar: 'Entendido',
                        textoCancelar: null,
                        onConfirmar: () => setModalFeedback((prev) => ({ ...prev, visible: false })),
                      });
                    }
                  }}
                >
                  <View style={[styles.moduloIconoContenedor, m.activo && styles.moduloIconoActivo]}>
                    <Icono
                      size={20}
                      color={m.activo ? COLORES.brandPrimary : COLORES.textMuted}
                      strokeWidth={2.2}
                    />
                  </View>

                  <View style={styles.moduloContenido}>
                    <View style={styles.moduloTituloFila}>
                      <Text style={[styles.moduloTitulo, !m.activo && styles.moduloTituloInactivo]}>
                        {m.titulo}
                      </Text>
                      <View style={[styles.badgeSprint, m.activo && styles.badgeSprintActivo]}>
                        <Text style={[styles.badgeSprintTexto, m.activo && styles.badgeSprintTextoActivo]}>
                          {m.activo ? 'DISPONIBLE' : m.sprint}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.moduloDescripcion}>{m.descripcion}</Text>
                  </View>

                  {m.activo ? (
                    <ArrowUpRight size={18} color={COLORES.brandPrimary} strokeWidth={2.2} />
                  ) : (
                    <ChevronRight size={18} color={COLORES.textMuted} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Ficha Resumen de Cuenta */}
          <View style={styles.fichaCuenta}>
            <Text style={styles.fichaTitulo}>Sesión Administrativa</Text>
            <View style={styles.fichaFila}>
              <Text style={styles.fichaLabel}>Identificador</Text>
              <Text style={styles.fichaValor}>{usuario?.identificador_acceso}</Text>
            </View>
            <View style={styles.fichaFila}>
              <Text style={styles.fichaLabel}>Correo</Text>
              <Text style={styles.fichaValor}>{usuario?.correo || 'Sin correo asociado'}</Text>
            </View>
            <View style={styles.fichaFila}>
              <Text style={styles.fichaLabel}>Tenant ID</Text>
              <Text style={styles.fichaValorMono} numberOfLines={1} ellipsizeMode="middle">
                {usuario?.academia_id}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal Desacoplado para Salida o Avisos */}
      <FichAppModalFeedback
        visible={modalFeedback.visible}
        tipo={modalFeedback.tipo}
        titulo={modalFeedback.titulo}
        mensaje={modalFeedback.mensaje}
        textoConfirmar={modalFeedback.textoConfirmar}
        textoCancelar={modalFeedback.textoCancelar}
        onConfirmar={modalFeedback.onConfirmar}
        onCancelar={modalFeedback.onCancelar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorPrincipal: {
    flex: 1,
    backgroundColor: COLORES.brandPrimaryDark,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSuperior: {
    backgroundColor: COLORES.brandPrimary,
    paddingHorizontal: ESPACIADO.space5,
    paddingBottom: ESPACIADO.space8 + ESPACIADO.space4, // Margen holgado hacia la hoja blanca
    position: 'relative',
    overflow: 'hidden',
  },
  circuloDecorativo1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  circuloDecorativo2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(185, 228, 74, 0.06)',
  },
  heroBarraSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ESPACIADO.space3,
    zIndex: 2,
  },
  academiaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: ESPACIADO.space3,
    paddingVertical: 5,
    borderRadius: RADIOS.full,
    maxWidth: '75%',
  },
  academiaNombre: {
    ...TIPOGRAFIA.bodySmall,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  botonSalirHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(220, 38, 38, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.4)',
    paddingHorizontal: ESPACIADO.space3,
    paddingVertical: 5,
    borderRadius: RADIOS.full,
  },
  botonSalirTexto: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  heroInfoUsuario: {
    zIndex: 2,
    marginBottom: ESPACIADO.space3,
  },
  rolPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(185, 228, 74, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: ESPACIADO.space2,
    paddingVertical: 3,
    borderRadius: RADIOS.sm,
    marginBottom: ESPACIADO.space1,
  },
  rolPillTexto: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORES.brandAccent,
    letterSpacing: 1,
  },
  usuarioSaludo: {
    ...TIPOGRAFIA.heading1,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroSubtitulo: {
    ...TIPOGRAFIA.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  cajaEstadoHero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIOS.md,
    paddingHorizontal: ESPACIADO.space3,
    paddingVertical: ESPACIADO.space2,
    zIndex: 2,
  },
  estadoIzquierda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.space2,
  },
  textoEstadoHero: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  puntoConexion: {
    width: 7,
    height: 7,
    borderRadius: RADIOS.full,
    backgroundColor: COLORES.textMuted,
  },
  puntoVerde: {
    backgroundColor: COLORES.brandAccent,
  },
  puntoNaranja: {
    backgroundColor: COLORES.warning,
  },
  hojaInferior: {
    flex: 1,
    backgroundColor: COLORES.surfaceDefault,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: ESPACIADO.space5,
    paddingTop: ESPACIADO.space6,
    marginTop: -ESPACIADO.space4,
    ...SOMBRAS.tarjeta,
  },
  seccionEncabezado: {
    marginBottom: ESPACIADO.space3,
  },
  seccionTitulo: {
    ...TIPOGRAFIA.heading2,
    fontSize: 18,
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
  moduloItemActivo: {
    backgroundColor: '#FAFCF8',
  },
  moduloItemUltimo: {
    borderBottomWidth: 0,
  },
  moduloIconoContenedor: {
    width: 42,
    height: 42,
    borderRadius: RADIOS.md,
    backgroundColor: COLORES.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduloIconoActivo: {
    backgroundColor: COLORES.brandPrimarySubtle,
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
    fontWeight: '700',
  },
  moduloTituloInactivo: {
    color: COLORES.textSecondary,
    fontWeight: '600',
  },
  moduloDescripcion: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    lineHeight: 16,
  },
  badgeSprint: {
    backgroundColor: COLORES.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIOS.sm,
  },
  badgeSprintActivo: {
    backgroundColor: COLORES.brandAccentSubtle,
  },
  badgeSprintTexto: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORES.textMuted,
  },
  badgeSprintTextoActivo: {
    color: COLORES.brandAccentDark,
  },
  fichaCuenta: {
    backgroundColor: COLORES.surfaceSubtle,
    borderRadius: RADIOS.lg,
    padding: ESPACIADO.space4,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
  },
  fichaTitulo: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORES.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: ESPACIADO.space2,
  },
  fichaFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  fichaLabel: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textMuted,
  },
  fichaValor: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textPrimary,
    fontWeight: '600',
  },
  fichaValorMono: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    maxWidth: 140,
  },
});
