import { db } from './config'
import { doc, setDoc, collection, addDoc, getDoc, Timestamp } from 'firebase/firestore'

export async function seedIfNeeded() {
  try {
    const configRef = doc(db, 'parametres', 'config')
    const configSnap = await getDoc(configRef)

    if (!configSnap.exists()) {
      await setDoc(configRef, {
        nomBusiness: 'Mon Commerce',
        whatsappAdmin: '2250700000000',
        callmebotApiKey: '',
        carteCentre: { lat: 5.3599, lng: -3.9870, zoom: 13 },
        logoUrl: null,
      })

      // Compteur de commandes
      await setDoc(doc(db, 'compteurs', 'commandes'), { dernierNumero: 0 })

      // Quartiers de démonstration
      const quartiers = [
        { nom: 'Cocody Angré', fraisLivraison: 1000, actif: true, ordre: 1 },
        { nom: 'Cocody Riviera', fraisLivraison: 1500, actif: true, ordre: 2 },
        { nom: 'Plateau', fraisLivraison: 2000, actif: true, ordre: 3 },
        { nom: 'Adjamé', fraisLivraison: 1500, actif: true, ordre: 4 },
        { nom: 'Yopougon', fraisLivraison: 2500, actif: true, ordre: 5 },
        { nom: 'Marcory', fraisLivraison: 2000, actif: true, ordre: 6 },
        { nom: 'Treichville', fraisLivraison: 2000, actif: true, ordre: 7 },
        { nom: 'Abobo', fraisLivraison: 2500, actif: true, ordre: 8 },
      ]
      for (const q of quartiers) {
        await addDoc(collection(db, 'quartiers'), q)
      }

      // Produits de démonstration
      const produits = [
        { nom: 'Riz Parfumé 5kg', description: 'Riz de qualité supérieure, idéal pour toutes vos recettes.', prix: 3500, imageUrl: '', categorie: 'Épicerie', stock: 50, actif: true, creeLe: Timestamp.now() },
        { nom: 'Huile Palme 1L', description: 'Huile de palme pure et naturelle.', prix: 1200, imageUrl: '', categorie: 'Épicerie', stock: 100, actif: true, creeLe: Timestamp.now() },
        { nom: 'Poulet Entier', description: 'Poulet frais du jour, livré rapidement.', prix: 5000, imageUrl: '', categorie: 'Viandes', stock: 20, actif: true, creeLe: Timestamp.now() },
        { nom: 'Tomate Fraîche 1kg', description: 'Tomates fraîches cueillis ce matin.', prix: 800, imageUrl: '', categorie: 'Légumes', stock: null, actif: true, creeLe: Timestamp.now() },
        { nom: 'Eau Minérale 1.5L', description: 'Eau minérale naturelle.', prix: 500, imageUrl: '', categorie: 'Boissons', stock: 200, actif: true, creeLe: Timestamp.now() },
      ]
      for (const p of produits) {
        await addDoc(collection(db, 'produits'), p)
      }
    }
  } catch {
    // Silencieux si non authentifié au premier chargement
  }
}
