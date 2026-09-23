import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

/**
 * StrictMode deliberadamente omitido.
 *
 * React 19 en desarrollo ejecuta mount → unmount → mount en el frame 0.
 * El primer unmount invoca globe._destructor() y disposeSurface(), que marcan
 * disposed = true y cancelan todas las promesas de TextureLoader en curso.
 * El segundo mount crea un Globe nuevo, pero las texturas Blue Marble nunca
 * cargan y el canvas queda en negro.
 *
 * Globe.gl gestiona su propio ciclo de vida imperativo de WebGL, lo que lo hace
 * incompatible con el doble montaje de StrictMode.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);
