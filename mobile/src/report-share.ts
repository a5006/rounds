import { Platform, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';

export async function captureReport(view: RefObject<View | null>, size: { width: number; height: number }) {
  if (!view.current || size.width <= 0 || size.height <= 0) throw new Error('战报尚未准备好，请稍后重试。');
  if (Platform.OS === 'web') {
    const { default: html2canvas } = await import('html2canvas');
    await document.fonts.ready;
    const canvas = await html2canvas(view.current as unknown as HTMLElement, { scale: 1080 / size.width, useCORS: true, logging: false });
    return canvas.toDataURL('image/png');
  }
  return captureRef(view, {
    format: 'png', result: 'tmpfile',
    width: 1080, height: Math.round(size.height / size.width * 1080),
  });
}

export async function shareReportImage(uri: string) {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ROUND-PRO-战报-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    try { link.click(); } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
    return;
  }
  if (!await Sharing.isAvailableAsync()) throw new Error('当前设备无法打开系统分享面板。');
  await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: '分享训练战报图片' });
  // Keep the temporary PNG alive: Android receivers may read it after the chooser resolves.
  // view-shot removes temporary captures when the application closes.
}
