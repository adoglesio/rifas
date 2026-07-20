import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { criarLoginVendedor } from '../lib/criarLoginVendedor'
import { excluirVendedorCompleto } from '../lib/excluirVendedor'
import {
  formatCpf,
  formatCurrency,
  formatDateTime,
  onlyDigits,
  isValidCpf,
  isValidPhone,
} from '../utils/format'

const VAZIO = { nome: '', cpf: '', telefone: '', email: '', senha: '' }

export default function Vendedores() {
  const [vendedores, setVendedores] = useState([])
  const [busca, setBusca] = useState('')
  const [form, setForm] = useState(VAZIO)
  const [editandoId, setEditandoId] = useState(null)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [historicoDe, setHistoricoDe] = useState(null)
  const [historico, setHistorico] = useState([])
  const [mostrarSenha, setMostrarSenha] = useState(false)

  async function carregar() {
    const { data } = await supabase.from('vendedores').select('*').order('nome')
    setVendedores(data || [])
  }

  useEffect(() => {
    carregar()
  }, [])

  function iniciarEdicao(v) {
    setEditandoId(v.id)
    setForm({ nome: v.nome, cpf: formatCpf(v.cpf), telefone: v.telefone, email: v.email, senha: '' })
    setErro('')
    setMensagem('')
  }

  function cancelar() {
    setEditandoId(null)
    setForm(VAZIO)
    setErro('')
    setMostrarSenha(false)
  }

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    setMensagem('')

    if (!isValidCpf(form.cpf)) return setErro('CPF inválido — use 11 dígitos.')
    if (!isValidPhone(form.telefone)) return setErro('Telefone inválido.')
    if (!form.email.includes('@')) return setErro('E-mail inválido.')
    if (!editandoId && form.senha && form.senha.length < 6) {
      return setErro('A senha precisa ter pelo menos 6 caracteres (ou deixe em branco).')
    }

    const email = form.email.trim().toLowerCase()
    const payload = {
      nome: form.nome.trim(),
      cpf: onlyDigits(form.cpf),
      telefone: onlyDigits(form.telefone),
      email,
    }

    if (editandoId) {
      const { error } = await supabase.from('vendedores').update(payload).eq('id', editandoId)
      if (error) return setErro(error.message.includes('duplicate') ? 'CPF ou e-mail já cadastrado.' : error.message)
      setMensagem('Vendedor atualizado.')
      cancelar()
      carregar()
      return
    }

    // cadastro novo: se veio senha, já cria o login (vendedor entra direto no app)
    if (form.senha) {
      const { data: authData, error: authError } = await criarLoginVendedor(email, form.senha)

      if (authError) {
        return setErro(
          authError.message?.toLowerCase().includes('registered')
            ? 'Já existe um login com esse e-mail. Deixe a senha em branco pra vincular ao login existente, ou use outro e-mail.'
            : `Não foi possível criar o login: ${authError.message}`
        )
      }

      const { error } = await supabase
        .from('vendedores')
        .insert({ ...payload, auth_user_id: authData.user?.id })

      if (error) return setErro(error.message.includes('duplicate') ? 'CPF ou e-mail já cadastrado.' : error.message)
      setMensagem(`Vendedor cadastrado! Ele já pode entrar no app com o e-mail ${email} e a senha definida.`)
    } else {
      // sem senha: vendedor cria a própria senha no primeiro acesso do app
      const { error } = await supabase.from('vendedores').insert(payload)
      if (error) return setErro(error.message.includes('duplicate') ? 'CPF ou e-mail já cadastrado.' : error.message)
      setMensagem(
        `Vendedor cadastrado. Peça para ele abrir o app e criar a própria senha com o e-mail ${email} para liberar o acesso.`
      )
    }

    cancelar()
    carregar()
  }

  async function alternarAtivo(v) {
    await supabase.from('vendedores').update({ ativo: !v.ativo }).eq('id', v.id)
    carregar()
  }

  async function excluir(v) {
    if (!confirm(`Excluir "${v.nome}" definitivamente, incluindo o login dele? Isso só funciona se ele nunca fez nenhuma venda.`))
      return

    const { error } = await excluirVendedorCompleto(v.id)
    if (error) {
      alert(error.message)
      return
    }
    carregar()
  }

  async function enviarLinkSenha(v) {
    setErro('')
    setMensagem('')
    const { error } = await supabase.auth.resetPasswordForEmail(v.email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    if (error) return setErro(`Não foi possível enviar o link: ${error.message}`)
    setMensagem(`Link de redefinição enviado pro e-mail ${v.email}.`)
  }

  async function verHistorico(v) {
    setHistoricoDe(v)
    const { data } = await supabase
      .from('vendas_detalhadas')
      .select('*')
      .eq('vendedor_id', v.id)
      .order('data_venda', { ascending: false })
    setHistorico(data || [])
  }

  const filtrados = vendedores.filter(
    (v) => v.nome.toLowerCase().includes(busca.toLowerCase()) || v.cpf.includes(onlyDigits(busca))
  )

  return (
    <div>
      <div className="mb-6">
        <p className="font-mono text-xs tracking-widest text-gold uppercase mb-1">Gerenciamento</p>
        <h2 className="font-display text-3xl font-semibold text-cream">Vendedores</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={salvar} className="ticket-card px-5 pt-7 pb-5 h-fit lg:col-span-1 space-y-3">
          <h3 className="font-display text-lg text-cream mb-1">
            {editandoId ? 'Editar vendedor' : 'Cadastrar vendedor'}
          </h3>
          <Campo label="Nome completo" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} required />
          <Campo label="CPF" value={form.cpf} onChange={(v) => setForm({ ...form, cpf: v })} required />
          <Campo label="Telefone" value={form.telefone} onChange={(v) => setForm({ ...form, telefone: v })} required />
          <Campo
            label="E-mail (login)"
            type="email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            required
          />

          {!editandoId && (
            <div>
              <label className="block text-xs text-muted mb-1.5">Senha (opcional)</label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-md pl-3 pr-10 py-2 text-sm text-cream focus:border-gold outline-none"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setMostrarSenha((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-cream"
                  aria-label={mostrarSenha ? 'Esconder senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? <IconeOlhoFechado /> : <IconeOlho />}
                </button>
              </div>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                {form.senha
                  ? 'Vendedor já entra direto no app com essa senha.'
                  : 'Deixe em branco pra ele criar a própria senha no app (primeiro acesso).'}
              </p>
            </div>
          )}

          {erro && <p className="text-sm text-red">{erro}</p>}
          {mensagem && <p className="text-sm text-green">{mensagem}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="px-5 py-2 text-sm rounded-md bg-gold text-base font-semibold hover:bg-gold/90 transition-colors"
            >
              {editandoId ? 'Salvar alterações' : 'Cadastrar'}
            </button>
            {editandoId && (
              <button
                type="button"
                onClick={cancelar}
                className="px-5 py-2 text-sm rounded-md text-muted hover:text-cream transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="lg:col-span-2">
          <input
            placeholder="Buscar por nome ou CPF…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm text-cream focus:border-gold outline-none mb-4"
          />

          <div className="ticket-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted font-mono text-xs uppercase">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">CPF</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted">
                      Nenhum vendedor encontrado.
                    </td>
                  </tr>
                ) : (
                  filtrados.map((v) => (
                    <tr key={v.id} className="border-b border-border/50 hover:bg-surface2">
                      <td className="px-4 py-3">{v.nome}</td>
                      <td className="px-4 py-3 font-mono text-xs">{formatCpf(v.cpf)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono ${v.ativo ? 'text-green' : 'text-red'}`}>
                          {v.ativo ? 'ativo' : 'desativado'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-3 text-xs">
                        <button onClick={() => verHistorico(v)} className="text-muted hover:text-gold">
                          histórico
                        </button>
                        <button onClick={() => iniciarEdicao(v)} className="text-muted hover:text-gold">
                          editar
                        </button>
                        {v.auth_user_id && (
                          <button onClick={() => enviarLinkSenha(v)} className="text-muted hover:text-gold">
                            redefinir senha
                          </button>
                        )}
                        <button onClick={() => alternarAtivo(v)} className="text-muted hover:text-red">
                          {v.ativo ? 'desativar' : 'reativar'}
                        </button>
                        <button onClick={() => excluir(v)} className="text-muted hover:text-red">
                          excluir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {historicoDe && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50"
          onClick={() => setHistoricoDe(null)}
        >
          <div
            className="ticket-card max-w-2xl w-full max-h-[80vh] overflow-y-auto px-6 pt-8 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl text-cream mb-4">Histórico — {historicoDe.nome}</h3>
            {historico.length === 0 ? (
              <p className="text-muted text-sm">Nenhuma venda registrada.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted font-mono text-xs uppercase border-b border-border">
                    <th className="py-2">Data</th>
                    <th className="py-2">Produto</th>
                    <th className="py-2">Valor</th>
                    <th className="py-2">Comprador</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((h) => (
                    <tr key={h.venda_id} className="border-b border-border/40">
                      <td className="py-2 font-mono text-xs text-muted">{formatDateTime(h.data_venda)}</td>
                      <td className="py-2">{h.produto_nome}</td>
                      <td className="py-2 font-mono text-gold">{formatCurrency(h.valor)}</td>
                      <td className="py-2">{h.comprador_nome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button onClick={() => setHistoricoDe(null)} className="mt-5 text-sm text-muted hover:text-cream">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Campo({ label, value, onChange, type = 'text', required }) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1.5">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm text-cream focus:border-gold outline-none"
      />
    </div>
  )
}

function IconeOlho() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconeOlhoFechado() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 1 12s4 8 11 8a9.26 9.26 0 0 0 5.39-1.61M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  )
}
