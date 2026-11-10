import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Search,
  X,
  Users,
  ChevronRight,
  Shield,
  UserCheck,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  UserPlus,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { obtenerToken } from '../../services/storage';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA, SOMBRAS } from '../../theme';

export default function PlayerDirectoryScreen({ navigation }) {
  const { token: tokenContext } = useAuth();

  const [jugadores, setJugadores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);
  const [totalJugadores, setTotalJugadores] = useState(0);

  // Obtener el token Bearer activo (desde contexto o almacenamiento seguro)
  const resolverToken = useCallback(async () => {
    return tokenContext || (await obtenerToken());
  }, [tokenContext]);

  // Cargar categorías iniciales para la barra de filtros
  const cargarCategorias = useCallback(async () => {
    try {
      const token = await resolverToken();
      if (!token) return;
      const datosCat = await apiService.listarCategorias(token);
      setCategorias(Array.isArray(datosCat) ? datosCat : []);
    } catch (err) {
      console.warn('Advertencia cargando categorías en móvil:', err.message);
    }
  }, [resolverToken]);

  // Cargar atletas aplicando filtros
  const cargarJugadores = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefrescando(true);
    } else {
      setCargando(true);
    }
    setError(null);

    try {
      const token = await resolverToken();
      if (!token) {
        setError('No se encontró una sesión activa. Por favor vuelve a iniciar sesión.');
        setCargando(false);
        setRefrescando(false);
        return;
      }

      const filtros = {};
      if (busqueda.trim() !== '') {
        filtros.busqueda = busqueda.trim();
      }
      if (categoriaSeleccionada) {
        filtros.categoria_id = categoriaSeleccionada;
      }

      const respuesta = await apiService.listarJugadores(token, filtros);
      const lista = respuesta?.items || (Array.isArray(respuesta) ? respuesta : []);
      setJugadores(lista);
      setTotalJugadores(respuesta?.total ?? lista.length);
    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor de FichApp.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [resolverToken, busqueda, categoriaSeleccionada]);

  // Recargar datos al enfocar la pantalla (ej. al volver de registrar un atleta)
  useFocusEffect(
    useCallback(() => {
      cargarCategorias();
      cargarJugadores();
    }, [cargarCategorias, cargarJugadores])
  );

  useEffect(() => {
    // Debounce sutil para la búsqueda
    const temporizador = setTimeout(() => {
      cargarJugadores();
    }, 300);
    return () => clearTimeout(temporizador);
  }, [cargarJugadores]);

  const onRefresh = () => {
    cargarCategorias();
    cargarJugadores(true);
  };

  const limpiarBusqueda = () => {
    setBusqueda('');
  };

  const seleccionarCategoria = (catId) => {
    setCategoriaSeleccionada((prev) => (prev === catId ? null : catId));
  };

  // Obtener iniciales para el avatar
  const obtenerIniciales = (nombres, apellidos) => {
    const n = nombres ? nombres.trim().charAt(0) : '';
    const a = apellidos ? apellidos.trim().charAt(0) : '';
    return `${n}${a}`.toUpperCase() || 'J';
  };

  // Renderizado de cada tarjeta de jugador
  const renderItemJugador = ({ item }) => {
    const iniciales = obtenerIniciales(item.nombres, item.apellidos);

    return (
      <TouchableOpacity
        style={styles.tarjetaJugador}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('PlayerDetail', { jugadorId: item.id, jugadorNombre: `${item.nombres} ${item.apellidos}` })}
      >
        {/* Avatar con iniciales */}
        <View style={styles.avatarContenedor}>
          <Text style={styles.avatarTexto}>{iniciales}</Text>
        </View>

        {/* Información Central */}
        <View style={styles.infoContenedor}>
          <View style={styles.filaNombre}>
            <Text style={styles.nombreTexto} numberOfLines={1}>
              {item.nombres} {item.apellidos}
            </Text>
            {item.numero_camiseta !== null && item.numero_camiseta !== undefined && (
              <View style={styles.dorsalBadge}>
                <Text style={styles.dorsalTexto}>#{item.numero_camiseta}</Text>
              </View>
            )}
          </View>

          {/* Categoría y Equipo */}
          <View style={styles.filaDeportiva}>
            <Shield size={13} color={COLORES.brandPrimary} />
            <Text style={styles.equipoTexto} numberOfLines={1}>
              {item.equipo_nombre || 'Sin equipo'}
              {item.categoria_nombre ? ` · ${item.categoria_nombre}` : ''}
            </Text>
          </View>

          {/* Posición y Representante */}
          <View style={styles.filaMetadatos}>
            {item.posicion && (
              <View style={styles.posicionBadge}>
                <Text style={styles.posicionTexto}>{item.posicion}</Text>
              </View>
            )}
            {item.representantes_nombres && (
              <View style={styles.filaTutor}>
                <UserCheck size={12} color={COLORES.textMuted} />
                <Text style={styles.tutorTexto} numberOfLines={1}>
                  {item.representantes_nombres}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Indicador de navegación */}
        <ChevronRight size={18} color={COLORES.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORES.surfaceBackground} />

      {/* Cabecera Superior */}
      <View style={styles.cabecera}>
        <TouchableOpacity
          style={styles.botonVolver}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Volver al panel"
        >
          <ArrowLeft size={20} color={COLORES.textPrimary} />
        </TouchableOpacity>

        <View style={styles.cabeceraTextoContenedor}>
          <Text style={styles.titulo}>Directorio de Jugadores</Text>
          <Text style={styles.subtitulo}>
            {cargando ? 'Consultando padrón...' : `${totalJugadores} atletas registrados`}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.botonInscribir}
          onPress={() => navigation.navigate('CreatePlayer')}
          activeOpacity={0.7}
        >
          <UserPlus size={16} color={COLORES.textOnBrand} />
          <Text style={styles.botonInscribirTexto}>Inscribir</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de Búsqueda Reactiva */}
      <View style={styles.contenedorBuscador}>
        <View style={styles.cajaInput}>
          <Search size={18} color={COLORES.textMuted} style={styles.iconoBuscador} />
          <TextInput
            style={styles.input}
            placeholder="Buscar por nombre, apellido o cédula..."
            placeholderTextColor={COLORES.textMuted}
            value={busqueda}
            onChangeText={setBusqueda}
            autoCorrect={false}
            returnKeyType="search"
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={limpiarBusqueda} style={styles.botonLimpiar}>
              <X size={16} color={COLORES.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros Horizontales por Categoría */}
      <View style={styles.contenedorFiltros}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: null, nombre: 'Todas' }, ...categorias]}
          keyExtractor={(item) => item.id || 'todas'}
          contentContainerStyle={styles.listaChips}
          renderItem={({ item }) => {
            const estaActivo = categoriaSeleccionada === item.id;
            return (
              <TouchableOpacity
                style={[styles.chip, estaActivo && styles.chipActivo]}
                onPress={() => seleccionarCategoria(item.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipTexto, estaActivo && styles.chipTextoActivo]}>
                  {item.nombre}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Estados de Interacción: Carga, Error, Vacío o Lista */}
      {cargando && !refrescando ? (
        <View style={styles.estadoCentrado}>
          <ActivityIndicator size="large" color={COLORES.brandPrimary} />
          <Text style={styles.textoEstado}>Cargando atletas de la academia...</Text>
        </View>
      ) : error ? (
        <View style={styles.estadoCentrado}>
          <View style={styles.iconoAlertaContenedor}>
            <AlertCircle size={32} color={COLORES.danger} />
          </View>
          <Text style={styles.tituloEstado}>Error al cargar jugadores</Text>
          <Text style={styles.descripcionEstado}>{error}</Text>
          <TouchableOpacity style={styles.botonReintentar} onPress={() => cargarJugadores()}>
            <RefreshCw size={16} color={COLORES.textOnBrand} />
            <Text style={styles.botonReintentarTexto}>Reintentar conexión</Text>
          </TouchableOpacity>
        </View>
      ) : jugadores.length === 0 ? (
        <View style={styles.estadoCentrado}>
          <View style={styles.iconoVacioContenedor}>
            <Users size={36} color={COLORES.brandPrimary} />
          </View>
          <Text style={styles.tituloEstado}>No se encontraron atletas</Text>
          <Text style={styles.descripcionEstado}>
            {busqueda || categoriaSeleccionada
              ? 'No hay jugadores que coincidan con los criterios de búsqueda aplicados.'
              : 'Aún no hay atletas registrados en esta academia deportiva.'}
          </Text>
          {(busqueda !== '' || categoriaSeleccionada !== null) && (
            <TouchableOpacity
              style={styles.botonLimpiarFiltros}
              onPress={() => {
                setBusqueda('');
                setCategoriaSeleccionada(null);
              }}
            >
              <Text style={styles.botonLimpiarFiltrosTexto}>Restablecer filtros</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={jugadores}
          keyExtractor={(item) => item.id}
          renderItem={renderItemJugador}
          contentContainerStyle={styles.listaJugadores}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={onRefresh}
              colors={[COLORES.brandPrimary]}
              tintColor={COLORES.brandPrimary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.surfaceBackground,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ESPACIADO.space5,
    paddingTop: ESPACIADO.space3,
    paddingBottom: ESPACIADO.space2,
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
  cabeceraTextoContenedor: {
    flex: 1,
  },
  botonInscribir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORES.brandPrimary,
    paddingHorizontal: ESPACIADO.space3,
    paddingVertical: ESPACIADO.space2,
    borderRadius: RADIOS.md,
    ...SOMBRAS.sutil,
  },
  botonInscribirTexto: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textOnBrand,
    fontWeight: '700',
  },
  titulo: {
    ...TIPOGRAFIA.heading3,
    color: COLORES.textPrimary,
  },
  subtitulo: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    marginTop: 1,
  },
  contenedorBuscador: {
    paddingHorizontal: ESPACIADO.space5,
    paddingVertical: ESPACIADO.space2,
  },
  cajaInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.surfaceDefault,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    borderRadius: RADIOS.md,
    paddingHorizontal: ESPACIADO.space3,
    height: 44,
  },
  iconoBuscador: {
    marginRight: ESPACIADO.space2,
  },
  input: {
    flex: 1,
    ...TIPOGRAFIA.body,
    color: COLORES.textPrimary,
    paddingVertical: 0,
  },
  botonLimpiar: {
    padding: ESPACIADO.space1,
  },
  contenedorFiltros: {
    paddingBottom: ESPACIADO.space2,
  },
  listaChips: {
    paddingHorizontal: ESPACIADO.space5,
    gap: ESPACIADO.space2,
  },
  chip: {
    paddingHorizontal: ESPACIADO.space3,
    paddingVertical: 6,
    borderRadius: RADIOS.full,
    backgroundColor: COLORES.surfaceDefault,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
  },
  chipActivo: {
    backgroundColor: COLORES.brandPrimary,
    borderColor: COLORES.brandPrimary,
  },
  chipTexto: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.textSecondary,
    fontWeight: '500',
  },
  chipTextoActivo: {
    color: COLORES.textOnBrand,
    fontWeight: '600',
  },
  listaJugadores: {
    paddingHorizontal: ESPACIADO.space5,
    paddingTop: ESPACIADO.space2,
    paddingBottom: ESPACIADO.space8,
    gap: ESPACIADO.space3,
  },
  tarjetaJugador: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.surfaceDefault,
    borderRadius: RADIOS.lg,
    padding: ESPACIADO.space4,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    gap: ESPACIADO.space3,
    ...SOMBRAS.sutil,
  },
  avatarContenedor: {
    width: 44,
    height: 44,
    borderRadius: RADIOS.full,
    backgroundColor: COLORES.brandPrimarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTexto: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORES.brandPrimary,
    letterSpacing: 0.5,
  },
  infoContenedor: {
    flex: 1,
  },
  filaNombre: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  nombreTexto: {
    ...TIPOGRAFIA.bodyMedium,
    color: COLORES.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  dorsalBadge: {
    backgroundColor: COLORES.brandAccentSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIOS.sm,
    marginLeft: ESPACIADO.space2,
  },
  dorsalTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORES.brandAccentDark,
  },
  filaDeportiva: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  equipoTexto: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.brandPrimary,
    fontWeight: '500',
    flex: 1,
  },
  filaMetadatos: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: ESPACIADO.space2,
  },
  posicionBadge: {
    backgroundColor: COLORES.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIOS.sm,
  },
  posicionTexto: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORES.textSecondary,
    textTransform: 'uppercase',
  },
  filaTutor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  tutorTexto: {
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
  textoEstado: {
    ...TIPOGRAFIA.bodyMedium,
    color: COLORES.textSecondary,
    marginTop: ESPACIADO.space3,
  },
  iconoAlertaContenedor: {
    width: 60,
    height: 60,
    borderRadius: RADIOS.full,
    backgroundColor: COLORES.dangerBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ESPACIADO.space3,
  },
  iconoVacioContenedor: {
    width: 64,
    height: 64,
    borderRadius: RADIOS.full,
    backgroundColor: COLORES.brandPrimarySubtle,
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
  botonLimpiarFiltros: {
    backgroundColor: COLORES.surfaceDefault,
    paddingHorizontal: ESPACIADO.space4,
    paddingVertical: ESPACIADO.space2,
    borderRadius: RADIOS.md,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
  },
  botonLimpiarFiltrosTexto: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.brandPrimary,
    fontWeight: '600',
  },
});
