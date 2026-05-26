type Props = {
  value: string
  leaderNames: string[]
  listId: string
  hideLabel?: boolean
  onChange: (name: string) => void
  onCommit?: (name: string) => void
}

export function LeaderPicker({ value, leaderNames, listId, hideLabel, onChange, onCommit }: Props) {
  return (
    <label className="field">
      {hideLabel ? null : <div className="label">ผู้ดำเนินรายการ</div>}
      <input
        list={listId}
        value={value}
        placeholder="เลือกหรือพิมพ์ชื่อใหม่"
        aria-label={hideLabel ? 'ผู้นำ / ผู้พูด' : undefined}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => onCommit?.(value)}
      />
      <datalist id={listId}>
        {leaderNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </label>
  )
}
