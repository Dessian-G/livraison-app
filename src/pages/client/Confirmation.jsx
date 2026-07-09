import { Link, useParams, useLocation } from 'react-router-dom'
import { CheckCircle, ShoppingBag, Eye } from 'lucide-react'
import { useConfig } from '../../contexts/ConfigContext'

export default function Confirmation() {
  const config = useConfig()
  const { id } = useParams()
  const location = useLocation()
  const { numero, total } = location.state || {}

  // Mémoriser l'ID pour "revenir au suivi" plus tard
  if (id) localStorage.setItem('derniere-commande-id', id)

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="bg-vert/10 rounded-full p-6 mb-5">
        <CheckCircle size={56} className="text-vert" />
      </div>

      <h1 className="text-2xl font-bold text-texte mb-2">Commande envoyée !</h1>

      {numero && (
        <div className="bg-bleu/5 border border-bleu/20 rounded-xl px-6 py-3 mb-4">
          <p className="text-xs text-gray-500 mb-1">Numéro de commande</p>
          <p className="text-2xl font-bold text-bleu">{numero}</p>
        </div>
      )}

      <p className="text-gray-500 text-sm max-w-xs mb-1">
        Votre commande a bien été reçue par <strong>{config.nomBusiness}</strong>.
      </p>
      {total && (
        <p className="text-gray-500 text-sm mb-1">
          Total à payer à la livraison : <strong>{total.toLocaleString()} FCFA</strong>
        </p>
      )}
      <p className="text-gray-400 text-xs mb-8">Paiement à la livraison.</p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {id && (
          <Link to={`/suivi/${id}`}
            className="flex items-center justify-center gap-2 bg-bleu text-white px-6 py-3 rounded-xl font-semibold hover:bg-bleu-dark transition">
            <Eye size={18} /> Suivre ma commande
          </Link>
        )}
        <Link to="/"
          className="flex items-center justify-center gap-2 border border-gray-200 text-texte px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition">
          <ShoppingBag size={18} /> Continuer les achats
        </Link>
      </div>
    </div>
  )
}
