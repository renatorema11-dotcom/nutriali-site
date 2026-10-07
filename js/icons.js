// Ícones Lucide (os mesmos usados no app) renderizados como SVG no HTML
// e desenhados em <canvas> para as telas 3D do celular.
import { ICONS } from './icon-data.js';

const toKey = (name) => name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

export function iconNodes(name) {
  const nodes = ICONS[toKey(name)];
  if (!nodes) console.warn(`Ícone não encontrado: ${name}`);
  return nodes || [];
}

export function iconSVG(name, { strokeWidth = 2, className = '' } = {}) {
  const inner = iconNodes(name)
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .filter(([k]) => k !== 'key')
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');
      return `<${tag} ${a}/>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" class="icon ${className}">${inner}</svg>`;
}

// Troca cada <i data-icon="nome"> pelo SVG correspondente, mantendo as classes.
export function renderIcons(root = document) {
  root.querySelectorAll('i[data-icon]').forEach((el) => {
    const tpl = document.createElement('template');
    tpl.innerHTML = iconSVG(el.dataset.icon, {
      strokeWidth: el.dataset.stroke || 2,
      className: el.className,
    });
    el.replaceWith(tpl.content.firstChild);
  });
}

// Desenha um ícone num contexto 2D. (x, y) é o canto superior esquerdo.
export function drawIcon(ctx, name, x, y, size, color, strokeWidth = 2) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [tag, a] of iconNodes(name)) {
    let p;
    if (tag === 'path') {
      p = new Path2D(a.d);
    } else {
      p = new Path2D();
      if (tag === 'circle') {
        p.moveTo(+a.cx + +a.r, +a.cy);
        p.arc(+a.cx, +a.cy, +a.r, 0, Math.PI * 2);
      } else if (tag === 'ellipse') {
        p.ellipse(+a.cx, +a.cy, +a.rx, +a.ry, 0, 0, Math.PI * 2);
      } else if (tag === 'rect') {
        roundRectPath(p, +a.x, +a.y, +a.width, +a.height, +(a.rx || 0));
      } else if (tag === 'line') {
        p.moveTo(+a.x1, +a.y1);
        p.lineTo(+a.x2, +a.y2);
      } else if (tag === 'polyline' || tag === 'polygon') {
        const pts = a.points.trim().split(/[\s,]+/).map(Number);
        p.moveTo(pts[0], pts[1]);
        for (let i = 2; i < pts.length; i += 2) p.lineTo(pts[i], pts[i + 1]);
        if (tag === 'polygon') p.closePath();
      }
    }
    ctx.stroke(p);
  }
  ctx.restore();
}

// Retângulo arredondado compatível com CanvasRenderingContext2D e Path2D.
export function roundRectPath(p, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  p.moveTo(x + rr, y);
  p.arcTo(x + w, y, x + w, y + h, rr);
  p.arcTo(x + w, y + h, x, y + h, rr);
  p.arcTo(x, y + h, x, y, rr);
  p.arcTo(x, y, x + w, y, rr);
  p.closePath();
}
