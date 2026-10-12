import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

export const PARAMETERS = {
  work: { label: '训练时长', description: '单回合高强度进攻时间', color: '#ffb3b2', dot: '#ff525d', min: 5, presets: [['标准回合 3:00', 180], ['快速冲刺 1:00', 60], ['Tabata 0:20', 20], ['耐力抗击 2:00', 120], ['极限战备 5:00', 300]] },
  rest: { label: '休息时长', description: '心率恢复与战术间隙', color: '#a2c9ff', dot: '#a2c9ff', min: 0, presets: [['标准间歇 1:00', 60], ['快速回气 0:30', 30], ['高强短歇 0:15', 15], ['Tabata 歇 0:10', 10], ['超长调整 2:00', 120]] },
  rounds: { label: '训练回合', description: '标准职业实战 8 - 12 局', color: '#e2e2e9', dot: '#e2e2e9', min: 1, presets: [['业余实战 3轮', 3], ['进阶特训 5轮', 5], ['经典实战 8轮', 8], ['金腰带战 12轮', 12]] },
  prep: { label: '准备时间', description: '戴拳套、咬护齿备战', color: '#fdbb43', dot: '#fdbb43', min: 0, presets: [['快速备战 0:10', 10], ['戴拳套 0:15', 15], ['充分准备 0:30', 30], ['无准备 0:00', 0]] },
};
const ROW = 56;
const pad = value => String(value).padStart(2, '0');

function Wheel({ label, options, value, onChange, suffix = '' }) {
  const element = useRef(null), selected = useRef(null), target = useRef(null);
  useLayoutEffect(() => {
    if (value === selected.current) return;
    const first = selected.current === null;
    selected.current = value;
    const top = Math.max(0, options.indexOf(value)) * ROW;
    target.current = first || Math.abs(element.current.scrollTop - top) < 1 ? null : top;
    element.current.scrollTo({ top, behavior: first ? 'instant' : 'smooth' });
  }, [value, options]);
  const updateFromScroll = () => {
    if (target.current !== null) {
      if (Math.abs(element.current.scrollTop - target.current) > 1) return;
      target.current = null;
    }
    const index = Math.max(0, Math.min(options.length - 1, Math.round(element.current.scrollTop / ROW)));
    const next = options[index];
    if (next !== selected.current) { selected.current = next; onChange(next); }
  };
  return <div className="picker-wheel-column">
    <span className="picker-wheel-unit">{label}</span>
    <div ref={element} className="picker-wheel" role="listbox" aria-label={label} tabIndex={0}
      onScroll={updateFromScroll} onPointerDown={() => { target.current = null; }} onWheel={() => { target.current = null; }} onKeyDown={event => {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
        event.preventDefault();
        const index = Math.max(0, Math.min(options.length - 1, options.indexOf(value) + (event.key === 'ArrowUp' ? -1 : 1)));
        onChange(options[index]);
      }}>
      {options.map(option => <button type="button" role="option" aria-selected={value === option} aria-label={`${option}${label}`} key={option}
        onClick={() => onChange(option)} className={`picker-wheel-row ${value === option ? 'is-selected' : ''}`} tabIndex={-1}>
        {suffix ? `${option}${suffix}` : pad(option)}
      </button>)}
    </div>
  </div>;
}

export default function ParameterPicker({ type, value, onConfirm, onClose }) {
  const meta = PARAMETERS[type];
  const [draft, setDraft] = useState(value);
  const [closing, setClosing] = useState(false);
  const dialog = useRef(null), closeTimer = useRef(null);
  const minutes = useRef(Array.from({ length: Math.max(11, Math.floor(value / 60) + 1) }, (_, i) => i)).current;
  const seconds = useRef([...new Set([...Array.from({ length: 12 }, (_, i) => i * 5), value % 60])].sort((a, b) => a - b)).current;
  const rounds = useRef(Array.from({ length: 30 }, (_, i) => i + 1)).current;
  const finish = callback => { if (closing) return; setClosing(true); closeTimer.current = setTimeout(callback, 220); };
  const close = () => finish(onClose);
  useEffect(() => {
    const previousFocus = document.activeElement, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current.querySelector('button')?.focus();
    return () => { clearTimeout(closeTimer.current); document.body.style.overflow = overflow; previousFocus?.focus(); };
  }, []);
  const safeValue = type === 'rounds' ? Math.max(1, Math.min(30, draft)) : Math.max(meta.min, draft);
  return <div className={`parameter-picker-overlay ${closing ? 'is-closing' : ''}`} style={{ '--picker-accent': meta.color, '--picker-dot': meta.dot }}>
    <div className="parameter-picker-backdrop" onClick={close} aria-hidden="true" />
    <section ref={dialog} className="parameter-picker-sheet" role="dialog" aria-modal="true" aria-labelledby="picker-title" onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key === 'Tab') {
        const focusable = [...dialog.current.querySelectorAll('button:not([tabindex="-1"]), [tabindex="0"]')];
        const first = focusable[0], last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }}>
      <div className="picker-handle" />
      <header className="picker-header">
        <button onClick={close} className="picker-cancel">取消</button>
        <div><h2 id="picker-title"><i />设置{meta.label}</h2><p>滑动滚轮精确微调</p></div>
        <button onClick={() => finish(() => onConfirm(safeValue))} className="picker-confirm">确定</button>
      </header>
      <div className="picker-presets">{meta.presets.map(([label, next]) => <button key={label} onClick={() => setDraft(next)}>{label}</button>)}</div>
      <div className="picker-wheels">
        <div className="picker-selection-band"><i /></div>
        {type === 'rounds' ? <Wheel label="回合" options={rounds} value={draft} onChange={setDraft} suffix=" 轮" /> : <>
          <Wheel label="分钟" options={minutes} value={Math.floor(draft / 60)} onChange={minute => setDraft(current => minute * 60 + current % 60)} />
          <span className="picker-colon">:</span>
          <Wheel label="秒" options={seconds} value={draft % 60} onChange={second => setDraft(current => Math.floor(current / 60) * 60 + second)} />
        </>}
      </div>
      <p className="picker-hint">{type === 'rounds' ? '1–30 回合' : `秒数以 5 秒为步长${type === 'work' ? ' · 训练至少 5 秒' : ' · 可设为 0 秒'}`}</p>
    </section>
  </div>;
}
