import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDateTime, formatCpf } from './format'

const COLUNAS = [
  { header: 'Data/Hora', key: 'data_venda', fmt: formatDateTime },
  { header: 'Produto', key: 'produto_nome' },
  { header: 'Valor', key: 'valor', fmt: formatCurrency },
  { header: 'Comprador', key: 'comprador_nome' },
  { header: 'CPF Comprador', key: 'comprador_cpf', fmt: formatCpf },
  { header: 'Telefone Comprador', key: 'comprador_telefone' },
  { header: 'Vendedor', key: 'vendedor_nome' },
  { header: 'CPF Vendedor', key: 'vendedor_cpf', fmt: formatCpf },
]

export function exportVendasExcel(vendas, nomeArquivo = 'vendas-rifa') {
  const linhas = vendas.map((v) => {
    const linha = {}
    COLUNAS.forEach((c) => {
      linha[c.header] = c.fmt ? c.fmt(v[c.key]) : v[c.key]
    })
    return linha
  })

  const planilha = XLSX.utils.json_to_sheet(linhas)
  const livro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(livro, planilha, 'Vendas')
  XLSX.writeFile(livro, `${nomeArquivo}.xlsx`)
}

export function exportVendasPdf(vendas, titulo = 'Relatório de Vendas — Rifa', nomeArquivo = 'vendas-rifa') {
  const doc = new jsPDF({ orientation: 'landscape' })

  doc.setFontSize(16)
  doc.text(titulo, 14, 15)
  doc.setFontSize(10)
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} · ${vendas.length} venda(s)`, 14, 21)

  const total = vendas.reduce((acc, v) => acc + Number(v.valor || 0), 0)

  autoTable(doc, {
    startY: 26,
    head: [COLUNAS.map((c) => c.header)],
    body: vendas.map((v) => COLUNAS.map((c) => (c.fmt ? c.fmt(v[c.key]) : v[c.key] || ''))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [193, 68, 60] },
    foot: [['', '', formatCurrency(total), '', '', '', '', '']],
    footStyles: { fillColor: [11, 18, 32], textColor: 255, fontStyle: 'bold' },
  })

  doc.save(`${nomeArquivo}.pdf`)
}
