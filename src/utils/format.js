export function formatCurrency(value) {
  return (Number(value) || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function formatCpf(cpf) {
  if (!cpf) return ''
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return cpf
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function onlyDigits(str) {
  return (str || '').replace(/\D/g, '')
}

export function formatDateTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('pt-BR')
}

export function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('pt-BR')
}

export function isValidCpf(cpf) {
  const digits = onlyDigits(cpf)
  return digits.length === 11
}

export function isValidPhone(phone) {
  const digits = onlyDigits(phone)
  return digits.length >= 10 && digits.length <= 11
}
