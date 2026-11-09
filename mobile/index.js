import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent llama a AppRegistry.registerComponent('main', () => App);
// Garantiza la inicialización adecuada tanto en Expo Go como en builds nativas.
registerRootComponent(App);
