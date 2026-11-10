import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '../theme/tokens';

/**
 * FichAppInput — Componente de entrada estandarizado para FichApp Design System.
 * 
 * Soporta:
 * - Estados visuales: Normal, Enfocado, Error, Deshabilitado.
 * - Icono lateral izquierdo configurable (componente Lucide).
 * - Mensaje de error de validación inline con icono AlertCircle y color danger.
 * - Modo contraseña con toggle interactivo Eye / EyeOff.
 * - Soporte para multilínea.
 */
export default function FichAppInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  iconoIzquierdo: IconoIzquierdo,
  esContrasena = false,
  editable = true,
  multilinea = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = false,
  maxLength,
  style,
  inputStyle,
  onBlur,
  onFocus,
  ...restoProps
}) {
  const [estaEnfocado, setEstaEnfocado] = useState(false);
  const [ocultarClave, setOcultarClave] = useState(esContrasena);

  const tieneError = Boolean(error);

  const manejarFocus = (e) => {
    setEstaEnfocado(true);
    if (onFocus) onFocus(e);
  };

  const manejarBlur = (e) => {
    setEstaEnfocado(false);
    if (onBlur) onBlur(e);
  };

  const alternarVisibilidadClave = () => {
    setOcultarClave((prev) => !prev);
  };

  return (
    <View style={[styles.contenedor, style]}>
      {label && <Text style={styles.etiqueta}>{label}</Text>}

      <View
        style={[
          styles.cajaInput,
          multilinea && styles.cajaInputMultilinea,
          estaEnfocado && styles.cajaInputEnfocado,
          tieneError && styles.cajaInputError,
          !editable && styles.cajaInputDeshabilitado,
        ]}
      >
        {IconoIzquierdo && (
          <View style={styles.iconoIzquierdoContenedor}>
            <IconoIzquierdo
              size={18}
              color={
                tieneError
                  ? COLORES.danger
                  : estaEnfocado
                  ? COLORES.brandPrimary
                  : COLORES.textMuted
              }
              strokeWidth={2}
            />
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            multilinea && styles.inputMultilinea,
            !editable && styles.inputDeshabilitado,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORES.textMuted}
          editable={editable}
          multiline={multilinea}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          maxLength={maxLength}
          secureTextEntry={esContrasena ? ocultarClave : false}
          onFocus={manejarFocus}
          onBlur={manejarBlur}
          {...restoProps}
        />

        {esContrasena && (
          <TouchableOpacity
            style={styles.botonToggleClave}
            onPress={alternarVisibilidadClave}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
            accessibilityLabel={ocultarClave ? 'Mostrar contraseña' : 'Ocultar contraseña'}
          >
            {ocultarClave ? (
              <Eye size={18} color={COLORES.textSecondary} strokeWidth={2} />
            ) : (
              <EyeOff size={18} color={COLORES.brandPrimary} strokeWidth={2} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {tieneError && (
        <View style={styles.contenedorError}>
          <AlertCircle size={14} color={COLORES.danger} strokeWidth={2} />
          <Text style={styles.textoError}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    marginBottom: ESPACIADO.space3,
    width: '100%',
  },
  etiqueta: {
    ...TIPOGRAFIA.label,
    color: COLORES.textPrimary,
    marginBottom: ESPACIADO.space1,
  },
  cajaInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.surfaceDefault,
    borderWidth: 1,
    borderColor: COLORES.borderDefault,
    borderRadius: RADIOS.md,
    paddingHorizontal: ESPACIADO.space3,
    minHeight: 46,
  },
  cajaInputMultilinea: {
    minHeight: 80,
    alignItems: 'flex-start',
    paddingVertical: ESPACIADO.space2,
  },
  cajaInputEnfocado: {
    borderColor: COLORES.borderFocus,
    backgroundColor: COLORES.surfaceDefault,
  },
  cajaInputError: {
    borderColor: COLORES.borderError,
    backgroundColor: COLORES.dangerBg + '25', // Tinte suave
  },
  cajaInputDeshabilitado: {
    backgroundColor: COLORES.surfaceSubtle,
    borderColor: COLORES.borderDefault,
  },
  iconoIzquierdoContenedor: {
    marginRight: ESPACIADO.space2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    ...TIPOGRAFIA.body,
    color: COLORES.textPrimary,
    minHeight: 44,
    paddingVertical: 0,
  },
  inputMultilinea: {
    minHeight: 70,
    textAlignVertical: 'top',
    paddingTop: ESPACIADO.space1,
  },
  inputDeshabilitado: {
    color: COLORES.textDisabled,
  },
  botonToggleClave: {
    padding: ESPACIADO.space1,
    marginLeft: ESPACIADO.space2,
  },
  contenedorError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.space1,
    marginTop: ESPACIADO.space1,
  },
  textoError: {
    ...TIPOGRAFIA.bodySmall,
    color: COLORES.danger,
    fontWeight: '500',
    flex: 1,
  },
});
