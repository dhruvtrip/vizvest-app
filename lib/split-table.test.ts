import { describe, expect, it } from 'vitest'
import { KNOWN_SPLITS, TABLE_SPLIT_CUTOFF_TIME, knownSplitsForIsin } from './split-table'

/**
 * Data-integrity checks for the bundled split table. These fail the build on
 * malformed data; fix the data from its sources, never the test.
 */

const EXPECTED_SECURITIES = 108
const EXPECTED_SPLITS = 127
const EARLIEST_DATE = '2017-01-01'

/** ISIN check digit (ISO 6166): letters to numbers (A=10..Z=35), then Luhn */
function isValidIsin(isin: string): boolean {
  if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isin)) return false
  const digits = isin
    .split('')
    .map(ch => (ch >= 'A' && ch <= 'Z' ? String(ch.charCodeAt(0) - 55) : ch))
    .join('')
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    // Double every second digit counting from the right, check digit excluded.
    let d = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  return sum % 10 === 0
}

function todayUtc(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`
}

function parseDate(date: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) return null
  const [y, m, d] = match.slice(1).map(Number)
  const parsed = new Date(Date.UTC(y, m - 1, d))
  if (parsed.getUTCFullYear() !== y || parsed.getUTCMonth() !== m - 1 || parsed.getUTCDate() !== d) {
    return null
  }
  return parsed
}

const allSplits = KNOWN_SPLITS.flatMap(security =>
  security.splits.map(split => ({ security, split }))
)

describe('isValidIsin (test helper)', () => {
  it('accepts valid ISINs and rejects a wrong check digit', () => {
    expect(isValidIsin('US0378331005')).toBe(true)
    expect(isValidIsin('GB0002634946')).toBe(true)
    expect(isValidIsin('US0378331006')).toBe(false)
    expect(isValidIsin('us0378331005')).toBe(false)
  })
})

describe('KNOWN_SPLITS data integrity', () => {
  it(`has ${EXPECTED_SECURITIES} securities and ${EXPECTED_SPLITS} splits`, () => {
    expect(KNOWN_SPLITS).toHaveLength(EXPECTED_SECURITIES)
    expect(allSplits).toHaveLength(EXPECTED_SPLITS)
  })

  it('gives every security a name, at least one ISIN and at least one split', () => {
    const bad = KNOWN_SPLITS.filter(
      s => s.name.trim() === '' || s.isins.length === 0 || s.splits.length === 0
    )
    expect(bad.map(s => s.name)).toEqual([])
  })

  it('has only ISINs that pass the check-digit algorithm', () => {
    const bad = KNOWN_SPLITS.flatMap(s => s.isins.filter(isin => !isValidIsin(isin)).map(isin => `${s.name}: ${isin}`))
    expect(bad).toEqual([])
  })

  it('never lists an ISIN under two securities (or twice under one)', () => {
    const owner = new Map<string, string>()
    const duplicates: string[] = []
    for (const security of KNOWN_SPLITS) {
      for (const isin of security.isins) {
        const previous = owner.get(isin)
        if (previous !== undefined) duplicates.push(`${isin}: ${previous} / ${security.name}`)
        owner.set(isin, security.name)
      }
    }
    expect(duplicates).toEqual([])
  })

  it('has valid weekday dates within 2017-01-01..today', () => {
    const today = todayUtc()
    const bad = allSplits
      .filter(({ split }) => {
        const date = parseDate(split.effectiveDate)
        if (!date) return true
        const day = date.getUTCDay()
        return (
          day === 0 ||
          day === 6 ||
          split.effectiveDate < EARLIEST_DATE ||
          split.effectiveDate > today
        )
      })
      .map(({ security, split }) => `${security.name}: ${split.effectiveDate}`)
    expect(bad).toEqual([])
  })

  it('lists splits in strictly ascending date order per security', () => {
    const bad = KNOWN_SPLITS.filter(s =>
      s.splits.some((split, i) => i > 0 && split.effectiveDate <= s.splits[i - 1].effectiveDate)
    )
    expect(bad.map(s => s.name)).toEqual([])
  })

  it('has positive, finite, unequal share counts', () => {
    const bad = allSplits
      .filter(({ split }) => {
        const { newShares, oldShares } = split
        return (
          !Number.isFinite(newShares) ||
          !Number.isFinite(oldShares) ||
          newShares <= 0 ||
          oldShares <= 0 ||
          newShares === oldShares
        )
      })
      .map(({ security, split }) => `${security.name}: ${split.effectiveDate}`)
    expect(bad).toEqual([])
  })

  it('has at least two distinct sources per split', () => {
    const bad = allSplits
      .filter(({ split }) => {
        const distinct = new Set(split.sources.map(s => s.trim()).filter(s => s !== ''))
        return distinct.size < 2
      })
      .map(({ security, split }) => `${security.name}: ${split.effectiveDate}`)
    expect(bad).toEqual([])
  })

  it('keeps sources as https URLs', () => {
    const bad = allSplits.flatMap(({ security, split }) =>
      split.sources.filter(s => !/^https:\/\/\S+$/.test(s)).map(s => `${security.name}: ${s}`)
    )
    expect(bad).toEqual([])
  })
})

describe('knownSplitsForIsin', () => {
  it('finds a security by any of its ISINs', () => {
    expect(knownSplitsForIsin('US5128073062')?.name).toBe('Lam Research')
    expect(knownSplitsForIsin('US5128071082')?.name).toBe('Lam Research')
  })

  it('trims and upper-cases the lookup', () => {
    expect(knownSplitsForIsin(' us0231351067 ')?.name).toBe('Amazon')
  })

  it('returns undefined for unknown or invalid input', () => {
    expect(knownSplitsForIsin('ZZ0000000018')).toBeUndefined()
    expect(knownSplitsForIsin('')).toBeUndefined()
    expect(knownSplitsForIsin(undefined as unknown as string)).toBeUndefined()
  })

  it('finds every ISIN in the table', () => {
    for (const security of KNOWN_SPLITS) {
      for (const isin of security.isins) {
        expect(knownSplitsForIsin(isin)).toBe(security)
      }
    }
  })
})

describe('TABLE_SPLIT_CUTOFF_TIME', () => {
  it('is 02:00:00 UTC', () => {
    expect(TABLE_SPLIT_CUTOFF_TIME).toBe('02:00:00')
  })
})
