import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import StatCard from '../components/StatCard'
import { formatCurrency } from '../utils/format'

export default function Painel() {
  const [totais, setTotais] = useState(null)
  const [porProduto, setPorProduto] = useState([])

  async function fetchTudo() {
    const [totaisRes, produtoRes] = await Promise.all([
      supabase.from('painel_totais').select('*').single(),
      supabase.from('vendas_por_produto').select('*').order('produto'),
    ])
    if (!totaisRes.error) setTotais(totaisRes.data)
    if (!produtoRes.error) setPorProduto(produtoRes.data || [])
  }

  useEffect(() => {
    fetchTudo()

    const channel = supabase
      .channel('painel-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendas' }, fetchTudo)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'compradores' }, fetchTudo)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendedores' }, fetchTudo)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, fetchTudo)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-xs tracking-widest text-gold uppercase mb-1">Tempo real</p>
        <h2 className="font-display text-3xl font-semibold text-cream">Painel inicial</h2>
      </div>

      {!totais ? (
        <p className="text-muted text-sm">carregando…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            <StatCard label="Total de vendas" value={totais.total_vendas} />
            <StatCard
              label="Valor arrecadado"
              value={formatCurrency(totais.valor_total_arrecadado)}
              accent="green"
            />
            <StatCard label="Compradores cadastrados" value={totais.total_compradores} />
            <StatCard label="Vendedores ativos" value={totais.total_vendedores_ativos} accent="red" />
          </div>

          {porProduto.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {porProduto.map((p) => (
                <StatCard key={p.produto} label={`${p.produto} vendidos`} value={p.quantidade} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
