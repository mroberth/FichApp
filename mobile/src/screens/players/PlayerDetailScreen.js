import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Linking,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Shield,
  HeartPulse,
  Users,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  RefreshCw,
  Award,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { obtenerToken } from '../../services/storage';
import { FichAppModalFeedback } from '../../components';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA, SOMBRAS } from '../../theme';

export default function PlayerDetailScreen({ route, navigation }) {
  const { jugadorId, jugadorNombre } = route.params || {};
  const { token: tokenContext } = useAuth();

  const [ficha, setFicha] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados para modal de asignación de equipo
  const [modalEquipoVisible, setModalEquipoVisible] = useState(false);
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [dorsalInput, setDorsalInput] = useState('');
  const [posicionInput, setPosicionInput] = useState('Mediocampista');
  const [guardandoEquipo, setGuardandoEquipo] = useState(false);

  // Estado para feedback desacoplado (reemplazo de Alert.alert)
  const [modalFeedback, setModalFeedback] = useState({
    visible: false,
    tipo: 'confirmacion',
    titulo: '',
    mensaje: '',
    textoConfirmar: 'Aceptar',
    textoCancelar: 'Cancelar',
    onConfirmar: null,
    onCancelar: null,
    cargando: false,
  });

  const cargarFicha = useCallback(async () => {
    if (!jugadorId) {
      setError('Identificador de jugador no proporcionado.');
      setCargando(false);
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const token = tokenContext || (await obtenerToken());
      if (!token) {
        setError('Sesión expirada. Inicia sesión nuevamente.');
        setCargando(false);
        return;
      }

      const datos = await apiService.obtenerFichaJugador(token, jugadorId);
      setFicha(datos);
    } catch (err) {
      setError(err.message || 'No se pudo cargar la ficha del jugador.');
    } finally {
      setCargando(false);
    }
  }, [tokenContext, jugadorId]);

  useEffect(() => {
    cargarFicha();
  }, [cargarFicha]);

  const abrirModalEquipo = async () => {
    setDorsalInput(ficha?.numero_camiseta ? String(ficha.numero_camiseta) : '');
    setPosicionInput(ficha?.posicion || 'Mediocampista');
    setEquipoSeleccionado(ficha?.equipo_id || null);
    setModalEquipoVisible(true);

    try {
      const token = tokenContext || (await obtenerToken());
      if (token) {
        const lista = await apiService.listarEquipos(token);
        setEquiposDisponibles(Array.isArray(lista) ? lista : []);
      }
    } catch (err) {
      console.warn('Error cargando equipos:', err.message);
    }
  };

  const guardarAsignacionEquipo = async () => {
    if (!equipoSeleccionado) {
      setModalFeedback({
        visible: true,
        tipo: 'error',
        titulo: 'Selección Requerida',
        mensaje: 'Por favor selecciona un equipo para el atleta antes de confirmar.',
        textoConfirmar: 'Entendido',
        onConfirmar: () => setModalFeedback((prev) => ({ ...prev, visible: false })),
        onCancelar: null,
      });
      return;
    }

    setGuardandoEquipo(true);
    try {
      const token = tokenContext || (await obtenerToken());
      const payload = {
        equipo_id: equipoSeleccionado,
        temporada: '2026',
        numero_camiseta: dorsalInput.trim() !== '' ? parseInt(dorsalInput.trim(), 10) : null,
        posicion: posicionInput,
      };

      await apiService.asignarEquipo(token, jugadorId, payload);
      setModalEquipoVisible(false);
      await cargarFicha();

      setModalFeedback({
        visible: true,
        tipo: 'exito',
        titulo: 'Plantel Actualizado',
        mensaje: 'El atleta ha sido asignado al equipo exitosamente.',
        textoConfirmar: 'Aceptar',
        onConfirmar: () => setModalFeedback((prev) => ({ ...prev, visible: false })),
        onCancelar: null,
      });
    } catch (err) {
      setModalFeedback({
        visible: true,
        tipo: 'error',
        titulo: 'Error al Asignar',
        mensaje: err.message || 'No se pudo actualizar el equipo.',
        textoConfirmar: 'Cerrar',
        onConfirmar: () => setModalFeedback((prev) => ({ ...prev, visible: false })),
        onCancelar: null,
      });
    } finally {
      setGuardandoEquipo(false);
    }
  };

  const ejecutarBaja = async () => {
    setModalFeedback((prev) => ({ ...prev, cargando: true }));
    try {
      const token = tokenContext || (await obtenerToken());
      await apiService.eliminarJugador(token, jugadorId);
      setModalFeedback({
        visible: true,
        tipo: 'exito',
        titulo: 'Atleta Retirado',
        mensaje: 'La ficha del atleta ha sido dada de baja exitosamente.',
        textoConfirmar: 'Aceptar',
        cargando: false,
        onConfirmar: () => {
          setModalFeedback((prev) => ({ ...prev, visible: false }));
          navigation.goBack();
        },
        onCancelar: null,
      });
    } catch (err) {
      setModalFeedback({
        visible: true,
        tipo: 'error',
        titulo: 'Error al Retirar',
        mensaje: err.message || 'No se pudo dar de baja al atleta.',
        textoConfirmar: 'Cerrar',
        cargando: false,
        onConfirmar: () => setModalFeedback((prev) => ({ ...prev, visible: false })),
        onCancelar: null,
      });
    }
  };

  const confirmarBaja = () => {
    setModalFeedback({
      visible: true,
      tipo: 'peligro',
      titulo: 'Dar de Baja Atleta',
      mensaje: `¿Estás seguro de que deseas retirar la ficha de ${ficha?.nombres} ${ficha?.apellidos}? Esta acción marcará su estatus como inactivo en el padrón.`,
      textoConfirmar: 'Sí, dar de baja',
      textoCancelar: 'Cancelar',
      cargando: false,
      onConfirmar: ejecutarBaja,
      onCancelar: () => setModalFeedback((prev) => ({ ...prev, visible: false })),
    });
  };

  // Cálculo de edad en base a fecha de nacimiento
  const calcularEdad = (fechaNac) => {
    if (!fechaNac) return null;
    const nacimiento = new Date(fechaNac);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad >= 0 ? `${edad} años` : null;
  };

  const llamarTelefono = (telefono) => {
    if (!telefono) return;
    const limpio = telefono.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${limpio}`);
  };

  const enviarCorreo = (correo) => {
    if (!correo) return;
    Linking.openURL(`mailto:${correo}`);
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.contenedor}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORES.surfaceBackground} />
        <View style={styles.cabeceraMin}>
          <TouchableOpacity style={styles.botonVolver} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color={COLORES.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.tituloMin}>{jugadorNombre || 'Ficha del Atleta'}</Text>
        </View>
        <View style={styles.estadoCentrado}>
          <ActivityIndicator size="large" color={COLORES.brandPrimary} />
          <Text style={styles.textoCarga}>Cargando ficha deportiva...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !ficha) {
    return (
      <SafeAreaView style={styles.contenedor}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORES.surfaceBackground} />
        <View style={styles.cabeceraMin}>
          <TouchableOpacity style={styles.botonVolver} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color={COLORES.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.tituloMin}>Error</Text>
        </View>
        <View style={styles.estadoCentrado}>
          <View style={styles.iconoAlerta}>
            <AlertCircle size={32} color={COLORES.danger} />
          </View>
          <Text style={styles.tituloEstado}>No se pudo cargar la información</Text>
          <Text style={styles.descripcionEstado}>{error || 'Jugador no encontrado.'}</Text>
          <TouchableOpacity style={styles.botonReintentar} onPress={cargarFicha}>
            <RefreshCw size={16} color={COLORES.textOnBrand} />
            <Text style={styles.botonReintentarTexto}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const iniciales = `${ficha.nombres?.charAt(0) || ''}${ficha.apellidos?.charAt(0) || ''}`.toUpperCase();
  const edadTexto = calcularEdad(ficha.fecha_nacimiento);
  const fichaMedica = ficha.ficha_medica || {};
  const alergias = Array.isArray(fichaMedica.alergias) ? fichaMedica.alergias : [];
  const representantes = Array.isArray(ficha.representantes) ? ficha.representantes : [];
  const historialEquipos = Array.isArray(ficha.historial_equipos) ? ficha.historial_equipos : [];

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORES.surfaceBackground} />

      {/* Cabecera de Navegación */}
      <View style={styles.cabeceraMin}>
        <TouchableOpacity style={styles.botonVolver} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={COLORES.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.tituloMin} numberOfLines={1}>
          Ficha Deportiva
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Tarjeta de Identidad del Atleta */}
        <View style={styles.tarjetaPerfil}>
          <View style={styles.avatarGrande}>
            <Text style={styles.avatarGrandeTexto}>{iniciales}</Text>
          </View>

          <Text style={styles.nombreCompleto}>
            {ficha.nombres} {ficha.apellidos}
          </Text>

          <View style={styles.etiquetasFila}>
            {ficha.cedula ? (
              <View style={styles.badgeCedula}>
                <Text style={styles.badgeCedulaTexto}>{ficha.cedula}</Text>
              </View>
            ) : null}

            <View style={[styles.badgeEstado, ficha.estado === 'activo' ? styles.badgeActivo : styles.badgeInactivo]}>
              <CheckCircle2 size={12} color={ficha.estado === 'activo' ? COLORES.success : COLORES.warning} />
              <Text style={[styles.badgeEstadoTexto, { color: ficha.estado === 'activo' ? COLORES.success : COLORES.warning }]}>
                {ficha.estado?.toUpperCase()}
              </Text>
            </View>
          </View>

          {ficha.numero_camiseta !== null && ficha.numero_camiseta !== undefined ? (
            <View style={styles.dorsalDestacado}>
              <Text style={styles.dorsalDestacadoTexto}>DORSAL #{ficha.numero_camiseta}</Text>
            </View>
          ) : null}
        </View>

        {/* Sección 1: Información Deportiva */}
        <View style={styles.seccionCard}>
          <View style={styles.seccionCabecera}>
            <Shield size={18} color={COLORES.brandPrimary} />
            <Text style={styles.seccionTitulo}>Estructura Deportiva</Text>
          </View>

          <View style={styles.campoFila}>
            <Text style={styles.campoLabel}>Equipo Actual</Text>
            <Text style={styles.campoValor}>{ficha.equipo_nombre || 'Sin equipo asignado'}</Text>
          </View>

          <View style={styles.campoFila}>
            <Text style={styles.campoLabel}>Categoría</Text>
            <Text style={styles.campoValor}>{ficha.categoria_nombre || 'No asignada'}</Text>
          </View>

          <View style={styles.campoFila}>
            <Text style={styles.campoLabel}>Posición en Cancha</Text>
            <Text style={styles.campoValor}>{ficha.posicion || 'Por definir'}</Text>
          </View>

          <View style={styles.campoFila}>
            <Text style={styles.campoLabel}>Temporada</Text>
            <Text style={styles.campoValor}>{ficha.temporada || '2026'}</Text>
          </View>

          <TouchableOpacity
            style={styles.botonAsignarEquipo}
            onPress={abrirModalEquipo}
            activeOpacity={0.7}
          >
            <ShieldCheck size={16} color={COLORES.brandPrimary} />
            <Text style={styles.botonAsignarEquipoTexto}>
              {ficha.equipo_nombre ? 'Cambiar Plantel o Dorsal' : 'Asignar a un Equipo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sección 2: Datos Personales */}
        <View style={styles.seccionCard}>
          <View style={styles.seccionCabecera}>
            <Calendar size={18} color={COLORES.brandPrimary} />
            <Text style={styles.seccionTitulo}>Datos Personales</Text>
          </View>

          <View style={styles.campoFila}>
            <Text style={styles.campoLabel}>Fecha de Nacimiento</Text>
            <Text style={styles.campoValor}>{ficha.fecha_nacimiento || 'No registrada'}</Text>
          </View>

          {edadTexto && (
            <View style={styles.campoFila}>
              <Text style={styles.campoLabel}>Edad</Text>
              <Text style={styles.campoValor}>{edadTexto}</Text>
            </View>
          )}

          <View style={styles.campoFila}>
            <Text style={styles.campoLabel}>Sexo</Text>
            <Text style={styles.campoValor}>
              {ficha.sexo === 'M' ? 'Masculino' : ficha.sexo === 'F' ? 'Femenino' : 'No especificado'}
            </Text>
          </View>
        </View>

        {/* Sección 3: Ficha Médica */}
        <View style={styles.seccionCard}>
          <View style={styles.seccionCabecera}>
            <HeartPulse size={18} color={COLORES.danger} />
            <Text style={styles.seccionTitulo}>Ficha Médica</Text>
          </View>

          <View style={styles.campoFila}>
            <Text style={styles.campoLabel}>Grupo Sanguíneo</Text>
            <View style={styles.tagSangre}>
              <Text style={styles.tagSangreTexto}>{fichaMedica.tipo_sangre || 'No indicado'}</Text>
            </View>
          </View>

          <View style={styles.campoBloque}>
            <Text style={styles.campoLabel}>Alergias Conocidas</Text>
            {alergias.length > 0 ? (
              <View style={styles.tagsContenedor}>
                {alergias.map((a, i) => (
                  <View key={i} style={styles.tagAlergia}>
                    <Text style={styles.tagAlergiaTexto}>{a}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.campoValorMuted}>Ninguna alergia registrada</Text>
            )}
          </View>

          {fichaMedica.observaciones && (
            <View style={styles.campoBloque}>
              <Text style={styles.campoLabel}>Observaciones Médicas</Text>
              <Text style={styles.campoValorTexto}>{fichaMedica.observaciones}</Text>
            </View>
          )}
        </View>

        {/* Sección 4: Padrón de Tutores y Representantes */}
        <View style={styles.seccionCard}>
          <View style={styles.seccionCabecera}>
            <Users size={18} color={COLORES.brandPrimary} />
            <Text style={styles.seccionTitulo}>Tutores y Representantes Legales</Text>
          </View>

          {representantes.length === 0 ? (
            <Text style={styles.campoValorMuted}>No tiene representantes registrados.</Text>
          ) : (
            representantes.map((rep, idx) => (
              <View key={rep.representante_id || idx} style={[styles.tutorCard, idx > 0 && styles.tutorCardSeparador]}>
                <View style={styles.tutorCabecera}>
                  <Text style={styles.tutorNombre}>
                    {rep.nombres} {rep.apellidos}
                  </Text>
                  <View style={styles.badgeRelacion}>
                    <Text style={styles.badgeRelacionTexto}>
                      {rep.tipo_relacion ? rep.tipo_relacion.replace('_', ' ').toUpperCase() : 'REPRESENTANTE'}
                    </Text>
                  </View>
                </View>

                {rep.cedula && (
                  <Text style={styles.tutorCedula}>C.I.: {rep.cedula}</Text>
                )}

                {/* Acciones de Contacto Rápido */}
                <View style={styles.tutorAcciones}>
                  {rep.telefono && (
                    <TouchableOpacity
                      style={styles.botonContacto}
                      onPress={() => llamarTelefono(rep.telefono)}
                      activeOpacity={0.7}
                    >
                      <Phone size={14} color={COLORES.brandPrimary} />
                      <Text style={styles.botonContactoTexto}>{rep.telefono}</Text>
                    </TouchableOpacity>
                  )}

                  {rep.correo && (
                    <TouchableOpacity
                      style={styles.botonContacto}
                      onPress={() => enviarCorreo(rep.correo)}
                      activeOpacity={0.7}
                    >
                      <Mail size={14} color={COLORES.brandPrimary} />
                      <Text style={styles.botonContactoTexto} numberOfLines={1}>
                        {rep.correo}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {rep.direccion && (
                  <View style={styles.filaDireccion}>
                    <MapPin size={13} color={COLORES.textMuted} />
                    <Text style={styles.direccionTexto}>{rep.direccion}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Sección 5: Historial de Planteles */}
        {historialEquipos.length > 0 && (
          <View style={styles.seccionCard}>
            <View style={styles.seccionCabecera}>
              <Award size={18} color={COLORES.brandPrimary} />
              <Text style={styles.seccionTitulo}>Historial de Temporadas</Text>
            </View>

            {historialEquipos.map((eq, i) => (
              <View key={eq.asignacion_id || i} style={styles.historialFila}>
                <View style={styles.historialInfo}>
                  <Text style={styles.historialEquipo}>{eq.equipo_nombre}</Text>
                  <Text style={styles.historialCategoria}>{eq.categoria_nombre}</Text>
                </View>
                <View style={styles.historialTemporada}>
                  <Text style={styles.historialTemporadaTexto}>Temp. {eq.temporada}</Text>
                  {eq.numero_camiseta && (
                    <Text style={styles.historialDorsal}>Dorsal #{eq.numero_camiseta}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Botón de Baja Lógica del Atleta */}
        <TouchableOpacity
          style={styles.botonDarBaja}
          onPress={confirmarBaja}
          activeOpacity={0.7}
        >
          <Trash2 size={16} color={COLORES.danger} />
          <Text style={styles.botonDarBajaTexto}>Dar de Baja Ficha del Atleta</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de Asignación / Cambio de Equipo */}
      <Modal
        visible={modalEquipoVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalEquipoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContenedor}>
            <View style={styles.modalCabecera}>
              <View style={styles.modalTituloFila}>
                <ShieldCheck size={20} color={COLORES.brandPrimary} />
                <Text style={styles.modalTitulo}>Asignar Plantel Deportivo</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalEquipoVisible(false)}
                style={styles.modalCerrar}
              >
                <X size={18} color={COLORES.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>Seleccionar Equipo</Text>
              {equiposDisponibles.length === 0 ? (
                <Text style={styles.modalTextoMuted}>No hay equipos registrados en la academia.</Text>
              ) : (
                <View style={styles.chipsEquiposFila}>
                  {equiposDisponibles.map((eq) => {
                    const seleccionado = equipoSeleccionado === eq.id;
                    return (
                      <TouchableOpacity
                        key={eq.id}
                        style={[styles.chipEquipoModal, seleccionado && styles.chipEquipoModalActivo]}
                        onPress={() => setEquipoSeleccionado(eq.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipEquipoModalTexto, seleccionado && styles.chipEquipoModalTextoActivo]}>
                          {eq.nombre} ({eq.categoria_nombre})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <Text style={styles.modalLabel}>Número de Dorsal / Camiseta</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ej: 10"
                placeholderTextColor={COLORES.textMuted}
                value={dorsalInput}
                onChangeText={setDorsalInput}
                keyboardType="numeric"
                maxLength={3}
              />

              <Text style={styles.modalLabel}>Posición en Cancha</Text>
              <View style={styles.chipsPosicionFila}>
                {['Portero', 'Defensa', 'Mediocampista', 'Delantero'].map((pos) => {
                  const activa = posicionInput === pos;
                  return (
                    <TouchableOpacity
                      key={pos}
                      style={[styles.chipPosicionModal, activa && styles.chipPosicionModalActivo]}
                      onPress={() => setPosicionInput(pos)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipPosicionModalTexto, activa && styles.chipPosicionModalTextoActivo]}>
                        {pos}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.modalBotonesFila}>
                <TouchableOpacity
                  style={styles.modalBotonCancelar}
                  onPress={() => setModalEquipoVisible(false)}
                  disabled={guardandoEquipo}
                >
                  <Text style={styles.modalBotonCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBotonGuardar, guardandoEquipo && styles.botonDeshabilitado]}
                  onPress={guardarAsignacionEquipo}
                  disabled={guardandoEquipo}
                >
                  {guardandoEquipo ? (
                    <ActivityIndicator size="small" color={COLORES.textOnBrand} />
                  ) : (
                    <Text style={styles.modalBotonGuardarTexto}>Confirmar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Desacoplado de Feedback y Confirmación */}
      <FichAppModalFeedback
        visible={modalFeedback.visible}
        tipo={modalFeedback.tipo}
        titulo={modalFeedback.titulo}
        mensaje={modalFeedback.mensaje}
        textoConfirmar={modalFeedback.textoConfirmar}
        textoCancelar={modalFeedback.textoCancelar}
        onConfirmar={modalFeedback.onConfirmar}
        onCancelar={modalFeedback.onCancelar}
        cargando={modalFeedback.cargando}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.surfaceBackground,
  },
  cabeceraMin: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ESPACIADO.space5,
    paddingVertical: ESPACIADO.space3,
    backgroundColor: COLORES.surfaceBackground,
    gap: ESPACIADO.space3,
  },
  botonVolver: {
    width: 38,
    height: 38,
    borderRadius: RADIOS.md,
    backgroundColor: COLORES.surfaceDefault,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tituloMin: {
    ...TIPOGRAFIA.heading3,
    color: COLORES.textPrimary,
    flex: 1,
  },
  scroll: {
    paddingHorizontal: ESPACIADO.space5,
    paddingBottom: ESPACIADO.space8,
    gap: ESPACIADO.space4,
  },
  tarjetaPerfil: {
    backgroundColor: COLORES.surfaceDefault,
    borderRadius: RADIOS.xl,
    padding: ESPACIADO.space5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    ...SOMBRAS.sutil,
  },
  avatarGrande: {
    width: 72,
    height: 72,
    borderRadius: RADIOS.full,
    backgroundColor: COLORES.brandPrimarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ESPACIADO.space3,
  },
  avatarGrandeTexto: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORES.brandPrimary,
    letterSpacing: 1,
  },
  nombreCompleto: {
    ...TIPOGRAFIA.heading2,
    color: COLORES.textPrimary,
    textAlign: 'center',
    marginBottom: ESPACIADO.space2,
  },
  etiquetasFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.space2,
    marginBottom: ESPACIADO.space2,
  },
  badgeCedula: {
    backgroundColor: COLORES.surfaceSubtle,
    paddingHorizontal: ESPACIADO.space3,
    paddingVertical: 3,
    borderRadius: RADIOS.sm,
  },
  badgeCedulaTexto: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    fontWeight: '600',
  },
  badgeEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: ESPACIADO.space2,
    paddingVertical: 3,
    borderRadius: RADIOS.sm,
  },
  badgeActivo: {
    backgroundColor: COLORES.successBg,
  },
  badgeInactivo: {
    backgroundColor: COLORES.warningBg,
  },
  badgeEstadoTexto: {
    fontSize: 10,
    fontWeight: '700',
  },
  dorsalDestacado: {
    backgroundColor: COLORES.brandAccentSubtle,
    paddingHorizontal: ESPACIADO.space3,
    paddingVertical: 3,
    borderRadius: RADIOS.sm,
    marginTop: ESPACIADO.space1,
  },
  dorsalDestacadoTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORES.brandAccentDark,
    letterSpacing: 0.5,
  },
  seccionCard: {
    backgroundColor: COLORES.surfaceDefault,
    borderRadius: RADIOS.lg,
    padding: ESPACIADO.space4,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    ...SOMBRAS.sutil,
  },
  seccionCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.space2,
    marginBottom: ESPACIADO.space3,
    paddingBottom: ESPACIADO.space2,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borderSubtle,
  },
  seccionTitulo: {
    ...TIPOGRAFIA.heading3,
    color: COLORES.textPrimary,
    fontSize: 15,
  },
  campoFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  campoLabel: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
  },
  campoValor: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textPrimary,
    fontWeight: '600',
  },
  campoBloque: {
    paddingVertical: 6,
  },
  campoValorMuted: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  campoValorTexto: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textPrimary,
    marginTop: 4,
    lineHeight: 18,
  },
  tagSangre: {
    backgroundColor: COLORES.dangerBg,
    paddingHorizontal: ESPACIADO.space2,
    paddingVertical: 2,
    borderRadius: RADIOS.sm,
  },
  tagSangreTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORES.danger,
  },
  tagsContenedor: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  tagAlergia: {
    backgroundColor: COLORES.warningBg,
    paddingHorizontal: ESPACIADO.space2,
    paddingVertical: 3,
    borderRadius: RADIOS.sm,
  },
  tagAlergiaTexto: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORES.warning,
  },
  tutorCard: {
    paddingVertical: ESPACIADO.space2,
  },
  tutorCardSeparador: {
    borderTopWidth: 1,
    borderTopColor: COLORES.borderSubtle,
    marginTop: ESPACIADO.space2,
    paddingTop: ESPACIADO.space3,
  },
  tutorCabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  tutorNombre: {
    ...TIPOGRAFIA.bodyMedium,
    color: COLORES.textPrimary,
    fontWeight: '600',
  },
  badgeRelacion: {
    backgroundColor: COLORES.brandPrimarySubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIOS.sm,
  },
  badgeRelacionTexto: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORES.brandPrimary,
  },
  tutorCedula: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    marginBottom: ESPACIADO.space2,
  },
  tutorAcciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ESPACIADO.space2,
    marginTop: 4,
  },
  botonContacto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORES.surfaceSubtle,
    paddingHorizontal: ESPACIADO.space3,
    paddingVertical: 6,
    borderRadius: RADIOS.md,
  },
  botonContactoTexto: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.brandPrimary,
    fontWeight: '600',
  },
  filaDireccion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: ESPACIADO.space2,
  },
  direccionTexto: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textMuted,
    flex: 1,
    lineHeight: 16,
  },
  historialFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ESPACIADO.space2,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borderSubtle,
  },
  historialInfo: {
    flex: 1,
  },
  historialEquipo: {
    ...TIPOGRAFIA.bodyMedium,
    color: COLORES.textPrimary,
    fontWeight: '600',
  },
  historialCategoria: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
  },
  historialTemporada: {
    alignItems: 'flex-end',
  },
  historialTemporadaTexto: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.brandPrimary,
    fontWeight: '600',
  },
  historialDorsal: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textMuted,
    fontSize: 11,
  },
  estadoCentrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ESPACIADO.space6,
  },
  textoCarga: {
    ...TIPOGRAFIA.bodyMedium,
    color: COLORES.textSecondary,
    marginTop: ESPACIADO.space3,
  },
  iconoAlerta: {
    width: 60,
    height: 60,
    borderRadius: RADIOS.full,
    backgroundColor: COLORES.dangerBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ESPACIADO.space3,
  },
  tituloEstado: {
    ...TIPOGRAFIA.heading3,
    color: COLORES.textPrimary,
    marginBottom: ESPACIADO.space2,
    textAlign: 'center',
  },
  descripcionEstado: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    textAlign: 'center',
    marginBottom: ESPACIADO.space5,
    lineHeight: 18,
  },
  botonReintentar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.space2,
    backgroundColor: COLORES.brandPrimary,
    paddingHorizontal: ESPACIADO.space5,
    paddingVertical: ESPACIADO.space3,
    borderRadius: RADIOS.md,
  },
  botonReintentarTexto: {
    ...TIPOGRAFIA.bodyMedium,
    color: COLORES.textOnBrand,
    fontWeight: '600',
  },
  botonAsignarEquipo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ESPACIADO.space2,
    backgroundColor: COLORES.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORES.brandPrimarySubtle,
    paddingVertical: ESPACIADO.space2,
    paddingHorizontal: ESPACIADO.space4,
    borderRadius: RADIOS.md,
    marginTop: ESPACIADO.space3,
    width: '100%',
  },
  botonAsignarEquipoTexto: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.brandPrimary,
    fontWeight: '700',
  },
  botonDarBaja: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ESPACIADO.space2,
    backgroundColor: COLORES.surfaceDefault,
    borderWidth: 1,
    borderColor: COLORES.danger,
    paddingVertical: ESPACIADO.space3,
    paddingHorizontal: ESPACIADO.space4,
    borderRadius: RADIOS.md,
    marginTop: ESPACIADO.space2,
  },
  botonDarBajaTexto: {
    ...TIPOGRAFIA.bodyMedium,
    color: COLORES.danger,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContenedor: {
    backgroundColor: COLORES.surfaceDefault,
    borderTopLeftRadius: RADIOS.xl,
    borderTopRightRadius: RADIOS.xl,
    padding: ESPACIADO.space5,
    maxHeight: '80%',
    ...SOMBRAS.elevada,
  },
  modalCabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ESPACIADO.space4,
    paddingBottom: ESPACIADO.space3,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borderSubtle,
  },
  modalTituloFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.space2,
  },
  modalTitulo: {
    ...TIPOGRAFIA.heading3,
    color: COLORES.textPrimary,
  },
  modalCerrar: {
    padding: ESPACIADO.space1,
  },
  modalLabel: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    fontWeight: '700',
    marginTop: ESPACIADO.space3,
    marginBottom: ESPACIADO.space2,
  },
  modalTextoMuted: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textMuted,
    fontStyle: 'italic',
  },
  chipsEquiposFila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ESPACIADO.space2,
    marginBottom: ESPACIADO.space2,
  },
  chipEquipoModal: {
    paddingHorizontal: ESPACIADO.space3,
    paddingVertical: ESPACIADO.space2,
    borderRadius: RADIOS.md,
    backgroundColor: COLORES.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
  },
  chipEquipoModalActivo: {
    backgroundColor: COLORES.brandPrimarySubtle,
    borderColor: COLORES.brandPrimary,
  },
  chipEquipoModalTexto: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    fontWeight: '500',
  },
  chipEquipoModalTextoActivo: {
    color: COLORES.brandPrimary,
    fontWeight: '700',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    borderRadius: RADIOS.md,
    paddingHorizontal: ESPACIADO.space4,
    paddingVertical: ESPACIADO.space3,
    ...TIPOGRAFIA.bodyMedium,
    color: COLORES.textPrimary,
    backgroundColor: COLORES.surfaceDefault,
  },
  chipsPosicionFila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ESPACIADO.space2,
    marginBottom: ESPACIADO.space4,
  },
  chipPosicionModal: {
    paddingHorizontal: ESPACIADO.space3,
    paddingVertical: ESPACIADO.space2,
    borderRadius: RADIOS.md,
    backgroundColor: COLORES.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
  },
  chipPosicionModalActivo: {
    backgroundColor: COLORES.brandAccentSubtle,
    borderColor: COLORES.brandAccent,
  },
  chipPosicionModalTexto: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    fontWeight: '500',
  },
  chipPosicionModalTextoActivo: {
    color: COLORES.brandAccentDark,
    fontWeight: '700',
  },
  modalBotonesFila: {
    flexDirection: 'row',
    gap: ESPACIADO.space3,
    marginTop: ESPACIADO.space4,
    paddingBottom: ESPACIADO.space4,
  },
  modalBotonCancelar: {
    flex: 1,
    paddingVertical: ESPACIADO.space3,
    borderRadius: RADIOS.md,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBotonCancelarTexto: {
    ...TIPOGRAFIA.bodyMedium,
    color: COLORES.textSecondary,
    fontWeight: '600',
  },
  modalBotonGuardar: {
    flex: 2,
    paddingVertical: ESPACIADO.space3,
    borderRadius: RADIOS.md,
    backgroundColor: COLORES.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBotonGuardarTexto: {
    ...TIPOGRAFIA.bodyMedium,
    color: COLORES.textOnBrand,
    fontWeight: '700',
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
});
