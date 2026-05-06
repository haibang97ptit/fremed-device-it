import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Tự động thêm JWT token vào mỗi request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Tự động redirect về login nếu token hết hạn
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// AUTH
export const login = (data) => api.post('/auth/login', data)
export const changePassword = (data) => api.post('/auth/change-password', data)

// DEVICES
export const getDevices = (params) => api.get('/devices', { params })
export const getDevice  = (id) => api.get(`/devices/${id}`)
export const createDevice = (data) => api.post('/devices', data)
export const updateDevice = (id, data) => api.put(`/devices/${id}`, data)
export const deleteDevice = (id) => api.delete(`/devices/${id}`)

// CARDS
export const getCards = (params) => api.get('/cards', { params })
export const createCard = (data) => api.post('/cards', data)
export const updateCard = (id, data) => api.put(`/cards/${id}`, data)
export const deleteCard = (id) => api.delete(`/cards/${id}`)

// IPS
export const getIPs = (params) => api.get('/ips', { params })
export const createIP = (data) => api.post('/ips', data)
export const updateIP = (id, data) => api.put(`/ips/${id}`, data)
export const deleteIP = (id) => api.delete(`/ips/${id}`)

// LOOKUP
export const getPhongban = () => api.get('/lookup/phongban')
export const createPhongban = (data) => api.post('/lookup/phongban', data)
export const getLoaimay = () => api.get('/lookup/loaimay')
export const createLoaimay = (data) => api.post('/lookup/loaimay', data)
export const getDashboard = () => api.get('/lookup/dashboard')

// PING
export const getPingStatus = () => api.get('/ping/status')
export const pingDevice = (id) => api.post(`/ping/${id}`)
export const getPingHistory = (id) => api.get(`/ping/history/${id}`)

// QUY TRÌNH IT
export const getQuyTrinh = () => api.get('/quy-trinh')
export const getQuyTrinhById = (id) => api.get(`/quy-trinh/${id}`)
export const createQuyTrinh = (formData) => api.post('/quy-trinh', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const updateQuyTrinh = (id, formData) => api.put(`/quy-trinh/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const deleteQuyTrinh = (id) => api.delete(`/quy-trinh/${id}`)

// TÀI KHOẢN THIẾT BỊ
export const getTaiKhoan = (params) => api.get('/tai-khoan', { params })
export const createTaiKhoan = (data) => api.post('/tai-khoan', data)
export const updateTaiKhoan = (id, data) => api.put(`/tai-khoan/${id}`, data)
export const deleteTaiKhoan = (id) => api.delete(`/tai-khoan/${id}`)
export const importTaiKhoan = (formData) => api.post('/tai-khoan/import', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

// PHIẾU ĐỀ NGHỊ
export const getPhieuDeNghi = (params) => api.get('/phieu-de-nghi', { params })
export const getPhieuDeNghiById = (id) => api.get(`/phieu-de-nghi/${id}`)
export const getNextPR = () => api.get('/phieu-de-nghi/next-pr')
export const createPhieuDeNghi = (data) => api.post('/phieu-de-nghi', data)
export const updatePhieuDeNghi = (id, data) => api.put(`/phieu-de-nghi/${id}`, data)
export const deletePhieuDeNghi = (id) => api.delete(`/phieu-de-nghi/${id}`)

export default api

// QUALZEN
export const getActionItems = () => api.get('/qualzen/action-items')
export const getActionItemsSummary = () => api.get('/qualzen/action-items/summary')

// ĐỒNG HỒ
export const getDongHoStatus = () => api.get('/dongho/status')
