import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { annulerCommande } from '../../services/commande'
import { CheckCircle, Clock, Truck, Package, XCircle, Loader, ShoppingBag } from 'lucide-react'

const ETAPES = [
  { statut: 'en_attente', label: 'Reçue', icon: Clock, color: 'text-yellow-500' },
  { statut: 'confirmée', label: 'Confirmée', icon: CheckCircle, color: 'text-blue-500' },
  { statut: 'prête_livraison', label: 'Prête', icon: Package, color: 'text-orange-500' },
  { statut: 'en_livraison', label: 'En livraison', icon: Truck, color: 'text-orange' },
  { statut: 'livrée', label: 'Livrée', icon: CheckCircle, color: 'text-vert' },
]

const STATUT_LABELS = {
  en_attente: { label: 'En attente de confirmation', color: 'bg-yellow-100 text-yellow-700' },
  confirmée: { label: 'Confirmée', color: 'bg-blue-100 text-blue-700' },
  prête_livraison: { label: 'Prête pour la livraison', color: 'bg-orange-100 text-orange-700' },
  en_livraison: { label: 'En cours de livraison', color: 'bg-blue-100 text-blue-700' },
  livrée: { label: 'Livrée ✓', color: 'bg-green-100 text-green-700' },
  annulée: { label: 'Annulée', color: 'bg-red-100 text-red-700' },
}

export default function Suivi() {
  const { id } = useParams()
  const [commande, setCommande] = useState(null)
  const [loading, setLoading] = useState(true)
  const [annulation, setAnnulation] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'commandes', id), snap => {
      setCommande(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      setLoading(false)
    })
    return unsub
  }, [id])

  async function handleAnnuler() {
    if (!confirm('Annuler cette commande ?')) return
    setAnnulation(true)
    try {
      await annulerCommande(id, commande.articles, 'client')
    } catch (err) {
      alert(err.message || 'Impossible d\'annuler.')
    } finally {
      setAnnulation(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!commande) return (
    <div className="text-center py-20">
      <p className="text-gray-400 mb-4">Commande introuvable.</p>
      <Link to="/" className="text-orange hover:underline">Retour à l'accueil</Link>
    </div>
  )

  const statutInfo = STATUT_LABELS[commande.statut] || { label: commande.statut, color: 'bg-gray-100 text-gray-500' }
  const indexActuel = ETAPES.findIndex(e => e.statut === commande.statut)
  const estAnnulee = commande.statut === 'annulée'

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="text-center py-4">
        <p className="text-sm text-gray-400 mb-1">Commande</p>
        <p className="text-2xl font-bold text-orange">{commande.numero || commande.id.slice(0, 8).toUpperCase()}</p>
        <span className={`inline-block mt-2 text-sm px-3 py-1 rounded-full font-medium ${statutInfo.color}`}>
          {statutInfo.label}
        </span>
      </div>

      {/* Progression */}
      {!estAnnulee && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            {ETAPES.map((etape, i) => {
              const Icone = etape.icon
              const passe = i <= indexActuel
              const actuel = i === indexActuel
              return (
                <div key={etape.statut} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition ${passe ? 'bg-orange' : 'bg-gray-100'}`}>
                    <Icone size={16} className={passe ? 'text-white' : 'text-gray-400'} />
                  </div>
                  <p className={`text-[10px] text-center leading-tight ${actuel ? 'text-orange font-semibold' : passe ? 'text-gray-600' : 'text-gray-300'}`}>
                    {etape.label}
                  </p>
                  {i < ETAPES.length - 1 && (
                    <div className={`absolute translate-x-4 translate-y-[-20px] h-0.5 w-full ${passe && i < indexActuel ? 'bg-orange' : 'bg-gray-200'}`} style={{ display: 'none' }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {estAnnulee && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center gap-3">
          <XCircle size={24} className="text-red-500 shrink-0" />
          <div>
            <p className="font-semibold text-red-700">Commande annulée</p>
            <p className="text-sm text-red-500">
              {commande.annuleePar === 'client' ? 'Annulée par vous.' : 'Annulée par le commerce.'}
            </p>
          </div>
        </div>
      )}

      {/* Récapitulatif */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
        <h2 className="font-semibold text-texte">Récapitulatif</h2>
        <div className="space-y-1">
          {commande.articles?.map((a, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-600">{a.quantite}x {a.nom}</span>
              <span>{(a.prix * a.quantite).toLocaleString()} FCFA</span>
            </div>
          ))}
        </div>
        <div className="pt-2 border-t space-y-1">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Livraison ({commande.client?.quartier})</span>
            <span>{commande.fraisLivraison > 0 ? `${commande.fraisLivraison.toLocaleString()} FCFA` : 'Gratuite'}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span className="text-orange">{commande.total?.toLocaleString()} FCFA</span>
          </div>
        </div>
      </div>

      {/* Annulation client */}
      {commande.statut === 'en_attente' && (
        <button onClick={handleAnnuler} disabled={annulation}
          className="w-full border border-red-200 text-red-500 py-3 rounded-xl font-medium hover:bg-red-50 transition flex items-center justify-center gap-2 disabled:opacity-60">
          {annulation ? <Loader size={16} className="animate-spin" /> : <XCircle size={16} />}
          {annulation ? 'Annulation...' : 'Annuler ma commande'}
        </button>
      )}

      {commande.statut !== 'en_attente' && commande.statut !== 'annulée' && (
        <p className="text-center text-xs text-gray-400">Pour annuler, contactez-nous directement.</p>
      )}

      <Link to="/" className="flex items-center justify-center gap-2 text-orange text-sm hover:underline py-2">
        <ShoppingBag size={16} /> Retour aux produits
      </Link>
    </div>
  )
}
