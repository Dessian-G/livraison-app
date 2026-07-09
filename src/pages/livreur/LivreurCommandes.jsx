import { useEffect, useState } from 'react'
import { collection, onSnapshot, updateDoc, doc, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'
import { Phone, Navigation, MapPin, Package, Truck } from 'lucide-react'
import CarteLeaflet from '../../components/CarteLeaflet'

export default function LivreurCommandes() {
  const { user } = useAuth()
  const [commandes, setCommandes] = useState([])
  const [ouvert, setOuvert] = useState(null)

  useEffect(() => {
    const q = query(
      collection(db, 'commandes'),
      where('statut', 'in', ['prête_livraison', 'en_livraison'])
    )
    return onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      // Trier : prête_livraison d'abord, puis en_livraison assignées à ce livreur
      setCommandes(docs.sort((a, b) => {
        if (a.statut === 'prête_livraison' && b.statut !== 'prête_livraison') return -1
        if (b.statut === 'prête_livraison' && a.statut !== 'prête_livraison') return 1
        return 0
      }))
    })
  }, [])

  async function prendreCommande(id) {
    await updateDoc(doc(db, 'commandes', id), { statut: 'en_livraison', livreurId: user.uid })
  }

  async function marquerLivree(id) {
    await updateDoc(doc(db, 'commandes', id), { statut: 'livrée' })
  }

  function formatDate(ts) {
    if (!ts) return ''
    return ts.toDate().toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-texte mb-2">Mes livraisons</h1>
      <p className="text-sm text-gray-400 mb-5">Commandes prêtes à livrer en temps réel</p>

      {commandes.length === 0 && (
        <div className="text-center py-20 text-gray-300">
          <Truck size={56} className="mx-auto mb-3 opacity-40" />
          <p>Aucune commande en attente de livraison.</p>
        </div>
      )}

      <div className="space-y-3">
        {commandes.map(c => {
          const isOpen = ouvert === c.id
          const isPrete = c.statut === 'prête_livraison'
          const isMoneLivraison = c.statut === 'en_livraison' && c.livreurId === user?.uid
          if (c.statut === 'en_livraison' && c.livreurId !== user?.uid) return null

          return (
            <div key={c.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setOuvert(isOpen ? null : c.id)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isPrete ? 'bg-purple-500' : 'bg-orange-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-texte text-sm">
                    {c.numero && <span className="text-bleu mr-1">{c.numero}</span>}{c.client?.nom}
                  </p>
                  <p className="text-xs text-gray-400">{c.client?.quartier} · {formatDate(c.date)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${isPrete ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                  {isPrete ? 'Prête' : 'En cours'}
                </span>
              </button>

              {isOpen && (
                <div className="border-t px-4 pb-4 pt-3 space-y-4">
                  {/* Infos client */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />
                      <a href={`tel:${c.client?.telephone}`} className="text-bleu text-sm font-medium hover:underline">{c.client?.telephone}</a>
                      <a href={`https://wa.me/${c.client?.telephone?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="ml-1 text-vert text-xs hover:underline">WhatsApp</a>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-texte font-medium">{c.client?.quartier}</p>
                        {c.client?.description && <p className="text-xs text-gray-400">{c.client.description}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Articles */}
                  <div className="bg-gris-bg rounded-lg p-3 space-y-1">
                    {c.articles?.map((a, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{a.quantite}x {a.nom}</span>
                        <span className="font-medium">{(a.prix * a.quantite).toLocaleString()} FCFA</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-200 mt-1">
                      <span>Total</span>
                      <span className="text-bleu">{c.total?.toLocaleString()} FCFA</span>
                    </div>
                  </div>

                  {/* Carte */}
                  {c.client?.position && (
                    <div>
                      <CarteLeaflet position={c.client.position} centre={{ ...c.client.position, zoom: 15 }} readonly />
                      <a
                        href={`https://www.google.com/maps?q=${c.client.position.lat},${c.client.position.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 flex items-center gap-1 text-bleu text-sm hover:underline"
                      >
                        <Navigation size={14} /> Itinéraire Google Maps
                      </a>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {isPrete && (
                      <button
                        onClick={() => prendreCommande(c.id)}
                        className="flex-1 bg-bleu text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-bleu-dark transition flex items-center justify-center gap-1"
                      >
                        <Truck size={16} /> J'ai pris la commande
                      </button>
                    )}
                    {isMoneLivraison && (
                      <button
                        onClick={() => marquerLivree(c.id)}
                        className="flex-1 bg-vert text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-vert-dark transition flex items-center justify-center gap-1"
                      >
                        <Package size={16} /> Marquer comme livrée
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
