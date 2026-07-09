import { useState, useEffect } from 'react'
import { doc, updateDoc, collection, onSnapshot, addDoc, deleteDoc, orderBy, query } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase/config'
import { useConfig } from '../../contexts/ConfigContext'
import { Save, Loader, Plus, Trash2, Pencil, X, Send } from 'lucide-react'
import AdminNav from '../../components/AdminNav'

export default function AdminParametres() {
  const config = useConfig()
  const [form, setForm] = useState({ nomBusiness: '', whatsappAdmin: '', callmebotApiKey: '', lat: '', lng: '', zoom: '' })
  const [logoFile, setLogoFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  // Quartiers
  const [quartiers, setQuartiers] = useState([])
  const [modalQ, setModalQ] = useState(null) // null | { mode: 'new'|'edit', id? }
  const [formQ, setFormQ] = useState({ nom: '', fraisLivraison: '', actif: true, ordre: '' })
  const [loadingQ, setLoadingQ] = useState(false)

  // Test WhatsApp
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState('')

  useEffect(() => {
    setForm({
      nomBusiness: config.nomBusiness || '',
      whatsappAdmin: config.whatsappAdmin || '',
      callmebotApiKey: config.callmebotApiKey || '',
      lat: String(config.carteCentre?.lat || 5.3599),
      lng: String(config.carteCentre?.lng || -3.9870),
      zoom: String(config.carteCentre?.zoom || 13),
    })
  }, [config])

  useEffect(() => {
    const q = query(collection(db, 'quartiers'), orderBy('ordre'))
    return onSnapshot(q, snap => setQuartiers(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setLoading(true)
    try {
      let logoUrl = config.logoUrl || null
      if (logoFile) {
        const storRef = ref(storage, `config/logo_${Date.now()}`)
        await uploadBytes(storRef, logoFile)
        logoUrl = await getDownloadURL(storRef)
      }
      await updateDoc(doc(db, 'parametres', 'config'), {
        nomBusiness: form.nomBusiness.trim(),
        whatsappAdmin: form.whatsappAdmin.trim(),
        callmebotApiKey: form.callmebotApiKey.trim(),
        carteCentre: { lat: parseFloat(form.lat), lng: parseFloat(form.lng), zoom: parseInt(form.zoom) },
        logoUrl,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error(err)
      alert('Erreur lors de la sauvegarde.')
    } finally {
      setLoading(false)
    }
  }

  async function handleTestWhatsApp() {
    const { whatsappAdmin, callmebotApiKey, nomBusiness } = config
    if (!whatsappAdmin || !callmebotApiKey) {
      setTestResult('❌ Renseignez d\'abord le numéro WhatsApp et la clé CallMeBot.')
      return
    }
    setTestLoading(true)
    setTestResult('')
    try {
      const msg = `🧪 TEST — ${nomBusiness || 'Mon Commerce'}\nLa notification WhatsApp fonctionne !`
      const url = `https://api.callmebot.com/whatsapp.php?phone=${whatsappAdmin}&text=${encodeURIComponent(msg)}&apikey=${callmebotApiKey}`
      const resp = await fetch(url)
      setTestResult(resp.ok ? '✅ Message envoyé ! Vérifiez votre WhatsApp.' : '❌ Échec de l\'envoi. Vérifiez la clé et le numéro.')
    } catch {
      setTestResult('❌ Erreur réseau.')
    } finally {
      setTestLoading(false)
    }
  }

  // ---- Quartiers ----
  function ouvrirNouveauQuartier() {
    const maxOrdre = quartiers.reduce((m, q) => Math.max(m, q.ordre || 0), 0)
    setFormQ({ nom: '', fraisLivraison: '', actif: true, ordre: String(maxOrdre + 1) })
    setModalQ({ mode: 'new' })
  }

  function ouvrirModifierQuartier(q) {
    setFormQ({ nom: q.nom, fraisLivraison: String(q.fraisLivraison), actif: q.actif, ordre: String(q.ordre || 0) })
    setModalQ({ mode: 'edit', id: q.id })
  }

  async function handleSaveQuartier() {
    if (!formQ.nom.trim()) return alert('Nom du quartier obligatoire.')
    setLoadingQ(true)
    try {
      const data = {
        nom: formQ.nom.trim(),
        fraisLivraison: Number(formQ.fraisLivraison) || 0,
        actif: formQ.actif,
        ordre: Number(formQ.ordre) || 0,
      }
      if (modalQ.mode === 'new') {
        await addDoc(collection(db, 'quartiers'), data)
      } else {
        await updateDoc(doc(db, 'quartiers', modalQ.id), data)
      }
      setModalQ(null)
    } catch (err) {
      alert('Erreur : ' + err.message)
    } finally {
      setLoadingQ(false)
    }
  }

  async function handleDeleteQuartier(id) {
    if (!confirm('Supprimer ce quartier ?')) return
    await deleteDoc(doc(db, 'quartiers', id))
  }

  return (
    <div>
      <AdminNav />
      <h1 className="text-xl font-bold text-texte mb-6">Paramètres</h1>

      <form onSubmit={handleSave} className="space-y-5 mb-8">
        {/* Infos commerce */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-texte">Informations du commerce</h2>
          <div>
            <label className="block text-sm font-medium text-texte mb-1">Nom du business</label>
            <input type="text" value={form.nomBusiness} onChange={e => setForm(f => ({ ...f, nomBusiness: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-bleu/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-texte mb-1">Numéro WhatsApp admin</label>
            <input type="text" value={form.whatsappAdmin} onChange={e => setForm(f => ({ ...f, whatsappAdmin: e.target.value }))}
              placeholder="Ex: 2250700000000"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-bleu/30" />
            <p className="text-xs text-gray-400 mt-1">Format international sans +. Ex : 2250700000000</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-texte mb-1">Clé API CallMeBot</label>
            <input type="text" value={form.callmebotApiKey} onChange={e => setForm(f => ({ ...f, callmebotApiKey: e.target.value }))}
              placeholder="Ex: 1234567"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-bleu/30" />
            <p className="text-xs text-gray-400 mt-1">
              Activez CallMeBot : envoyez <strong>«&nbsp;I allow callmebot to send me messages&nbsp;»</strong> au +34 644 60 49 23 sur WhatsApp.
            </p>
          </div>
          {/* Test WhatsApp */}
          <div>
            <button type="button" onClick={handleTestWhatsApp} disabled={testLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium hover:bg-green-100 transition disabled:opacity-60">
              {testLoading ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
              Tester la notification WhatsApp
            </button>
            {testResult && <p className="text-sm mt-2">{testResult}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-texte mb-1">Logo</label>
            {config.logoUrl && <img src={config.logoUrl} alt="logo" className="h-16 rounded-lg mb-2 object-contain" />}
            <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} className="text-sm" />
          </div>
        </div>

        {/* Centre carte */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-texte">Centre de la carte par défaut</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Latitude', name: 'lat', placeholder: '5.3599' },
              { label: 'Longitude', name: 'lng', placeholder: '-3.9870' },
              { label: 'Zoom', name: 'zoom', placeholder: '13' },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-xs font-medium text-texte mb-1">{f.label}</label>
                <input type="number" step="any" value={form[f.name]}
                  onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-bleu/30" />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">Défaut : Cocody, Abidjan (5.3599, -3.9870, zoom 13)</p>
        </div>

        <button type="submit" disabled={loading}
          className={`w-full py-3 rounded-xl font-bold text-white transition flex items-center justify-center gap-2 disabled:opacity-60 ${saved ? 'bg-vert' : 'bg-bleu hover:bg-bleu-dark'}`}>
          {loading ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
          {loading ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Sauvegarder'}
        </button>
      </form>

      {/* Gestion quartiers */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-texte">Quartiers & frais de livraison</h2>
          <button onClick={ouvrirNouveauQuartier}
            className="flex items-center gap-1 bg-bleu text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-bleu-dark transition">
            <Plus size={15} /> Ajouter
          </button>
        </div>
        <div className="space-y-2">
          {quartiers.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucun quartier configuré.</p>}
          {quartiers.map(q => (
            <div key={q.id} className={`flex items-center justify-between p-3 rounded-xl border ${q.actif ? 'border-gray-100 bg-gray-50' : 'border-gray-100 bg-gray-50 opacity-50'}`}>
              <div>
                <p className="font-medium text-texte text-sm">{q.nom}</p>
                <p className="text-xs text-gray-400">
                  {q.fraisLivraison > 0 ? `${q.fraisLivraison.toLocaleString()} FCFA` : 'Gratuit'} · {q.actif ? 'Actif' : 'Inactif'}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => ouvrirModifierQuartier(q)} className="text-gray-400 hover:text-bleu transition"><Pencil size={16} /></button>
                <button onClick={() => handleDeleteQuartier(q.id)} className="text-gray-400 hover:text-red-500 transition"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal quartier */}
      {modalQ && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-texte">{modalQ.mode === 'new' ? 'Nouveau quartier' : 'Modifier le quartier'}</h2>
              <button onClick={() => setModalQ(null)}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-texte mb-1">Nom du quartier *</label>
                <input type="text" value={formQ.nom} onChange={e => setFormQ(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex: Cocody Angré"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-bleu/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-texte mb-1">Frais de livraison (FCFA)</label>
                <input type="number" value={formQ.fraisLivraison} onChange={e => setFormQ(f => ({ ...f, fraisLivraison: e.target.value }))}
                  placeholder="0 = gratuit"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-bleu/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-texte mb-1">Ordre d'affichage</label>
                <input type="number" value={formQ.ordre} onChange={e => setFormQ(f => ({ ...f, ordre: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-bleu/30" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formQ.actif} onChange={e => setFormQ(f => ({ ...f, actif: e.target.checked }))} className="w-4 h-4 accent-bleu" />
                <span className="text-sm text-texte">Quartier actif (visible pour les clients)</span>
              </label>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={() => setModalQ(null)} className="flex-1 border border-gray-200 text-texte py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">Annuler</button>
              <button onClick={handleSaveQuartier} disabled={loadingQ}
                className="flex-1 bg-bleu text-white py-2.5 rounded-xl text-sm font-medium hover:bg-bleu-dark transition flex items-center justify-center gap-2 disabled:opacity-60">
                {loadingQ ? <Loader size={16} className="animate-spin" /> : null}
                {loadingQ ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
