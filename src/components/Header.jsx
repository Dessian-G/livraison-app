import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, LogOut, Package, Truck } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { usePanier } from '../contexts/PanierContext'
import { useConfig } from '../contexts/ConfigContext'

export default function Header() {
  const { user, role } = useAuth()
  const { articles } = usePanier()
  const config = useConfig()
  const navigate = useNavigate()
  const nbArticles = articles.reduce((s, a) => s + a.quantite, 0)

  async function handleLogout() {
    await signOut(auth)
    navigate('/')
  }

  return (
    <header className="bg-bleu text-white shadow-md sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight truncate max-w-[220px]">
          <img
            src="/logo.png"
            alt="Mon Commerce"
            className="h-9 w-9 rounded-lg object-cover object-top shrink-0"
          />
          {config.nomBusiness}
        </Link>

        <nav className="flex items-center gap-3">
          {role === 'admin' && (
            <Link to="/admin/commandes" className="flex items-center gap-1 text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition">
              <Package size={16} /> Admin
            </Link>
          )}
          {role === 'livreur' && (
            <Link to="/livreur/commandes" className="flex items-center gap-1 text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition">
              <Truck size={16} /> Livraison
            </Link>
          )}
          {!role && (
            <Link to="/panier" className="relative flex items-center gap-1 text-sm hover:bg-white/20 px-3 py-1.5 rounded-lg transition">
              <ShoppingCart size={20} />
              {nbArticles > 0 && (
                <span className="absolute -top-1 -right-1 bg-vert text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {nbArticles}
                </span>
              )}
            </Link>
          )}
          {user ? (
            <button onClick={handleLogout} className="flex items-center gap-1 text-sm hover:bg-white/20 px-3 py-1.5 rounded-lg transition">
              <LogOut size={16} />
            </button>
          ) : (
            <Link to="/connexion" className="text-sm hover:bg-white/20 px-3 py-1.5 rounded-lg transition">
              Connexion
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
