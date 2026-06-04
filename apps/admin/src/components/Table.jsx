import { color, space, font } from '@trello/ui';

export function Table({
  columns, rows, empty = 'No records', loading, error, rowKey,
}) {
  const th = {
    textAlign: 'left', padding: '12px 16px', fontFamily: font.text, fontSize: 12,
    textTransform: 'uppercase', letterSpacing: 0.5, color: color.darkGray,
    fontWeight: 600, borderBottom: `1px solid ${color.border}`, background: color.offWhite,
  };
  const td = {
    padding: '12px 16px', fontFamily: font.text, fontSize: 14,
    color: color.navyDeep, borderBottom: `1px solid ${color.border}`, verticalAlign: 'middle',
  };

  const message = (text, danger) => (
    <tr>
      <td colSpan={columns.length} style={{
        ...td, textAlign: 'center', padding: space.xl,
        color: danger ? color.danger : color.mediumGray,
      }}>{text}</td>
    </tr>
  );

  return (
    <div style={{ background: color.white, border: `1px solid ${color.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ ...th, width: c.width }}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? message('Loading…')
            : error
              ? message(error, true)
              : rows.length === 0
                ? message(empty)
                : rows.map((row) => (
                    <tr key={rowKey(row)}>
                      {columns.map((c) => (
                        <td key={c.key} style={td}>
                          {c.render ? c.render(row) : row[c.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
        </tbody>
      </table>
    </div>
  );
}
