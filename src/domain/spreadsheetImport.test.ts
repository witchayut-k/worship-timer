import { describe, expect, it } from 'vitest'
import { parseSpreadsheetTsv } from './spreadsheetImport'

describe('parseSpreadsheetTsv', () => {
  it('parses 5-column template with Thai headers (เวลา)', () => {
    const tsv = [
      'รายการ\tผู้นำ\tเวลา\tไฟ\tมีเดีย',
      'ต้อนรับ\tสมชาย\t00:05\tไฟห้อง\t',
      'นมัสการ\t\t00:15\tเวที\tเนื้อเพลง',
    ].join('\n')

    const result = parseSpreadsheetTsv(tsv)

    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toMatchObject({
      name: 'ต้อนรับ',
      leaderName: 'สมชาย',
      durationSec: 300,
      roomLights: 'ไฟห้อง',
    })
    expect(result.rows[1].durationSec).toBe(900)
    expect(result.warnings.some((w) => w.key === 'missingDuration')).toBe(false)
  })

  it('parses 5-column template with English headers (Time)', () => {
    const tsv = [
      'Item\tLeader\tTime\tLights\tMedia',
      'Welcome\tJohn\t00:05\tHouse\t',
    ].join('\n')

    const result = parseSpreadsheetTsv(tsv)

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].durationSec).toBe(300)
    expect(result.warnings.some((w) => w.key === 'missingDuration')).toBe(false)
  })

  it('parses 5-column rows without header', () => {
    const tsv = 'ต้อนรับ\tสมชาย\t00:05\tไฟห้อง\t'

    const result = parseSpreadsheetTsv(tsv)

    expect(result.rows[0]).toMatchObject({
      name: 'ต้อนรับ',
      durationSec: 300,
      roomLights: 'ไฟห้อง',
    })
    expect(result.warnings.some((w) => w.key === 'missingDuration')).toBe(false)
  })
})
