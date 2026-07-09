import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { Link } from 'react-router-dom'
import { ShoppingCart, Package, Search } from 'lucide-react'
import { usePanier } from '../../contexts/PanierContext'

export default function Catalogue() {
  const [produits, setProduits] = useState([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [categorieActive, setCategorieActive] = useState('Tous')
  const { ajouterArticle } = usePanier()
  const [ajoutIds, setAjoutIds] = useState({})

  useEffect(() => {
    const q = query(collection(db, 'produits'), where('actif', '==', true), orderBy('creeLe', 'desc'))
    return onSnapshot(q, snap => {
      setProduits(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  function handleAjouter(e, produit) {
    e.preventDefault()
    if (produit.stock === 0) return
    ajouterArticle(produit)
    setAjoutIds(prev => ({ ...prev, [produit.id]: true }))
    setTimeout(() => setAjoutIds(prev => ({ ...prev, [produit.id]: false })), 1000)
  }

  const categories = ['Tous', ...Array.from(new Set(produits.map(p => p.categorie).filter(Boolean)))]

  const produitsFiltres = produits.filter(p => {
    const matchCat = categorieActive === 'Tous' || p.categorie === categorieActive
    const matchRecherche = !recherche || p.nom.toLowerCase().includes(recherche.toLowerCase()) || p.description?.toLowerCase().includes(recherche.toLowerCase())
    return matchCat && matchRecherche
  })

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-bleu border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
          placeholder="Rechercher un produit..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-bleu/30 bg-white" />
      </div>

      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategorieActive(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition shrink-0 ${categorieActive === cat ? 'bg-bleu text-white' : 'bg-white text-gray-500 hover:bg-bleu/5'}`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {produitsFiltres.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <Package size={48} className="mx-auto mb-3 opacity-40" />
          <p>{recherche ? `Aucun résultat pour « ${recherche} »` : 'Aucun produit disponible.'}</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {produitsFiltres.map(p => {
          const stockNul = p.stock === 0
          return (
            <div key={p.id} className={`bg-white rounded-xl shadow-sm overflow-hidden flex flex-col ${stockNul ? 'opacity-60' : ''}`}>
              <Link to={`/produit/${p.id}`}>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.nom} className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-36 bg-gris-bg flex items-center justify-center">
                    <Package size={40} className="text-gray-300" />
                  </div>
                )}
              </Link>
              <div className="p-3 flex flex-col flex-1">
                {p.categorie && <span className="text-[10px] text-gray-400 uppercase tracking-wide">{p.categorie}</span>}
                <Link to={`/produit/${p.id}`} className="font-semibold text-texte text-sm leading-tight hover:text-bleu transition line-clamp-2 mt-0.5">
                  {p.nom}
                </Link>
                <p className="text-bleu font-bold mt-1 text-sm">{p.prix.toLocaleString()} FCFA</p>
                {p.stock !== null && p.stock > 0 && p.stock <= 5 && (
                  <p className="text-xs text-orange-500 font-medium">Stock faible : {p.stock} restant{p.stock > 1 ? 's' : ''}</p>
                )}
                <button onClick={e => handleAjouter(e, p)} disabled={stockNul}
                  className={`mt-auto w-full flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium transition ${stockNul ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ajoutIds[p.id] ? 'bg-vert text-white' : 'bg-bleu text-white hover:bg-bleu-dark'}`}>
                  <ShoppingCart size={15} />
                  {stockNul ? 'Indisponible' : ajoutIds[p.id] ? 'Ajouté !' : 'Ajouter'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
