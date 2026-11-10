/**
 * Generador ligero de UUIDv4 en JavaScript puro.
 * Compatible con React Native y entornos offline sin dependencias nativas adicionales.
 */
export const generarUUID = () => {
  // Patrón RFC4122 v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
