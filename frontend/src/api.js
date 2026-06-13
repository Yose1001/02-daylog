import axios from 'axios'

// In dev, baseURL is empty and Vite proxies "/api" to the backend.
// In prod, set VITE_API_URL to the backend's base URL.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
})

// Attach the JWT (if we have one) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
