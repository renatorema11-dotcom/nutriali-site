import { renderIcons, iconSVG } from './icons.js';

// Endereço do app NutriAli (hospedado na Hostinger). Todos os botões
// "Entrar" / "Testar grátis" usam este endereço + o caminho em data-app.
const APP_URL = 'https://nutriali.srv1890478.hstgr.cloud';

const root = document.documentElement;
root.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

// ---------------------------------------------------------------------------
// Básico: links do app, ícones, ano
// ---------------------------------------------------------------------------
document.querySelectorAll('[data-app]').forEach((a) => {
  a.href = APP_URL + a.dataset.app;
});
renderIcons();
document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = new Date().getFullYear();
});

// ---------------------------------------------------------------------------
// Rolagem suave (Lenis) integrada ao GSAP ScrollTrigger
// ---------------------------------------------------------------------------
let lenis = null;
if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

if (!reduceMotion && window.Lenis) {
  lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
  if (gsap && ScrollTrigger) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }
}

function scrollToTarget(target) {
  if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.3 });
  else if (typeof target === 'number') window.scrollTo({ top: target, behavior: reduceMotion ? 'auto' : 'smooth' });
  else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
}

document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    closeMenu();
    scrollToTarget(id === '#inicio' ? 0 : target);
    history.replaceState(null, '', id);
  });
});

// ---------------------------------------------------------------------------
// Navegação: fundo ao rolar, menu mobile e link ativo
// ---------------------------------------------------------------------------
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const toggle = document.querySelector('.nav__toggle');
const sheet = document.getElementById('menu-mobile');

function closeMenu() {
  if (!sheet || sheet.hidden) return;
  sheet.hidden = true;
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Abrir menu');
}

toggle?.addEventListener('click', () => {
  const open = sheet.hidden;
  sheet.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
});
document.addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());
document.addEventListener('click', (e) => {
  if (!sheet.hidden && !sheet.contains(e.target) && !toggle.contains(e.target)) closeMenu();
});

const navLinks = [...document.querySelectorAll('.nav__links a')];
const sectionIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((l) => l.setAttribute('aria-current', String(l.getAttribute('href') === `#${entry.target.id}`)));
    });
  },
  { rootMargin: '-45% 0px -50% 0px' }
);
navLinks.forEach((l) => {
  const s = document.querySelector(l.getAttribute('href'));
  if (s) sectionIO.observe(s);
});

// ---------------------------------------------------------------------------
// Revelação ao rolar (com escalonamento automático em grupos)
// ---------------------------------------------------------------------------
document.querySelectorAll('[data-stagger]').forEach((group) => {
  [...group.children].forEach((child, i) => {
    child.setAttribute('data-reveal', '');
    child.style.setProperty('--delay', `${Math.min(i, 6) * 0.08}s`);
  });
});

const revealIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      revealIO.unobserve(entry.target);
    });
  },
  { rootMargin: '0px 0px -8% 0px', threshold: 0.1 }
);
document.querySelectorAll('[data-reveal]').forEach((el) => revealIO.observe(el));

// ---------------------------------------------------------------------------
// Entrada do hero
// ---------------------------------------------------------------------------
function splitWords(el) {
  const frag = document.createDocumentFragment();
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) frag.append(' ');
        else {
          const w = document.createElement('span');
          w.className = 'word';
          w.textContent = part;
          frag.append(w);
        }
      });
    } else {
      const w = document.createElement('span');
      w.className = 'word';
      w.append(node.cloneNode(true));
      frag.append(w);
    }
  });
  el.replaceChildren(frag);
  return el.querySelectorAll('.word');
}

const heroTitle = document.querySelector('[data-split]');
const heroIntro = [...document.querySelectorAll('.hero [data-intro]')];

if (gsap && !reduceMotion && heroTitle) {
  const words = splitWords(heroTitle);
  gsap.set(heroTitle, { opacity: 1 });
  gsap.set(words, { opacity: 0, y: 34, rotateX: -40 });
  gsap.set(heroIntro, { opacity: 0, y: 22 });
  root.classList.add('intro-done');
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.15 });
  tl.to(heroIntro[0], { opacity: 1, y: 0, duration: 1 })
    .to(words, { opacity: 1, y: 0, rotateX: 0, duration: 1.2, stagger: 0.07 }, '-=0.8')
    .to(heroIntro.slice(1), { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, '-=0.9');
} else {
  root.classList.add('intro-done');
}
// Rede de segurança: nunca deixar o conteúdo escondido.
setTimeout(() => root.classList.add('intro-done'), 3000);

// ---------------------------------------------------------------------------
// Contadores
// ---------------------------------------------------------------------------
const counterIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      counterIO.unobserve(entry.target);
      const el = entry.target;
      const to = Number(el.dataset.count);
      if (reduceMotion) return;
      const t0 = performance.now();
      const dur = 1500;
      const step = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(step);
      };
      el.textContent = '0';
      requestAnimationFrame(step);
    });
  },
  { threshold: 0.6 }
);
document.querySelectorAll('[data-count]').forEach((el) => counterIO.observe(el));

// ---------------------------------------------------------------------------
// Conversa simulada com o Ali (sincronizada com a esfera 3D)
// ---------------------------------------------------------------------------
const DIALOG = [
  { who: 'patient', text: 'Ali, o que tem no meu almoço hoje?' },
  { who: 'ali', text: 'Hoje no almoço: frango grelhado, arroz integral, feijão e salada verde à vontade. Bom apetite!' },
  { who: 'patient', text: 'Meu peso hoje é 82,5.' },
  { who: 'ali', text: 'Perfeito! Registrei 82,5 kg no seu acompanhamento. Faltam só 2,5 kg para a sua meta.', action: 'Peso registrado no acompanhamento' },
  { who: 'patient', text: 'Comi frango com arroz no almoço.' },
  { who: 'ali', text: 'Anotado! Adicionei frango com arroz ao seu diário alimentar.', action: 'Refeição adicionada ao diário' },
  { who: 'patient', text: 'Quero marcar uma consulta.' },
  { who: 'ali', text: 'Pedido enviado! Sua nutricionista vai confirmar o melhor horário com você.', action: 'Pedido de consulta enviado' },
];

const STATUS = {
  idle: 'Toque para falar com o Ali',
  listening: 'Ouvindo o paciente…',
  thinking: 'Consultando o plano…',
  speaking: 'Ali está falando…',
};

let orbApi = null;
const transcriptEl = document.querySelector('[data-transcript]');
const statusEl = document.querySelector('[data-status]');
const waveEl = document.querySelector('[data-wave]');

function setMode(mode) {
  if (statusEl) statusEl.textContent = STATUS[mode];
  if (waveEl) waveEl.dataset.mode = mode;
  orbApi?.setMode(mode);
}

function startConversation() {
  if (!transcriptEl) return;

  if (reduceMotion) {
    DIALOG.slice(0, 4).forEach((line) => transcriptEl.append(makeBubble(line, line.text)));
    return;
  }

  let running = false;
  let generation = 0;
  const wait = (ms, gen) =>
    new Promise((resolve, reject) => setTimeout(() => (gen === generation ? resolve() : reject(new Error('stop'))), ms));

  async function run(gen) {
    let i = 0;
    for (;;) {
      const line = DIALOG[i % DIALOG.length];
      if (i % DIALOG.length === 0 && i > 0) {
        clearBubbles();
        await wait(600, gen);
      }
      trimBubbles();
      if (line.who === 'patient') {
        setMode('listening');
        const b = makeBubble(line, '');
        transcriptEl.append(b);
        const textEl = b.querySelector('.bubble__text');
        textEl.classList.add('is-typing');
        const words = line.text.split(' ');
        for (let w = 0; w < words.length; w++) {
          await wait(150 + Math.random() * 110, gen);
          textEl.textContent = words.slice(0, w + 1).join(' ');
        }
        textEl.classList.remove('is-typing');
        await wait(450, gen);
      } else {
        setMode('thinking');
        const b = makeBubble(line, null);
        transcriptEl.append(b);
        await wait(900, gen);
        const textEl = b.querySelector('.bubble__text');
        textEl.replaceChildren();
        textEl.classList.add('is-typing');
        setMode('speaking');
        for (let c = 1; c <= line.text.length; c++) {
          textEl.textContent = line.text.slice(0, c);
          await wait(line.text[c - 1] === ' ' ? 34 : 24, gen);
        }
        textEl.classList.remove('is-typing');
        if (line.action) {
          await wait(250, gen);
          const action = document.createElement('span');
          action.className = 'bubble__action';
          action.innerHTML = `${iconSVG('check')} ${line.action}`;
          b.append(action);
        }
        await wait(500, gen);
        setMode('idle');
        await wait(1300, gen);
      }
      i++;
    }
  }

  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        const gen = ++generation;
        run(gen).catch(() => {});
      } else if (!entry.isIntersecting && running) {
        running = false;
        generation++;
        setMode('idle');
      }
    },
    { threshold: 0.25 }
  );
  io.observe(transcriptEl.closest('section'));
}

function makeBubble(line, text) {
  const b = document.createElement('div');
  b.className = `bubble bubble--${line.who}`;
  const who = line.who === 'ali' ? `${iconSVG('audio-lines')} Ali` : `${iconSVG('user')} Paciente`;
  b.innerHTML = `<span class="bubble__who">${who}</span><p class="bubble__text"></p>`;
  const textEl = b.querySelector('.bubble__text');
  if (text === null) textEl.innerHTML = '<span class="bubble__dots"><i></i><i></i><i></i></span>';
  else textEl.textContent = text;
  return b;
}

function trimBubbles() {
  const bubbles = [...transcriptEl.querySelectorAll('.bubble:not(.is-leaving)')];
  bubbles.slice(0, Math.max(0, bubbles.length - 3)).forEach(removeBubble);
}

function clearBubbles() {
  transcriptEl.querySelectorAll('.bubble:not(.is-leaving)').forEach(removeBubble);
}

function removeBubble(b) {
  b.classList.add('is-leaving');
  setTimeout(() => b.remove(), 400);
}

startConversation();

// ---------------------------------------------------------------------------
// Tour do paciente: passo ativo controla o celular 3D
// ---------------------------------------------------------------------------
let tourApi = null;
let activeStep = 0;
const steps = [...document.querySelectorAll('.tour__step')];
const dots = [...document.querySelectorAll('.tour__dots button')];

function setStep(i) {
  activeStep = i;
  steps.forEach((s, j) => s.classList.toggle('is-active', j === i));
  dots.forEach((d, j) => d.classList.toggle('is-active', j === i));
  tourApi?.setStep(i);
}

let stepIO = null;
function observeSteps() {
  stepIO?.disconnect();
  const narrow = window.matchMedia('(max-width: 960px)').matches;
  stepIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setStep(Number(entry.target.dataset.step));
      });
    },
    { rootMargin: narrow ? '-72% 0px -26% 0px' : '-49% 0px -49% 0px' }
  );
  steps.forEach((s) => stepIO.observe(s));
}
observeSteps();
window.matchMedia('(max-width: 960px)').addEventListener('change', observeSteps);

dots.forEach((d) =>
  d.addEventListener('click', () => {
    const step = steps[Number(d.dataset.goto)];
    if (step) scrollToTarget(step);
  })
);

// ---------------------------------------------------------------------------
// Animações ligadas à rolagem (GSAP)
// ---------------------------------------------------------------------------
if (gsap && ScrollTrigger && !reduceMotion) {
  const scene = document.querySelector('[data-pro-scene]');
  const wide = window.matchMedia('(min-width: 961px)').matches;
  if (scene && wide) {
    gsap.fromTo(
      scene,
      { '--rx': '26deg', '--sc': 0.9 },
      {
        '--rx': '0deg',
        '--sc': 1,
        ease: 'none',
        scrollTrigger: { trigger: scene, start: 'top 95%', end: 'top 22%', scrub: 0.6 },
      }
    );
    gsap.from('.float-card', {
      opacity: 0,
      y: 50,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.18,
      scrollTrigger: { trigger: scene, start: 'top 55%' },
    });
  }

  const line = document.querySelector('[data-line]');
  if (line) {
    gsap.fromTo(
      line,
      { '--p': 0 },
      { '--p': 1, ease: 'none', scrollTrigger: { trigger: '.howto', start: 'top 80%', end: 'top 35%', scrub: 0.5 } }
    );
  }
}

// ---------------------------------------------------------------------------
// Cartão de preço com inclinação 3D
// ---------------------------------------------------------------------------
document.querySelectorAll('[data-tilt]').forEach((el) => {
  if (!canHover || reduceMotion) return;
  const max = 7;
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.classList.add('is-tilting');
    el.style.setProperty('--ry', `${(px - 0.5) * max * 2}deg`);
    el.style.setProperty('--rx', `${(0.5 - py) * max * 2}deg`);
    el.style.setProperty('--gx', `${px * 100}%`);
    el.style.setProperty('--gy', `${py * 100}%`);
  });
  el.addEventListener('pointerleave', () => {
    el.classList.remove('is-tilting');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  });
});

// ---------------------------------------------------------------------------
// FAQ com abertura animada
// ---------------------------------------------------------------------------
document.querySelectorAll('.faq details').forEach((d) => {
  const summary = d.querySelector('summary');
  const body = d.querySelector('.faq__body');
  let anim = null;
  summary.addEventListener('click', (e) => {
    if (reduceMotion) return;
    e.preventDefault();
    anim?.cancel();
    if (d.open) {
      anim = body.animate([{ height: `${body.offsetHeight}px`, opacity: 1 }, { height: '0px', opacity: 0 }], {
        duration: 280,
        easing: 'cubic-bezier(.4,0,.2,1)',
      });
      anim.onfinish = () => {
        d.open = false;
        anim = null;
      };
    } else {
      d.open = true;
      anim = body.animate([{ height: '0px', opacity: 0 }, { height: `${body.offsetHeight}px`, opacity: 1 }], {
        duration: 380,
        easing: 'cubic-bezier(.16,1,.3,1)',
      });
      anim.onfinish = () => (anim = null);
    }
  });
});

// ---------------------------------------------------------------------------
// Cenas 3D (carregadas sob demanda; o site funciona mesmo sem WebGL)
// ---------------------------------------------------------------------------
function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

function whenNear(el, cb, margin = '600px 0px') {
  if (!el) return;
  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      cb();
    },
    { rootMargin: margin }
  );
  io.observe(el);
}

function fail(section, err) {
  console.warn('Cena 3D indisponível:', err);
  section?.classList.add('is-fallback');
}

if (webglAvailable()) {
  const hero = document.querySelector('.hero');
  import('./three/hero.js')
    .then(({ initHero }) =>
      initHero({
        canvas: document.getElementById('hero-canvas'),
        stage: document.getElementById('hero-stage'),
        section: hero,
        chips: [...document.querySelectorAll('[data-chip]')],
      })
    )
    .then(() => hero.classList.add('is-ready'))
    .catch((err) => fail(hero, err));

  const orbCanvas = document.getElementById('orb-canvas');
  whenNear(orbCanvas, () =>
    import('./three/orb.js')
      .then(({ initOrb }) => {
        orbApi = initOrb(orbCanvas);
        orbApi.setMode(waveEl?.dataset.mode || 'idle');
      })
      .catch((err) => fail(orbCanvas.closest('section'), err))
  );

  const tourCanvas = document.getElementById('tour-canvas');
  whenNear(tourCanvas, () =>
    import('./three/tour.js')
      .then(({ initTour }) => initTour(tourCanvas))
      .then((api) => {
        tourApi = api;
        tourApi.setStep(activeStep, true);
      })
      .catch((err) => fail(tourCanvas.closest('section'), err))
  );

  const brandCanvas = document.getElementById('brand-canvas');
  whenNear(brandCanvas, () =>
    import('./three/brand.js')
      .then(({ initBrand }) => initBrand(brandCanvas))
      .catch((err) => fail(brandCanvas.closest('section'), err))
  );
} else {
  document.querySelectorAll('[data-3d]').forEach((s) => s.classList.add('is-fallback'));
}
