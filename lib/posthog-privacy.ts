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
        filtered.properties[key] = sanitizeString(value)
      }

      if (typeof value === 'object' && value !== null) {
        filtered.properties[key] = filterSensitiveProperties(value, hasConsented)
      }
    })
  }

  return filtered
}


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
      console.warn('[PostHog Privacy] Event properties contain sensitive keywords:', propertyKeys)
      return false
    }

    const hasSensitiveValue = Object.values(event.properties).some(value => {
      if (typeof value === 'number') {
        return true
      }
      if (typeof value === 'string') {
        // Check for currency symbols: $ £ € ¥ ₹ ₽ ₩ ₪ ₨ ₦ ₫ ₱ ₴ ₵ ₺ ₼ ₾ ₿
        const currencySymbolPattern = /[\$£€¥₹₽₩₪₨₦₫₱₴₵₺₼₾₿]|C\$|\d+p|p\d+/

        // Check for common currency codes as whole words
        const currencyCodePattern = /\b(USD|EUR|GBP|CHF|CAD|JPY|CNY|INR|RUB|KRW|ILS|AUD|NZD|SGD|HKD|SEK|NOK|DKK|PLN|CZK|HUF|RON|BGN|HRK|TRY|MXN|BRL|ZAR|AED|SAR|QAR|KWD|BHD|OMR|JOD|EGP|MAD|TND|DZD|LYD|GBX)\b/i

        // Check for amounts with decimal places (e.g., "1234.56", "1,234.56")
        const amountPattern = /^\d+[.,]\d{2}$/

        if (currencySymbolPattern.test(value) ||
          currencyCodePattern.test(value) ||
          amountPattern.test(value.trim())) {
          return true
        }
      }
      return false
    })

    if (hasSensitiveValue) {
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
