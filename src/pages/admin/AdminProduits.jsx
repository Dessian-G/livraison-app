import { useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, orderBy, query } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Loader, Package } from 'lucide-react'
import AdminNav from '../../components/AdminNav'

const VIDE = { nom: '', description: '', prix: '', categorie: '', stock: '', actif: true, imageUrl: '' }

export default function AdminProduits() {
  const [produits, setProduits] = useState([])
  const [modal, setModal] = useState(null) // null | { mode: 'new'|'edit', data }
  const [form, setForm] = useState(VIDE)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'produits'), orderBy('creeLe', 'desc'))
    return onSnapshot(q, snap => setProduits(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [])

  function ouvrirNouveauProduit() {
    setForm(VIDE)
    setModal({ mode: 'new' })
  }

  function ouvrirModifierProduit(p) {
    setForm({ nom: p.nom, description: p.description, prix: String(p.prix), categorie: p.categorie || '', stock: p.stock !== null ? String(p.stock) : '', actif: p.actif, imageUrl: p.imageUrl || '' })
    setModal({ mode: 'edit', id: p.id })
  }

  async function handleSave() {
    if (!form.nom.trim() || !form.prix) return alert('Nom et prix obligatoires.')
    setLoading(true)
    try {
      const data = {
        nom: form.nom.trim(),
        description: form.description.trim(),
        prix: Number(form.prix),
        categorie: form.categorie.trim(),
        stock: form.stock === '' ? null : Number(form.stock),
        actif: form.actif,
        imageUrl: form.imageUrl.trim(),
      }
      if (modal.mode === 'new') {
        await addDoc(collection(db, 'produits'), { ...data, creeLe: Timestamp.now() })
      } else {
        await updateDoc(doc(db, 'produits', modal.id), data)
      }
      setModal(null)
    } catch (err) {
      console.error(err)
      alert('Erreur lors de la sauvegarde.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce produit ?')) return
    await deleteDoc(doc(db, 'produits', id))
  }

  async function toggleActif(p) {
    await updateDoc(doc(db, 'produits', p.id), { actif: !p.actif })
  }

  return (
    <div>
      <AdminNav />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-texte">Produits</h1>
        <button onClick={ouvrirNouveauProduit} className="flex items-center gap-1 bg-orange text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-dark transition">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="space-y-3">
        {produits.map(p => (
          <div key={p.id} className={`bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 ${!p.actif ? 'opacity-50' : ''}`}>
            {p.imageUrl
              ? <img src={p.imageUrl} alt={p.nom} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
              : <div className="w-14 h-14 rounded-lg bg-gris-bg flex items-center justify-center flex-shrink-0"><Package size={24} className="text-gray-300" /></div>
            }
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-texte text-sm truncate">{p.nom}</p>
              <p className="text-orange font-bold text-sm">{p.prix.toLocaleString()} FCFA</p>
              {p.categorie && <span className="text-xs text-gray-400">{p.categorie}</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleActif(p)} className="text-gray-400 hover:text-orange transition" title={p.actif ? 'Désactiver' : 'Activer'}>
                {p.actif ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
              <button onClick={() => ouvrirModifierProduit(p)} className="text-gray-400 hover:text-orange transition"><Pencil size={18} /></button>
              <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-500 transition"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-texte">{modal.mode === 'new' ? 'Nouveau produit' : 'Modifier le produit'}</h2>
              <button onClick={() => setModal(null)}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'Nom *', name: 'nom', placeholder: 'Nom du produit' },
                { label: 'Prix (FCFA) *', name: 'prix', type: 'number', placeholder: '0' },
                { label: 'Catégorie', name: 'categorie', placeholder: 'Ex: Épicerie' },
                { label: 'Stock (vide = illimité)', name: 'stock', type: 'number', placeholder: '' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-texte mb-1">{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    value={form[f.name]}
                    onChange={e => setForm(prev => ({ ...prev, [f.name]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange/30"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-texte mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange/30 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-texte mb-1">Lien de l'image (optionnel)</label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange/30"
                />
                {form.imageUrl && <img src={form.imageUrl} className="mt-2 h-20 rounded-lg object-cover" />}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.actif} onChange={e => setForm(f => ({ ...f, actif: e.target.checked }))} className="w-4 h-4 accent-orange" />
                <span className="text-sm text-texte">Produit visible (actif)</span>
              </label>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 text-texte py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">Annuler</button>
              <button onClick={handleSave} disabled={loading} className="flex-1 bg-orange text-white py-2.5 rounded-xl text-sm font-medium hover:bg-orange-dark transition flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <Loader size={16} className="animate-spin" /> : null}
                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
