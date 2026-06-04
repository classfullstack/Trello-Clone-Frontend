import { useState } from 'react';
import { color, space, font, radius, Skeleton, Button, EmptyState } from '@trello/ui';
import { IconChevronLeft, IconChevronRight } from './icons';

export function Table({
  columns, rows, empty = 'No records', emptyDescription, emptyIcon = '📄',
  loading, error, rowKey, skeletonRows = 6,
}) {
  const th = {
    textAlign: 'left', padding: '12px 16px', fontFamily: font.text, fontSize: 11,
    textTransform: 'uppercase', letterSpacing: 0.6, color: color.darkGray,
    fontWeight: 700, borderBottom: `1px solid ${color.border}`,
    background: color.offWhite, position: 'sticky', top: 0, zIndex: 1, whiteSpace: 'nowrap',
  };
  const td = {
    padding: '12px 16px', fontFamily: font.text, fontSize: 14,
    color: color.navyDeep, borderBottom: `1px solid ${color.offWhite}`, verticalAlign: 'middle',
  };

  return (
    <div style={{
      background: color.white, border: `1px solid ${color.border}`,
      borderRadius: radius.large, overflow: 'hidden', boxShadow: shadowSubtle,
    }}>
      <div style={{ overflowX: 'auto', maxHeight: '64vh', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={{ ...th, width: c.width, textAlign: c.align ?? 'left' }}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={`sk-${i}`}>
                  {columns.map((c) => (
                    <td key={c.key} style={td}><Skeleton width={`${50 + ((i + c.key.length) % 4) * 12}%`} /></td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={columns.length} style={{ ...td, borderBottom: 'none', padding: 0 }}>
                  <EmptyState icon="⚠️" title="Something went wrong" description={error} />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ ...td, borderBottom: 'none', padding: 0 }}>
                  <EmptyState icon={emptyIcon} title={empty} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              rows.map((row, i) => <Row key={rowKey(row)} row={row} columns={columns} td={td} zebra={i % 2 === 1} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const shadowSubtle = 'rgba(9, 30, 66, 0.08) 0px 1px 2px 0px';

function Row({ row, columns, td, zebra }) {
  const [hover, setHover] = useState(false);
  const bg = hover ? '#F7F8F9' : zebra ? '#FCFCFD' : color.white;
  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ background: bg, transition: 'background .1s' }}
    >
      {columns.map((c) => (
        <td key={c.key} style={{ ...td, textAlign: c.align ?? 'left' }}>
          {c.render ? c.render(row) : row[c.key]}
        </td>
      ))}
    </tr>
  );
}

export function Pagination({ page, pageSize, total, onPage }) {
  const maxPage = Math.max(1, Math.ceil((total || 0) / pageSize));
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: space.base, marginTop: space.base, flexWrap: 'wrap',
      fontFamily: font.text, fontSize: 14, color: color.navyLight,
    }}>
      <span>Showing <strong style={{ color: color.navyMedium }}>{from}-{to}</strong> of <strong style={{ color: color.navyMedium }}>{total.toLocaleString()}</strong></span>
      <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}
          leftIcon={<IconChevronLeft size={16} />}>Prev</Button>
        <span style={{ padding: '0 8px', color: color.navyMedium }}>Page {page} / {maxPage}</span>
        <Button variant="secondary" size="sm" disabled={page >= maxPage} onClick={() => onPage(page + 1)}
          rightIcon={<IconChevronRight size={16} />}>Next</Button>
      </div>
    </div>
  );
}
