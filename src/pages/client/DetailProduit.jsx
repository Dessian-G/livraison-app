import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { ShoppingCart, ArrowLeft, Package } from 'lucide-react'
import { usePanier } from '../../contexts/PanierContext'

export default function DetailProduit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [produit, setProduit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ajoute, setAjoute] = useState(false)
  const { ajouterArticle } = usePanier()

  useEffect(() => {
    getDoc(doc(db, 'produits', id)).then(snap => {
      if (snap.exists()) setProduit({ id: snap.id, ...snap.data() })
      setLoading(false)
    })
  }, [id])

  function handleAjouter() {
    ajouterArticle(produit)
    setAjoute(true)
    setTimeout(() => setAjoute(false), 1500)
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!produit) return (
    <div className="text-center py-20 text-gray-400">Produit introuvable.</div>
  )

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-orange mb-4 hover:underline text-sm">
        <ArrowLeft size={16} /> Retour
      </button>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {produit.imageUrl ? (
          <img src={produit.imageUrl} alt={produit.nom} className="w-full h-56 object-cover" />
        ) : (
          <div className="w-full h-56 bg-gris-bg flex items-center justify-center">
            <Package size={64} className="text-gray-300" />
          </div>
        )}
        <div className="p-5">
          {produit.categorie && (
            <span className="text-xs bg-orange/10 text-orange px-2 py-0.5 rounded-full font-medium">{produit.categorie}</span>
          )}
          <h1 className="text-xl font-bold text-texte mt-2">{produit.nom}</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">{produit.description}</p>
          <div className="flex items-center justify-between mt-5">
            <span className="text-2xl font-bold text-orange">{produit.prix.toLocaleString()} FCFA</span>
            {produit.stock !== null && (
              <span className="text-xs text-gray-400">Stock : {produit.stock}</span>
            )}
          </div>
          <button
            onClick={handleAjouter}
            className={`mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition ${ajoute ? 'bg-vert' : 'bg-orange hover:bg-orange-dark'}`}
          >
            <ShoppingCart size={18} />
            {ajoute ? 'Ajouté au panier !' : 'Ajouter au panier'}
          </button>
        </div>
      </div>
    </div>
  )
}
