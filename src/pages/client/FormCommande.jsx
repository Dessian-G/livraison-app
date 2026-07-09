import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { usePanier } from '../../contexts/PanierContext'
import { useConfig } from '../../contexts/ConfigContext'
import { creerCommande } from '../../services/commande'
import CarteLeaflet from '../../components/CarteLeaflet'
import { MapPin, Loader } from 'lucide-react'

export default function FormCommande() {
  const { articles, total, viderPanier } = usePanier()
  const config = useConfig()
  const navigate = useNavigate()

  const [quartiers, setQuartiers] = useState([])
  const [form, setForm] = useState({ nom: '', telephone: '', quartierId: '', quartierNom: '', fraisLivraison: 0, description: '' })
  const [position, setPosition] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [orderSubmitted, setOrderSubmitted] = useState(false)

  useEffect(() => {
    if (articles.length === 0 && !orderSubmitted) navigate('/panier')
  }, [articles.length, orderSubmitted, navigate])

  useEffect(() => {
    const q = query(collection(db, 'quartiers'), orderBy('ordre'))
    return onSnapshot(q, snap => setQuartiers(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(q => q.actif)))
  }, [])

  function handleQuartierChange(e) {
    const id = e.target.value
    const q = quartiers.find(q => q.id === id)
    setForm(f => ({ ...f, quartierId: id, quartierNom: q?.nom || '', fraisLivraison: q?.fraisLivraison || 0 }))
  }

  function validate() {
    const e = {}
    if (!form.nom.trim()) e.nom = 'Nom obligatoire'
    if (!form.telephone.trim()) e.telephone = 'Téléphone obligatoire'
    if (!form.quartierId) e.quartier = 'Veuillez choisir votre quartier'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleGeolocate() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert('Impossible de récupérer votre position.')
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const result = await creerCommande({
        articles,
        client: {
          nom: form.nom.trim(),
          telephone: form.telephone.trim(),
          quartier: form.quartierNom,
          fraisLivraison: form.fraisLivraison,
          description: form.description.trim(),
          position: position || null,
        },
        config,
      })
      setOrderSubmitted(true)
      navigate(`/confirmation/${result.commandeId}`, { state: { numero: result.numero, total: result.total } })
      viderPanier()
    } catch (err) {
      alert(err.message || 'Erreur lors de la commande. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const totalAvecFrais = total + form.fraisLivraison

  return (
    <div>
      <h1 className="text-2xl font-bold text-texte mb-6">Mes informations</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-texte mb-1">Nom complet <span className="text-red-500">*</span></label>
            <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
              placeholder="Ex: Koné Aminata"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-bleu/30 transition ${errors.nom ? 'border-red-400' : 'border-gray-200'}`} />
            {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-texte mb-1">Numéro de téléphone <span className="text-red-500">*</span></label>
            <input type="tel" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
              placeholder="Ex: 0700000000"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-bleu/30 transition ${errors.telephone ? 'border-red-400' : 'border-gray-200'}`} />
            {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-texte mb-1">Quartier / Commune <span className="text-red-500">*</span></label>
            <select value={form.quartierId} onChange={handleQuartierChange}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-bleu/30 transition bg-white ${errors.quartier ? 'border-red-400' : 'border-gray-200'}`}>
              <option value="">-- Choisir votre quartier --</option>
              {quartiers.map(q => (
                <option key={q.id} value={q.id}>
                  {q.nom} {q.fraisLivraison > 0 ? `(+${q.fraisLivraison.toLocaleString()} FCFA)` : '(Livraison gratuite)'}
                </option>
              ))}
            </select>
            {errors.quartier && <p className="text-red-500 text-xs mt-1">{errors.quartier}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-texte mb-1">Description / Point de repère</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Ex: Face à la pharmacie, 2ème maison bleue..." rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-bleu/30 transition resize-none" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-texte text-sm">Ma position sur la carte</h2>
            <button type="button" onClick={handleGeolocate} className="flex items-center gap-1 text-bleu text-xs hover:underline">
              <MapPin size={14} /> Ma position
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-3">Cliquez sur la carte ou déplacez le marqueur.</p>
          <CarteLeaflet
            centre={config.carteCentre}
            position={position || config.carteCentre}
            onChange={setPosition}
          />
          {position && (
            <p className="text-xs text-gray-400 mt-2">Position : {position.lat.toFixed(5)}, {position.lng.toFixed(5)}</p>
          )}
        </div>

        {/* Récapitulatif */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Sous-total</span>
            <span>{total.toLocaleString()} FCFA</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Frais de livraison</span>
            <span>{form.quartierId ? (form.fraisLivraison > 0 ? `${form.fraisLivraison.toLocaleString()} FCFA` : 'Gratuit') : '—'}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t">
            <span>Total à payer</span>
            <span className="text-bleu">{totalAvecFrais.toLocaleString()} FCFA</span>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-vert text-white py-3.5 rounded-xl font-bold text-base hover:bg-vert-dark transition flex items-center justify-center gap-2 disabled:opacity-60">
          {loading ? <><Loader size={18} className="animate-spin" /> Envoi en cours...</> : `Valider la commande — ${totalAvecFrais.toLocaleString()} FCFA`}
        </button>
      </form>
    </div>
  )
}
