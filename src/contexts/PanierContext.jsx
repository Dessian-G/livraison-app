import { createContext, useContext, useState, useEffect } from 'react'

const PanierContext = createContext(null)
const STORAGE_KEY = 'livraison-panier'

function chargerPanier() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function PanierProvider({ children }) {
  const [articles, setArticles] = useState(chargerPanier)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles))
  }, [articles])

  function ajouterArticle(produit) {
    setArticles(prev => {
      const existant = prev.find(a => a.produitId === produit.id)
      if (existant) {
        return prev.map(a => a.produitId === produit.id ? { ...a, quantite: a.quantite + 1 } : a)
      }
      return [...prev, { produitId: produit.id, nom: produit.nom, prix: produit.prix, quantite: 1 }]
    })
  }

  function modifierQuantite(produitId, quantite) {
    if (quantite <= 0) {
      setArticles(prev => prev.filter(a => a.produitId !== produitId))
    } else {
      setArticles(prev => prev.map(a => a.produitId === produitId ? { ...a, quantite } : a))
    }
  }

  function viderPanier() {
    setArticles([])
  }

  const total = articles.reduce((s, a) => s + a.prix * a.quantite, 0)

  return (
    <PanierContext.Provider value={{ articles, ajouterArticle, modifierQuantite, viderPanier, total }}>
      {children}
    </PanierContext.Provider>
  )
}

export const usePanier = () => useContext(PanierContext)
