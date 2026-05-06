import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Devices from './pages/Devices'
import Cards from './pages/Cards'
import IPs from './pages/IPs'
import QuyTrinhIT from './pages/QuyTrinhIT'
import TaiKhoanIT from './pages/TaiKhoanIT'
import PhieuDeNghi from './pages/PhieuDeNghi'
import ActionItems from './pages/ActionItems'

function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="devices" element={<Devices />} />
            <Route path="cards"   element={<Cards />} />
            <Route path="ips"     element={<IPs />} />
            <Route path="quy-trinh" element={<QuyTrinhIT />} />
            <Route path="tai-khoan" element={<TaiKhoanIT />} />
            <Route path="phieu-de-nghi" element={<PhieuDeNghi />} />
            <Route path="action-items" element={<ActionItems />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
