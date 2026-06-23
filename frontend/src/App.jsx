import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import Navbar from './components/layout/Navbar';
import ProgressSync from './components/ProgressSync';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <ProgressSync />
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#F4F1FF]">
          <Navbar />
          <main className="flex-1 flex flex-col">
            <AppRoutes />
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
