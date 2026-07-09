import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function RequireRole({ role, children }) {
  const { user, role: userRole, loading } = useAuth()

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-bleu border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!user || userRole !== role) return <Navigate to="/connexion" replace />
  return children
}
