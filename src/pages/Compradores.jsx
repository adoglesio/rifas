import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatCpf, formatCurrency, formatDateTime, onlyDigits } from '../utils/format'

export default function Compradores() {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const [selecionado, setSelecionado] = useState(null)
  const [historico, setHistorico] = useState([])
  const [buscando, setBuscando] = useState(false)

  useEffect(() => {
    buscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function buscar(e) {
    e?.preventDefault()
    setBuscando(true)
    setSelecionado(null)
    const digits = onlyDigits(busca)
    let query = supabase.from('compradores').select('*').order('nome')
    query = digits.length >= 11 ? query.eq('cpf', digits) : query.ilike('nome', `%${busca}%`)
    const { data } = await query.limit(200)
    setResultados(data || [])
    setBuscando(false)
  }

  async function selecionar(c) {
    setSelecionado(c)
    const { data } = await supabase
      .from('vendas_detalhadas')
      .select('*')
      .eq('comprador_id', c.id)
      .order('data_venda', { ascending: false })
    setHistorico(data || [])
  }

  const resumoPorProduto = historico.reduce((acc, h) => {
    acc[h.produto_nome] = (acc[h.produto_nome] || 0) + 1
    return acc
  }, {})

  const totalGasto = historico.reduce((acc, h) => acc + Number(h.valor || 0), 0)

  return (
    <div>
      <div className="mb-6">
        <p className="font-mono text-xs tracking-widest text-gold uppercase mb-1">Consulta</p>
        <h2 className="font-display text-3xl font-semibold text-cream">Compradores</h2>
      </div>

      <form onSubmit={buscar} className="flex gap-2 mb-6">
        <input
          placeholder="Buscar por CPF ou nome… (em branco mostra todos)"
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
            <p className="px-4 py-4 text-sm text-muted">Nenhum resultado ainda.</p>
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
              Selecione um comprador para ver os detalhes.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="ticket-card px-6 pt-7 pb-5">
                <h3 className="font-display text-xl text-cream mb-3">{selecionado.nome}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted mb-1">CPF</p>
                    <p className="font-mono">{formatCpf(selecionado.cpf)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Telefone</p>
                    <p className="font-mono">{selecionado.telefone}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Badge label={`${historico.length} compra(s)`} />
                <Badge label={formatCurrency(totalGasto)} accent="green" />
                {Object.entries(resumoPorProduto).map(([nome, qtd]) => (
                  <Badge key={nome} label={`${nome}: ${qtd}`} />
                ))}
              </div>

              <div className="ticket-card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted font-mono text-xs uppercase">
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Produto</th>
                      <th className="px-4 py-3">Valor</th>
                      <th className="px-4 py-3">Vendedor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map((h) => (
                      <tr key={h.venda_id} className="border-b border-border/50">
                        <td className="px-4 py-3 font-mono text-xs text-muted">{formatDateTime(h.data_venda)}</td>
                        <td className="px-4 py-3">{h.produto_nome}</td>
                        <td className="px-4 py-3 font-mono text-gold">{formatCurrency(h.valor)}</td>
                        <td className="px-4 py-3">{h.vendedor_nome}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Badge({ label, accent }) {
  const color = accent === 'green' ? 'text-green border-green/40' : 'text-cream border-border'
  return <span className={`px-3 py-1.5 rounded-full border font-mono text-xs ${color}`}>{label}</span>
}
