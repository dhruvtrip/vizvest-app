export interface Currency {
  code: string
  name: string
  /** File name in public/flags, without the extension. */
  flag: string
  /** Small mark on the flag for currencies that share one, e.g. pence. */
  badge?: string
}

/** A raised pill with a round flag and the currency code. */
export function CurrencyChip({ currency }: { currency: Currency }) {
  return (
    <span className="currency-chip">
      <span className="flag" style={{ backgroundImage: `url(/flags/${currency.flag}.svg)` }}>
        {currency.badge ? <span className="flag__badge">{currency.badge}</span> : null}
      </span>
      <span className="currency-chip__code">{currency.code}</span>
    </span>
  )
}
