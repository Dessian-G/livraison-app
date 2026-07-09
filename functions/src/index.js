const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const admin = require('firebase-admin')
const axios = require('axios')

admin.initializeApp()

exports.notifierNouvelleCommande = onDocumentCreated('commandes/{commandeId}', async (event) => {
  const commande = event.data.data()
  const commandeId = event.params.commandeId

  // Récupérer la config (nom business + numéro WhatsApp admin)
  const configSnap = await admin.firestore().doc('parametres/config').get()
  const config = configSnap.data()

  if (!config?.whatsappAdmin || !config?.callmebotApiKey) {
    console.log('WhatsApp non configuré — callmebotApiKey manquante dans parametres/config')
    return
  }

  const { client, articles, total } = commande

  // Construire la liste des articles
  const lignesArticles = (articles || [])
    .map(a => `- ${a.quantite}x ${a.nom} — ${(a.prix * a.quantite).toLocaleString('fr-FR')} FCFA`)
    .join('\n')

  const positionLigne = client?.position
    ? `Position : https://maps.google.com/?q=${client.position.lat},${client.position.lng}`
    : 'Position : non renseignée'

  const message = [
    `🛒 NOUVELLE COMMANDE — ${config.nomBusiness}`,
    `Client : ${client?.nom} (${client?.telephone})`,
    `Quartier : ${client?.quartier}`,
    client?.description ? `Repère : ${client.description}` : null,
    positionLigne,
    '',
    'Articles :',
    lignesArticles,
    `TOTAL : ${(total || 0).toLocaleString('fr-FR')} FCFA`,
  ].filter(l => l !== null).join('\n')

  try {
    const phone = config.whatsappAdmin
    const apiKey = config.callmebotApiKey
    const encodedMsg = encodeURIComponent(message)
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodedMsg}&apikey=${apiKey}`

    await axios.get(url, { timeout: 10000 })
    await event.data.ref.update({ notifEnvoyee: true })
    console.log(`Notification WhatsApp envoyée pour commande ${commandeId}`)
  } catch (err) {
    console.error('Erreur envoi WhatsApp:', err.message)
    // On ne bloque pas — la commande est bien enregistrée
  }
})
