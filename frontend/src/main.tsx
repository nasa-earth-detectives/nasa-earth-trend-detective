import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

/**
 * StrictMode deliberately omitted.
 *
 * React 19 in development runs mount → unmount → mount at frame 0.
 * The first unmount calls globe._destructor() and disposeSurface(), which set
 * disposed = true and cancel all in-flight TextureLoader promises.
 * The second mount creates a new Globe, but Blue Marble textures never
 * load, leaving the canvas black.
 *
 * Globe.gl manages its own imperative WebGL lifecycle, making it
 * incompatible with StrictMode double mounting.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);
