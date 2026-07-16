import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatCurrency } from '../utils/format'

const VAZIO = { nome: '', valor: '' }

export default function Produtos() {
  const [produtos, setProdutos] = useState([])
  const [form, setForm] = useState(VAZIO)
  const [editandoId, setEditandoId] = useState(null)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  async function carregar() {
    const { data } = await supabase.from('produtos').select('*').order('nome')
    setProdutos(data || [])
  }

  useEffect(() => {
    carregar()
  }, [])

  function iniciarEdicao(p) {
    setEditandoId(p.id)
    setForm({ nome: p.nome, valor: String(p.valor) })
    setErro('')
    setMensagem('')
  }

  function cancelar() {
    setEditandoId(null)
    setForm(VAZIO)
    setErro('')
  }

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    setMensagem('')

    const nome = form.nome.trim()
    const valor = Number(String(form.valor).replace(',', '.'))

    if (!nome) return setErro('Informe o nome do produto.')
    if (!valor || valor <= 0) return setErro('Informe um valor válido, maior que zero.')

    if (editandoId) {
      const { error } = await supabase.from('produtos').update({ nome, valor }).eq('id', editandoId)
      if (error) return setErro(error.message.includes('duplicate') ? 'Já existe um produto com esse nome.' : error.message)
      setMensagem('Produto atualizado.')
    } else {
      const { error } = await supabase.from('produtos').insert({ nome, valor, ativo: true })
      if (error) return setErro(error.message.includes('duplicate') ? 'Já existe um produto com esse nome.' : error.message)
      setMensagem('Produto cadastrado.')
    }

    cancelar()
    carregar()
  }

  async function alternarAtivo(p) {
    await supabase.from('produtos').update({ ativo: !p.ativo }).eq('id', p.id)
    carregar()
  }

  async function excluir(p) {
    if (!confirm(`Excluir "${p.nome}" definitivamente? Isso só funciona se nunca teve venda registrada.`)) return

    const { error } = await supabase.from('produtos').delete().eq('id', p.id)
    if (error) {
      if (error.message.includes('foreign key') || error.code === '23503') {
        alert(`Não dá pra excluir "${p.nome}" porque já existem vendas registradas com ele. Use "desativar" em vez disso — assim ele some das novas vendas mas o histórico continua íntegro.`)
      } else {
        alert(`Erro ao excluir: ${error.message}`)
      }
      return
    }
    carregar()
  }

  return (
    <div>
      <div className="mb-6">
        <p className="font-mono text-xs tracking-widest text-gold uppercase mb-1">Gerenciamento</p>
        <h2 className="font-display text-3xl font-semibold text-cream">Produtos</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={salvar} className="ticket-card px-5 pt-7 pb-5 h-fit lg:col-span-1 space-y-3">
          <h3 className="font-display text-lg text-cream mb-1">
            {editandoId ? 'Editar produto' : 'Cadastrar produto'}
          </h3>

          <div>
            <label className="block text-xs text-muted mb-1.5">Nome</label>
            <input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: Combo, Cartela, Almoço"
              className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm text-cream focus:border-gold outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1.5">Valor (R$)</label>
            <input
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              placeholder="Ex: 25.00"
              inputMode="decimal"
              className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm text-cream focus:border-gold outline-none"
            />
          </div>

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
          <div className="ticket-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted font-mono text-xs uppercase">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted">
                      Nenhum produto cadastrado ainda.
                    </td>
                  </tr>
                ) : (
                  produtos.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-surface2">
                      <td className="px-4 py-3">{p.nome}</td>
                      <td className="px-4 py-3 font-mono text-gold">{formatCurrency(p.valor)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono ${p.ativo ? 'text-green' : 'text-red'}`}>
                          {p.ativo ? 'ativo' : 'desativado'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-3 text-xs">
                        <button onClick={() => iniciarEdicao(p)} className="text-muted hover:text-gold">
                          editar
                        </button>
                        <button onClick={() => alternarAtivo(p)} className="text-muted hover:text-gold">
                          {p.ativo ? 'desativar' : 'reativar'}
                        </button>
                        <button onClick={() => excluir(p)} className="text-muted hover:text-red">
                          excluir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted mt-3">
            Produtos "desativados" somem da tela de venda do app, mas continuam aparecendo no histórico de vendas
            antigas. Só é possível excluir de verdade um produto que nunca teve venda registrada.
          </p>
        </div>
      </div>
    </div>
  )
}
