import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { usePanier } from '../../contexts/PanierContext'

export default function Panier() {
  const { articles, modifierQuantite, total } = usePanier()
  const navigate = useNavigate()

  if (articles.length === 0) return (
    <div className="text-center py-20">
      <ShoppingBag size={56} className="mx-auto text-gray-300 mb-4" />
      <p className="text-gray-500 mb-4">Votre panier est vide.</p>
      <Link to="/" className="inline-block bg-orange text-white px-6 py-2.5 rounded-xl font-medium hover:bg-orange-dark transition">
        Voir les produits
      </Link>
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-texte mb-6">Mon panier</h1>
      <div className="space-y-3 mb-6">
        {articles.map(a => (
          <div key={a.produitId} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-texte text-sm truncate">{a.nom}</p>
              <p className="text-orange font-bold text-sm mt-0.5">{(a.prix * a.quantite).toLocaleString()} FCFA</p>
              <p className="text-xs text-gray-400">{a.prix.toLocaleString()} FCFA / unité</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => modifierQuantite(a.produitId, a.quantite - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-500 transition"
              >
                {a.quantite === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
              </button>
              <span className="w-6 text-center font-bold text-texte">{a.quantite}</span>
              <button
                onClick={() => modifierQuantite(a.produitId, a.quantite + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-orange/10 hover:text-orange transition"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex items-center justify-between">
        <span className="font-semibold text-texte">Total</span>
        <span className="text-xl font-bold text-orange">{total.toLocaleString()} FCFA</span>
      </div>

      <button
        onClick={() => navigate('/commande')}
        className="w-full bg-vert text-white py-3.5 rounded-xl font-bold text-base hover:bg-vert-dark transition"
      >
        Commander — {total.toLocaleString()} FCFA
      </button>
    </div>
  )
}
