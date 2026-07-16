import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import logoMaria from '../assets/logo-maria.png'

export default function Login() {
  const { session, isAdmin, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && session && isAdmin) {
      navigate('/', { replace: true })
    }
    if (!loading && session && isAdmin === false) {
      setError('Este usuário não tem acesso ao painel administrativo.')
    }
  }, [loading, session, isAdmin, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) setError('E-mail ou senha incorretos.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={logoMaria} alt="" className="w-16 h-16 mx-auto mb-4" />
          <p className="font-mono text-xs tracking-widest text-gold uppercase mb-2">
            Painel Administrativo
          </p>
          <h1 className="font-display text-3xl font-semibold text-cream">Olá, Salve Maria</h1>
        </div>

        <form onSubmit={handleSubmit} className="ticket-card px-6 pt-8 pb-6 space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1.5">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm text-cream focus:border-gold outline-none"
              placeholder="admin@exemplo.com"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm text-cream focus:border-gold outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gold text-base font-semibold py-2.5 rounded-md hover:bg-gold/90 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
