import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Diagnosis from './pages/Diagnosis';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import TreatmentPlanning from './pages/TreatmentPlanning';
import PatientTreatment from './pages/PatientTreatment';
import ProsthesisTracking from './pages/ProsthesisTracking';
import AdminProsthesisUpdate from './pages/AdminProsthesisUpdate';
import AccountDeleted from './pages/AccountDeleted';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PaymentTracking from './pages/PaymentTracking';
import SessionTimeout from './components/SessionTimeout';
import SmileDesignModule from './pages/SmileDesignModule';

// Protected Route Component
const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (user && user.role === 'deleted' && location.pathname !== '/hesap-silindi') {
    return <Navigate to="/hesap-silindi" replace />;
  }

  if (!user) {
    return <Navigate to="/giris" replace />;
  }

  if (role && user.role !== role) {
    // Redirect to appropriate dashboard if role doesn't match
    return <Navigate to={user.role === 'admin' ? '/admin-dashboard' : '/dashboard'} />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <SessionTimeout />
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/kayit" element={<Register />} />
            <Route path="/giris" element={<Login />} />
            <Route path="/sifre-unuttum" element={<ForgotPassword />} />
            <Route path="/sifre-sifirla" element={<ResetPassword />} />

            {/* Patient Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/diagnosis" element={
              <ProtectedRoute>
                <Diagnosis />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/treatment-plan" element={
              <ProtectedRoute>
                <PatientTreatment />
              </ProtectedRoute>
            } />
            <Route path="/protez-takip" element={
              <ProtectedRoute>
                <ProsthesisTracking />
              </ProtectedRoute>
            } />
            <Route path="/odeme" element={
              <ProtectedRoute>
                <PaymentTracking />
              </ProtectedRoute>
            } />
            <Route path="/smile-design" element={
              <ProtectedRoute>
                <SmileDesignModule />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin-dashboard" element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/treatment/:username" element={
              <ProtectedRoute role="admin">
                <TreatmentPlanning />
              </ProtectedRoute>
            } />
            <Route path="/admin/profile/:username" element={
              <ProtectedRoute role="admin">
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/admin/protez-guncelle/:username" element={
              <ProtectedRoute role="admin">
                <AdminProsthesisUpdate />
              </ProtectedRoute>
            } />
            <Route path="/admin/odeme/:username" element={
              <ProtectedRoute role="admin">
                <PaymentTracking />
              </ProtectedRoute>
            } />

            <Route path="/hesap-silindi" element={<AccountDeleted />} />

            {/* Catch all - redirect to landing */}
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
