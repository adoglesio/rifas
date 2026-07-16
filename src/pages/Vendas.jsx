import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatCurrency, formatCpf, formatDateTime, onlyDigits } from '../utils/format'
import { exportVendasExcel, exportVendasPdf } from '../utils/export'

const FILTROS_VAZIOS = {
  compradorCpf: '',
  compradorNome: '',
  vendedorCpf: '',
  vendedorNome: '',
  produtoNome: '',
  dataInicial: '',
  dataFinal: '',
}

export default function Vendas() {
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS)
  const [vendas, setVendas] = useState([])
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('produtos').select('nome').then(({ data }) => data && setProdutos(data))
    buscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function buscar() {
    setLoading(true)
    let query = supabase.from('vendas_detalhadas').select('*').order('data_venda', { ascending: false })

    if (filtros.compradorCpf) query = query.eq('comprador_cpf', onlyDigits(filtros.compradorCpf))
    if (filtros.compradorNome) query = query.ilike('comprador_nome', `%${filtros.compradorNome}%`)
    if (filtros.vendedorCpf) query = query.eq('vendedor_cpf', onlyDigits(filtros.vendedorCpf))
    if (filtros.vendedorNome) query = query.ilike('vendedor_nome', `%${filtros.vendedorNome}%`)
    if (filtros.produtoNome) query = query.eq('produto_nome', filtros.produtoNome)
    if (filtros.dataInicial) query = query.gte('data_venda', `${filtros.dataInicial}T00:00:00`)
    if (filtros.dataFinal) query = query.lte('data_venda', `${filtros.dataFinal}T23:59:59`)

    const { data, error } = await query.limit(1000)
    if (!error) setVendas(data || [])
    setLoading(false)
  }

  function limpar() {
    setFiltros(FILTROS_VAZIOS)
  }

  const resumoPorProduto = useMemo(() => {
    const mapa = {}
    vendas.forEach((v) => {
      mapa[v.produto_nome] = (mapa[v.produto_nome] || 0) + 1
    })
    return mapa
  }, [vendas])

  const totalValor = useMemo(() => vendas.reduce((acc, v) => acc + Number(v.valor || 0), 0), [vendas])

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs tracking-widest text-gold uppercase mb-1">Consulta</p>
          <h2 className="font-display text-3xl font-semibold text-cream">Vendas</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportVendasExcel(vendas)}
            disabled={vendas.length === 0}
            className="px-4 py-2 text-sm rounded-md border border-border text-cream hover:border-gold transition-colors disabled:opacity-40"
          >
            Exportar Excel
          </button>
          <button
            onClick={() => exportVendasPdf(vendas)}
            disabled={vendas.length === 0}
            className="px-4 py-2 text-sm rounded-md border border-border text-cream hover:border-gold transition-colors disabled:opacity-40"
          >
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="ticket-card px-5 pt-6 pb-5 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <Campo label="CPF comprador" value={filtros.compradorCpf} onChange={(v) => setFiltros({ ...filtros, compradorCpf: v })} />
          <Campo label="Nome comprador" value={filtros.compradorNome} onChange={(v) => setFiltros({ ...filtros, compradorNome: v })} />
          <Campo label="CPF vendedor" value={filtros.vendedorCpf} onChange={(v) => setFiltros({ ...filtros, vendedorCpf: v })} />
          <Campo label="Nome vendedor" value={filtros.vendedorNome} onChange={(v) => setFiltros({ ...filtros, vendedorNome: v })} />
          <div>
            <label className="block text-xs text-muted mb-1.5">Produto</label>
            <select
              value={filtros.produtoNome}
              onChange={(e) => setFiltros({ ...filtros, produtoNome: e.target.value })}
              className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm text-cream focus:border-gold outline-none"
            >
              <option value="">Todos</option>
              {produtos.map((p) => (
                <option key={p.nome} value={p.nome}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
          <Campo label="Data inicial" type="date" value={filtros.dataInicial} onChange={(v) => setFiltros({ ...filtros, dataInicial: v })} />
          <Campo label="Data final" type="date" value={filtros.dataFinal} onChange={(v) => setFiltros({ ...filtros, dataFinal: v })} />
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={buscar}
            className="px-5 py-2 text-sm rounded-md bg-gold text-base font-semibold hover:bg-gold/90 transition-colors"
          >
            Filtrar
          </button>
          <button onClick={limpar} className="px-5 py-2 text-sm rounded-md text-muted hover:text-cream transition-colors">
            Limpar
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <Badge label={`${vendas.length} venda(s)`} />
        <Badge label={formatCurrency(totalValor)} accent="green" />
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
              <th className="px-4 py-3">Comprador</th>
              <th className="px-4 py-3">CPF</th>
              <th className="px-4 py-3">Vendedor</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">
                  carregando…
                </td>
              </tr>
            ) : vendas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">
                  Nenhuma venda encontrada.
                </td>
              </tr>
            ) : (
              vendas.map((v) => (
                <tr key={v.venda_id} className="border-b border-border/50 hover:bg-surface2">
                  <td className="px-4 py-3 font-mono text-xs text-muted">{formatDateTime(v.data_venda)}</td>
                  <td className="px-4 py-3">{v.produto_nome}</td>
                  <td className="px-4 py-3 font-mono text-gold">{formatCurrency(v.valor)}</td>
                  <td className="px-4 py-3">{v.comprador_nome}</td>
                  <td className="px-4 py-3 font-mono text-xs">{formatCpf(v.comprador_cpf)}</td>
                  <td className="px-4 py-3">{v.vendedor_nome}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Campo({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm text-cream focus:border-gold outline-none"
      />
    </div>
  )
}

function Badge({ label, accent }) {
  const color = accent === 'green' ? 'text-green border-green/40' : 'text-cream border-border'
  return <span className={`px-3 py-1.5 rounded-full border font-mono text-xs ${color}`}>{label}</span>
}
