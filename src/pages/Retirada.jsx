import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatCpf, formatCurrency, formatDateTime, onlyDigits } from '../utils/format'

export default function Retirada() {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [selecionado, setSelecionado] = useState(null)
  const [itens, setItens] = useState([])
  const [salvandoId, setSalvandoId] = useState(null)

  async function buscar(e) {
    e?.preventDefault()
    setBuscando(true)
    setSelecionado(null)
    const digits = onlyDigits(busca)
    let query = supabase.from('compradores').select('*')
    query = digits.length >= 11 ? query.eq('cpf', digits) : query.ilike('nome', `%${busca}%`)
    const { data } = await query.limit(20)
    setResultados(data || [])
    setBuscando(false)
  }

  async function selecionar(c) {
    setSelecionado(c)
    const { data } = await supabase
      .from('vendas_detalhadas')
      .select('*')
      .eq('comprador_id', c.id)
      .order('produto_nome')
    setItens(data || [])
  }

  async function alternarRetirado(item) {
    setSalvandoId(item.venda_id)
    const novoValor = !item.retirado
    const { error } = await supabase
      .from('vendas')
      .update({ retirado: novoValor, retirado_em: novoValor ? new Date().toISOString() : null })
      .eq('id', item.venda_id)

    setSalvandoId(null)
    if (error) {
      alert(`Não foi possível atualizar: ${error.message}`)
      return
    }

    setItens((atual) =>
      atual.map((i) =>
        i.venda_id === item.venda_id
          ? { ...i, retirado: novoValor, retirado_em: novoValor ? new Date().toISOString() : null }
          : i
      )
    )
  }

  async function marcarTodos(valor) {
    const pendentes = itens.filter((i) => i.retirado !== valor)
    if (pendentes.length === 0) return

    const agora = valor ? new Date().toISOString() : null
    const { error } = await supabase
      .from('vendas')
      .update({ retirado: valor, retirado_em: agora })
      .in('id', pendentes.map((i) => i.venda_id))

    if (error) {
      alert(`Não foi possível atualizar: ${error.message}`)
      return
    }

    setItens((atual) => atual.map((i) => ({ ...i, retirado: valor, retirado_em: agora })))
  }

  const totalItens = itens.length
  const totalRetirados = itens.filter((i) => i.retirado).length

  return (
    <div>
      <div className="mb-6">
        <p className="font-mono text-xs tracking-widest text-gold uppercase mb-1">Ponto de retirada</p>
        <h2 className="font-display text-3xl font-semibold text-cream">Conferência de Retirada</h2>
      </div>

      <form onSubmit={buscar} className="flex gap-2 mb-6">
        <input
          autoFocus
          placeholder="Digite o CPF do comprador…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 bg-surface2 border border-border rounded-md px-3 py-2 text-sm text-cream focus:border-gold outline-none"
        />
        <button className="px-5 py-2 text-sm rounded-md bg-gold text-base font-semibold hover:bg-gold/90 transition-colors">
          Buscar
        </button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="ticket-card divide-y divide-border/50 lg:col-span-1 max-h-[70vh] overflow-y-auto">
          {buscando ? (
            <p className="px-4 py-4 text-sm text-muted">buscando…</p>
          ) : resultados.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted">Busque pelo CPF pra começar.</p>
          ) : (
            resultados.map((c) => (
              <button
                key={c.id}
                onClick={() => selecionar(c)}
                className={`w-full text-left px-4 py-3 hover:bg-surface2 transition-colors ${
                  selecionado?.id === c.id ? 'bg-surface2' : ''
                }`}
              >
                <p className="text-sm text-cream">{c.nome}</p>
                <p className="text-xs text-muted font-mono">{formatCpf(c.cpf)}</p>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {!selecionado ? (
            <div className="ticket-card px-6 py-10 text-center text-muted text-sm">
              Selecione um comprador pra ver os itens dele.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="ticket-card px-6 pt-7 pb-5">
                <h3 className="font-display text-xl text-cream mb-1">{selecionado.nome}</h3>
                <p className="text-xs text-muted font-mono">{formatCpf(selecionado.cpf)}</p>
              </div>

              {itens.length === 0 ? (
                <div className="ticket-card px-6 py-8 text-center text-muted text-sm">
                  Esse comprador não tem nenhuma compra registrada.
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted font-mono">
                      {totalRetirados} de {totalItens} itens retirados
                    </span>
                    <div className="space-x-3 text-xs">
                      <button onClick={() => marcarTodos(true)} className="text-gold hover:text-cream">
                        marcar tudo
                      </button>
                      <button onClick={() => marcarTodos(false)} className="text-muted hover:text-cream">
                        desmarcar tudo
                      </button>
                    </div>
                  </div>

                  <div className="ticket-card divide-y divide-border/50">
                    {itens.map((item) => (
                      <label
                        key={item.venda_id}
                        className="flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-surface2"
                      >
                        <input
                          type="checkbox"
                          checked={item.retirado}
                          disabled={salvandoId === item.venda_id}
                          onChange={() => alternarRetirado(item)}
                          className="w-5 h-5 accent-gold shrink-0"
                        />
                        <div className="flex-1">
                          <p className={`text-sm ${item.retirado ? 'text-muted line-through' : 'text-cream'}`}>
                            {item.quantidade}x {item.produto_nome}
                          </p>
                          <p className="text-xs text-muted font-mono mt-0.5">
                            {formatCurrency(item.valor)}
                            {item.retirado && item.retirado_em && ` · retirado em ${formatDateTime(item.retirado_em)}`}
                          </p>
                        </div>
                        {item.retirado && <span className="text-green text-xs font-mono shrink-0">✓ retirado</span>}
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
