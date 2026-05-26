type Props = {
  value: string
  leaderNames: string[]
  listId: string
  onChange: (name: string) => void
  onCommit?: (name: string) => void
}

export function LeaderPicker({ value, leaderNames, listId, onChange, onCommit }: Props) {
  return (
    <label className="field">
      <div className="label">ผู้ดำเนินรายการ</div>
      <input
        list={listId}
        value={value}
        placeholder="เลือกหรือพิมพ์ชื่อใหม่"
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
