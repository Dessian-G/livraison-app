import { useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { db } from '../../firebase/config'
import { firebaseConfig } from '../../firebase/config'

// Instance secondaire pour créer des comptes sans déconnecter l'admin
let secondaryApp
function getSecondaryAuth() {
  if (!secondaryApp) secondaryApp = initializeApp(firebaseConfig, 'secondary')
  return getAuth(secondaryApp)
}
import { Plus, Pencil, Trash2, Phone, X, Loader, Truck } from 'lucide-react'
import AdminNav from '../../components/AdminNav'

const VIDE = { nom: '', telephone: '', email: '', motDePasse: '', disponible: true }

export default function AdminLivreurs() {
  const [livreurs, setLivreurs] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(VIDE)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    return onSnapshot(collection(db, 'livreurs'), snap =>
      setLivreurs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [])

  function ouvrirNouveauLivreur() {
    setForm(VIDE)
    setModal({ mode: 'new' })
  }

  function ouvrirModifier(l) {
    setForm({ nom: l.nom, telephone: l.telephone, email: '', motDePasse: '', disponible: l.disponible })
    setModal({ mode: 'edit', id: l.id, uid: l.uid })
  }

  async function handleSave() {
    if (!form.nom.trim() || !form.telephone.trim()) return alert('Nom et téléphone obligatoires.')
    setLoading(true)
    try {
      if (modal.mode === 'new') {
        if (!form.email.trim() || !form.motDePasse) return alert('Email et mot de passe obligatoires pour créer un compte.')
        const cred = await createUserWithEmailAndPassword(getSecondaryAuth(), form.email.trim(), form.motDePasse)
        const uid = cred.user.uid
        await setDoc(doc(db, 'utilisateurs', uid), { role: 'livreur' })
        await addDoc(collection(db, 'livreurs'), { uid, nom: form.nom.trim(), telephone: form.telephone.trim(), disponible: true })
      } else {
        await updateDoc(doc(db, 'livreurs', modal.id), { nom: form.nom.trim(), telephone: form.telephone.trim(), disponible: form.disponible })
      }
      setModal(null)
    } catch (err) {
      console.error(err)
      alert(err.message || 'Erreur lors de la sauvegarde.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(l) {
    if (!confirm(`Supprimer ${l.nom} ?`)) return
    await deleteDoc(doc(db, 'livreurs', l.id))
  }

  return (
    <div>
      <AdminNav />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-texte">Livreurs</h1>
        <button onClick={ouvrirNouveauLivreur} className="flex items-center gap-1 bg-bleu text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-bleu-dark transition">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="space-y-3">
        {livreurs.length === 0 && <p className="text-gray-400 text-sm py-8 text-center">Aucun livreur enregistré.</p>}
        {livreurs.map(l => (
          <div key={l.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-bleu/10 flex items-center justify-center flex-shrink-0">
              <Truck size={18} className="text-bleu" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-texte text-sm">{l.nom}</p>
              <p className="text-gray-500 text-sm">{l.telephone}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${l.disponible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {l.disponible ? 'Disponible' : 'Indisponible'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a href={`tel:${l.telephone}`} className="text-gray-400 hover:text-vert transition" title="Appeler"><Phone size={18} /></a>
              <a href={`https://wa.me/${l.telephone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-vert transition" title="WhatsApp">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
              <button onClick={() => ouvrirModifier(l)} className="text-gray-400 hover:text-bleu transition"><Pencil size={18} /></button>
              <button onClick={() => handleDelete(l)} className="text-gray-400 hover:text-red-500 transition"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-texte">{modal.mode === 'new' ? 'Nouveau livreur' : 'Modifier le livreur'}</h2>
              <button onClick={() => setModal(null)}><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'Nom *', name: 'nom', placeholder: 'Nom du livreur' },
                { label: 'Téléphone *', name: 'telephone', type: 'tel', placeholder: '0700000000' },
                ...(modal.mode === 'new' ? [
                  { label: 'Email (compte connexion) *', name: 'email', type: 'email', placeholder: 'livreur@email.com' },
                  { label: 'Mot de passe *', name: 'motDePasse', type: 'password', placeholder: '••••••••' },
                ] : []),
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-texte mb-1">{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    value={form[f.name]}
                    onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-bleu/30"
                  />
                </div>
              ))}
              {modal.mode === 'edit' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.disponible} onChange={e => setForm(f => ({ ...f, disponible: e.target.checked }))} className="w-4 h-4 accent-bleu" />
                  <span className="text-sm text-texte">Disponible</span>
                </label>
              )}
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 text-texte py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">Annuler</button>
              <button onClick={handleSave} disabled={loading} className="flex-1 bg-bleu text-white py-2.5 rounded-xl text-sm font-medium hover:bg-bleu-dark transition flex items-center justify-center gap-2 disabled:opacity-60">
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
