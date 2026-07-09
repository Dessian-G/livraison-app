import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { ShoppingBag, Clock, Truck, CheckCircle, TrendingUp } from 'lucide-react'
import AdminNav from '../../components/AdminNav'

const STATUT_LABELS = {
  en_attente: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmée: { label: 'Confirmée', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  prête_livraison: { label: 'Prête livraison', color: 'bg-orange-100 text-orange-700', icon: ShoppingBag },
  en_livraison: { label: 'En livraison', color: 'bg-blue-100 text-blue-700', icon: Truck },
  livrée: { label: 'Livrée', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  annulée: { label: 'Annulée', color: 'bg-red-100 text-red-700', icon: null },
}

export default function AdminDashboard() {
  const [commandes, setCommandes] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'commandes'), orderBy('date', 'desc'))
    return onSnapshot(q, snap => setCommandes(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [])

  // Stats du jour
  const debutJour = new Date(); debutJour.setHours(0, 0, 0, 0)
  const commandesDuJour = commandes.filter(c => c.date?.toDate() >= debutJour)
  const chiffreDuJour = commandesDuJour.filter(c => c.statut !== 'annulée').reduce((s, c) => s + (c.total || 0), 0)
  const enAttente = commandes.filter(c => c.statut === 'en_attente').length
  const enLivraison = commandes.filter(c => c.statut === 'en_livraison').length
  const livreesJour = commandesDuJour.filter(c => c.statut === 'livrée').length

  function formatDate(ts) {
    if (!ts) return ''
    return ts.toDate().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const dernieres = commandes.slice(0, 10)

  return (
    <div>
      <AdminNav />
      <h1 className="text-xl font-bold text-texte mb-5">Tableau de bord</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard icon={Clock} label="En attente" value={enAttente} color="bg-yellow-50 text-yellow-700" />
        <StatCard icon={Truck} label="En livraison" value={enLivraison} color="bg-blue-50 text-blue-700" />
        <StatCard icon={CheckCircle} label="Livrées (today)" value={livreesJour} color="bg-green-50 text-green-700" />
        <StatCard icon={TrendingUp} label="CA du jour" value={`${chiffreDuJour.toLocaleString()} F`} color="bg-orange/5 text-orange" />
      </div>

      {/* Dernières commandes */}
      <h2 className="font-semibold text-texte mb-3">Dernières commandes</h2>
      <div className="space-y-2">
        {dernieres.length === 0 && (
          <p className="text-gray-400 text-sm py-8 text-center">Aucune commande pour le moment.</p>
        )}
        {dernieres.map(c => {
          const st = STATUT_LABELS[c.statut] || { label: c.statut, color: 'bg-gray-100 text-gray-500' }
          return (
            <div key={c.id} className="bg-white rounded-xl shadow-sm p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-texte text-sm truncate">{c.numero || '—'} · {c.client?.nom}</p>
                <p className="text-xs text-gray-400">{formatDate(c.date)} · {c.client?.quartier}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-bold text-sm text-orange">{c.total?.toLocaleString()} F</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`rounded-2xl p-4 ${color.split(' ')[0]} flex items-center gap-3`}>
      <div className={`w-10 h-10 rounded-full bg-white/60 flex items-center justify-center`}>
        <Icon size={20} className={color.split(' ')[1]} />
      </div>
      <div>
        <p className={`text-xl font-bold ${color.split(' ')[1]}`}>{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}
