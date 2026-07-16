import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { supabase } from '../lib/supabaseClient'
import { formatCurrency, formatDate } from '../utils/format'

const CORES = ['#C9A876', '#C1443C', '#6F9C6B', '#8B96AC']

export default function Graficos() {
  const [porDia, setPorDia] = useState([])
  const [porProduto, setPorProduto] = useState([])
  const [ranking, setRanking] = useState([])
  const [porMes, setPorMes] = useState([])

  useEffect(() => {
    async function load() {
      const [dia, produto, rank, mes] = await Promise.all([
        supabase.from('vendas_por_dia').select('*'),
        supabase.from('vendas_por_produto').select('*'),
        supabase.from('ranking_vendedores').select('*').limit(10),
        supabase.from('faturamento_por_mes').select('*'),
      ])
      if (dia.data) setPorDia(dia.data.map((d) => ({ ...d, dia: formatDate(d.dia) })))
      if (produto.data) setPorProduto(produto.data)
      if (rank.data) setRanking(rank.data)
      if (mes.data) setPorMes(mes.data.map((m) => ({ ...m, mes: formatDate(m.mes) })))
    }
    load()
  }, [])

  return (
    <div className="space-y-10">
      <div>
        <p className="font-mono text-xs tracking-widest text-gold uppercase mb-1">Em tempo real</p>
        <h2 className="font-display text-3xl font-semibold text-cream">Gráficos</h2>
      </div>

      <ChartCard title="Vendas por dia">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={porDia}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2C3A56" />
            <XAxis dataKey="dia" stroke="#8B96AC" fontSize={12} />
            <YAxis stroke="#8B96AC" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: '#141C30', border: '1px solid #2C3A56' }} />
            <Bar dataKey="quantidade" fill="#C9A876" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Vendas por produto">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={porProduto} dataKey="quantidade" nameKey="produto" outerRadius={90} label>
                {porProduto.map((_, i) => (
                  <Cell key={i} fill={CORES[i % CORES.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#141C30', border: '1px solid #2C3A56' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Ranking de vendedores">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ranking} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2C3A56" />
              <XAxis type="number" stroke="#8B96AC" fontSize={12} />
              <YAxis type="category" dataKey="vendedor_nome" stroke="#8B96AC" fontSize={11} width={110} />
              <Tooltip contentStyle={{ background: '#141C30', border: '1px solid #2C3A56' }} />
              <Bar dataKey="valor_total" fill="#C1443C" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Faturamento por período (evolução)">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={porMes}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2C3A56" />
            <XAxis dataKey="mes" stroke="#8B96AC" fontSize={12} />
            <YAxis
              stroke="#8B96AC"
              fontSize={12}
              tickFormatter={(v) => formatCurrency(v)}
              width={90}
            />
            <Tooltip
              formatter={(v) => formatCurrency(v)}
              contentStyle={{ background: '#141C30', border: '1px solid #2C3A56' }}
            />
            <Line type="monotone" dataKey="valor_total" stroke="#6F9C6B" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="ticket-card px-5 pt-7 pb-5">
      <h3 className="font-display text-lg text-cream mb-4">{title}</h3>
      {children}
    </div>
  )
}
