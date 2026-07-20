import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import logoMaria from '../assets/logo-maria.png'

export default function RedefinirSenha() {
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.')
    if (senha !== confirmar) return setErro('As senhas não coincidem.')

    setSalvando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setSalvando(false)

    if (error) {
      setErro(
        error.message?.toLowerCase().includes('session')
          ? 'Link inválido ou expirado. Peça pro administrador enviar um novo link.'
          : error.message
      )
      return
    }

    setMensagem('Senha alterada! Já pode fechar esta janela e entrar no app com a senha nova.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={logoMaria} alt="" className="w-16 h-16 mx-auto mb-4" />
          <p className="font-mono text-xs tracking-widest text-gold uppercase mb-2">Redefinir senha</p>
          <h1 className="font-display text-3xl font-semibold text-cream">Olá, Salve Maria</h1>
        </div>

        <div className="ticket-card px-6 pt-8 pb-6">
          {mensagem ? (
            <p className="text-sm text-green text-center">{mensagem}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-muted mb-1.5">Nova senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="mín. 6 caracteres"
                  className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm text-cream focus:border-gold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5">Confirme a nova senha</label>
                <input
                  type="password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm text-cream focus:border-gold outline-none"
                />
              </div>

              {erro && <p className="text-sm text-red">{erro}</p>}

              <button
                type="submit"
                disabled={salvando}
                className="w-full bg-gold text-base font-semibold py-2.5 rounded-md hover:bg-gold/90 transition-colors disabled:opacity-50"
              >
                {salvando ? 'Salvando…' : 'Salvar nova senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
