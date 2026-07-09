import { createContext, useContext, useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

const ConfigContext = createContext(null)

const DEFAULT_CONFIG = {
  nomBusiness: 'Mon Commerce',
  whatsappAdmin: '',
  carteCentre: { lat: 5.3599, lng: -3.9870, zoom: 13 },
  logoUrl: null,
}

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'parametres', 'config'), (snap) => {
      if (snap.exists()) setConfig({ ...DEFAULT_CONFIG, ...snap.data() })
    })
    return unsub
  }, [])

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  )
}

export const useConfig = () => useContext(ConfigContext)
