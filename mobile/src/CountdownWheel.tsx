import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import WheelPicker from '@quidone/react-native-wheel-picker';
import { theme as t } from './theme';

type Props = { label: string; data: { value: number; label: string }[]; value: number; color: string; onChange: (value: number) => void };
const itemHeight = 56;
function WebWheel({ label, data, value, color, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null), dragging = useRef<{ y: number; top: number } | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selected = data.findIndex(item => item.value === value);
  useEffect(() => {
    const node = ref.current;
    if (node && Math.round(node.scrollTop / itemHeight) !== selected) node.scrollTo({ top: selected * itemHeight, behavior: 'instant' });
  }, [selected]);
  useEffect(() => () => { if (settleTimer.current) clearTimeout(settleTimer.current); }, []);
  const settle = (node: HTMLDivElement) => {
    const index = Math.max(0, Math.min(data.length - 1, Math.round(node.scrollTop / itemHeight)));
    node.scrollTo({ top: index * itemHeight, behavior: 'smooth' }); onChange(data[index].value);
  };
  return React.createElement('div', {
    ref, role: 'spinbutton', tabIndex: 0, 'aria-label': label, 'aria-valuemin': data[0].value, 'aria-valuemax': data[data.length - 1].value, 'aria-valuenow': value, 'aria-valuetext': String(value).padStart(2, '0'),
    style: { width: '100%', height: 168, overflowY: 'auto', scrollbarWidth: 'none', scrollSnapType: 'y mandatory', overscrollBehavior: 'contain', touchAction: 'pan-y', cursor: 'ns-resize' },
    onScroll: (event: React.UIEvent<HTMLDivElement>) => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
      const node = event.currentTarget; settleTimer.current = setTimeout(() => { if (!dragging.current) settle(node); }, 120);
    },
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== 'mouse') return;
      dragging.current = { y: event.clientY, top: event.currentTarget.scrollTop };
      event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.style.scrollSnapType = 'none'; event.preventDefault();
    },
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => { if (dragging.current) event.currentTarget.scrollTop = dragging.current.top + dragging.current.y - event.clientY; },
    onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return;
      const moved = Math.abs(event.clientY - dragging.current.y) > 4;
      dragging.current = null; event.currentTarget.style.scrollSnapType = 'y mandatory';
      if (!moved) { const bounds = event.currentTarget.getBoundingClientRect(); event.currentTarget.scrollTop += (Math.floor((event.clientY - bounds.top) / itemHeight) - 1) * itemHeight; }
      settle(event.currentTarget);
    },
    onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => { dragging.current = null; event.currentTarget.style.scrollSnapType = 'y mandatory'; settle(event.currentTarget); },
    onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
      const index = event.key === 'ArrowUp' ? selected - 1 : event.key === 'ArrowDown' ? selected + 1 : event.key === 'Home' ? 0 : event.key === 'End' ? data.length - 1 : null;
      if (index !== null) { event.preventDefault(); onChange(data[Math.max(0, Math.min(data.length - 1, index))].value); }
    },
  }, React.createElement('div', { style: { paddingTop: itemHeight, paddingBottom: itemHeight } }, data.map((item, index) => React.createElement('div', {
    key: item.value, 'aria-hidden': true,
    style: { height: itemHeight, scrollSnapAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none', color: index === selected ? color : '#ab88874d', fontFamily: t.mono, fontSize: index === selected ? 48 : 18, letterSpacing: index === selected ? -2 : 0 },
  }, item.label))));
}
export function CountdownWheel(props: Props) {
  return <View style={styles.column}>{Platform.OS === 'web' ? <WebWheel {...props} /> : <WheelPicker data={props.data} value={props.value} width="100%" itemHeight={56} visibleItemCount={3} enableScrollByTapOnItem
    onValueChanged={({ item }) => props.onChange(item.value)} renderOverlay={null}
    renderItem={({ item }) => <Text style={[styles.number, item.value === props.value ? { color: props.color } : styles.ghost]}>{item.label}</Text>} />}</View>;
}
const styles = StyleSheet.create({ column: { flex: 1, minWidth: 0, height: 168, justifyContent: 'center', alignItems: 'center' }, number: { fontFamily: t.mono, fontSize: 48, lineHeight: 56, textAlign: 'center', letterSpacing: -2 }, ghost: { color: '#ab88874d', fontSize: 18, letterSpacing: 0 } });
