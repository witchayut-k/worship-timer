import { describe, expect, it } from 'vitest'
import type { ControlLease } from '../domain/types'
import {
  isLeaseExpired,
  isLeaseHolder,
  LEASE_TTL_MS,
  resolveLeaseClaimOutcome,
} from './controlLease'

function lease(overrides: Partial<ControlLease> = {}): ControlLease {
  const now = Date.now()
  return {
    holderUid: 'uid-a',
    holderSessionId: 'sess-a',
    claimedAtMs: now,
    heartbeatAtMs: now,
    ...overrides,
  }
}

describe('controlLease', () => {
  it('isLeaseExpired is false within TTL', () => {
    const now = 1_000_000
    expect(isLeaseExpired(lease({ heartbeatAtMs: now - LEASE_TTL_MS + 1 }), now)).toBe(false)
  })

  it('isLeaseExpired is true after TTL', () => {
    const now = 1_000_000
    expect(isLeaseExpired(lease({ heartbeatAtMs: now - LEASE_TTL_MS - 1 }), now)).toBe(true)
  })

  it('isLeaseHolder requires uid, session, and fresh heartbeat', () => {
    const now = 1_000_000
    const l = lease({ heartbeatAtMs: now })
    expect(isLeaseHolder(l, 'uid-a', 'sess-a', now)).toBe(true)
    expect(isLeaseHolder(l, 'uid-b', 'sess-a', now)).toBe(false)
    expect(isLeaseHolder(l, 'uid-a', 'sess-b', now)).toBe(false)
    expect(isLeaseHolder(l, 'uid-a', 'sess-a', now + LEASE_TTL_MS + 1)).toBe(false)
  })

  it('resolveLeaseClaimOutcome returns claimed when vacant or expired', () => {
    const now = 1_000_000
    expect(resolveLeaseClaimOutcome(null, 'uid-a', 'sess-a', now)).toBe('claimed')
    expect(
      resolveLeaseClaimOutcome(
        lease({ heartbeatAtMs: now - LEASE_TTL_MS - 1 }),
        'uid-a',
        'sess-a',
        now,
      ),
    ).toBe('claimed')
  })

  it('resolveLeaseClaimOutcome returns held for same holder', () => {
    const now = 1_000_000
    const l = lease({ holderUid: 'uid-a', holderSessionId: 'sess-a', heartbeatAtMs: now })
    expect(resolveLeaseClaimOutcome(l, 'uid-a', 'sess-a', now)).toBe('held')
  })

  it('resolveLeaseClaimOutcome returns observer for other holder', () => {
    const now = 1_000_000
    const l = lease({ holderUid: 'uid-b', holderSessionId: 'sess-b', heartbeatAtMs: now })
    expect(resolveLeaseClaimOutcome(l, 'uid-a', 'sess-a', now)).toBe('observer')
  })
})
