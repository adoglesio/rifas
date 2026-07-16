import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function ProtectedRoute({ children }) {
  const { session, isAdmin, loading } = useAuth()

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base text-muted font-mono text-sm">
        carregando…
      </div>
    )
  }

  if (!session || !isAdmin) {
    return <Navigate to="/login" replace />
  }

  return children
}
