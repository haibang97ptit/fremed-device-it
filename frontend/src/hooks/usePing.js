import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { getPingStatus } from '../api'

export function usePing() {
  const [pingMap, setPingMap] = useState({})
  const socketRef = useRef(null)

  useEffect(() => {
    // Lấy data ping qua API — retry sau 2 giây nếu lần đầu rỗng
    const fetchPing = () => {
      getPingStatus()
        .then(r => {
          if (r.data && Object.keys(r.data).length > 0) {
            setPingMap(r.data)
          }
        })
        .catch(() => {})
    }

    fetchPing()
    const retryTimer = setTimeout(fetchPing, 3000)

    // WebSocket
    const socket = io('/', { transports: ['websocket'] })
    socketRef.current = socket

    socket.on('connect', () => {
      // Yêu cầu server gửi lại ping_initial khi reconnect
      fetchPing()
    })

    socket.on('ping_initial', (data) => {
      if (data && Object.keys(data).length > 0) {
        setPingMap(data)
      }
    })

    socket.on('ping_update', ({ deviceId, status, latency }) => {
      setPingMap(prev => ({
        ...prev,
        [deviceId]: { status, latency, checkedAt: new Date() }
      }))
    })

    return () => {
      clearTimeout(retryTimer)
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  return pingMap
}
