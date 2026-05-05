export const formatPrice = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '—'
  return '$' + Number(value).toFixed(2)
}

export const currentMonthYear = (): string => {
  return new Date().toISOString().slice(0, 7)
}

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
