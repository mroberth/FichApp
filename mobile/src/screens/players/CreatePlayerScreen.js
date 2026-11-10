import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  User,
  Shield,
  HeartPulse,
  Users,
  Save,
  Phone,
  Mail,
  CreditCard,
  Calendar,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { obtenerToken } from '../../services/storage';
import { FichAppInput, FichAppModalFeedback } from '../../components';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA, SOMBRAS } from '../../theme';

const TIPOS_SANGRE = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const POSICIONES = ['Portero', 'Defensa', 'Mediocampista', 'Delantero'];
const PARENTESCOS = [
  { clave: 'padre', etiqueta: 'Padre' },
  { clave: 'madre', etiqueta: 'Madre' },
  { clave: 'representante_legal', etiqueta: 'Tutor Legal' },
];

export default function CreatePlayerScreen({ navigation }) {
  const { token: tokenContext } = useAuth();

  // Estados del formulario - Atleta
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [cedula, setCedula] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [sexo, setSexo] = useState('M');

  // Ficha médica
  const [tipoSangre, setTipoSangre] = useState('O+');
  const [alergiasTexto, setAlergiasTexto] = useState('');
  const [observacionesMedicas, setObservacionesMedicas] = useState('');

  // Tutor / Representante
  const [modoTutor, setModoTutor] = useState('nuevo'); // 'nuevo' | 'existente'
  const [tutorNombres, setTutorNombres] = useState('');
  const [tutorApellidos, setTutorApellidos] = useState('');
  const [tutorTelefono, setTutorTelefono] = useState('');
  const [tutorCedula, setTutorCedula] = useState('');
  const [tutorCorreo, setTutorCorreo] = useState('');
  const [tipoRelacion, setTipoRelacion] = useState('padre');

  // Asignación de equipo
  const [equipos, setEquipos] = useState([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [numeroCamiseta, setNumeroCamiseta] = useState('');
  const [posicion, setPosicion] = useState('Mediocampista');

  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState({});
  const [modalFeedback, setModalFeedback] = useState({
    visible: false,
    tipo: 'exito',
    titulo: '',
    mensaje: '',
    onConfirmar: null,
  });

  // Cargar equipos disponibles
  useEffect(() => {
    const cargarEquipos = async () => {
      try {
        const token = tokenContext || (await obtenerToken());
        if (token) {
          const lista = await apiService.listarEquipos(token);
          setEquipos(Array.isArray(lista) ? lista : []);
        }
      } catch (err) {
        console.warn('Error cargando equipos:', err.message);
      }
    };
    cargarEquipos();
  }, [tokenContext]);

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!nombres.trim()) {
      nuevosErrores.nombres = 'Ingresa los nombres del atleta.';
    }
    if (!apellidos.trim()) {
      nuevosErrores.apellidos = 'Ingresa los apellidos del atleta.';
    }

    if (fechaNacimiento.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento.trim())) {
      nuevosErrores.fechaNacimiento = 'Formato inválido. Debe ser AAAA-MM-DD (ej: 2015-05-14).';
    }

    if (modoTutor === 'nuevo') {
      if (!tutorNombres.trim()) {
        nuevosErrores.tutorNombres = 'Ingresa los nombres del representante.';
      }
      if (!tutorApellidos.trim()) {
        nuevosErrores.tutorApellidos = 'Ingresa los apellidos del representante.';
      }
      if (!tutorTelefono.trim()) {
        nuevosErrores.tutorTelefono = 'Ingresa el teléfono de contacto.';
      }
    } else {
      if (!tutorCedula.trim()) {
        nuevosErrores.tutorCedula = 'Ingresa la cédula del tutor existente para vincularlo.';
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const validarYGuardar = async () => {
    if (!validarFormulario()) {
      return;
    }

    setGuardando(true);

    try {
      const token = tokenContext || (await obtenerToken());
      if (!token) {
        setModalFeedback({
          visible: true,
          tipo: 'error',
          titulo: 'Sesión Expirada',
          mensaje: 'No hay una sesión activa. Vuelve a iniciar sesión.',
          onConfirmar: () => setModalFeedback((prev) => ({ ...prev, visible: false })),
        });
        setGuardando(false);
        return;
      }

      // Procesar alergias como array
      const alergiasArray = alergiasTexto
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      const payload = {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        cedula: cedula.trim() ? cedula.trim().toUpperCase() : null,
        fecha_nacimiento: fechaNacimiento.trim() || null,
        sexo: sexo,
        ficha_medica: {
          tipo_sangre: tipoSangre,
          alergias: alergiasArray,
          observaciones: observacionesMedicas.trim() || null,
        },
        tipo_relacion: tipoRelacion,
        es_contacto_principal: true,
      };

      if (modoTutor === 'nuevo') {
        payload.representante = {
          nombres: tutorNombres.trim(),
          apellidos: tutorApellidos.trim(),
          telefono: tutorTelefono.trim(),
          cedula: tutorCedula.trim() ? tutorCedula.trim().toUpperCase() : null,
          correo: tutorCorreo.trim() || null,
        };
      } else {
        payload.representante = {
          cedula: tutorCedula.trim().toUpperCase(),
          telefono: '+58 000 0000000',
          nombres: 'Tutor',
          apellidos: 'Existente',
        };
      }

      if (equipoSeleccionado) {
        payload.equipo_id = equipoSeleccionado;
        payload.temporada = '2026';
        if (numeroCamiseta.trim() !== '') {
          payload.numero_camiseta = parseInt(numeroCamiseta.trim(), 10);
        }
        if (posicion) {
          payload.posicion = posicion;
        }
      }

      await apiService.registrarJugador(token, payload);

      setModalFeedback({
        visible: true,
        tipo: 'exito',
        titulo: '¡Inscripción Exitosa!',
        mensaje: `El atleta ${nombres.trim()} ${apellidos.trim()} ha sido registrado correctamente en la academia deportiva.`,
        onConfirmar: () => {
          setModalFeedback((prev) => ({ ...prev, visible: false }));
          navigation.goBack();
        },
      });
    } catch (err) {
      // Mapear errores específicos del backend inline si vienen en error.detalles
      if (err.detalles && typeof err.detalles === 'object') {
        setErrores((prev) => ({ ...prev, ...err.detalles }));
      }

      setModalFeedback({
        visible: true,
        tipo: 'error',
        titulo: 'Error al Registrar',
        mensaje: err.message || 'No se pudo guardar la ficha deportiva.',
        onConfirmar: () => setModalFeedback((prev) => ({ ...prev, visible: false })),
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORES.surfaceBackground} />

      {/* Cabecera */}
      <View style={styles.cabecera}>
        <TouchableOpacity style={styles.botonVolver} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={COLORES.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.tituloCabecera}>Inscribir Nuevo Atleta</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* SECCIÓN 1: DATOS PERSONALES */}
          <View style={styles.tarjeta}>
            <View style={styles.tarjetaCabecera}>
              <User size={18} color={COLORES.brandPrimary} />
              <Text style={styles.tarjetaTitulo}>Datos del Atleta</Text>
            </View>

            <FichAppInput
              label="Nombres *"
              placeholder="Ej: Daniel Alejandro"
              value={nombres}
              onChangeText={(t) => {
                setErrores((prev) => ({ ...prev, nombres: null }));
                setNombres(t);
              }}
              error={errores.nombres}
              iconoIzquierdo={User}
            />

            <FichAppInput
              label="Apellidos *"
              placeholder="Ej: Colmenárez"
              value={apellidos}
              onChangeText={(t) => {
                setErrores((prev) => ({ ...prev, apellidos: null }));
                setApellidos(t);
              }}
              error={errores.apellidos}
              iconoIzquierdo={User}
            />

            <View style={styles.filaDoble}>
              <View style={styles.columnaMedia}>
                <FichAppInput
                  label="Cédula (opcional)"
                  placeholder="V-35111222"
                  value={cedula}
                  onChangeText={(t) => {
                    setErrores((prev) => ({ ...prev, cedula: null }));
                    setCedula(t);
                  }}
                  error={errores.cedula}
                  iconoIzquierdo={CreditCard}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.columnaMedia}>
                <FichAppInput
                  label="Nacimiento *"
                  placeholder="AAAA-MM-DD"
                  value={fechaNacimiento}
                  onChangeText={(t) => {
                    setErrores((prev) => ({ ...prev, fechaNacimiento: null }));
                    setFechaNacimiento(t);
                  }}
                  error={errores.fechaNacimiento}
                  iconoIzquierdo={Calendar}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.label}>Sexo</Text>
            <View style={styles.chipsFila}>
              <TouchableOpacity
                style={[styles.chipOpcion, sexo === 'M' && styles.chipOpcionActivo]}
                onPress={() => setSexo('M')}
              >
                <Text style={[styles.chipOpcionTexto, sexo === 'M' && styles.chipOpcionTextoActivo]}>Masculino</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chipOpcion, sexo === 'F' && styles.chipOpcionActivo]}
                onPress={() => setSexo('F')}
              >
                <Text style={[styles.chipOpcionTexto, sexo === 'F' && styles.chipOpcionTextoActivo]}>Femenino</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* SECCIÓN 2: TUTOR / REPRESENTANTE */}
          <View style={styles.tarjeta}>
            <View style={styles.tarjetaCabecera}>
              <Users size={18} color={COLORES.brandPrimary} />
              <Text style={styles.tarjetaTitulo}>Representante Legal</Text>
            </View>

            {/* Selector de modo */}
            <View style={styles.toggleModo}>
              <TouchableOpacity
                style={[styles.toggleBtn, modoTutor === 'nuevo' && styles.toggleBtnActivo]}
                onPress={() => {
                  setErrores({});
                  setModoTutor('nuevo');
                }}
              >
                <Text style={[styles.toggleBtnTexto, modoTutor === 'nuevo' && styles.toggleBtnTextoActivo]}>
                  Nuevo Representante
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, modoTutor === 'existente' && styles.toggleBtnActivo]}
                onPress={() => {
                  setErrores({});
                  setModoTutor('existente');
                }}
              >
                <Text style={[styles.toggleBtnTexto, modoTutor === 'existente' && styles.toggleBtnTextoActivo]}>
                  Cédula Existente
                </Text>
              </TouchableOpacity>
            </View>

            {modoTutor === 'nuevo' ? (
              <>
                <FichAppInput
                  label="Nombres del Tutor *"
                  placeholder="Ej: José Manuel"
                  value={tutorNombres}
                  onChangeText={(t) => {
                    setErrores((prev) => ({ ...prev, tutorNombres: null }));
                    setTutorNombres(t);
                  }}
                  error={errores.tutorNombres}
                  iconoIzquierdo={User}
                />

                <FichAppInput
                  label="Apellidos del Tutor *"
                  placeholder="Ej: Colmenárez"
                  value={tutorApellidos}
                  onChangeText={(t) => {
                    setErrores((prev) => ({ ...prev, tutorApellidos: null }));
                    setTutorApellidos(t);
                  }}
                  error={errores.tutorApellidos}
                  iconoIzquierdo={User}
                />

                <View style={styles.filaDoble}>
                  <View style={styles.columnaMedia}>
                    <FichAppInput
                      label="Teléfono de Contacto *"
                      placeholder="+58 412 1234567"
                      value={tutorTelefono}
                      onChangeText={(t) => {
                        setErrores((prev) => ({ ...prev, tutorTelefono: null }));
                        setTutorTelefono(t);
                      }}
                      error={errores.tutorTelefono}
                      iconoIzquierdo={Phone}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.columnaMedia}>
                    <FichAppInput
                      label="Cédula Tutor"
                      placeholder="V-14555666"
                      value={tutorCedula}
                      onChangeText={(t) => {
                        setErrores((prev) => ({ ...prev, tutorCedula: null }));
                        setTutorCedula(t);
                      }}
                      error={errores.tutorCedula}
                      iconoIzquierdo={CreditCard}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <FichAppInput
                  label="Correo Electrónico"
                  placeholder="jose.colmenarez@example.com"
                  value={tutorCorreo}
                  onChangeText={setTutorCorreo}
                  error={errores.tutorCorreo}
                  iconoIzquierdo={Mail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </>
            ) : (
              <>
                <FichAppInput
                  label="Cédula del Tutor Registrado *"
                  placeholder="Ej: V-14234567"
                  value={tutorCedula}
                  onChangeText={(t) => {
                    setErrores((prev) => ({ ...prev, tutorCedula: null }));
                    setTutorCedula(t);
                  }}
                  error={errores.tutorCedula}
                  iconoIzquierdo={CreditCard}
                  autoCapitalize="characters"
                />
                <Text style={styles.ayudaTexto}>
                  Si el padre ya tiene otros atletas en la academia, ingresa su cédula para vincular a los hermanos en la misma familia.
                </Text>
              </>
            )}

            <Text style={styles.label}>Parentesco / Relación</Text>
            <View style={styles.chipsFila}>
              {PARENTESCOS.map((p) => (
                <TouchableOpacity
                  key={p.clave}
                  style={[styles.chipOpcion, tipoRelacion === p.clave && styles.chipOpcionActivo]}
                  onPress={() => setTipoRelacion(p.clave)}
                >
                  <Text style={[styles.chipOpcionTexto, tipoRelacion === p.clave && styles.chipOpcionTextoActivo]}>
                    {p.etiqueta}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* SECCIÓN 3: FICHA MÉDICA */}
          <View style={styles.tarjeta}>
            <View style={styles.tarjetaCabecera}>
              <HeartPulse size={18} color={COLORES.danger} />
              <Text style={styles.tarjetaTitulo}>Ficha Médica</Text>
            </View>

            <Text style={styles.label}>Grupo Sanguíneo</Text>
            <View style={styles.chipsFila}>
              {TIPOS_SANGRE.map((ts) => (
                <TouchableOpacity
                  key={ts}
                  style={[styles.chipPequeno, tipoSangre === ts && styles.chipPequenoActivo]}
                  onPress={() => setTipoSangre(ts)}
                >
                  <Text style={[styles.chipPequenoTexto, tipoSangre === ts && styles.chipPequenoTextoActivo]}>
                    {ts}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <FichAppInput
              label="Alergias (separadas por comas)"
              placeholder="Ej: Penicilina, Ibuprofeno, Polen"
              value={alergiasTexto}
              onChangeText={setAlergiasTexto}
            />

            <FichAppInput
              label="Observaciones Médicas"
              placeholder="Afecciones, recomendaciones para cancha..."
              value={observacionesMedicas}
              onChangeText={setObservacionesMedicas}
              multilinea
              numberOfLines={3}
            />
          </View>

          {/* SECCIÓN 4: ASIGNACIÓN A EQUIPO */}
          <View style={styles.tarjeta}>
            <View style={styles.tarjetaCabecera}>
              <Shield size={18} color={COLORES.brandPrimary} />
              <Text style={styles.tarjetaTitulo}>Plantel Deportivo (Opcional)</Text>
            </View>

            <Text style={styles.label}>Seleccionar Equipo</Text>
            <View style={styles.chipsFila}>
              <TouchableOpacity
                style={[styles.chipEquipo, equipoSeleccionado === null && styles.chipEquipoActivo]}
                onPress={() => setEquipoSeleccionado(null)}
              >
                <Text style={[styles.chipEquipoTexto, equipoSeleccionado === null && styles.chipEquipoTextoActivo]}>
                  Sin equipo por ahora
                </Text>
              </TouchableOpacity>

              {equipos.map((eq) => (
                <TouchableOpacity
                  key={eq.id}
                  style={[styles.chipEquipo, equipoSeleccionado === eq.id && styles.chipEquipoActivo]}
                  onPress={() => setEquipoSeleccionado(eq.id)}
                >
                  <Text style={[styles.chipEquipoTexto, equipoSeleccionado === eq.id && styles.chipEquipoTextoActivo]}>
                    {eq.nombre} ({eq.categoria_nombre})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {equipoSeleccionado && (
              <>
                <View style={styles.filaDoble}>
                  <View style={styles.columnaMedia}>
                    <FichAppInput
                      label="Número de Camiseta"
                      placeholder="Ej: 10"
                      value={numeroCamiseta}
                      onChangeText={setNumeroCamiseta}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                  </View>
                  <View style={styles.columnaMedia}>
                    <FichAppInput
                      label="Temporada"
                      value="2026"
                      editable={false}
                    />
                  </View>
                </View>

                <Text style={styles.label}>Posición Habitual</Text>
                <View style={styles.chipsFila}>
                  {POSICIONES.map((pos) => (
                    <TouchableOpacity
                      key={pos}
                      style={[styles.chipOpcion, posicion === pos && styles.chipOpcionActivo]}
                      onPress={() => setPosicion(pos)}
                    >
                      <Text style={[styles.chipOpcionTexto, posicion === pos && styles.chipOpcionTextoActivo]}>
                        {pos}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* BOTÓN GUARDAR */}
          <TouchableOpacity
            style={[styles.botonGuardar, guardando && styles.botonDeshabilitado]}
            onPress={validarYGuardar}
            disabled={guardando}
            activeOpacity={0.8}
          >
            {guardando ? (
              <ActivityIndicator size="small" color={COLORES.textOnBrand} />
            ) : (
              <>
                <Save size={18} color={COLORES.textOnBrand} />
                <Text style={styles.botonGuardarTexto}>Registrar Ficha Deportiva</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Desacoplado de Feedback y Confirmación */}
      <FichAppModalFeedback
        visible={modalFeedback.visible}
        tipo={modalFeedback.tipo}
        titulo={modalFeedback.titulo}
        mensaje={modalFeedback.mensaje}
        onConfirmar={modalFeedback.onConfirmar}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.surfaceBackground,
  },
  keyboardView: {
    flex: 1,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ESPACIADO.space5,
    paddingVertical: ESPACIADO.space3,
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
  tituloCabecera: {
    ...TIPOGRAFIA.heading3,
    color: COLORES.textPrimary,
  },
  scroll: {
    paddingHorizontal: ESPACIADO.space5,
    paddingBottom: ESPACIADO.space8,
    gap: ESPACIADO.space4,
  },
  tarjeta: {
    backgroundColor: COLORES.surfaceDefault,
    borderRadius: RADIOS.lg,
    padding: ESPACIADO.space4,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    ...SOMBRAS.sutil,
  },
  tarjetaCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.space2,
    marginBottom: ESPACIADO.space3,
    paddingBottom: ESPACIADO.space2,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borderSubtle,
  },
  tarjetaTitulo: {
    ...TIPOGRAFIA.heading3,
    fontSize: 15,
    color: COLORES.textPrimary,
  },
  label: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: ESPACIADO.space2,
  },
  input: {
    backgroundColor: COLORES.surfaceBackground,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    borderRadius: RADIOS.md,
    paddingHorizontal: ESPACIADO.space3,
    paddingVertical: ESPACIADO.space2,
    ...TIPOGRAFIA.body,
    color: COLORES.textPrimary,
    minHeight: 42,
  },
  inputMultilinea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  inputBloqueado: {
    backgroundColor: COLORES.surfaceSubtle,
    color: COLORES.textMuted,
  },
  filaDoble: {
    flexDirection: 'row',
    gap: ESPACIADO.space3,
  },
  columnaMedia: {
    flex: 1,
  },
  chipsFila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ESPACIADO.space2,
    marginTop: 4,
  },
  chipOpcion: {
    paddingHorizontal: ESPACIADO.space3,
    paddingVertical: 7,
    borderRadius: RADIOS.md,
    backgroundColor: COLORES.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
  },
  chipOpcionActivo: {
    backgroundColor: COLORES.brandPrimary,
    borderColor: COLORES.brandPrimary,
  },
  chipOpcionTexto: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    fontWeight: '500',
  },
  chipOpcionTextoActivo: {
    color: COLORES.textOnBrand,
    fontWeight: '600',
  },
  chipPequeno: {
    paddingHorizontal: ESPACIADO.space2,
    paddingVertical: 5,
    borderRadius: RADIOS.sm,
    backgroundColor: COLORES.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    minWidth: 36,
    alignItems: 'center',
  },
  chipPequenoActivo: {
    backgroundColor: COLORES.danger,
    borderColor: COLORES.danger,
  },
  chipPequenoTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORES.textSecondary,
  },
  chipPequenoTextoActivo: {
    color: COLORES.textOnBrand,
  },
  chipEquipo: {
    paddingHorizontal: ESPACIADO.space3,
    paddingVertical: 8,
    borderRadius: RADIOS.md,
    backgroundColor: COLORES.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
  },
  chipEquipoActivo: {
    backgroundColor: COLORES.brandPrimary,
    borderColor: COLORES.brandPrimary,
  },
  chipEquipoTexto: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    fontWeight: '500',
  },
  chipEquipoTextoActivo: {
    color: COLORES.textOnBrand,
    fontWeight: '600',
  },
  toggleModo: {
    flexDirection: 'row',
    backgroundColor: COLORES.surfaceSubtle,
    borderRadius: RADIOS.md,
    padding: 3,
    marginBottom: ESPACIADO.space2,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: RADIOS.sm,
  },
  toggleBtnActivo: {
    backgroundColor: COLORES.surfaceDefault,
    ...SOMBRAS.sutil,
  },
  toggleBtnTexto: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textMuted,
    fontWeight: '500',
  },
  toggleBtnTextoActivo: {
    color: COLORES.brandPrimary,
    fontWeight: '700',
  },
  ayudaTexto: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 16,
  },
  botonGuardar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ESPACIADO.space2,
    backgroundColor: COLORES.brandPrimary,
    borderRadius: RADIOS.md,
    paddingVertical: ESPACIADO.space4,
    marginTop: ESPACIADO.space2,
    ...SOMBRAS.sutil,
  },
  botonGuardarTexto: {
    ...TIPOGRAFIA.bodyMedium,
    color: COLORES.textOnBrand,
    fontWeight: '700',
    fontSize: 15,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
});
