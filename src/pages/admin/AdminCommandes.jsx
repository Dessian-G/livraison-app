import { useEffect, useState } from 'react'
import { collection, onSnapshot, updateDoc, doc, orderBy, query } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { annulerCommande } from '../../services/commande'
import { ChevronDown, ChevronUp, Navigation, Phone, AlertCircle } from 'lucide-react'
import AdminNav from '../../components/AdminNav'
import CarteLeaflet from '../../components/CarteLeaflet'

const STATUTS = ['en_attente', 'confirmée', 'prête_livraison', 'en_livraison', 'livrée', 'annulée']

const STATUT_LABELS = {
  en_attente: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  confirmée: { label: 'Confirmée', color: 'bg-blue-100 text-blue-700' },
  prête_livraison: { label: 'Prête livraison', color: 'bg-orange-100 text-orange-700' },
  en_livraison: { label: 'En livraison', color: 'bg-indigo-100 text-indigo-700' },
  livrée: { label: 'Livrée ✓', color: 'bg-green-100 text-green-700' },
  annulée: { label: 'Annulée', color: 'bg-red-100 text-red-700' },
}

const FILTRES = ['tous', 'en_attente', 'confirmée', 'prête_livraison', 'en_livraison', 'livrée', 'annulée']

export default function AdminCommandes() {
  const [commandes, setCommandes] = useState([])
  const [ouvert, setOuvert] = useState(null)
  const [filtre, setFiltre] = useState('tous')

  useEffect(() => {
    const q = query(collection(db, 'commandes'), orderBy('date', 'desc'))
    return onSnapshot(q, snap => setCommandes(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [])

  const commandesFiltrees = filtre === 'tous' ? commandes : commandes.filter(c => c.statut === filtre)

  async function changerStatut(commande, nouveauStatut) {
    if (nouveauStatut === 'annulée') {
      if (!confirm('Annuler cette commande et restaurer le stock ?')) return
      try {
        await annulerCommande(commande.id, commande.articles || [], 'admin')
      } catch (err) {
        alert(err.message || 'Erreur lors de l\'annulation.')
      }
    } else {
      await updateDoc(doc(db, 'commandes', commande.id), { statut: nouveauStatut })
    }
  }

  function formatDate(ts) {
    if (!ts) return ''
    return ts.toDate().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div>
      <AdminNav />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-texte">Commandes <span className="text-gray-400 font-normal text-base">({commandesFiltrees.length})</span></h1>
      </div>

      {/* Filtres par statut */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {FILTRES.map(f => (
          <button key={f} onClick={() => setFiltre(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition shrink-0 ${filtre === f ? 'bg-orange text-white' : 'bg-white text-gray-500 hover:bg-orange/5'}`}>
            {f === 'tous' ? 'Toutes' : STATUT_LABELS[f]?.label || f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {commandesFiltrees.length === 0 && <p className="text-gray-400 text-sm py-8 text-center">Aucune commande.</p>}
        {commandesFiltrees.map(c => {
          const st = STATUT_LABELS[c.statut] || { label: c.statut, color: 'bg-gray-100 text-gray-500' }
          const isOpen = ouvert === c.id
          return (
            <div key={c.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button onClick={() => setOuvert(isOpen ? null : c.id)}
                className="w-full flex items-center justify-between p-4 text-left">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-texte text-sm truncate">
                    {c.numero && <span className="text-orange mr-1">{c.numero}</span>}{c.client?.nom}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(c.date)} · {c.client?.quartier}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!c.notifEnvoyee && c.statut === 'en_attente' && (
                    <span title="Notification non envoyée"><AlertCircle size={14} className="text-orange-400" /></span>
                  )}
                  <span className="font-bold text-sm text-orange">{c.total?.toLocaleString()} F</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                  {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t px-4 pb-4 pt-3 space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400 text-xs">Téléphone</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="font-medium">{c.client?.telephone}</p>
                        <a href={`tel:${c.client?.telephone}`} className="text-vert"><Phone size={14} /></a>
                        <a href={`https://wa.me/${(c.client?.telephone || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-vert">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </a>
                      </div>
                    </div>
                    <div><span className="text-gray-400 text-xs">Quartier</span><p className="font-medium">{c.client?.quartier}</p></div>
                    {c.client?.description && <div className="col-span-2"><span className="text-gray-400 text-xs">Repère</span><p className="font-medium">{c.client.description}</p></div>}
                    {c.annuleePar && <div className="col-span-2"><span className="text-gray-400 text-xs">Annulée par</span><p className="font-medium capitalize">{c.annuleePar === 'client' ? 'Le client' : "L'admin"}</p></div>}
                  </div>

                  {c.client?.position && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Position client</p>
                      <CarteLeaflet position={c.client.position} centre={{ ...c.client.position, zoom: 15 }} readonly />
                      <a href={`https://www.google.com/maps?q=${c.client.position.lat},${c.client.position.lng}`}
                        target="_blank" rel="noreferrer"
                        className="mt-2 flex items-center gap-1 text-orange text-xs hover:underline">
                        <Navigation size={12} /> Itinéraire Google Maps
                      </a>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-gray-400 mb-1">Articles</p>
                    <div className="space-y-1">
                      {c.articles?.map((a, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{a.quantite}x {a.nom}</span>
                          <span className="text-orange font-medium">{(a.prix * a.quantite).toLocaleString()} FCFA</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t space-y-1 text-sm">
                      <div className="flex justify-between text-gray-500">
                        <span>Livraison ({c.client?.quartier})</span>
                        <span>{c.fraisLivraison > 0 ? `${c.fraisLivraison?.toLocaleString()} FCFA` : 'Gratuite'}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-orange">{c.total?.toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  </div>

                  {c.statut !== 'annulée' && c.statut !== 'livrée' && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Changer le statut</p>
                      <div className="flex flex-wrap gap-2">
                        {STATUTS.filter(s => s !== c.statut).map(s => {
                          const info = STATUT_LABELS[s]
                          return (
                            <button key={s} onClick={() => changerStatut(c, s)}
                              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition hover:opacity-80 ${info.color}`}>
                              → {info.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
