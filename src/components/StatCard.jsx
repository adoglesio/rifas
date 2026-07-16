export default function StatCard({ label, value, accent = 'gold' }) {
  const accentClass = accent === 'red' ? 'text-red' : accent === 'green' ? 'text-green' : 'text-gold'

  return (
    <div className="ticket-card px-5 pt-6 pb-5">
      <p className="text-xs uppercase tracking-widest text-muted font-mono mb-2">{label}</p>
      <p className={`font-display text-3xl font-semibold ${accentClass}`}>{value}</p>
    </div>
  )
}
