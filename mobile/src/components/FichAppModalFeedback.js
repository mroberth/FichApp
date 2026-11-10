import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { AlertCircle, CheckCircle2, HelpCircle, X } from 'lucide-react-native';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA, SOMBRAS } from '../theme/tokens';

/**
 * FichAppModalFeedback — Modal de confirmación y feedback desacoplado de Alert.alert nativo.
 * 
 * Tipos:
 * - 'confirmacion': Pregunta con botón cancelar y confirmar (peligro o acción).
 * - 'exito': Mensaje de operación completada con botón de aceptar.
 * - 'error': Mensaje de error detallado con botón de cerrar.
 */
export default function FichAppModalFeedback({
  visible,
  tipo = 'confirmacion', // 'confirmacion' | 'exito' | 'error' | 'peligro'
  titulo,
  mensaje,
  textoConfirmar = 'Aceptar',
  textoCancelar = 'Cancelar',
  onConfirmar,
  onCancelar,
  cargando = false,
}) {
  if (!visible) return null;

  const esPeligro = tipo === 'peligro';
  const esExito = tipo === 'exito';
  const esError = tipo === 'error';

  const obtenerIcono = () => {
    if (esExito) {
      return <CheckCircle2 size={36} color={COLORES.success} strokeWidth={2.2} />;
    }
    if (esError || esPeligro) {
      return <AlertCircle size={36} color={COLORES.danger} strokeWidth={2.2} />;
    }
    return <HelpCircle size={36} color={COLORES.brandPrimary} strokeWidth={2.2} />;
  };

  const obtenerFondoIcono = () => {
    if (esExito) return COLORES.successBg;
    if (esError || esPeligro) return COLORES.dangerBg;
    return COLORES.brandPrimarySubtle;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancelar}
    >
      <View style={styles.overlay}>
        <View style={styles.tarjetaModal}>
          {/* Botón superior de cierre si no está cargando */}
          {onCancelar && !cargando && (
            <TouchableOpacity
              style={styles.botonCerrarEsquina}
              onPress={onCancelar}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={COLORES.textMuted} />
            </TouchableOpacity>
          )}

          {/* Emblema / Icono Central */}
          <View style={[styles.contenedorIcono, { backgroundColor: obtenerFondoIcono() }]}>
            {obtenerIcono()}
          </View>

          {/* Título y Mensaje */}
          {titulo ? <Text style={styles.titulo}>{titulo}</Text> : null}
          {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}

          {/* Botones de Acción */}
          <View style={styles.filaBotones}>
            {onCancelar && (
              <TouchableOpacity
                style={styles.botonSecundario}
                onPress={onCancelar}
                disabled={cargando}
                activeOpacity={0.7}
              >
                <Text style={styles.botonSecundarioTexto}>{textoCancelar}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.botonPrimario,
                esPeligro && styles.botonPeligro,
                esExito && styles.botonExito,
                cargando && styles.botonDeshabilitado,
                !onCancelar && { flex: 1 },
              ]}
              onPress={onConfirmar}
              disabled={cargando}
              activeOpacity={0.8}
            >
              {cargando ? (
                <ActivityIndicator size="small" color={COLORES.textOnBrand} />
              ) : (
                <Text style={styles.botonPrimarioTexto}>{textoConfirmar}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 77, 80, 0.45)', // Azul petróleo translúcido
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ESPACIADO.space5,
  },
  tarjetaModal: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORES.surfaceDefault,
    borderRadius: RADIOS.xl,
    padding: ESPACIADO.space6,
    alignItems: 'center',
    position: 'relative',
    ...SOMBRAS.tarjeta,
  },
  botonCerrarEsquina: {
    position: 'absolute',
    top: ESPACIADO.space4,
    right: ESPACIADO.space4,
    padding: ESPACIADO.space1,
  },
  contenedorIcono: {
    width: 64,
    height: 64,
    borderRadius: RADIOS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ESPACIADO.space4,
  },
  titulo: {
    ...TIPOGRAFIA.heading2,
    color: COLORES.textPrimary,
    textAlign: 'center',
    marginBottom: ESPACIADO.space2,
  },
  mensaje: {
    ...TIPOGRAFIA.body,
    color: COLORES.textSecondary,
    textAlign: 'center',
    marginBottom: ESPACIADO.space6,
    lineHeight: 22,
  },
  filaBotones: {
    flexDirection: 'row',
    gap: ESPACIADO.space3,
    width: '100%',
  },
  botonSecundario: {
    flex: 1,
    height: 46,
    borderRadius: RADIOS.md,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    backgroundColor: COLORES.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonSecundarioTexto: {
    ...TIPOGRAFIA.button,
    color: COLORES.textPrimary,
  },
  botonPrimario: {
    flex: 1,
    height: 46,
    borderRadius: RADIOS.md,
    backgroundColor: COLORES.brandPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonPeligro: {
    backgroundColor: COLORES.danger,
  },
  botonExito: {
    backgroundColor: COLORES.brandPrimary,
  },
  botonPrimarioTexto: {
    ...TIPOGRAFIA.button,
    color: COLORES.textOnBrand,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
});
