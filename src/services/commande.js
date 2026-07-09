import { db } from '../firebase/config'
import {
  collection, doc, runTransaction, Timestamp, updateDoc
} from 'firebase/firestore'

/**
 * Crée une commande via transaction Firestore :
 * - Attribue un numéro CMD-XXXX (compteur atomique)
 * - Revalide les prix depuis Firestore
 * - Décrémente le stock
 * - Crée le document commande
 * Puis envoie la notification WhatsApp CallMeBot (non bloquant)
 */
export async function creerCommande({ articles, client, config }) {
  const commandeRef = doc(collection(db, 'commandes'))

  const result = await runTransaction(db, async (tx) => {
    // 1. Compteur → numéro
    const compteurRef = doc(db, 'compteurs', 'commandes')
    const compteurSnap = await tx.get(compteurRef)
    const dernierNumero = compteurSnap.exists() ? (compteurSnap.data().dernierNumero || 0) : 0
    const nouveauNumero = dernierNumero + 1
    const numero = `CMD-${String(nouveauNumero).padStart(4, '0')}`

    // 2. Revalider les prix et le stock
    const produitsSnaps = await Promise.all(
      articles.map(a => tx.get(doc(db, 'produits', a.produitId)))
    )

    let sousTotal = 0
    const articlesValides = []

    for (let i = 0; i < articles.length; i++) {
      const snap = produitsSnaps[i]
      if (!snap.exists()) throw new Error(`Produit introuvable : ${articles[i].nom}`)
      const produit = snap.data()
      if (!produit.actif) throw new Error(`Produit indisponible : ${produit.nom}`)
      if (produit.stock !== null && produit.stock < articles[i].quantite) {
        throw new Error(`Stock insuffisant pour : ${produit.nom}`)
      }
      const prixValide = produit.prix
      sousTotal += prixValide * articles[i].quantite
      articlesValides.push({ produitId: articles[i].produitId, nom: produit.nom, prix: prixValide, quantite: articles[i].quantite })
    }

    // 3. Frais de livraison depuis le quartier
    const fraisLivraison = client.fraisLivraison || 0
    const total = sousTotal + fraisLivraison

    // 4. Créer la commande
    tx.set(commandeRef, {
      numero,
      date: Timestamp.now(),
      client: {
        nom: client.nom,
        telephone: client.telephone,
        quartier: client.quartier,
        description: client.description || '',
        position: client.position || null,
      },
      articles: articlesValides,
      sousTotal,
      fraisLivraison,
      total,
      statut: 'en_attente',
      livreurId: null,
      annuleePar: null,
      notifEnvoyee: false,
    })

    // 5. Décrémenter le stock
    for (let i = 0; i < articles.length; i++) {
      const snap = produitsSnaps[i]
      if (snap.data().stock !== null) {
        tx.update(doc(db, 'produits', articles[i].produitId), {
          stock: snap.data().stock - articles[i].quantite
        })
      }
    }

    // 6. Incrémenter le compteur
    tx.set(compteurRef, { dernierNumero: nouveauNumero })

    return { commandeId: commandeRef.id, numero, sousTotal, fraisLivraison, total, articlesValides }
  })

  // 7. Notification WhatsApp CallMeBot (non bloquant)
  envoyerNotifWhatsApp(result, client, config).then(ok => {
    if (ok) updateDoc(commandeRef, { notifEnvoyee: true })
  }).catch(() => {})

  return result
}

async function envoyerNotifWhatsApp(commande, client, config) {
  const { whatsappAdmin, callmebotApiKey, nomBusiness } = config
  if (!whatsappAdmin || !callmebotApiKey) return false

  const lignesArticles = commande.articlesValides
    .map(a => `- ${a.quantite}x ${a.nom} — ${(a.prix * a.quantite).toLocaleString()} FCFA`)
    .join('\n')

  const positionLien = client.position
    ? `\nPosition : https://maps.google.com/?q=${client.position.lat},${client.position.lng}`
    : ''

  const message = `🛒 NOUVELLE COMMANDE ${commande.numero} — ${nomBusiness}
Client : ${client.nom} (${client.telephone})
Quartier : ${client.quartier}
Repère : ${client.description || '—'}${positionLien}

Articles :
${lignesArticles}
Livraison : ${commande.fraisLivraison.toLocaleString()} FCFA
TOTAL : ${commande.total.toLocaleString()} FCFA`

  const url = `https://api.callmebot.com/whatsapp.php?phone=${whatsappAdmin}&text=${encodeURIComponent(message)}&apikey=${callmebotApiKey}`

  const resp = await fetch(url)
  return resp.ok
}

/**
 * Annule une commande et restaure le stock
 */
export async function annulerCommande(commandeId, articles, annuleePar = 'admin') {
  await runTransaction(db, async (tx) => {
    const commandeRef = doc(db, 'commandes', commandeId)
    const snap = await tx.get(commandeRef)
    if (!snap.exists()) throw new Error('Commande introuvable')
    if (snap.data().statut !== 'en_attente') throw new Error('Impossible d\'annuler cette commande')

    tx.update(commandeRef, { statut: 'annulée', annuleePar })

    // Restaurer le stock
    for (const a of articles) {
      const prodRef = doc(db, 'produits', a.produitId)
      const prodSnap = await tx.get(prodRef)
      if (prodSnap.exists() && prodSnap.data().stock !== null) {
        tx.update(prodRef, { stock: prodSnap.data().stock + a.quantite })
      }
    }
  })
}
