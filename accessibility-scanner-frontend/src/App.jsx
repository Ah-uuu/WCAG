import { Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from './lib/auth';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Scan from './pages/Scan';
import ScanDetail from './pages/ScanDetail';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Refund from './pages/Refund';
import PixelLoader from './components/PixelLoader';

function ProtectedRoute({ children }) {
  const { data: session, isPending } = useSession();
  if (isPending) return <PixelLoader message="LOADING SAVE DATA..." />;
  if (!session) return <Navigate to="/sign-in" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/refund" element={<Refund />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/scan/:id" element={<ProtectedRoute><ScanDetail /></ProtectedRoute>} />
        <Route path="/success" element={<Navigate to="/dashboard" replace />} />
        <Route path="/cancel" element={<Navigate to="/pricing" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
