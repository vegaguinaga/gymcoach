import { describe, expect, it } from 'vitest'
import { detectarPlataforma } from '../instalacion'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'
const IPAD = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15'
const ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36'
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36'

describe('detectarPlataforma', () => {
  it('iPhone e iPad (que se presenta como Mac con pantalla táctil)', () => {
    expect(detectarPlataforma(IPHONE)).toBe('ios')
    expect(detectarPlataforma(IPAD, 5)).toBe('ios')
  })
  it('un Mac sin pantalla táctil no es iOS', () => {
    expect(detectarPlataforma(IPAD, 0)).toBe('otra')
  })
  it('Android y escritorio', () => {
    expect(detectarPlataforma(ANDROID)).toBe('android')
    expect(detectarPlataforma(WINDOWS)).toBe('otra')
  })
})
