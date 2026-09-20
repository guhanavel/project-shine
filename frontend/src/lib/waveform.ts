// Waveform utilities: decode audio, compute a normalized RMS envelope,
// and compare two envelopes with cosine similarity.

let _ctx: AudioContext | null = null;
function ctx(): AudioContext {
  if (!_ctx) {
    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    _ctx = new AudioContextCtor();
  }
  return _ctx;
}

export async function decodeUrl(url: string): Promise<AudioBuffer> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  return await ctx().decodeAudioData(buf.slice(0));
}

export async function decodeBlob(blob: Blob): Promise<AudioBuffer> {
  const buf = await blob.arrayBuffer();
  return await ctx().decodeAudioData(buf.slice(0));
}

/** RMS envelope with `bins` samples, silence-trimmed and peak-normalized to [0,1]. */
export function envelope(buffer: AudioBuffer, bins = 64): number[] {
  const ch = buffer.getChannelData(0);
  // 1) coarse RMS at ~200 windows to find speech region
  const scanW = Math.max(1, Math.floor(ch.length / 200));
  const scan: number[] = [];
  for (let i = 0; i < ch.length; i += scanW) {
    let s = 0;
    const end = Math.min(ch.length, i + scanW);
    for (let j = i; j < end; j++) s += ch[j] * ch[j];
    scan.push(Math.sqrt(s / (end - i)));
  }
  const peak = Math.max(...scan, 1e-6);
  const thr = peak * 0.15;
  let start = 0,
    end = scan.length - 1;
  while (start < scan.length && scan[start] < thr) start++;
  while (end > start && scan[end] < thr) end--;
  const sStart = start * scanW;
  const sEnd = Math.min(ch.length, (end + 1) * scanW);
  const len = Math.max(1, sEnd - sStart);

  // 2) fine RMS across `bins` windows over the speech region
  const out: number[] = new Array(bins).fill(0);
  const w = len / bins;
  for (let b = 0; b < bins; b++) {
    const i0 = sStart + Math.floor(b * w);
    const i1 = sStart + Math.floor((b + 1) * w);
    let s = 0;
    const n = Math.max(1, i1 - i0);
    for (let j = i0; j < i1; j++) s += ch[j] * ch[j];
    out[b] = Math.sqrt(s / n);
  }
  const mx = Math.max(...out, 1e-6);
  return out.map((v) => v / mx);
}

/** Cosine similarity, returned as a 0..1 score. */
export function similarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na * nb) || 1e-6;
  return Math.max(0, Math.min(1, dot / denom));
}

/** Draw an envelope as centered bars into a canvas. */
export function drawEnvelope(canvas: HTMLCanvasElement, env: number[], color = "#ff6b6b") {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth,
    h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const c = canvas.getContext("2d")!;
  c.scale(dpr, dpr);
  c.clearRect(0, 0, w, h);
  const bw = w / env.length;
  c.fillStyle = color;
  for (let i = 0; i < env.length; i++) {
    const bh = Math.max(2, env[i] * (h - 4));
    const x = i * bw + 1;
    const y = (h - bh) / 2;
    c.fillRect(x, y, Math.max(1, bw - 2), bh);
  }
}
