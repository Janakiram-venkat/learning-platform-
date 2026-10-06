import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import Navbar from './components/layout/Navbar';
import ProgressSync from './components/ProgressSync';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      {/* BrowserRouter wraps everything so ProgressSync and all children
          have access to React Router context if they ever need it. */}
      <BrowserRouter>
        <ProgressSync />
        <div className="min-h-screen flex flex-col bg-paper">
          <Navbar />
          <main className="flex-1 flex flex-col">
            <AppRoutes />
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
