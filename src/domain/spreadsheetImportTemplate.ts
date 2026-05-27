export type ImportTemplateRow = {
  item: string
  leader: string
  duration: string
  lights: string
  media: string
}

function rowToTsvCells(row: ImportTemplateRow): string[] {
  return [row.item, row.leader, row.duration, row.lights, row.media]
}

export function buildImportTemplateTsv(
  headers: [string, string, string, string, string],
  rows: ImportTemplateRow[],
): string {
  const lines = [headers.join('\t'), ...rows.map((row) => rowToTsvCells(row).join('\t'))]
  return lines.join('\n')
}
