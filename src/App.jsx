import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PanierProvider } from './contexts/PanierContext'
import { ConfigProvider } from './contexts/ConfigContext'
import { RequireRole } from './components/RouteGuard'
import Header from './components/Header'
import Footer from './components/Footer'

import Catalogue from './pages/client/Catalogue'
import DetailProduit from './pages/client/DetailProduit'
import Panier from './pages/client/Panier'
import FormCommande from './pages/client/FormCommande'
import Confirmation from './pages/client/Confirmation'
import Suivi from './pages/client/Suivi'

import Connexion from './pages/Connexion'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProduits from './pages/admin/AdminProduits'
import AdminCommandes from './pages/admin/AdminCommandes'
import AdminLivreurs from './pages/admin/AdminLivreurs'
import AdminParametres from './pages/admin/AdminParametres'

import LivreurCommandes from './pages/livreur/LivreurCommandes'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfigProvider>
          <PanierProvider>
            <div className="min-h-screen bg-gris-bg">
              <Header />
              <main className="max-w-4xl mx-auto px-4 py-6">
                <Routes>
                  {/* Client */}
                  <Route path="/" element={<Catalogue />} />
                  <Route path="/produit/:id" element={<DetailProduit />} />
                  <Route path="/panier" element={<Panier />} />
                  <Route path="/commande" element={<FormCommande />} />
                  <Route path="/confirmation/:id" element={<Confirmation />} />
                  <Route path="/suivi/:id" element={<Suivi />} />

                  {/* Auth */}
                  <Route path="/connexion" element={<Connexion />} />

                  {/* Admin */}
                  <Route path="/admin" element={<RequireRole role="admin"><AdminDashboard /></RequireRole>} />
                  <Route path="/admin/produits" element={<RequireRole role="admin"><AdminProduits /></RequireRole>} />
                  <Route path="/admin/commandes" element={<RequireRole role="admin"><AdminCommandes /></RequireRole>} />
                  <Route path="/admin/livreurs" element={<RequireRole role="admin"><AdminLivreurs /></RequireRole>} />
                  <Route path="/admin/parametres" element={<RequireRole role="admin"><AdminParametres /></RequireRole>} />

                  {/* Livreur */}
                  <Route path="/livreur" element={<RequireRole role="livreur"><LivreurCommandes /></RequireRole>} />
                  <Route path="/livreur/commandes" element={<RequireRole role="livreur"><LivreurCommandes /></RequireRole>} />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </PanierProvider>
        </ConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
