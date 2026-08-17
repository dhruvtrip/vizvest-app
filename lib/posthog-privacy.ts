/**
 * Privacy utility functions for PostHog event sanitization
 * Ensures no sensitive portfolio data (stocks, amounts, financial info) is captured
 */

const SENSITIVE_KEYWORDS = [
  'ticker',
  'stock',
  'amount',
  'price',
  'shares',
  'dividend',
  'transaction',
  'portfolio',
  'investment',
  'balance',
  'profit',
  'loss',
  'revenue',
  'currency',
  'value',
  'total',
  'quantity'
]

// Patterns that indicate a value is monetary/financial and must never be sent.
// Hoisted here so both filterSensitiveProperties (masking) and validateEvent
// (final guard) use the exact same definition.
const CURRENCY_SYMBOL_PATTERN = /[\$£€¥₹₽₩₪₨₦₫₱₴₵₺₼₾₿]|C\$/
const CURRENCY_CODE_PATTERN =
  /\b(USD|EUR|GBP|CHF|CAD|JPY|CNY|INR|RUB|KRW|ILS|AUD|NZD|SGD|HKD|SEK|NOK|DKK|PLN|CZK|HUF|RON|BGN|HRK|TRY|MXN|BRL|ZAR|AED|SAR|QAR|KWD|BHD|OMR|JOD|EGP|MAD|TND|DZD|LYD|GBX)\b/i
const AMOUNT_PATTERN = /^\d+[.,]\d{2}$/

const REDACTED = '[Content filtered for privacy]'

// True when a string looks like a monetary amount or currency reference.
function looksFinancial(value: string): boolean {
  return (
    CURRENCY_SYMBOL_PATTERN.test(value) ||
    CURRENCY_CODE_PATTERN.test(value) ||
    AMOUNT_PATTERN.test(value.trim())
  )
}

// Sanitizes a string by removing or masking sensitive information

export function sanitizeString(value: string): string {
  if (!value || typeof value !== 'string') {
    return value
  }

  const lowerValue = value.toLowerCase()
  const containsSensitive = SENSITIVE_KEYWORDS.some(keyword =>
    lowerValue.includes(keyword.toLowerCase())
  )

  if (containsSensitive) {
    return '[Content filtered for privacy]'
  }

  return value
}

/**
 * Sanitizes error messages to remove sensitive data
 * Only keeps error type/name, not the full message
 */
export function sanitizeError(error: Error): {
  error_type: string
  error_name: string
} {
  return {
    error_type: error.name || 'Error',
    error_name: error.constructor.name || 'UnknownError'
  }
}


/**
 * Strips exception messages and stack traces from PostHog's autocaptured
 * `$exception` events, keeping ONLY the exception type.
 *
 * PostHog flattens exception data onto `$exception_message` / `$exception_values`
 * and nests it in `$exception_list[]` (each entry has `value` and `stacktrace`).
 * These `$`-prefixed keys are deliberately exempt from the generic property
 * sanitizer below, so — for a financial app that must never leak portfolio data
 * through a stack trace — they are scrubbed here explicitly. This matches the
 * product's "error type/name only" policy: enough to group and count errors,
 * never enough to expose a user's data.
 */
export function scrubExceptionProperties(event: any): any {
  if (!event || event.event !== '$exception' || !event.properties) {
    return event
  }

  const props = event.properties

  // Flattened, human-readable fields that can contain arbitrary error text.
  delete props.$exception_message
  delete props.$exception_values

  // Per-exception entries: keep only the type (+ safe mechanism metadata),
  // drop the message value, the stack trace, and any module/source path.
  if (Array.isArray(props.$exception_list)) {
    props.$exception_list = props.$exception_list.map((ex: any) => {
      if (!ex || typeof ex !== 'object') {
        return ex
      }
      const scrubbed: any = {}
      if (ex.type !== undefined) scrubbed.type = ex.type
      if (ex.mechanism !== undefined) scrubbed.mechanism = ex.mechanism
      return scrubbed
    })
  }

  return event
}

export function filterSensitiveProperties(event: any, hasConsented: boolean = false): any {
  if (!event || typeof event !== 'object') {
    return event
  }

  const filtered: any = { ...event }

  if (filtered.properties) {
    // Always remove IP addresses (personally identifiable)
    delete filtered.properties.$ip
    delete filtered.properties.ip
    delete filtered.properties.ip_address

    // Always remove precise location data (city, coordinates, timezone, postal code)
    delete filtered.properties.$geoip_city_name
    delete filtered.properties.$geoip_latitude
    delete filtered.properties.$geoip_longitude
    delete filtered.properties.$geoip_time_zone
    delete filtered.properties.$geoip_subdivision_1_code
    delete filtered.properties.$geoip_subdivision_1_name
    delete filtered.properties.$geoip_subdivision_2_code
    delete filtered.properties.$geoip_subdivision_2_name
    delete filtered.properties.$geoip_postal_code

    // If user has NOT consented, remove ALL location data (including country-level)
    if (!hasConsented) {
      delete filtered.properties.$geoip_country_code
      delete filtered.properties.$geoip_country_name
      delete filtered.properties.$geoip_continent_code
      delete filtered.properties.$geoip_continent_name
      delete filtered.properties.$referrer
      delete filtered.properties.$referring_domain
    }

    // Remove any properties that might contain sensitive portfolio data
    Object.keys(filtered.properties).forEach(key => {
      const lowerKey = key.toLowerCase()
      const value = filtered.properties[key]

      if (SENSITIVE_KEYWORDS.some(keyword => lowerKey.includes(keyword))) {
        delete filtered.properties[key]
        return
      }

      if (typeof value === 'string') {
        // Mask keyword-sensitive strings, and — for non-PostHog-internal keys —
        // mask anything that looks like a monetary amount. Masking the single
        // property (rather than dropping the whole event, as validateEvent used
        // to) keeps the event's other analytics value intact.
        let next = sanitizeString(value)
        if (!key.startsWith('$') && next !== REDACTED && looksFinancial(next)) {
          next = REDACTED
        }
        filtered.properties[key] = next
      }

      if (typeof value === 'object' && value !== null) {
        filtered.properties[key] = filterSensitiveProperties(value, hasConsented)
      }
    })
  }

  return filtered
}


/**
 * Final safety net, run AFTER filterSensitiveProperties/scrubExceptionProperties.
 *
 * Previously this also dropped the ENTIRE event whenever any property value
 * looked like a currency amount — which silently discarded legitimate events
 * (e.g. a harmless "12.00"). That value-level filtering now lives in
 * filterSensitiveProperties, which masks the offending property instead. Here we
 * only hard-block if a clearly sensitive property KEY somehow survived filtering,
 * which should never happen in practice — it's defense in depth, not the primary
 * filter.
 */
export function validateEvent(event: any): boolean {
  if (!event) {
    return false
  }

  if (event.properties) {
    const propertyKeys = Object.keys(event.properties).map(k => k.toLowerCase())
    const hasSensitiveKey = propertyKeys.some(key =>
      SENSITIVE_KEYWORDS.some(keyword => key.includes(keyword))
    )

    if (hasSensitiveKey) {
      console.warn('[PostHog Privacy] Event dropped — sensitive property key survived filtering:', propertyKeys)
      return false
    }
  }

  return true
}

// Consent management functions for PostHog analytics

const CONSENT_KEY = 'posthog_analytics_consent'
const OPT_OUT_KEY = 'posthog_opt_out'

export function getConsentStatus(): 'accepted' | 'rejected' | null {
  if (typeof window === 'undefined') {
    return null
  }

  const consent = localStorage.getItem(CONSENT_KEY)
  if (consent === 'accepted') {
    return 'accepted'
  }
  if (consent === 'rejected' || localStorage.getItem(OPT_OUT_KEY) === 'true') {
    return 'rejected'
  }

  return null
}


export function setConsentStatus(accepted: boolean): void {
  if (typeof window === 'undefined') {
    return
  }

  if (accepted) {
    localStorage.setItem(CONSENT_KEY, 'accepted')
    localStorage.removeItem(OPT_OUT_KEY)
  } else {
    localStorage.setItem(CONSENT_KEY, 'rejected')
    localStorage.setItem(OPT_OUT_KEY, 'true')
  }

  window.dispatchEvent(new CustomEvent('posthog-consent-changed', {
    detail: { accepted }
  }))
}

export function hasUserConsented(): boolean {
  return getConsentStatus() === 'accepted'
}
