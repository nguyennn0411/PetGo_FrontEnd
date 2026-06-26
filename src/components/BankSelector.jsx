import { Search, ChevronDown, Check, Building2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { VIETNAM_BANKS, searchBanks } from '../constants/banks';

export default function BankSelector({ value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  const results = searchBanks(query);
  const selected = VIETNAM_BANKS.find(b => b.shortName === value);

  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '10px 12px', border: '1px solid var(--border-secondary)',
          borderRadius: 10, fontSize: 13, fontWeight: 500, background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, cursor: 'pointer',
          color: selected ? 'var(--text-primary)' : '#9ca3af',
        }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <Building2 size={16} style={{ flexShrink: 0, opacity: 0.5 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected ? `${selected.shortName} - ${selected.name}` : (placeholder || 'Chọn ngân hàng')}
          </span>
        </span>
        <ChevronDown size={16} style={{ flexShrink: 0, opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden',
        }}>
          <div style={{ padding: '8px 8px 0' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 8,
            }}>
              <Search size={16} style={{ opacity: 0.4, flexShrink: 0 }} />
              <input
                type="text" placeholder="Tìm ngân hàng..."
                value={query} onChange={e => setQuery(e.target.value)}
                autoFocus
                style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13, fontWeight: 500, background: 'transparent' }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 240, overflowY: 'auto', padding: '4px 0' }}>
            {results.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>Không tìm thấy ngân hàng</div>
            ) : (
              results.map(b => {
                const sel = value === b.shortName;
                return (
                  <button key={b.shortName} type="button" onClick={() => { onChange(b.shortName); setOpen(false); setQuery(''); }}
                    style={{
                      width: '100%', padding: '10px 12px', border: 'none', background: sel ? '#fff7ed' : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: sel ? 700 : 500,
                      color: sel ? '#ea580c' : '#374151', textAlign: 'left',
                    }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 4, background: sel ? '#f97316' : '#f3f4f6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {sel && <Check size={14} color="#fff" strokeWidth={3} />}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <span style={{ fontWeight: 700, marginRight: 4 }}>{b.shortName}</span>
                      <span style={{ color: '#6b7280', fontSize: 12 }}>{b.name}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
