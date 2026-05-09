import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { lazy, Suspense } from 'react'
import Layout from './components/Layout'
import Login from './pages/Login'

// Lazy load — chỉ tải trang khi user truy cập
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Devices = lazy(() => import('./pages/Devices'))
const Cards = lazy(() => import('./pages/Cards'))
const IPs = lazy(() => import('./pages/IPs'))
const QuyTrinhIT = lazy(() => import('./pages/QuyTrinhIT'))
const TaiKhoanIT = lazy(() => import('./pages/TaiKhoanIT'))
const PhieuDeNghi = lazy(() => import('./pages/PhieuDeNghi'))
const ActionItems = lazy(() => import('./pages/ActionItems'))
const ITSop = lazy(() => import('./pages/ITSop'))

function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

const Loading = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-5 h-5 border-2 border-[#0052cc] border-t-transparent rounded-full animate-spin" />
  </div>
)

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
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
              <Route path="it-sop" element={<ITSop />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
