// Manifest of pre-recorded audio, served from Supabase Storage.
// Keys are normalized (lowercase, trimmed). Values are Storage public URLs.
import { storageUrl } from "@/lib/storage";

const audio = (name: string) => storageUrl("phonics-audio", name);

const introAiko = audio("intro-aiko.mp3");
const introEmma = audio("intro-emma.mp3");
const introGina = audio("intro-gina.mp3");
const introSidd = audio("intro-sidd.mp3");

const la = audio("letter-a.wav");
const lb = audio("letter-b.wav");
const lc = audio("letter-c.wav");
const ld = audio("letter-d.wav");
const le = audio("letter-e.wav");
const lf = audio("letter-f.wav");
const lg = audio("letter-g.wav");
const lh = audio("letter-h.wav");
const li = audio("letter-i.wav");
const lj = audio("letter-j.wav");
const lk = audio("letter-k.wav");
const ll = audio("letter-l.wav");
const lm = audio("letter-m.wav");
const ln = audio("letter-n.wav");
const lo = audio("letter-o.wav");
const lp = audio("letter-p.wav");
const lq = audio("letter-q.wav");
const lr = audio("letter-r.wav");
const ls = audio("letter-s.wav");
const lt = audio("letter-t.wav");
const lu = audio("letter-u.wav");
const lv = audio("letter-v.mp3");
const lw = audio("letter-w.mp3");
const lx = audio("letter-x.wav");
const ly = audio("letter-y.wav");
const lz = audio("letter-z.wav");

// Digraphs
const dCk = audio("letter-ck.wav");
const dSh = audio("letter-sh.wav");
const dCh = audio("letter-ch.wav");

const wAm = audio("word-am.wav");
const wAn = audio("word-an.wav");
const wAnd = audio("word-and.wav");
const wAnt = audio("word-ant.wav");
const wAt = audio("word-at.wav");
const wDid = audio("word-did.wav");
const wDip = audio("word-dip.wav");
const wGet = audio("word-get.wav");
const wIn = audio("word-in.wav");
const wIt = audio("word-it.wav");
const wMap = audio("word-map.wav");
const wMat = audio("word-mat.wav");
const wNot = audio("word-not.wav");
const wOn = audio("word-on.wav");
const wPin = audio("word-pin.wav");
const wPit = audio("word-pit.wav");
const wSap = audio("word-sap.wav");
const wSit = audio("word-sit.wav");
const wTap = audio("word-tap.wav");
const wTin = audio("word-tin.wav");
const wUp = audio("word-up.wav");
const wUs = audio("word-us.wav");

const letters: Record<string, string | null> = {
  a: la,
  b: lb,
  c: lc,
  d: ld,
  e: le,
  f: lf,
  g: lg,
  h: lh,
  i: li,
  j: lj,
  k: lk,
  l: ll,
  m: lm,
  n: ln,
  o: lo,
  p: lp,
  q: lq,
  r: lr,
  s: ls,
  t: lt,
  u: lu,
  v: lv,
  w: lw,
  x: lx,
  y: ly,
  z: lz,
  ck: dCk,
  sh: dSh,
  ch: dCh,
};

const words: Record<string, string | null> = {
  am: wAm,
  an: wAn,
  and: wAnd,
  ant: wAnt,
  at: wAt,
  did: wDid,
  dip: wDip,
  get: wGet,
  in: wIn,
  it: wIt,
  map: wMap,
  mat: wMat,
  not: wNot,
  on: wOn,
  pin: wPin,
  pit: wPit,
  sap: wSap,
  sit: wSit,
  tap: wTap,
  tin: wTin,
  up: wUp,
  us: wUs,
};

const intros: Record<string, string | null> = {
  aiko: introAiko,
  emma: introEmma,
  gina: introGina,
  sidd: introSidd,
};

function norm(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.!?,"']/g, "")
    .trim();
}

/** Resolve a phrase to a CDN URL, or null when we have no local recording. */
export function resolveAudioUrl(text: string): string | null {
  const key = norm(text);
  if (!key) return null;
  // Single letter (including things like "s", "a") — also handle "sss", "mmm"
  if (/^([a-z])\1*$/.test(key)) {
    const ch = key[0];
    const letterUrl = letters[ch];
    if (letterUrl) return letterUrl;
  }
  const directLetterUrl = letters[key];
  if (directLetterUrl) return directLetterUrl;
  const directWordUrl = words[key];
  if (directWordUrl) return directWordUrl;
  // "a. ant." style — take the last meaningful token
  const tokens = key.split(/\s+/).filter(Boolean);
  for (const t of tokens.reverse()) {
    const wordUrl = words[t];
    if (wordUrl) return wordUrl;
    const letterUrl = letters[t];
    if (letterUrl) return letterUrl;
  }
  return null;
}

export function resolveIntroUrl(characterId: string): string | null {
  return intros[characterId] ?? null;
}

export function hasLocalAudio(text: string): boolean {
  return resolveAudioUrl(text) !== null;
}
