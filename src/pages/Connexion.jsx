import { useState, useEffect } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogIn, Loader } from 'lucide-react'
import { useConfig } from '../contexts/ConfigContext'

export default function Connexion() {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { role, loading: authLoading } = useAuth()
  const config = useConfig()

  useEffect(() => {
    if (!authLoading && role === 'admin') navigate('/admin/commandes', { replace: true })
    if (!authLoading && role === 'livreur') navigate('/livreur/commandes', { replace: true })
  }, [role, authLoading, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), motDePasse)
    } catch (err) {
      setError('Email ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-xl font-bold text-texte mb-1">{config.nomBusiness}</h1>
        <p className="text-gray-400 text-sm mb-6">Connexion Admin / Livreur</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-texte mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange/30 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-texte mb-1">Mot de passe</label>
            <input
              type="password"
              value={motDePasse}
              onChange={e => setMotDePasse(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange/30 transition"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange text-white py-3 rounded-xl font-semibold hover:bg-orange-dark transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader size={18} className="animate-spin" /> : <LogIn size={18} />}
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
