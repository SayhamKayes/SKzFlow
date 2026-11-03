import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { APP_CONFIG } from './config/appConfig';

document.title = `${APP_CONFIG.name} | ${APP_CONFIG.tagline}`;

createRoot(document.getElementById('root')!).render(<App />);
