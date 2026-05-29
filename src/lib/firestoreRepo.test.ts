import { deleteField } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'
import { worshipEventToFirestoreData } from './firestoreRepo'
import type { WorshipEvent } from '../domain/types'

function baseEvent(overrides: Partial<WorshipEvent> = {}): WorshipEvent {
  return {
    title: 'Sunday',
    date: '2026-05-29',
    status: 'active',
    updatedAtMs: 1,
    leaderNames: [],
    ...overrides,
  }
}

describe('worshipEventToFirestoreData', () => {
  it('writes deleteField when planned start is omitted', () => {
    const data = worshipEventToFirestoreData(baseEvent())
    expect(data.plannedStartTime).toEqual(deleteField())
  })

  it('writes deleteField when planned start is blank', () => {
    const data = worshipEventToFirestoreData(baseEvent({ plannedStartTime: '  ' }))
    expect(data.plannedStartTime).toEqual(deleteField())
  })

  it('keeps trimmed planned start when set', () => {
    const data = worshipEventToFirestoreData(baseEvent({ plannedStartTime: ' 10:30 ' }))
    expect(data.plannedStartTime).toBe('10:30')
  })
})
