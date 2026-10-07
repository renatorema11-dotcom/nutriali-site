// Telas do app do paciente desenhadas em <canvas> e usadas como textura
// na tela do celular 3D. Reproduzem os componentes reais do NutriAli.
import { THREE } from './common.js';
import { drawIcon, roundRectPath } from '../icons.js';

const W = 390;
const H = 845;
const S = 2.4; // resolução: 936 x 2028 px
const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif';

// ---------------------------------------------------------------------------
// Primitivas de desenho
// ---------------------------------------------------------------------------
const hasLS = 'letterSpacing' in CanvasRenderingContext2D.prototype;

function setFont(ctx, size, weight, ls = 0) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  if (hasLS) ctx.letterSpacing = `${ls}px`;
}

function txt(ctx, s, x, y, { size = 14, weight = 400, color = '#1e293b', align = 'left', ls = 0 } = {}) {
  setFont(ctx, size, weight, ls);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
  if (hasLS) ctx.letterSpacing = '0px';
}

function measure(ctx, s, size, weight, ls = 0) {
  setFont(ctx, size, weight, ls);
  const w = ctx.measureText(s).width;
  if (hasLS) ctx.letterSpacing = '0px';
  return w;
}

function wrap(ctx, s, x, y, maxW, lh, opts) {
  const words = s.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (line && measure(ctx, test, opts.size, opts.weight || 400) > maxW) {
      txt(ctx, line, x, yy, opts);
      line = word;
      yy += lh;
    } else {
      line = test;
    }
  }
  if (line) txt(ctx, line, x, yy, opts);
  return yy;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  roundRectPath(ctx, x, y, w, h, r);
}

function fillRR(ctx, x, y, w, h, r, color) {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
}

function strokeRR(ctx, x, y, w, h, r, color, lw = 1) {
  rr(ctx, x, y, w, h, r);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.stroke();
}

function circle(ctx, x, y, r, fill, stroke, lw = 1) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

function shadow(ctx, blur, offsetY, color) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur * S;
  ctx.shadowOffsetY = offsetY * S;
}

function card(ctx, x, y, w, h, { fill = 'rgba(255,255,255,.76)', stroke = 'rgba(255,255,255,.98)', r = 18 } = {}) {
  ctx.save();
  shadow(ctx, 18, 6, 'rgba(15,23,42,.08)');
  fillRR(ctx, x, y, w, h, r, fill);
  ctx.restore();
  strokeRR(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r, stroke);
}

function bar(ctx, x, y, w, h, pct, color, track = '#eef2f6') {
  fillRR(ctx, x, y, w, h, h / 2, track);
  if (pct > 0) fillRR(ctx, x, y, Math.max(h, w * pct), h, h / 2, color);
}

function pillWidth(ctx, label, { size = 11.5, weight = 600, px = 10, icon } = {}) {
  return measure(ctx, label, size, weight) + px * 2 + (icon ? size + 5 : 0);
}

function pill(ctx, label, x, y, opts = {}) {
  const {
    bg = 'rgba(255,255,255,.62)',
    border = 'rgba(255,255,255,.98)',
    color = '#334155',
    size = 11.5,
    weight = 600,
    h = 24,
    px = 10,
    icon,
  } = opts;
  const w = pillWidth(ctx, label, opts);
  fillRR(ctx, x, y, w, h, h / 2, bg);
  strokeRR(ctx, x + 0.5, y + 0.5, w - 1, h - 1, h / 2, border);
  let tx = x + px;
  if (icon) {
    drawIcon(ctx, icon, tx, y + (h - size) / 2, size, color, 2.2);
    tx += size + 5;
  }
  txt(ctx, label, tx, y + h / 2 + size * 0.36, { size, weight, color });
  return w;
}

// Pseudoaleatório determinístico (o desenho fica sempre igual)
function seeded(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

// ---------------------------------------------------------------------------
// Estrutura comum das telas
// ---------------------------------------------------------------------------
function background(ctx) {
  ctx.fillStyle = '#f0f9ff';
  ctx.fillRect(0, 0, W, H);
  [
    [0, 0, '224,242,241'],
    [W, 0, '227,242,253'],
    [W, H, '241,248,233'],
    [0, H, '255,249,196'],
  ].forEach(([x, y, rgb]) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, H * 0.62);
    g.addColorStop(0, `rgba(${rgb},1)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  });
}

function statusBar(ctx) {
  txt(ctx, '9:41', 54, 34, { size: 16, weight: 600, color: '#0f172a', align: 'center' });
  fillRR(ctx, W / 2 - 60, 11, 120, 35, 17.5, '#000');
  for (let i = 0; i < 4; i++) {
    const bh = 4.5 + i * 2.6;
    fillRR(ctx, 294 + i * 5.4, 34.5 - bh, 3.6, bh, 1, '#0f172a');
  }
  ctx.save();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  [9.5, 6].forEach((r) => {
    ctx.beginPath();
    ctx.arc(328, 34, r, -Math.PI * 0.78, -Math.PI * 0.22);
    ctx.stroke();
  });
  ctx.restore();
  circle(ctx, 328, 32.5, 1.8, '#0f172a');
  strokeRR(ctx, 342, 23.5, 25, 12.5, 3.8, 'rgba(15,23,42,.38)', 1.1);
  fillRR(ctx, 344, 25.5, 18.5, 8.5, 2.2, '#0f172a');
  fillRR(ctx, 368.5, 27.5, 2, 4.5, 1, 'rgba(15,23,42,.38)');
}

function appHeader(ctx) {
  const y = 58;
  ctx.save();
  shadow(ctx, 10, 3, 'rgba(76,132,102,.45)');
  fillRR(ctx, 20, y, 38, 38, 11, '#4c8466');
  ctx.restore();
  drawIcon(ctx, 'apple', 28, y + 8, 22, '#ffffff', 2.1);
  txt(ctx, 'NutriAli', 67, y + 26, { size: 21, weight: 800, color: '#276e58', ls: -0.5 });

  circle(ctx, W - 76, y + 19, 18, 'rgba(255,255,255,.8)', 'rgba(255,255,255,1)');
  drawIcon(ctx, 'bell', W - 85, y + 10, 18, '#475569');
  circle(ctx, W - 68, y + 10, 4, '#f43f5e', '#ffffff', 1.5);

  circle(ctx, W - 34, y + 19, 18, '#e0eee6', '#ffffff', 2);
  txt(ctx, 'M', W - 34, y + 25, { size: 15, weight: 700, color: '#276e58', align: 'center' });
}

function tabBar(ctx, active) {
  const y = H - 92;
  card(ctx, 14, y, W - 28, 66, { r: 24, fill: 'rgba(255,255,255,.9)' });
  const items = [
    ['layout-dashboard', 'Início'],
    ['book-open', 'Diário'],
    null,
    ['chart-line', 'Evolução'],
    ['user', 'Perfil'],
  ];
  const sw = (W - 28) / items.length;
  items.forEach((it, i) => {
    const cx = 14 + sw * i + sw / 2;
    if (!it) {
      ctx.save();
      shadow(ctx, 16, 6, 'rgba(76,132,102,.5)');
      circle(ctx, cx, y + 6, 27, '#4c8466');
      ctx.restore();
      circle(ctx, cx, y + 6, 27, null, 'rgba(255,255,255,.95)', 3);
      drawIcon(ctx, 'mic', cx - 11.5, y - 5.5, 23, '#ffffff', 2.2);
      txt(ctx, 'Ali', cx, y + 54, { size: 11, weight: 700, color: '#276e58', align: 'center' });
      return;
    }
    const on = it[1] === active;
    const color = on ? '#276e58' : '#94a3b8';
    drawIcon(ctx, it[0], cx - 11, y + 13, 22, color, on ? 2.2 : 2);
    txt(ctx, it[1], cx, y + 54, { size: 11, weight: on ? 700 : 500, color, align: 'center' });
  });
  fillRR(ctx, W / 2 - 67, H - 13, 134, 5, 2.5, '#0f172a');
}

function title(ctx, main, sub) {
  txt(ctx, main, 20, 140, { size: 27, weight: 800, color: '#0f172a', ls: -0.8 });
  if (sub) txt(ctx, sub, 20, 163, { size: 14, color: '#475569' });
}

function cardTitle(ctx, icon, iconColor, label, x, y) {
  drawIcon(ctx, icon, x, y - 14, 18, iconColor);
  txt(ctx, label, x + 26, y, { size: 15, weight: 700, color: '#1e293b' });
}

// ---------------------------------------------------------------------------
// Tela 1 — Painel do dia
// ---------------------------------------------------------------------------
function drawHome(ctx) {
  background(ctx);
  statusBar(ctx);
  appHeader(ctx);
  txt(ctx, 'Olá, Mariana', 20, 140, { size: 28, weight: 800, color: '#0f172a', ls: -0.9 });
  txt(ctx, 'Bem-vinda de volta ao seu painel.', 20, 163, { size: 14, color: '#475569' });
  let x = 20;
  x += pill(ctx, 'Objetivo: Emagrecimento', x, 176) + 8;
  pill(ctx, 'Peso: 68,4 kg', x, 176);

  // Meta vs Atual
  let y = 214;
  card(ctx, 16, y, W - 32, 140);
  cardTitle(ctx, 'target', '#6366f1', 'Meta vs Atual', 32, y + 30);
  txt(ctx, '68,4', 32, y + 75, { size: 34, weight: 800, color: '#0f172a', ls: -1 });
  txt(ctx, 'kg', 32 + measure(ctx, '68,4', 34, 800, -1) + 6, y + 75, { size: 14, color: '#64748b' });
  drawIcon(ctx, 'trending-down', 32, y + 86, 14, '#10b981');
  txt(ctx, 'Faltam 3,4 kg para a meta', 51, y + 98, { size: 12.5, color: '#64748b' });
  txt(ctx, 'Alvo', W - 32, y + 52, { size: 12, weight: 600, color: '#6366f1', align: 'right' });
  txt(ctx, '65,0 kg', W - 32, y + 76, { size: 19, weight: 700, color: '#1e293b', align: 'right' });
  txt(ctx, '72 kg', 32, y + 117, { size: 11, weight: 500, color: '#64748b' });
  txt(ctx, '51%', W - 32, y + 117, { size: 11, weight: 600, color: '#64748b', align: 'right' });
  bar(ctx, 32, y + 123, W - 64, 8, 0.51, '#6366f1');

  // Dica do dia
  y += 152;
  card(ctx, 16, y, W - 32, 112, { fill: 'rgba(255,251,235,.95)', stroke: 'rgba(253,230,138,.95)' });
  drawIcon(ctx, 'lightbulb', 32, y + 16, 16, '#f59e0b');
  txt(ctx, 'DICA DO DIA', 54, y + 29, { size: 11.5, weight: 800, color: '#92400e', ls: 1 });
  wrap(
    ctx,
    'Inclua uma fonte de proteína no café da manhã: ela aumenta a saciedade e ajuda a controlar a fome ao longo do dia.',
    32,
    y + 55,
    W - 64,
    19,
    { size: 13.5, weight: 500, color: '#78350f' }
  );

  // Conquistas
  y += 124;
  card(ctx, 16, y, W - 32, 150);
  cardTitle(ctx, 'award', '#f59e0b', 'Conquistas do Dia', 32, y + 30);
  const tiles = [
    { icon: 'droplets', title: 'Hidratação', desc: '1,5L / 2L', p: 0.75, color: '#3b82f6', bg: '#dbeafe' },
    { icon: 'target', title: 'Refeições', desc: '3 / 4 concluídas', p: 0.75, color: '#10b981', bg: '#d1fae5' },
    { icon: 'flame', title: 'Sequência', desc: '5 dias seguidos', p: 1, color: '#f97316', bg: '#ffedd5', ping: true },
  ];
  const tw = (W - 64 - 16) / 3;
  tiles.forEach((t, i) => {
    const tx = 32 + i * (tw + 8);
    const ty = y + 46;
    ctx.save();
    shadow(ctx, 8, 2, 'rgba(15,23,42,.06)');
    fillRR(ctx, tx, ty, tw, 90, 14, '#ffffff');
    ctx.restore();
    strokeRR(ctx, tx + 0.5, ty + 0.5, tw - 1, 89, 14, '#eef2f6');
    fillRR(ctx, tx + 10, ty + 10, 28, 28, 8, t.bg);
    drawIcon(ctx, t.icon, tx + 16, ty + 16, 16, t.color);
    if (t.ping) {
      circle(ctx, tx + tw - 15, ty + 16, 7, 'rgba(245,158,11,.25)');
      circle(ctx, tx + tw - 15, ty + 16, 4, '#f59e0b');
    }
    txt(ctx, t.title, tx + 10, ty + 55, { size: 12, weight: 700, color: '#1e293b' });
    txt(ctx, t.desc, tx + 10, ty + 70, { size: 10, weight: 500, color: '#64748b' });
    bar(ctx, tx + 10, ty + 78, tw - 20, 5, t.p, t.color);
  });

  // Atalho para o Ali
  y += 162;
  card(ctx, 16, y, W - 32, 72, { fill: 'rgba(242,247,244,.97)', stroke: '#e0eee6' });
  ctx.save();
  shadow(ctx, 10, 4, 'rgba(76,132,102,.45)');
  circle(ctx, 53, y + 36, 21, '#4c8466');
  ctx.restore();
  drawIcon(ctx, 'mic', 43, y + 26, 20, '#ffffff', 2.2);
  txt(ctx, 'Fale com o Ali', 86, y + 32, { size: 15, weight: 700, color: '#1c5341' });
  txt(ctx, 'Tire dúvidas do seu plano por voz', 86, y + 51, { size: 12.5, color: '#475569' });
  drawIcon(ctx, 'chevron-right', W - 52, y + 26, 20, '#94a3b8');

  tabBar(ctx, 'Início');
}

// ---------------------------------------------------------------------------
// Tela 2 — Diário alimentar
// ---------------------------------------------------------------------------
const STATUS_STYLE = {
  followed: { bg: '#ecfdf5', border: '#6ee7b7', color: '#047857' },
  different: { bg: '#fffbeb', border: '#fcd34d', color: '#b45309' },
  skipped: { bg: '#fff1f2', border: '#fda4af', color: '#be123c' },
  off: { bg: '#ffffff', border: '#e2e8f0', color: '#64748b' },
};

function statusButtons(ctx, y, active) {
  const defs = [
    ['check', 'Refeição realizada', 'followed', 146],
    ['pen-line', 'Alterei', 'different', 82],
    ['x', 'Pulei', 'skipped', 82],
  ];
  let x = 32;
  defs.forEach(([icon, label, key, w]) => {
    const st = STATUS_STYLE[key === active ? key : 'off'];
    fillRR(ctx, x, y, w, 30, 8, st.bg);
    strokeRR(ctx, x + 0.5, y + 0.5, w - 1, 29, 8, st.border);
    const cw = 13 + 5 + measure(ctx, label, 11.5, 600);
    const sx = x + (w - cw) / 2;
    drawIcon(ctx, icon, sx, y + 8.5, 13, st.color, 2.4);
    txt(ctx, label, sx + 18, y + 19.5, { size: 11.5, weight: 600, color: st.color });
    x += w + 8;
  });
}

function mealHeader(ctx, y, name, time, items) {
  txt(ctx, name, 32, y + 29, { size: 15, weight: 700, color: '#1e293b' });
  const nx = 32 + measure(ctx, name, 15, 700) + 8;
  pill(ctx, time, nx, y + 14, { bg: '#f1f5f9', border: '#f1f5f9', color: '#64748b', size: 11, weight: 500, h: 21, px: 8, icon: 'clock' });
  txt(ctx, items, 32, y + 50, { size: 12.5, color: '#475569' });
}

function plate(ctx, x, y, w, h) {
  const rand = seeded(7);
  ctx.save();
  rr(ctx, x, y, w, h, 12);
  ctx.clip();
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#ead8c1');
  g.addColorStop(1, '#d4b996');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(120,80,40,.12)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(x, y + 8 + i * 15);
    ctx.bezierCurveTo(x + w * 0.3, y + 4 + i * 15, x + w * 0.6, y + 12 + i * 15, x + w, y + 7 + i * 15);
    ctx.stroke();
  }
  const cx = x + w / 2;
  const cy = y + h / 2;
  circle(ctx, cx + 1.5, cy + 2.5, 38, 'rgba(0,0,0,.14)');
  circle(ctx, cx, cy, 38, '#ffffff');
  circle(ctx, cx, cy, 30, '#f8fafc', '#e2e8f0', 1);
  // salada
  [
    [-12, -12, 9, '#22c55e'],
    [-4, -18, 7, '#16a34a'],
    [-18, -3, 7, '#4ade80'],
    [-7, -6, 6, '#86efac'],
    [-1, -10, 3.5, '#ef4444'],
    [-15, -15, 3, '#ef4444'],
  ].forEach(([dx, dy, r, c]) => circle(ctx, cx + dx, cy + dy, r, c));
  // frango grelhado
  ctx.save();
  ctx.translate(cx + 11, cy - 9);
  ctx.rotate(-0.45);
  fillRR(ctx, -12, -7.5, 24, 15, 6, '#e3b97f');
  ctx.strokeStyle = '#a8703c';
  ctx.lineWidth = 1.6;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(-7 + i * 6, -6);
    ctx.lineTo(-3 + i * 6, 6);
    ctx.stroke();
  }
  ctx.restore();
  // batata-doce
  [
    [9, 13, 0.5, '#f59e0b'],
    [17, 4, 1.25, '#fb923c'],
  ].forEach(([dx, dy, rot, c]) => {
    ctx.save();
    ctx.translate(cx + dx, cy + dy);
    ctx.rotate(rot);
    fillRR(ctx, -8.5, -4.5, 17, 9, 4, c);
    ctx.restore();
  });
  // feijão
  for (let k = 0; k < 16; k++) circle(ctx, cx - 15 + rand() * 13, cy + 7 + rand() * 11, 2.3, k % 3 ? '#5b3a29' : '#6f4733');
  ctx.restore();
}

function meal(ctx, y, { name, time, items, status }) {
  card(ctx, 16, y, W - 32, 104);
  mealHeader(ctx, y, name, time, items);
  statusButtons(ctx, y + 62, status);
}

function drawDiary(ctx) {
  background(ctx);
  statusBar(ctx);
  appHeader(ctx);
  title(ctx, 'Diário Alimentar');
  drawIcon(ctx, 'calendar', 20, 151, 14, '#64748b');
  txt(ctx, 'Hoje · sexta-feira', 40, 163, { size: 13, weight: 500, color: '#64748b' });
  const pw = pillWidth(ctx, '3 de 4 refeições');
  pill(ctx, '3 de 4 refeições', W - 20 - pw, 148, { bg: '#e0eee6', border: '#c2dfd1', color: '#1f5a48' });

  let y = 182;
  meal(ctx, y, { name: 'Café da manhã', time: '07:30', items: 'Ovos mexidos, pão integral e mamão', status: 'followed' });

  y += 114;
  card(ctx, 16, y, W - 32, 310);
  mealHeader(ctx, y, 'Almoço', '12:30', 'Frango grelhado, arroz integral, feijão e salada');
  statusButtons(ctx, y + 62, 'different');
  plate(ctx, 32, y + 106, 88, 88);
  txt(ctx, 'Consumo real', 134, y + 121, { size: 12, weight: 700, color: '#334155' });
  wrap(ctx, 'Troquei o arroz integral por batata-doce.', 134, y + 140, W - 32 - 134 - 14, 17, { size: 12.5, color: '#475569' });
  pill(ctx, 'Foto enviada', 134, y + 166, { icon: 'camera', bg: '#f1f5f9', border: '#e2e8f0', color: '#475569', size: 10.5, h: 22, px: 9 });
  const fy = y + 208;
  fillRR(ctx, 32, fy, W - 64, 88, 12, '#ecfdf5');
  strokeRR(ctx, 32.5, fy + 0.5, W - 65, 87, 12, '#a7f3d0');
  drawIcon(ctx, 'sparkles', 44, fy + 12, 15, '#059669');
  txt(ctx, 'ANÁLISE DA IA', 66, fy + 24, { size: 10.5, weight: 800, color: '#047857', ls: 0.8 });
  wrap(
    ctx,
    'Boa troca! A batata-doce mantém o prato equilibrado e a porção de proteína está adequada ao seu objetivo.',
    44,
    fy + 45,
    W - 64 - 24,
    16.5,
    { size: 12, weight: 500, color: '#065f46' }
  );

  y += 320;
  meal(ctx, y, { name: 'Lanche da tarde', time: '16:00', items: 'Iogurte natural com granola', status: null });

  tabBar(ctx, 'Diário');
}

// ---------------------------------------------------------------------------
// Tela 3 — Hábitos: água, humor e sequência
// ---------------------------------------------------------------------------
function drawHabits(ctx) {
  background(ctx);
  statusBar(ctx);
  appHeader(ctx);
  title(ctx, 'Hábitos de hoje', 'Pequenas vitórias, todos os dias.');

  // Água
  let y = 184;
  card(ctx, 16, y, W - 32, 196);
  cardTitle(ctx, 'droplet', '#3b82f6', 'Água (Hoje)', 32, y + 30);
  txt(ctx, '1500 / 2000 ml', W - 32, y + 30, { size: 12.5, weight: 500, color: '#64748b', align: 'right' });
  const rcx = 96;
  const rcy = y + 118;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#dbeafe';
  ctx.beginPath();
  ctx.arc(rcx, rcy, 52, 0, Math.PI * 2);
  ctx.stroke();
  const wg = ctx.createLinearGradient(rcx - 52, rcy - 52, rcx + 52, rcy + 52);
  wg.addColorStop(0, '#60a5fa');
  wg.addColorStop(1, '#2563eb');
  ctx.strokeStyle = wg;
  ctx.beginPath();
  ctx.arc(rcx, rcy, 52, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.75);
  ctx.stroke();
  ctx.restore();
  txt(ctx, '1,5 L', rcx, rcy + 5, { size: 22, weight: 800, color: '#1e3a8a', align: 'center', ls: -0.5 });
  txt(ctx, '75% da meta', rcx, rcy + 23, { size: 10.5, weight: 600, color: '#64748b', align: 'center' });
  txt(ctx, 'Faltam 500 ml', 176, y + 78, { size: 16, weight: 800, color: '#0f172a', ls: -0.3 });
  txt(ctx, 'para a meta de 2 L', 176, y + 97, { size: 12.5, color: '#64748b' });
  ['250ml', '500ml'].forEach((label, i) => {
    const by = y + 114 + i * 40;
    fillRR(ctx, 176, by, W - 32 - 176, 32, 9, '#ffffff');
    strokeRR(ctx, 176.5, by + 0.5, W - 33 - 176, 31, 9, '#bfdbfe');
    const cw = 14 + 4 + measure(ctx, label, 12.5, 600);
    const sx = 176 + (W - 32 - 176 - cw) / 2;
    drawIcon(ctx, 'plus', sx, by + 9, 14, '#2563eb', 2.4);
    txt(ctx, label, sx + 18, by + 20.5, { size: 12.5, weight: 600, color: '#2563eb' });
  });

  // Humor
  y += 208;
  card(ctx, 16, y, W - 32, 128);
  cardTitle(ctx, 'smile', '#f59e0b', 'Como você se sente hoje?', 32, y + 30);
  const moods = [
    ['frown', 'Triste'],
    ['meh', 'Neutro'],
    ['smile', 'Feliz'],
    ['heart', 'Ótimo'],
  ];
  const slot = (W - 64) / 4;
  moods.forEach(([icon, label], i) => {
    const cx = 32 + slot * i + slot / 2;
    const on = i === 2;
    if (on) fillRR(ctx, cx - 31, y + 44, 62, 72, 14, '#e0eee6');
    drawIcon(ctx, icon, cx - 15, y + 54, 30, on ? '#276e58' : '#a3b1c2', 2);
    txt(ctx, label, cx, y + 104, { size: 11, weight: on ? 700 : 600, color: on ? '#276e58' : '#94a3b8', align: 'center' });
  });

  // Sequência
  y += 140;
  card(ctx, 16, y, W - 32, 186);
  cardTitle(ctx, 'flame', '#f97316', 'Sequência de 5 dias', 32, y + 30);
  txt(ctx, 'Continue assim, Mariana!', 32, y + 52, { size: 12.5, color: '#64748b' });
  const days = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
  const step = (W - 64) / days.length;
  days.forEach((d, i) => {
    const cx = 32 + step * i + step / 2;
    const cy = y + 92;
    if (i < 5) {
      if (i === 4) circle(ctx, cx, cy, 21, null, '#fdba74', 3);
      circle(ctx, cx, cy, 17, '#f97316');
      drawIcon(ctx, 'check', cx - 8, cy - 8, 16, '#ffffff', 2.8);
    } else {
      circle(ctx, cx, cy, 17, '#ffffff', '#e2e8f0', 1.5);
    }
    txt(ctx, d, cx, y + 129, { size: 11, weight: 700, color: i < 5 ? '#c2410c' : '#94a3b8', align: 'center' });
  });
  txt(ctx, 'Meta da semana', 32, y + 158, { size: 12, weight: 600, color: '#334155' });
  txt(ctx, '5 de 7 dias', W - 32, y + 158, { size: 12, weight: 700, color: '#c2410c', align: 'right' });
  bar(ctx, 32, y + 166, W - 64, 7, 5 / 7, '#f97316', '#ffedd5');

  tabBar(ctx, 'Início');
}

// ---------------------------------------------------------------------------
// Tela 4 — Evolução
// ---------------------------------------------------------------------------
function smoothPath(ctx, pts) {
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const t = 0.17;
    ctx.bezierCurveTo(
      p1[0] + (p2[0] - p0[0]) * t,
      p1[1] + (p2[1] - p0[1]) * t,
      p2[0] - (p3[0] - p1[0]) * t,
      p2[1] - (p3[1] - p1[1]) * t,
      p2[0],
      p2[1]
    );
  }
}

function drawEvolution(ctx) {
  background(ctx);
  statusBar(ctx);
  appHeader(ctx);
  title(ctx, 'Minha evolução', 'Últimas 8 semanas');

  // Indicadores
  let y = 182;
  const kw = (W - 32 - 10) / 2;
  [
    ['Peso perdido', '−3,6 kg', '#047857', '#10b981'],
    ['Gordura corporal', '−2,9 %', '#6d28d9', '#8b5cf6'],
  ].forEach(([label, value, color, iconColor], i) => {
    const x = 16 + i * (kw + 10);
    card(ctx, x, y, kw, 78);
    txt(ctx, label, x + 14, y + 27, { size: 11.5, weight: 600, color: '#64748b' });
    txt(ctx, value, x + 14, y + 58, { size: 23, weight: 800, color, ls: -0.6 });
    drawIcon(ctx, 'trending-down', x + kw - 32, y + 14, 18, iconColor);
  });

  // Gráfico de peso
  y += 90;
  card(ctx, 16, y, W - 32, 228);
  cardTitle(ctx, 'chart-line', '#4c8466', 'Evolução do peso', 32, y + 30);
  const pw = pillWidth(ctx, 'kg', { size: 10.5, px: 8 });
  pill(ctx, 'kg', W - 32 - pw, y + 15, { size: 10.5, px: 8, h: 21, bg: '#f1f5f9', border: '#e2e8f0', color: '#475569' });
  const values = [72.0, 71.4, 70.9, 70.6, 69.8, 69.3, 68.9, 68.4];
  const left = 58;
  const right = W - 40;
  const top = y + 58;
  const bottom = y + 190;
  const vy = (v) => bottom - ((v - 67.5) / 5) * (bottom - top);
  const vx = (i) => left + (i / (values.length - 1)) * (right - left);
  ctx.save();
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  [68, 70, 72].forEach((v) => {
    ctx.beginPath();
    ctx.moveTo(left - 6, vy(v));
    ctx.lineTo(right + 6, vy(v));
    ctx.stroke();
    txt(ctx, String(v), 32, vy(v) + 3.5, { size: 10.5, weight: 500, color: '#94a3b8' });
  });
  ctx.restore();
  const pts = values.map((v, i) => [vx(i), vy(v)]);
  ctx.beginPath();
  smoothPath(ctx, pts);
  ctx.lineTo(right, bottom);
  ctx.lineTo(left, bottom);
  ctx.closePath();
  const area = ctx.createLinearGradient(0, top, 0, bottom);
  area.addColorStop(0, 'rgba(76,132,102,.3)');
  area.addColorStop(1, 'rgba(76,132,102,0)');
  ctx.fillStyle = area;
  ctx.fill();
  ctx.beginPath();
  smoothPath(ctx, pts);
  ctx.strokeStyle = '#4c8466';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.stroke();
  pts.forEach(([px, py], i) => {
    if (i === pts.length - 1) {
      circle(ctx, px, py, 9, 'rgba(76,132,102,.2)');
      circle(ctx, px, py, 5.5, '#4c8466', '#ffffff', 2);
    } else {
      circle(ctx, px, py, 3.5, '#ffffff', '#4c8466', 2);
    }
    txt(ctx, `S${i + 1}`, px, bottom + 18, { size: 10, weight: 500, color: '#94a3b8', align: 'center' });
  });
  const [lx, ly] = pts[pts.length - 1];
  fillRR(ctx, lx - 52, ly - 40, 60, 25, 8, '#1c5341');
  ctx.beginPath();
  ctx.moveTo(lx - 8, ly - 15.5);
  ctx.lineTo(lx - 2, ly - 9);
  ctx.lineTo(lx + 2, ly - 15.5);
  ctx.fillStyle = '#1c5341';
  ctx.fill();
  txt(ctx, '68,4 kg', lx - 22, ly - 23, { size: 11.5, weight: 700, color: '#ffffff', align: 'center' });

  // Metas diárias (macros)
  y += 240;
  card(ctx, 16, y, W - 32, 206);
  cardTitle(ctx, 'chart-pie', '#4c8466', 'Metas Diárias', 32, y + 30);
  const macros = [
    ['Carboidratos', 0.45, '#4c8466'],
    ['Proteínas', 0.3, '#8b5cf6'],
    ['Gorduras', 0.25, '#f59e0b'],
  ];
  const dcx = 98;
  const dcy = y + 120;
  const gap = 0.09;
  let a = -Math.PI / 2;
  ctx.save();
  ctx.lineWidth = 18;
  macros.forEach(([, frac, color]) => {
    const arc = Math.PI * 2 * frac;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(dcx, dcy, 52, a + gap / 2, a + arc - gap / 2);
    ctx.stroke();
    a += arc;
  });
  ctx.restore();
  txt(ctx, 'Hoje', dcx, dcy + 5, { size: 13, weight: 700, color: '#334155', align: 'center' });
  macros.forEach(([label, frac, color], i) => {
    const ly2 = y + 84 + i * 36;
    circle(ctx, 186, ly2 - 4, 5.5, color);
    txt(ctx, label, 200, ly2, { size: 13, weight: 600, color: '#334155' });
    txt(ctx, `${Math.round(frac * 100)}%`, W - 36, ly2, { size: 13, weight: 800, color: '#0f172a', align: 'right' });
  });

  tabBar(ctx, 'Evolução');
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
function paint(fn) {
  const c = document.createElement('canvas');
  c.width = Math.round(W * S);
  c.height = Math.round(H * S);
  const ctx = c.getContext('2d');
  ctx.scale(S, S);
  fn(ctx);
  return c;
}

async function ensureFonts() {
  if (!document.fonts?.load) return;
  const loads = [400, 500, 600, 700, 800].map((w) => document.fonts.load(`${w} 16px Inter`));
  await Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 2500))]).catch(() => {});
}

let canvasesPromise = null;
function getCanvases() {
  canvasesPromise ??= ensureFonts().then(() => ({
    home: paint(drawHome),
    diary: paint(drawDiary),
    habits: paint(drawHabits),
    evolution: paint(drawEvolution),
  }));
  return canvasesPromise;
}

export const SCREEN_ORDER = ['home', 'diary', 'habits', 'evolution'];

export async function createScreenTextures(renderer) {
  const canvases = await getCanvases();
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const out = {};
  for (const [key, c] of Object.entries(canvases)) {
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = aniso;
    out[key] = tex;
  }
  return out;
}
