import { describe, expect, it } from 'vitest'
import { resolveSessionStatus } from './sessionStatus'

const t = (key: string) => key

describe('resolveSessionStatus', () => {
  it('returns ready when not in production mode', () => {
    const { variant, label } = resolveSessionStatus({
      productionMode: false,
      phase: 'running',
      ready: true,
      serviceEnded: true,
    })
    expect(variant).toBe('ready')
    expect(label(t)).toBe('nav.sessionReady')
  })

  it('returns ended before paused when serviceEnded', () => {
    const { variant, label } = resolveSessionStatus({
      productionMode: true,
      phase: 'paused',
      ready: true,
      serviceEnded: true,
    })
    expect(variant).toBe('ended')
    expect(label(t)).toBe('control.endServiceEnded')
  })

  it('returns live when running and not ended', () => {
    const { variant, label } = resolveSessionStatus({
      productionMode: true,
      phase: 'running',
      ready: true,
      serviceEnded: false,
    })
    expect(variant).toBe('live')
    expect(label(t)).toBe('nav.live')
  })

  it('returns paused when paused without serviceEnded', () => {
    const { variant, label } = resolveSessionStatus({
      productionMode: true,
      phase: 'paused',
      ready: true,
      serviceEnded: false,
    })
    expect(variant).toBe('paused')
    expect(label(t)).toBe('control.paused')
  })
})
