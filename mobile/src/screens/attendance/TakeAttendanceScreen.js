import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Users,
  Building2,
  MapPin,
  FileText,
  Check,
  AlertTriangle,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { asistenciaOfflineRepository } from '../../services/asistenciaOfflineRepository';
import { FichAppModalFeedback } from '../../components';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA, SOMBRAS } from '../../theme';

export default function TakeAttendanceScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { usuario, token } = useAuth();

  const [equipos, setEquipos] = useState([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [atletas, setAtletas] = useState([]);
  const [asistencias, setAsistencias] = useState({}); // { [jugadorId]: 'presente' | 'ausente' | 'justificado' }
  const [lugar, setLugar] = useState('Cancha Principal');
  const [observacionesGenerales, setObservacionesGenerales] = useState('');
  
  const [cargandoEquipos, setCargandoEquipos] = useState(true);
  const [cargandoAtletas, setCargandoAtletas] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [modoOffline, setModoOffline] = useState(false);

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

  // Fecha formateada para visualización y registro
  const fechaHoyTexto = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('es-VE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  // 1. Cargar equipos disponibles (online con fallback o caché local)
  useEffect(() => {
    const cargarEquipos = async () => {
      setCargandoEquipos(true);
      try {
        let equiposValidos = [];

        if (token) {
          try {
            const lista = await apiService.listarEquipos(token);
            equiposValidos = Array.isArray(lista) ? lista : (lista?.items || []);
            // Guardar en SQLite local para uso offline
            if (equiposValidos.length > 0) {
              await asistenciaOfflineRepository.cachearEquipos(usuario?.academia_id || '', equiposValidos);
            }
          } catch (errApi) {
            console.warn('Fallo al obtener equipos online, intentando caché local:', errApi);
            equiposValidos = await asistenciaOfflineRepository.obtenerEquiposLocales();
            setModoOffline(true);
          }
        } else {
          equiposValidos = await asistenciaOfflineRepository.obtenerEquiposLocales();
          setModoOffline(true);
        }

        setEquipos(equiposValidos);
        if (equiposValidos.length > 0) {
          setEquipoSeleccionado(equiposValidos[0]);
        }
      } catch (err) {
        console.error('Error cargando equipos:', err);
      } finally {
        setCargandoEquipos(false);
      }
    };
    cargarEquipos();
  }, [token, usuario]);

  // 2. Cargar jugadores cuando cambia el equipo seleccionado
  const cargarAtletasDeEquipo = useCallback(async (equipo) => {
    if (!equipo?.id) return;
    setCargandoAtletas(true);
    try {
      let lista = [];

      // Intentar primero online si hay token
      if (token) {
        try {
          const resp = await apiService.listarJugadores(token, { equipo_id: equipo.id, limite: 100 });
          lista = resp?.items || (Array.isArray(resp) ? resp : []);
          
          // Guardar en SQLite local para disponibilidad offline futura
          await asistenciaOfflineRepository.cachearPlantilla(
            usuario?.academia_id || '',
            equipo.id,
            lista
          );
        } catch {
          // Si falla internet, recurrir al caché local de SQLite
          lista = await asistenciaOfflineRepository.obtenerPlantillaLocal(equipo.id);
          setModoOffline(true);
        }
      } else {
        lista = await asistenciaOfflineRepository.obtenerPlantillaLocal(equipo.id);
        setModoOffline(true);
      }

      setAtletas(lista);

      // Estado por defecto: todos "presente" para acelerar la toma de asistencia con un solo pulgar
      const inicial = {};
      lista.forEach((j) => {
        const idAtleta = j.jugador_id || j.id;
        inicial[idAtleta] = 'presente';
      });
      setAsistencias(inicial);
    } catch (err) {
      console.error('Error cargando atletas:', err);
    } finally {
      setCargandoAtletas(false);
    }
  }, [token, usuario]);

  useEffect(() => {
    if (equipoSeleccionado) {
      cargarAtletasDeEquipo(equipoSeleccionado);
    }
  }, [equipoSeleccionado, cargarAtletasDeEquipo]);

  // Conteo de métricas en tiempo real
  const metricas = useMemo(() => {
    let presentes = 0;
    let ausentes = 0;
    let justificados = 0;

    Object.values(asistencias).forEach((estado) => {
      if (estado === 'presente') presentes++;
      else if (estado === 'ausente') ausentes++;
      else if (estado === 'justificado') justificados++;
    });

    return { presentes, ausentes, justificados, total: atletas.length };
  }, [asistencias, atletas]);

  // Alternar estado táctil con un toque: Presente -> Ausente -> Justificado -> Presente
  const alternarEstado = (jugadorId) => {
    setAsistencias((prev) => {
      const actual = prev[jugadorId] || 'presente';
      let siguiente = 'presente';
      if (actual === 'presente') siguiente = 'ausente';
      else if (actual === 'ausente') siguiente = 'justificado';
      else siguiente = 'presente';

      return { ...prev, [jugadorId]: siguiente };
    });
  };

  // Marcar directamente con botón específico
  const fijarEstado = (jugadorId, nuevoEstado) => {
    setAsistencias((prev) => ({ ...prev, [jugadorId]: nuevoEstado }));
  };

  // Guardar sesión y registros en SQLite local
  const guardarAsistencia = async () => {
    if (!equipoSeleccionado) {
      setModalFeedback({
        visible: true,
        tipo: 'error',
        titulo: 'Equipo Requerido',
        mensaje: 'Selecciona un equipo para registrar la asistencia.',
        textoConfirmar: 'Entendido',
        onConfirmar: () => setModalFeedback((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    if (atletas.length === 0) {
      setModalFeedback({
        visible: true,
        tipo: 'error',
        titulo: 'Plantilla Vacía',
        mensaje: 'El equipo seleccionado no tiene atletas registrados.',
        textoConfirmar: 'Entendido',
        onConfirmar: () => setModalFeedback((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    setGuardando(true);
    try {
      const registros = atletas.map((a) => {
        const idAtleta = a.jugador_id || a.id;
        const nombreCompleto = `${a.nombres || ''} ${a.apellidos || ''}`.trim();
        return {
          jugador_id: idAtleta,
          jugador_nombre: nombreCompleto,
          numero_camiseta: a.numero_camiseta || null,
          estado_asistencia: asistencias[idAtleta] || 'presente',
          observaciones: '',
        };
      });

      const sesionId = await asistenciaOfflineRepository.guardarSesionConAsistencias({
        academiaId: usuario?.academia_id || '',
        equipoId: equipoSeleccionado.id,
        equipoNombre: equipoSeleccionado.nombre || 'Equipo',
        categoriaNombre: equipoSeleccionado.categoria_nombre || '',
        fechaSesion: new Date().toISOString(),
        lugar: lugar.trim(),
        observaciones: observacionesGenerales.trim(),
        creadoPor: usuario?.id || '',
        registros,
      });

      setModalFeedback({
        visible: true,
        tipo: 'exito',
        titulo: '¡Asistencia Guardada!',
        mensaje: `Se guardó la sesión localmente con ${metricas.presentes} presentes y ${metricas.ausentes} ausentes. Podrás sincronizarla cuando tengas conexión.`,
        textoConfirmar: 'Volver al Panel',
        onConfirmar: () => {
          setModalFeedback((prev) => ({ ...prev, visible: false }));
          navigation.navigate('CoachDashboard');
        },
      });
    } catch (err) {
      console.error('Error guardando asistencia local:', err);
      setModalFeedback({
        visible: true,
        tipo: 'error',
        titulo: 'Error al Guardar',
        mensaje: 'No se pudo guardar la sesión en el almacenamiento local: ' + err.message,
        textoConfirmar: 'Aceptar',
        onConfirmar: () => setModalFeedback((prev) => ({ ...prev, visible: false })),
      });
    } finally {
      setGuardando(false);
    }
  };

  const renderAtleta = ({ item }) => {
    const idAtleta = item.jugador_id || item.id;
    const estado = asistencias[idAtleta] || 'presente';

    const esPresente = estado === 'presente';
    const esAusente = estado === 'ausente';
    const esJustificado = estado === 'justificado';

    return (
      <View style={styles.filaAtleta}>
        {/* Info del Atleta */}
        <TouchableOpacity
          style={styles.infoAtleta}
          activeOpacity={0.7}
          onPress={() => alternarEstado(idAtleta)}
        >
          <View style={styles.dorsalBadge}>
            <Text style={styles.dorsalTexto}>{item.numero_camiseta ? `#${item.numero_camiseta}` : '—'}</Text>
          </View>
          <View style={styles.textosAtleta}>
            <Text style={styles.nombreAtleta} numberOfLines={1}>
              {item.apellidos}, {item.nombres}
            </Text>
            <Text style={styles.posicionAtleta}>
              {item.posicion || 'Sin posición'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Controles de Selección Táctil de Estado (Thumb-Friendly) */}
        <View style={styles.selectorEstados}>
          <TouchableOpacity
            style={[styles.botonEstado, esPresente && styles.botonPresenteActivo]}
            onPress={() => fijarEstado(idAtleta, 'presente')}
            activeOpacity={0.8}
          >
            <Text style={[styles.textoBotonEstado, esPresente && styles.textoPresenteActivo]}>P</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.botonEstado, esAusente && styles.botonAusenteActivo]}
            onPress={() => fijarEstado(idAtleta, 'ausente')}
            activeOpacity={0.8}
          >
            <Text style={[styles.textoBotonEstado, esAusente && styles.textoAusenteActivo]}>A</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.botonEstado, esJustificado && styles.botonJustificadoActivo]}
            onPress={() => fijarEstado(idAtleta, 'justificado')}
            activeOpacity={0.8}
          >
            <Text style={[styles.textoBotonEstado, esJustificado && styles.textoJustificadoActivo]}>J</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor={COLORES.brandPrimary} />

      {/* ========================================================================= */}
      {/* 1. CABECERA HERO SPLIT (Azul Petróleo #174D50 - Alto Contraste Bajo el Sol) */}
      {/* ========================================================================= */}
      <View style={[styles.heroHeader, { paddingTop: insets.top + ESPACIADO.space3 }]}>
        <View style={styles.barraSuperior}>
          <TouchableOpacity
            style={styles.botonRetroceso}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <ArrowLeft size={22} color={COLORES.textOnBrand} />
          </TouchableOpacity>

          <View style={styles.centroHeader}>
            <Text style={styles.subtituloHero}>CANCHA OFFLINE</Text>
            <Text style={styles.tituloHero}>Toma de Asistencia</Text>
          </View>

          <View style={styles.fechaBadge}>
            <Calendar size={13} color={COLORES.brandAccent} style={{ marginRight: 4 }} />
            <Text style={styles.textoFechaBadge}>{fechaHoyTexto}</Text>
          </View>
        </View>

        {/* Selector Horizontal de Equipos */}
        {cargandoEquipos ? (
          <ActivityIndicator size="small" color={COLORES.brandAccent} style={{ marginVertical: 12 }} />
        ) : (
          <FlatList
            horizontal
            data={equipos}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listaEquipos}
            renderItem={({ item }) => {
              const seleccionado = equipoSeleccionado?.id === item.id;
              return (
                <TouchableOpacity
                  style={[styles.chipEquipo, seleccionado && styles.chipEquipoActivo]}
                  onPress={() => setEquipoSeleccionado(item)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.textoChipEquipo, seleccionado && styles.textoChipEquipoActivo]}>
                    {item.nombre}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Chips de Métricas en Tiempo Real (Thumb Count) */}
        <View style={styles.panelMetricas}>
          <View style={[styles.metricaPill, { backgroundColor: COLORES.brandAccentSubtle }]}>
            <CheckCircle2 size={14} color={COLORES.brandAccentDark} style={{ marginRight: 4 }} />
            <Text style={[styles.textoMetrica, { color: COLORES.brandAccentDark }]}>
              {metricas.presentes} Presentes
            </Text>
          </View>

          <View style={[styles.metricaPill, { backgroundColor: COLORES.dangerBg }]}>
            <XCircle size={14} color={COLORES.danger} style={{ marginRight: 4 }} />
            <Text style={[styles.textoMetrica, { color: COLORES.danger }]}>
              {metricas.ausentes} Ausentes
            </Text>
          </View>

          <View style={[styles.metricaPill, { backgroundColor: COLORES.warningBg }]}>
            <Clock size={14} color={COLORES.warning} style={{ marginRight: 4 }} />
            <Text style={[styles.textoMetrica, { color: COLORES.warning }]}>
              {metricas.justificados} Justificados
            </Text>
          </View>
        </View>
      </View>

      {/* ========================================================================= */}
      {/* 2. HOJA INFERIOR CURVADA («HERO SPLIT» - Fondo Claro y Controles Táctiles) */}
      {/* ========================================================================= */}
      <View style={styles.hojaInferior}>
        {cargandoAtletas ? (
          <View style={styles.centroCarga}>
            <ActivityIndicator size="large" color={COLORES.brandPrimary} />
            <Text style={styles.textoCarga}>Cargando plantilla del equipo...</Text>
          </View>
        ) : atletas.length === 0 ? (
          <View style={styles.centroVacio}>
            <Users size={48} color={COLORES.textMuted} />
            <Text style={styles.tituloVacio}>No hay atletas registrados</Text>
            <Text style={styles.subtituloVacio}>
              Este equipo aún no tiene jugadores asignados en la temporada activa.
            </Text>
          </View>
        ) : (
          <FlatList
            data={atletas}
            keyExtractor={(item) => item.jugador_id || item.id}
            renderItem={renderAtleta}
            contentContainerStyle={styles.listaAtletas}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separador} />}
          />
        )}

        {/* Barra de Acción Inferior Fija para el Pulgar */}
        <View style={[styles.barraAccionInferior, { paddingBottom: insets.bottom + ESPACIADO.space3 }]}>
          <TouchableOpacity
            style={[styles.botonGuardar, (guardando || atletas.length === 0) && styles.botonDeshabilitado]}
            onPress={guardarAsistencia}
            disabled={guardando || atletas.length === 0}
            activeOpacity={0.8}
          >
            {guardando ? (
              <ActivityIndicator size="small" color={COLORES.textOnBrand} />
            ) : (
              <>
                <Save size={20} color={COLORES.textOnBrand} style={{ marginRight: 8 }} />
                <Text style={styles.textoBotonGuardar}>
                  Guardar Sesión en Cancha ({metricas.total})
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

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
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.brandPrimary,
  },
  heroHeader: {
    backgroundColor: COLORES.brandPrimary,
    paddingHorizontal: ESPACIADO.space4,
    paddingBottom: ESPACIADO.space4,
  },
  barraSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ESPACIADO.space3,
  },
  botonRetroceso: {
    width: 40,
    height: 40,
    borderRadius: RADIOS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centroHeader: {
    flex: 1,
    marginHorizontal: ESPACIADO.space2,
  },
  subtituloHero: {
    ...TIPOGRAFIA.caption,
    color: COLORES.brandAccent,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  tituloHero: {
    ...TIPOGRAFIA.heading2,
    color: COLORES.textOnBrand,
    fontWeight: '700',
  },
  fechaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIOS.full,
  },
  textoFechaBadge: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textOnBrand,
    fontWeight: '600',
  },
  listaEquipos: {
    paddingVertical: ESPACIADO.space2,
    gap: 8,
  },
  chipEquipo: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIOS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  chipEquipoActivo: {
    backgroundColor: COLORES.brandAccent,
    borderColor: COLORES.brandAccent,
  },
  textoChipEquipo: {
    ...TIPOGRAFIA.bodyMedium,
    color: COLORES.textOnBrand,
    fontWeight: '600',
  },
  textoChipEquipoActivo: {
    color: COLORES.brandPrimaryDark,
    fontWeight: '700',
  },
  panelMetricas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: ESPACIADO.space2,
  },
  metricaPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: RADIOS.md,
  },
  textoMetrica: {
    ...TIPOGRAFIA.bodySmall,
    fontWeight: '700',
    fontSize: 11,
  },
  hojaInferior: {
    flex: 1,
    backgroundColor: COLORES.surfaceDefault,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    paddingTop: ESPACIADO.space3,
  },
  centroCarga: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ESPACIADO.space4,
  },
  textoCarga: {
    ...TIPOGRAFIA.bodyMedium,
    color: COLORES.textSecondary,
    marginTop: 12,
  },
  centroVacio: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ESPACIADO.space6,
  },
  tituloVacio: {
    ...TIPOGRAFIA.heading3,
    color: COLORES.textPrimary,
    marginTop: ESPACIADO.space3,
  },
  subtituloVacio: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  listaAtletas: {
    paddingHorizontal: ESPACIADO.space4,
    paddingBottom: 100,
  },
  separador: {
    height: 1,
    backgroundColor: COLORES.borderSubtle,
  },
  filaAtleta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    minHeight: 64,
  },
  infoAtleta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  dorsalBadge: {
    width: 38,
    height: 38,
    borderRadius: RADIOS.full,
    backgroundColor: COLORES.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
  },
  dorsalTexto: {
    ...TIPOGRAFIA.bodyMedium,
    color: COLORES.brandPrimary,
    fontWeight: '700',
  },
  textosAtleta: {
    flex: 1,
  },
  nombreAtleta: {
    ...TIPOGRAFIA.bodyMedium,
    color: COLORES.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
  posicionAtleta: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    marginTop: 2,
  },
  selectorEstados: {
    flexDirection: 'row',
    gap: 6,
  },
  botonEstado: {
    width: 44,
    height: 44,
    borderRadius: RADIOS.md,
    backgroundColor: COLORES.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: COLORES.borderDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotonEstado: {
    ...TIPOGRAFIA.bodyMedium,
    fontWeight: '700',
    color: COLORES.textMuted,
  },
  botonPresenteActivo: {
    backgroundColor: COLORES.brandAccent,
    borderColor: COLORES.brandAccentDark,
  },
  textoPresenteActivo: {
    color: COLORES.brandPrimaryDark,
    fontWeight: '800',
  },
  botonAusenteActivo: {
    backgroundColor: COLORES.dangerBg,
    borderColor: COLORES.danger,
  },
  textoAusenteActivo: {
    color: COLORES.danger,
    fontWeight: '800',
  },
  botonJustificadoActivo: {
    backgroundColor: COLORES.warningBg,
    borderColor: COLORES.warning,
  },
  textoJustificadoActivo: {
    color: COLORES.warning,
    fontWeight: '800',
  },
  barraAccionInferior: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORES.surfaceDefault,
    borderTopWidth: 1,
    borderTopColor: COLORES.borderSubtle,
    paddingHorizontal: ESPACIADO.space4,
    paddingTop: ESPACIADO.space3,
    ...SOMBRAS.lg,
  },
  botonGuardar: {
    height: 52,
    borderRadius: RADIOS.md,
    backgroundColor: COLORES.brandPrimary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonDeshabilitado: {
    backgroundColor: COLORES.borderDefault,
  },
  textoBotonGuardar: {
    ...TIPOGRAFIA.heading3,
    color: COLORES.textOnBrand,
    fontWeight: '700',
  },
});
