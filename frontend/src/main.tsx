import ReactDOM from 'react-dom/client';
import App from './App';
import { WSProvider } from '@/context/WsContext';
import { AuthProvider } from '@/context/AuthProvider';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <AuthProvider>
    <WSProvider>
      <App />
    </WSProvider>
  </AuthProvider>,
);
