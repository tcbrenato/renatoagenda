import type { Task } from '@/lib/supabase';
import { formatLongDate, formatShortDate, relativeDayLabel, todayISO, toISODate } from '@/lib/categories';

const FRENCH_MONTHS: Record<string, number> = {
  janvier: 0, février: 1, fevrier: 1, mars: 2, avril: 3, mai: 4, juin: 5,
  juillet: 6, août: 7, aout: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11, decembre: 11,
};

const MONTH_DISPLAY = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const WEEKDAYS: Record<string, number> = {
  dimanche: 0, lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6,
};

const DAYPART_TIME: Record<string, string> = {
  matin: '08:00',
  midi: '12:00',
  'apres-midi': '15:00',
  soir: '19:00',
  soiree: '19:00',
  nuit: '21:00',
};

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function startOfWeek(d: Date): Date {
  const dow = (d.getDay() + 6) % 7; // 0 = Monday
  const s = new Date(d);
  s.setDate(d.getDate() - dow);
  s.setHours(0, 0, 0, 0);
  return s;
}

function nextWeekday(targetDow: number, today: Date): Date {
  const d = new Date(today);
  let diff = (targetDow - d.getDay() + 7) % 7;
  if (diff === 0) diff = 7;
  d.setDate(d.getDate() + diff);
  return d;
}

/** Try to extract a single target ISO date from a free-text French question. Returns null if none found. */
function extractDate(question: string): string | null {
  const q = question.toLowerCase();
  const today = new Date();

  if (/\baujourd'?hui\b/.test(q)) return toISODate(today);
  if (/\bapres-?demain\b/.test(normalize(q))) {
    const d = new Date(today);
    d.setDate(d.getDate() + 2);
    return toISODate(d);
  }
  if (/\bdemain\b/.test(q)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return toISODate(d);
  }
  if (/\bhier\b/.test(q)) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return toISODate(d);
  }

  const iso = q.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const slash = q.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]) - 1;
    const year = slash[3] ? (slash[3].length === 2 ? 2000 + Number(slash[3]) : Number(slash[3])) : today.getFullYear();
    return toISODate(new Date(year, month, day));
  }

  const monthNames = Object.keys(FRENCH_MONTHS).join('|');
  const frMatch = normalize(q).match(new RegExp(`\\b(\\d{1,2})\\s+(${monthNames})\\s*(\\d{4})?`));
  if (frMatch) {
    const day = Number(frMatch[1]);
    const month = FRENCH_MONTHS[frMatch[2]];
    const year = frMatch[3] ? Number(frMatch[3]) : today.getFullYear();
    return toISODate(new Date(year, month, day));
  }

  const weekdayNames = Object.keys(WEEKDAYS).join('|');
  const wdMatch = normalize(q).match(new RegExp(`\\b(${weekdayNames})\\b`));
  if (wdMatch) {
    return toISODate(nextWeekday(WEEKDAYS[wdMatch[1]], today));
  }

  return null;
}

/** Try to extract a date RANGE (week / month) from a free-text French question. */
function extractRange(question: string): { start: Date; end: Date; label: string } | null {
  const nq = normalize(question);
  const today = new Date();

  if (/\bcette semaine\b/.test(nq)) {
    const start = startOfWeek(today);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end, label: 'cette semaine' };
  }
  if (/\bsemaine prochaine\b/.test(nq)) {
    const start = startOfWeek(today);
    start.setDate(start.getDate() + 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end, label: 'la semaine prochaine' };
  }
  if (/\bce mois\b/.test(nq)) {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { start, end, label: `ce mois-ci (${MONTH_DISPLAY[today.getMonth()]})` };
  }

  const monthNames = Object.keys(FRENCH_MONTHS).join('|');
  const m = nq.match(new RegExp(`\\b(${monthNames})\\b`));
  if (m && !/\d/.test(nq)) {
    const monthIdx = FRENCH_MONTHS[m[1]];
    const yearMatch = nq.match(/\b(20\d{2})\b/);
    const year = yearMatch ? Number(yearMatch[1]) : today.getFullYear();
    const start = new Date(year, monthIdx, 1);
    const end = new Date(year, monthIdx + 1, 0);
    return { start, end, label: `${MONTH_DISPLAY[monthIdx]} ${year}` };
  }

  return null;
}

function taskLine(t: Task): string {
  const parts = [t.title];
  if (t.time) parts.push(`à ${t.time}`);
  if (t.location) parts.push(`(${t.location})`);
  if (t.participants) parts.push(`avec ${t.participants}`);
  return parts.join(' ');
}

function summarizeTasksForDate(tasks: Task[], iso: string): string {
  const list = tasks.filter((t) => t.date === iso);
  const label = iso === todayISO() ? "aujourd'hui" : `le ${formatLongDate(iso)} (${relativeDayLabel(iso)})`;
  if (list.length === 0) return `Vous n'avez rien de prévu ${label}.`;
  const lines = list.map((t) => `• ${taskLine(t)}${t.completed ? ' ✅' : ''}`).join('\n');
  return `${list.length === 1 ? 'Vous avez 1 tâche' : `Vous avez ${list.length} tâches`} ${label} :\n${lines}`;
}

function summarizeRange(tasks: Task[], range: { start: Date; end: Date; label: string }, wantsAvailability: boolean): string {
  const startIso = toISODate(range.start);
  const endIso = toISODate(range.end);
  const inRange = tasks.filter((t) => t.date >= startIso && t.date <= endIso);

  if (wantsAvailability) {
    const busy = new Set(inRange.filter((t) => !t.completed).map((t) => t.date));
    const freeDays: string[] = [];
    for (let d = new Date(range.start); d <= range.end; d.setDate(d.getDate() + 1)) {
      const iso = toISODate(d);
      if (!busy.has(iso)) freeDays.push(iso);
    }
    if (freeDays.length === 0) return `Vous êtes occupé tous les jours de ${range.label} — aucune disponibilité.`;
    const lines = freeDays.slice(0, 15).map((iso) => `• ${relativeDayLabel(iso)} (${formatShortDate(iso)})`).join('\n');
    const extra = freeDays.length > 15 ? `\n… et ${freeDays.length - 15} autre(s) jour(s)` : '';
    return `Vos disponibilités pour ${range.label} :\n${lines}${extra}`;
  }

  if (inRange.length === 0) return `Vous n'avez rien de prévu pour ${range.label}.`;
  const lines = inRange
    .map((t) => `• ${formatShortDate(t.date)} — ${taskLine(t)}${t.completed ? ' ✅' : ''}`)
    .join('\n');
  return `Voici votre programme pour ${range.label} (${inRange.length} tâche${inRange.length > 1 ? 's' : ''}) :\n${lines}`;
}

function keywordSearch(question: string, tasks: Task[]): Task[] {
  const stopwords = new Set([
    'que', 'qui', 'quoi', 'quand', 'est', 'ce', 'j', 'ai', 'mon', 'ma', 'mes',
    'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'pour', 'avec', 'dans',
    'sur', 'et', 'ou', 'a', 'au', 'aux', 'quest', 'quelle', 'quel', 'y',
    'sont', 'cette', 'ces',
  ]);
  const words = normalize(question)
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));
  if (words.length === 0) return [];
  return tasks.filter((t) => {
    const haystack = normalize(`${t.title} ${t.location ?? ''} ${t.participants ?? ''} ${t.description ?? ''}`);
    return words.some((w) => haystack.includes(w));
  });
}

const SMALLTALK: Record<string, string> = {
  bonjour: 'Bonjour ! Posez-moi une question sur vos programmes, ou dites-moi « programme-moi… » pour créer un rendez-vous.',
  salut: 'Salut ! Demandez-moi ce que vous avez de prévu, ou dites « programme-moi… » pour ajouter un rendez-vous.',
  bonsoir: 'Bonsoir ! Que voulez-vous savoir ou programmer ?',
  coucou: 'Coucou ! Une date, une semaine, un mois — ou dites « programme-moi… » pour créer un rendez-vous.',
  hello: 'Bonjour ! Demandez-moi une date ou dites « programme-moi… » pour créer un rendez-vous.',
  merci: 'Avec plaisir !',
  ok: 'Je suis là si besoin.',
  daccord: 'Parfait — dites-moi si vous voulez que je regarde ou programme autre chose.',
  cava: 'Très bien, merci ! Comment puis-je vous aider avec votre agenda ?',
};

function matchSmalltalk(question: string): string | null {
  const bare = normalize(question).replace(/[^\w\s]/g, '').trim();
  for (const key of Object.keys(SMALLTALK)) {
    if (bare === key || bare.startsWith(`${key} `)) return SMALLTALK[key];
  }
  return null;
}

/** Generate a local, rule-based answer — no external API, no cost. */
export function answerQuestion(question: string, tasks: Task[]): string {
  const dateIso = extractDate(question);
  if (dateIso) return summarizeTasksForDate(tasks, dateIso);

  const range = extractRange(question);
  if (range) {
    const wantsAvailability = /\b(disponib|libre|dispo)\w*/.test(normalize(question));
    return summarizeRange(tasks, range, wantsAvailability);
  }

  const smalltalk = matchSmalltalk(question);
  if (smalltalk) return smalltalk;

  const matches = keywordSearch(question, tasks);
  if (matches.length > 0) {
    const lines = matches
      .slice(0, 8)
      .map((t) => `• ${taskLine(t)} — ${relativeDayLabel(t.date)}${t.completed ? ' ✅' : ''}`)
      .join('\n');
    return `J'ai trouvé ${matches.length > 1 ? `${matches.length} tâches` : '1 tâche'} en lien avec votre question :\n${lines}`;
  }

  return "Je n'ai rien trouvé de correspondant. Essayez avec une date (ex. « 15 août »), une période (« cette semaine », « juillet »), un mot-clé, ou « programme-moi… » pour créer un rendez-vous.";
}

export function dailySummary(tasks: Task[]): string {
  return summarizeTasksForDate(tasks, todayISO());
}

/* ---------------------------------------------------------------------- */
/* Création de tâches en langage naturel ("programme-moi ...")            */
/* ---------------------------------------------------------------------- */

const CREATE_TRIGGER = /^\s*(programme|planifie|planifier|ajoute|ajouter|cr[ée]e|cr[ée]er|organise|organiser|pr[ée]vois|pr[ée]voir|note|noter|mets|mettre|inscris|inscrire)[-\s]*(moi)?\b\s*/i;

function stripCreateTrigger(text: string): string | null {
  const m = text.match(CREATE_TRIGGER);
  if (!m) return null;
  return text.slice(m[0].length);
}

const PARTICIPANTS_REGEX = /\bavec\s+([A-ZÀ-Ý][\wÀ-ÿ'-]*(?:\s+(?:et\s+)?[A-ZÀ-Ý][\wÀ-ÿ'-]*){0,3})/;
const LOCATION_REGEX = /\b(?:sur|chez|au|à)\s+([A-ZÀ-Ý][\wÀ-ÿ'-]*(?:\s+[A-ZÀ-Ý][\wÀ-ÿ'-]*){0,2})/;

function extractAndStrip(text: string, regex: RegExp): { value: string | null; rest: string } {
  const m = text.match(regex);
  if (!m || m.index === undefined) return { value: null, rest: text };
  const value = m[1].trim();
  const rest = (text.slice(0, m.index) + ' ' + text.slice(m.index + m[0].length)).replace(/\s+/g, ' ').trim();
  return { value, rest };
}

function parseDateSegment(segment: string, today: Date): { date: string; time: string | null } | null {
  const nSeg = normalize(segment);
  const monthNames = Object.keys(FRENCH_MONTHS).join('|');
  let date: string | null = null;

  const frMatch = nSeg.match(new RegExp(`\\b(\\d{1,2})\\s+(${monthNames})\\s*(\\d{4})?`));
  if (frMatch) {
    const day = Number(frMatch[1]);
    const month = FRENCH_MONTHS[frMatch[2]];
    const year = frMatch[3] ? Number(frMatch[3]) : today.getFullYear();
    date = toISODate(new Date(year, month, day));
  } else {
    const slash = nSeg.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
    if (slash) {
      const day = Number(slash[1]);
      const month = Number(slash[2]) - 1;
      const year = slash[3] ? (slash[3].length === 2 ? 2000 + Number(slash[3]) : Number(slash[3])) : today.getFullYear();
      date = toISODate(new Date(year, month, day));
    } else if (/\bdemain\b/.test(nSeg)) {
      const d = new Date(today);
      d.setDate(d.getDate() + 1);
      date = toISODate(d);
    } else if (/\baujourd ?hui\b/.test(nSeg)) {
      date = toISODate(today);
    } else {
      const weekdayNames = Object.keys(WEEKDAYS).join('|');
      const wdMatch = nSeg.match(new RegExp(`\\b(${weekdayNames})\\b`));
      if (wdMatch) date = toISODate(nextWeekday(WEEKDAYS[wdMatch[1]], today));
    }
  }
  if (!date) return null;

  let time: string | null = null;
  const explicitTime = segment.match(/\b(\d{1,2})\s*h\s*(\d{2})?\b/i);
  if (explicitTime) {
    const hh = explicitTime[1].padStart(2, '0');
    const mm = (explicitTime[2] ?? '00').padStart(2, '0');
    time = `${hh}:${mm}`;
  } else if (/apres[- ]?midi/.test(nSeg)) {
    time = DAYPART_TIME['apres-midi'];
  } else {
    for (const key of ['matin', 'midi', 'soir', 'soiree', 'nuit']) {
      if (new RegExp(`\\b${key}\\b`).test(nSeg)) {
        time = DAYPART_TIME[key];
        break;
      }
    }
  }
  return { date, time };
}

export type ParsedCreateCommand = {
  title: string;
  location: string | null;
  participants: string | null;
  entries: { date: string; time: string | null }[];
};

/** Detects "programme-moi ..." style commands and extracts title + location + participants + one or more date/time entries. */
export function parseCreateCommand(text: string, reference: Date = new Date()): ParsedCreateCommand | null {
  const stripped = stripCreateTrigger(text.trim());
  if (stripped === null) return null;

  const { value: participants, rest: afterParticipants } = extractAndStrip(stripped, PARTICIPANTS_REGEX);
  const { value: location, rest: remainder } = extractAndStrip(afterParticipants, LOCATION_REGEX);

  const nRem = normalize(remainder);
  const monthNames = Object.keys(FRENCH_MONTHS).join('|');
  const weekdayNames = Object.keys(WEEKDAYS).join('|');
  const markerRegex = new RegExp(`\\b(${weekdayNames}|${monthNames}|demain|aujourd ?hui|\\d{1,2}\\/\\d{1,2})\\b`);
  const markerMatch = nRem.match(markerRegex);
  if (!markerMatch || markerMatch.index === undefined) return null;

  let title = remainder.slice(0, markerMatch.index).trim();
  title = title.replace(/^(le|la|les|un|une|des|du|de|pour|d')\s+/i, '').trim();
  title = title.replace(/\s+(le|pour|du)$/i, '').trim();
  if (!title) title = 'Nouvel événement';

  const datePart = remainder.slice(markerMatch.index);
  const segments = datePart.split(/\bet\b/i).map((s) => s.trim()).filter(Boolean);

  const entries: { date: string; time: string | null }[] = [];
  for (const seg of segments) {
    const parsed = parseDateSegment(seg, reference);
    if (parsed) entries.push(parsed);
  }
  if (entries.length === 0) return null;

  return { title, location, participants, entries };
}

export function describeCreatedTasks(
  title: string,
  entries: { date: string; time: string | null }[],
  location: string | null,
  participants: string | null,
): string {
  const extras = [location ? `à ${location}` : null, participants ? `avec ${participants}` : null]
    .filter(Boolean)
    .join(' · ');
  const lines = entries
    .map((e) => {
      const dayLabel = relativeDayLabel(e.date);
      const dateLabel = formatLongDate(e.date);
      const timeLabel = e.time ? ` à ${e.time}` : '';
      return `• ${dayLabel} (${dateLabel})${timeLabel}`;
    })
    .join('\n');
  return `C'est noté ! J'ai programmé « ${title} »${extras ? ` (${extras})` : ''} :\n${lines}`;
}