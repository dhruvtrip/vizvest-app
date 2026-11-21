/**
 * Amount columns that older or variant Trading 212 exports write with the
 * currency in the header, e.g. `Total (GBP)` instead of `Total` plus a
 * `Currency (Total)` column.
 */
const SUFFIXABLE_COLUMNS = [
  'Total',
  'Result',
  'Currency conversion fee',
  'Withholding tax',
  'Stamp duty reserve tax',
  'Charge amount',
  'Deposit fee'
] as const

const SUFFIXED_HEADER = new RegExp(
  `^(${SUFFIXABLE_COLUMNS.map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}) \\(([A-Z]{3})\\)$`
)

interface SuffixedColumn {
  header: string
  column: string
  currency: string
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '')
}

/**
 * Maps suffixed amount headers (`X (CCC)`, CCC = three capital letters) to the
 * plain `X` the rest of the app reads, and fills `Currency (X)` with CCC on each
 * row where that column is missing or empty. Headers such as `Currency (Total)`
 * are not touched, and a suffixed header is left alone if the plain one exists.
 *
 * Returns the inputs unchanged (same references) when nothing is suffixed.
 */
export function normalizeSuffixedHeaders<T extends object>(
  fields: string[],
  rows: T[]
): { fields: string[]; rows: T[] } {
  const present = new Set(fields)
  const suffixed: SuffixedColumn[] = []

  for (const header of fields) {
    const match = SUFFIXED_HEADER.exec(header)
    if (!match) continue
    const [, column, currency] = match
    if (present.has(column) || suffixed.some(s => s.column === column)) continue
    suffixed.push({ header, column, currency })
  }

  if (suffixed.length === 0) return { fields, rows }

  const renames = new Map(suffixed.map(s => [s.header, s.column]))

  const normalizedFields = fields.map(f => renames.get(f) ?? f)
  for (const { column } of suffixed) {
    const currencyColumn = `Currency (${column})`
    if (!normalizedFields.includes(currencyColumn)) normalizedFields.push(currencyColumn)
  }

  const normalizedRows = rows.map(row => {
    const next: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(row)) {
      next[renames.get(key) ?? key] = value
    }
    for (const { column, currency } of suffixed) {
      const currencyColumn = `Currency (${column})`
      if (isBlank(next[currencyColumn])) next[currencyColumn] = currency
    }
    return next as T
  })

  return { fields: normalizedFields, rows: normalizedRows }
}
