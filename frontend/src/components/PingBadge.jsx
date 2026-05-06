export default function PingBadge({ status, latency }) {
  if (!status) return <span className="badge bg-gray-100 text-gray-400">—</span>

  if (status === 'online') return (
    <span className="badge bg-green-50 text-green-700 gap-1">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      {latency ? `${latency}ms` : 'Online'}
    </span>
  )

  return (
    <span className="badge bg-red-50 text-red-600 gap-1">
      <span className="h-2 w-2 rounded-full bg-red-500 inline-block"></span>
      Offline
    </span>
  )
}
