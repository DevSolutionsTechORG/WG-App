import { describe, expect, it } from 'vitest'
import { isPushEndpoint } from '@/lib/schemas'

describe('isPushEndpoint', () => {
  it('lässt nur https-URLs bekannter Push-Dienste zu', () => {
    expect(isPushEndpoint('https://fcm.googleapis.com/fcm/send/abc')).toBe(true)
    expect(isPushEndpoint('https://web.push.apple.com/abc')).toBe(true)
    expect(isPushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/abc')).toBe(true)
  })

  it('blockt interne und fremde Ziele (SSRF)', () => {
    expect(isPushEndpoint('http://fcm.googleapis.com/fcm/send/abc')).toBe(false)
    expect(isPushEndpoint('https://localhost:27017/')).toBe(false)
    expect(isPushEndpoint('https://169.254.169.254/latest/meta-data')).toBe(false)
    expect(isPushEndpoint('https://fcm.googleapis.com.evil.example/x')).toBe(false)
    expect(isPushEndpoint('https://evilpush.apple.com/x')).toBe(false)
    expect(isPushEndpoint('not a url')).toBe(false)
  })
})
