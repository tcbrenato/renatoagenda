import jsPDF from 'jspdf';
import type { Task } from '@/lib/supabase';
import { CATEGORIES, categorize, formatLongDate, toISODate, parseDate } from '@/lib/categories';

export type SharePeriod = 'today' | 'week' | 'month' | 'selected';

const BRAND = '#0100AD';
const BRAND_LIGHT = '#2A2AFF';

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function periodRange(period: SharePeriod, selectedDates: string[]): { start: string; end: string; label: string } {
  const now = new Date();
  if (period === 'today') {
    const iso = toISODate(now);
    return { start: iso, end: iso, label: formatLongDate(iso) };
  }
  if (period === 'week') {
    const start = new Date(now);
    const day = (start.getDay() + 6) % 7; // Monday=0
    start.setDate(start.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      start: toISODate(start),
      end: toISODate(end),
      label: `Semaine du ${toISODate(start)} au ${toISODate(end)}`,
    };
  }
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: toISODate(start),
      end: toISODate(end),
      label: start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    };
  }
  // selected
  const sorted = [...selectedDates].sort();
  return {
    start: sorted[0] ?? toISODate(now),
    end: sorted[sorted.length - 1] ?? toISODate(now),
    label: sorted.length === 1 ? formatLongDate(sorted[0]) : `${sorted[0]} → ${sorted[sorted.length - 1]}`,
  };
}

export function filterTasksForPeriod(tasks: Task[], period: SharePeriod, selectedDates: string[]): Task[] {
  const { start, end } = periodRange(period, selectedDates);
  return tasks.filter((t) => t.date >= start && t.date <= end);
}

export function generateAgendaPDF(
  tasks: Task[],
  period: SharePeriod,
  selectedDates: string[],
): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentW = pageW - margin * 2;
  const [br, bg, bb] = hexToRgb(BRAND);
  const [lr, lg, lb] = hexToRgb(BRAND_LIGHT);

  // Header band
  doc.setFillColor(br, bg, bb);
  doc.rect(0, 0, pageW, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Renato Agenda', margin, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Votre journée, organisée.', margin, 22);

  const range = periodRange(period, selectedDates);
  const filtered = filterTasksForPeriod(tasks, period, selectedDates);

  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Programme partagé', margin, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(120, 120, 120);
  doc.text(range.label, margin, 48);
  doc.text(`${filtered.length} tâche(s)`, pageW - margin, 48, { align: 'right' });

  // Divider
  doc.setDrawColor(br, bg, bb);
  doc.setLineWidth(0.5);
  doc.line(margin, 52, pageW - margin, 52);

  // Group by date
  const byDate = new Map<string, Task[]>();
  for (const t of filtered) {
    if (!byDate.has(t.date)) byDate.set(t.date, []);
    byDate.get(t.date)!.push(t);
  }
  const sortedDates = [...byDate.keys()].sort();

  let y = 60;
  const lineH = 5;
  const cardH = 14;

  for (const date of sortedDates) {
    const dayTasks = byDate.get(date)!;
    const d = parseDate(date);
    const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    // Day header
    if (y > pageH - 30) {
      doc.addPage();
      y = margin + 4;
    }
    doc.setFillColor(br, bg, bb);
    doc.roundedRect(margin, y, contentW, 8, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1), margin + 3, y + 5.5);
    doc.text(`${dayTasks.length}`, pageW - margin - 3, y + 5.5, { align: 'right' });
    y += 11;

    for (const t of dayTasks) {
      const cat = CATEGORIES[categorize(t)];
      const [cr, cg, cb] = hexToRgb(catDotHex(cat.key));

      if (y > pageH - 25) {
        doc.addPage();
        y = margin + 4;
      }

      // Card background
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentW, cardH, 1.5, 1.5, 'F');
      // Color stripe
      doc.setFillColor(cr, cg, cb);
      doc.roundedRect(margin, y, 1.5, cardH, 0.8, 0.8, 'F');

      let x = margin + 4;
      // Time
      if (t.time) {
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(t.time, x, y + 5);
        x += 14;
      }
      // Title
      doc.setTextColor(20, 20, 20);
      doc.setFont('helvetica', t.completed ? 'normal' : 'bold');
      doc.setFontSize(10);
      const titleX = x;
      doc.text(t.title, titleX, y + 5);
      // Details line
      let detail = '';
      if (t.location) detail += t.location;
      if (t.participants) detail += (detail ? '  •  ' : '') + t.participants;
      if (detail) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(130, 130, 130);
        doc.text(detail, titleX, y + 9.5);
      }
      // Status
      if (t.completed) {
        doc.setTextColor(16, 185, 129);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('Terminé', pageW - margin - 4, y + 5, { align: 'right' });
      }

      y += cardH + 2;
    }
    y += 3;
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.setTextColor(160, 160, 160);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Généré par Renato Agenda', margin, pageH - 7);
    doc.text(`Page ${i}/${pageCount}`, pageW - margin, pageH - 7, { align: 'right' });
  }

  return doc;
}

function catDotHex(key: string): string {
  switch (key) {
    case 'urgent': return '#EF4444';
    case 'upcoming': return '#FBBF24';
    case 'other': return '#CBD5E1';
    case 'done': return '#10B981';
    default: return '#CBD5E1';
  }
}
