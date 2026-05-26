import { parseMmSsToSec } from './time'

export type ParsedProgramRow = {
  name: string
  leaderName: string
  durationSec: number
  roomLights: string
  mediaNote: string
}

export type ImportWarning =
  | { key: 'missingDuration'; rowNum: number }
  | { key: 'noData' }
  | { key: 'missingNameColumn' }
  | { key: 'fewColumns'; rowNum: number; count: number }
  | { key: 'noRowsWithName' }

export type ParseResult = {
  rows: ParsedProgramRow[]
  warnings: ImportWarning[]
  skipped: number
}

type ColumnMap = {
  start?: number
  end?: number
  minutes?: number
  roomLights?: number
  name?: number
  leaderName?: number
  mediaNote?: number
}

const DEFAULT_COLUMNS: ColumnMap = {
  start: 1,
  end: 2,
  minutes: 3,
  roomLights: 4,
  name: 5,
  leaderName: 6,
  mediaNote: 7,
}

const DEFAULT_DURATION_SEC = 300

function splitRows(text: string): string[][] {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.split('\t'))
    .filter((cells) => cells.some((c) => c.trim().length > 0))
}

function normalizeHeader(cell: string): string {
  return cell.trim().toLowerCase().replace(/\s+/g, '')
}

function isHeaderRow(cells: string[]): boolean {
  const joined = cells.map(normalizeHeader).join(' ')
  return (
    joined.includes('item') ||
    joined.includes('leader') ||
    joined.includes('start') ||
    joined.includes('duration') ||
    joined.includes('minutes') ||
    joined.includes('lights') ||
    joined.includes('media') ||
    joined.includes('ที่') ||
    joined.includes('เริ่ม') ||
    joined.includes('รายการ') ||
    joined.includes('ผู้รับพระพร')
  )
}

function mapColumnsFromHeader(cells: string[]): ColumnMap {
  const map: ColumnMap = {}
  cells.forEach((raw, index) => {
    const h = normalizeHeader(raw)
    if (!h) return
    if (
      (h.includes('start') && !h.includes('end')) ||
      (h.includes('เริ่ม') && !h.includes('สิ้น'))
    ) {
      map.start = index
    } else if (h.includes('end') || h.includes('finish') || h.includes('สิ้นสุด') || h.includes('สิ้น')) {
      map.end = index
    } else if (h.includes('minute') || h.includes('duration') || h.includes('นาที')) {
      map.minutes = index
    } else if (h.includes('light') || h.includes('ไฟ')) {
      map.roomLights = index
    } else if (h === 'item' || h.includes('segment') || h.includes('program') || h.includes('รายการ')) {
      map.name = index
    } else if (
      h.includes('leader') ||
      h.includes('speaker') ||
      h.includes('host') ||
      h.includes('ผู้รับพระพร') ||
      h.includes('ผู้นำ')
    ) {
      map.leaderName = index
    } else if (h.includes('media') || h.includes('av') || h.includes('มีเดีย') || h.includes('สื่อ')) {
      map.mediaNote = index
    }
  })
  return { ...DEFAULT_COLUMNS, ...map }
}

function cellAt(cells: string[], index: number | undefined): string {
  if (index == null || index < 0 || index >= cells.length) return ''
  return cells[index]?.trim() ?? ''
}

/** Duration column uses HH:mm (e.g. 00:10 = 10 minutes). */
function parseDurationHhMmToSec(input: string): number | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed)
  if (!match) return null
  const hh = Number(match[1])
  const mm = Number(match[2])
  if (!Number.isFinite(hh) || !Number.isFinite(mm) || mm > 59) return null
  const total = hh * 3600 + mm * 60
  return total > 0 ? total : null
}

function parseClockToSec(input: string): number | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed)
  if (!match) return null
  const hh = Number(match[1])
  const mm = Number(match[2])
  if (!Number.isFinite(hh) || !Number.isFinite(mm) || mm > 59) return null
  return hh * 3600 + mm * 60
}

function durationFromStartEnd(start: string, end: string): number | null {
  const s = parseClockToSec(start)
  const e = parseClockToSec(end)
  if (s == null || e == null) return null
  let diff = e - s
  if (diff <= 0) diff += 24 * 3600
  return diff > 0 ? diff : null
}

function resolveDurationSec(
  cells: string[],
  cols: ColumnMap,
  rowNum: number,
  warnings: ImportWarning[],
): number {
  const minutesRaw = cellAt(cells, cols.minutes)
  const startRaw = cellAt(cells, cols.start)
  const endRaw = cellAt(cells, cols.end)

  const fromMinutes = parseDurationHhMmToSec(minutesRaw)
  if (fromMinutes != null) return fromMinutes

  const fromMmSs = parseMmSsToSec(minutesRaw)
  if (fromMmSs != null && fromMmSs > 0) return fromMmSs

  const fromRange = durationFromStartEnd(startRaw, endRaw)
  if (fromRange != null) return fromRange

  warnings.push({ key: 'missingDuration', rowNum })
  return DEFAULT_DURATION_SEC
}

export function parseSpreadsheetTsv(text: string): ParseResult {
  const warnings: ImportWarning[] = []
  let skipped = 0
  const rawRows = splitRows(text)
  if (!rawRows.length) {
    return { rows: [], warnings: [{ key: 'noData' }], skipped: 0 }
  }

  let dataRows = rawRows
  let cols = DEFAULT_COLUMNS

  if (isHeaderRow(rawRows[0])) {
    cols = mapColumnsFromHeader(rawRows[0])
    dataRows = rawRows.slice(1)
    if (cols.name === undefined) {
      warnings.push({ key: 'missingNameColumn' })
      cols = { ...DEFAULT_COLUMNS, ...cols }
    }
  }

  const rows: ParsedProgramRow[] = []
  let lastLeader = ''

  dataRows.forEach((cells, i) => {
    const rowNum = i + 1
    const name = cellAt(cells, cols.name)
    if (!name) {
      skipped += 1
      return
    }

    if (cells.length < 4 && !isHeaderRow(cells)) {
      warnings.push({ key: 'fewColumns', rowNum, count: cells.length })
    }

    let leaderName = cellAt(cells, cols.leaderName)
    if (!leaderName && lastLeader) leaderName = lastLeader
    if (leaderName) lastLeader = leaderName

    rows.push({
      name,
      leaderName,
      durationSec: resolveDurationSec(cells, cols, rowNum, warnings),
      roomLights: cellAt(cells, cols.roomLights),
      mediaNote: cellAt(cells, cols.mediaNote),
    })
  })

  if (!rows.length && dataRows.length > 0) {
    warnings.push({ key: 'noRowsWithName' })
  }

  return { rows, warnings, skipped }
}
