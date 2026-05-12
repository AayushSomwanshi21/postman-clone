import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Home from './pages/Home';
import Auth from './pages/Auth';
import { useAuthStore } from './store/authStore';

export default function App() {
  const token = useAuthStore((s) => s.token);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={!token ? <Auth /> : <Navigate to="/collections" />} />
        <Route path="/*" element={token ? <Home /> : <Navigate to="/auth" />} />
      </Routes>
      <Toaster position="bottom-right" theme="dark" />
    </BrowserRouter>
  );
}
