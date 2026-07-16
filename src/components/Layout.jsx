import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import logoMaria from '../assets/logo-maria.png'

const LINKS = [
  { to: '/', label: 'Painel', num: '01' },
  { to: '/graficos', label: 'Gráficos', num: '02' },
  { to: '/vendas', label: 'Vendas', num: '03' },
  { to: '/vendedores', label: 'Vendedores', num: '04' },
  { to: '/compradores', label: 'Compradores', num: '05' },
  { to: '/produtos', label: 'Produtos', num: '06' },
]

export default function Layout({ children }) {
  const { adminNome, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-base">
      <aside className="w-64 shrink-0 border-r border-border flex flex-col">
        <div className="px-6 py-7 border-b border-border flex items-center gap-3">
          <img src={logoMaria} alt="" className="w-9 h-9 shrink-0" />
          <div>
            <p className="font-mono text-[11px] tracking-widest text-gold uppercase">Bilhete nº 001</p>
            <h1 className="font-display text-xl font-semibold text-cream mt-0.5">Rifa · Painel</h1>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-surface2 text-gold'
                    : 'text-muted hover:text-cream hover:bg-surface'
                }`
              }
            >
              <span className="font-mono text-xs opacity-60">{link.num}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <hr className="ticket-divider mx-3" />

        <div className="px-6 py-5">
          <p className="text-xs text-muted mb-2 truncate">{adminNome || 'Administrador'}</p>
          <button
            onClick={handleSignOut}
            className="text-sm text-red hover:text-cream transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  )
}
