import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Button, s } from './ui';
import { theme as t } from './theme';

export function ConfirmDialog({ title, message, confirm, onConfirm, onCancel }: { title: string; message: string; confirm: string; onConfirm: () => void; onCancel: () => void }) {
  return <Modal transparent animationType="fade" onRequestClose={onCancel}><View style={styles.backdrop}><View style={[s.card, styles.dialog]} accessibilityViewIsModal><Text style={s.title}>{title}</Text><Text style={[s.body, { color: t.soft }]}>{message}</Text><Button title={confirm} onPress={onConfirm} /><Button title="取消" secondary onPress={onCancel} /></View></View></Modal>;
}
const styles = StyleSheet.create({ backdrop: { flex: 1, backgroundColor: '#000a', alignItems: 'center', justifyContent: 'center', padding: 24 }, dialog: { width: '100%', maxWidth: 400, gap: 18 } });
