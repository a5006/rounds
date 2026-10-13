export function decodeWav(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (offset, length) => String.fromCharCode(...bytes.subarray(offset, offset + length));
  if (text(0, 4) !== 'RIFF' || text(8, 4) !== 'WAVE') throw new Error('Unsupported WAV header');
  let channels = 1, bits = 16, sampleRate = 22050, format = 1, dataOffset = 0, dataLength = 0;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const tag = text(offset, 4), length = view.getUint32(offset + 4, true);
    if (offset + 8 + length > bytes.length) throw new Error('Truncated WAV');
    if (tag === 'fmt ') { format = view.getUint16(offset + 8, true); channels = view.getUint16(offset + 10, true); sampleRate = view.getUint32(offset + 12, true); bits = view.getUint16(offset + 22, true); }
    if (tag === 'data') { dataOffset = offset + 8; dataLength = length; }
    offset += 8 + length + (length % 2);
  }
  if (format !== 1 || ![8, 16].includes(bits) || !dataOffset) throw new Error('Only PCM 8/16 bit WAV is supported');
  const step = channels * bits / 8, samples = new Float32Array(Math.floor(dataLength / step));
  for (let i = 0; i < samples.length; i++) {
    let sum = 0;
    for (let channel = 0; channel < channels; channel++) {
      const at = dataOffset + i * step + channel * bits / 8;
      sum += bits === 8 ? (view.getUint8(at) - 128) / 128 : view.getInt16(at, true) / 32768;
    }
    samples[i] = sum / channels;
  }
  return { sampleRate, samples };
}

// Stream small blocks: even long workouts never allocate the entire WAV in JS memory.
export function* wavChunks(plan, clips, sampleRate = 11025, blockSize = 65536) {
  const durationMs = plan.reduce((sum, phase) => sum + phase.durationMs, 0);
  const length = Math.round(durationMs * sampleRate / 1000);
  const paddedLength = length + (length % 2);
  const header = new Uint8Array(44), view = new DataView(header.buffer);
  const writeText = (at, text) => [...text].forEach((char, i) => header[at + i] = char.charCodeAt(0));
  writeText(0, 'RIFF'); view.setUint32(4, 36 + paddedLength, true); writeText(8, 'WAVE'); writeText(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate, true); view.setUint16(32, 1, true); view.setUint16(34, 8, true);
  writeText(36, 'data'); view.setUint32(40, length, true);
  yield header;
  const cues = plan.flatMap(phase => phase.cues.map(cue => ({ ...cue, start: Math.round((phase.offsetMs + cue.atMs) * sampleRate / 1000), audio: clips[cue.clip] }))).filter(cue => cue.audio).map(cue => ({ ...cue, end: cue.start + Math.round(cue.audio.samples.length * sampleRate / cue.audio.sampleRate) }));
  for (let start = 0; start < length; start += blockSize) {
    const count = Math.min(blockSize, length - start), bytes = new Uint8Array(count).fill(128);
    const overlapping = cues.filter(cue => cue.start < start + count && cue.end > start);
    if (overlapping.length) {
      const mix = new Float32Array(count);
      for (const cue of overlapping) {
        const from = Math.max(start, cue.start), to = Math.min(start + count, cue.end);
        for (let frame = from; frame < to; frame++) {
          const source = Math.min(cue.audio.samples.length - 1, Math.floor((frame - cue.start) * cue.audio.sampleRate / sampleRate));
          mix[frame - start] += cue.audio.samples[source];
        }
      }
      for (let i = 0; i < count; i++) bytes[i] = Math.max(0, Math.min(255, Math.round(128 + mix[i] * 127)));
    }
    yield bytes;
  }
  if (length % 2) yield new Uint8Array([0]);
}
