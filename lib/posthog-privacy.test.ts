import { describe, expect, it } from 'vitest'
import {
  scrubExceptionProperties,
  filterSensitiveProperties,
  validateEvent,
} from './posthog-privacy'

describe('scrubExceptionProperties', () => {
  it('strips message + stack trace from $exception events, keeping only the type', () => {
    const event = {
      event: '$exception',
      properties: {
        $exception_type: 'TypeError',
        $exception_message: "Cannot read 'AAPL' of undefined — total 1,234.56",
        $exception_values: ["Cannot read 'AAPL' of undefined"],
        $exception_list: [
          {
            type: 'TypeError',
            value: "Cannot read 'AAPL' of undefined — total 1,234.56",
            mechanism: { handled: false, type: 'onuncaughtexception' },
            stacktrace: {
              type: 'raw',
              frames: [{ filename: 'dividends.tsx', function: 'render', lineno: 42 }],
            },
          },
        ],
      },
    }

    const scrubbed = scrubExceptionProperties(event)

    // Type is preserved so we can still group/count errors
    expect(scrubbed.properties.$exception_type).toBe('TypeError')
    // Everything that could carry user data is gone
    expect(scrubbed.properties.$exception_message).toBeUndefined()
    expect(scrubbed.properties.$exception_values).toBeUndefined()
    expect(scrubbed.properties.$exception_list[0].value).toBeUndefined()
    expect(scrubbed.properties.$exception_list[0].stacktrace).toBeUndefined()
    // Safe metadata survives
    expect(scrubbed.properties.$exception_list[0].type).toBe('TypeError')
    expect(scrubbed.properties.$exception_list[0].mechanism).toEqual({
      handled: false,
      type: 'onuncaughtexception',
    })
  })

  it('leaves non-exception events untouched', () => {
    const event = { event: 'dividends_dashboard_viewed', properties: { foo: 'bar' } }
    expect(scrubExceptionProperties(event)).toEqual(event)
  })
})

describe('filterSensitiveProperties', () => {
  it('masks values that look like monetary amounts/currency instead of dropping them', () => {
    const event = {
      event: 'csv_upload_completed',
      properties: { file_count: 2, note: '12.00', code: 'USD', symbol: '£420.00' },
    }

    const filtered = filterSensitiveProperties(event, true)

    // The rest of the event survives (the whole event is NOT dropped)...
    expect(filtered.properties.file_count).toBe(2)
    // ...but the financial-looking values are masked in place.
    expect(filtered.properties.note).toBe('[Content filtered for privacy]')
    expect(filtered.properties.code).toBe('[Content filtered for privacy]')
    expect(filtered.properties.symbol).toBe('[Content filtered for privacy]')
  })

  it('removes properties whose key contains a sensitive keyword', () => {
    const event = { event: 'x', properties: { ticker: 'AAPL', view_mode: 'month' } }
    const filtered = filterSensitiveProperties(event, true)
    expect(filtered.properties.ticker).toBeUndefined()
    expect(filtered.properties.view_mode).toBe('month')
  })

  it('drops country geo + full referrer URL when unconsented, but KEEPS the referring domain + UTM for channel attribution', () => {
    const event = {
      event: 'x',
      properties: {
        $geoip_country_name: 'Germany',
        $referrer: 'https://google.com/search?q=some+private+query',
        $referring_domain: 'google.com',
        utm_source: 'reddit',
        $screen_height: 1080,
      },
    }
    const filtered = filterSensitiveProperties(event, false)
    // Country geo + the full referrer URL (can carry PII in the query) are dropped
    expect(filtered.properties.$geoip_country_name).toBeUndefined()
    expect(filtered.properties.$referrer).toBeUndefined()
    // Non-personal acquisition signals are kept so the channel isn't "Unknown"
    expect(filtered.properties.$referring_domain).toBe('google.com')
    expect(filtered.properties.utm_source).toBe('reddit')
    expect(filtered.properties.$screen_height).toBe(1080)
  })

  it('keeps referrer + country geo when the user HAS consented', () => {
    const event = {
      event: 'x',
      properties: {
        $geoip_country_name: 'Germany',
        $referrer: 'https://google.com/search',
        $referring_domain: 'google.com',
      },
    }
    const filtered = filterSensitiveProperties(event, true)
    expect(filtered.properties.$geoip_country_name).toBe('Germany')
    expect(filtered.properties.$referrer).toBe('https://google.com/search')
    expect(filtered.properties.$referring_domain).toBe('google.com')
  })

  it('does not strip the consent_state property', () => {
    const event = { event: 'x', properties: { consent_state: 'anonymous' } }
    expect(filterSensitiveProperties(event, false).properties.consent_state).toBe('anonymous')
    expect(validateEvent({ event: 'x', properties: { consent_state: 'anonymous' } })).toBe(true)
  })
})

describe('validateEvent', () => {
  it('no longer drops an event just because a value looks financial', () => {
    // Regression guard: previously "12.00" made validateEvent return false and
    // the whole event was silently discarded.
    const event = { event: 'x', properties: { some_number: '12.00' } }
    expect(validateEvent(event)).toBe(true)
  })

  it('still blocks an event that has a sensitive property key', () => {
    const event = { event: 'x', properties: { portfolio_value: 5000 } }
    expect(validateEvent(event)).toBe(false)
  })

  it('allows a clean event', () => {
    const event = { event: 'stock_selected', properties: { source: 'holding' } }
    expect(validateEvent(event)).toBe(true)
  })
})
