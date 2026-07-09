import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, ClipboardList, Truck, Settings } from 'lucide-react'

const links = [
  { to: '/admin', icon: <LayoutDashboard size={16} />, label: 'Dashboard', end: true },
  { to: '/admin/commandes', icon: <ClipboardList size={16} />, label: 'Commandes' },
  { to: '/admin/produits', icon: <Package size={16} />, label: 'Produits' },
  { to: '/admin/livreurs', icon: <Truck size={16} />, label: 'Livreurs' },
  { to: '/admin/parametres', icon: <Settings size={16} />, label: 'Paramètres' },
]

export default function AdminNav() {
  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 mb-6">
      {links.map(l => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${isActive ? 'bg-orange text-white' : 'bg-white text-texte hover:bg-orange/10'}`
          }
        >
          {l.icon} {l.label}
        </NavLink>
      ))}
    </nav>
  )
}
