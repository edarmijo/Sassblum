import { useRef, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Server, Network, Cctv } from 'lucide-react';
import { EASE_APPLE } from '../../../core/ui/motion/ease';

/* ─── colour palette — SassBlum brand teal ─── */
const C = {
  bg:     '#04090f',          // deep navy-black
  bg2:    '#081624',          // dark navy layer
  accent: '#00c4e0',          // vivid teal (brand primary)
  accent2:'#38d9f5',          // light teal
  accent3:'#7ee8f9',          // pale teal highlight
  muted:  '#7aa3b8',          // accessible blue-muted text
  text:   '#eef4f8',          // cool white
  green:  '#22d87a',          // status green
  glow:   'rgba(0,196,224,0.32)', // teal glow
};

/* ─── reusable glow-on-hover handler (CSS var --card-x / --card-y) ─── */
function glowMouse(e: MouseEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--card-x', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--card-y', `${e.clientY - rect.top}px`);
}

/* ─── animated counter hook ─── */
function useCounter(target: number, inView: boolean, reduceMotion: boolean, duration = 2000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      setValue(target);
      return;
    }
    let rafId = 0;
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [inView, target, reduceMotion, duration]);
  return value;
}

/* ─── tiny helpers ─── */
const stagger = (i: number) => ({ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.7, ease: EASE_APPLE } } });
const fadeUp = { hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_APPLE } } };

/* ─── marquee items ─── */
const MARQUEE = ['INFRAESTRUCTURA IT', 'SOPORTE TÉCNICO', 'CABLEADO ESTRUCTURADO', 'SISTEMA CCTV', 'DOMÓTICA', 'VENTA DE SERVIDORES'];

/* ─── stat definitions ─── */
const STATS = [
  { target: 20, suffix: '+', label: 'Años de Experiencia', fill: '80%' },
  { target: 500, suffix: '+', label: 'Proyectos Completados', fill: '95%' },
  { target: 100, suffix: '%', label: 'Compromiso Total', fill: '100%' },
];

/* ────────────────────────────────────────────────────────────────────
   HOME COMPONENT
   ──────────────────────────────────────────────────────────────────── */
export function Home() {
  const reduceMotion = useReducedMotion() ?? false;

  /* ── section in-view refs ── */
  const aboutRef = useRef<HTMLDivElement>(null);
  const aboutInView = useInView(aboutRef, { once: true, margin: '-100px' });

  /* ── counter values ── */
  const c20 = useCounter(20, aboutInView, reduceMotion);
  const c500 = useCounter(500, aboutInView, reduceMotion);
  const c100 = useCounter(100, aboutInView, reduceMotion);
  const counters = [c20, c500, c100];

  /* ── hero card parallax refs (outer) ── */
  const heroRef = useRef<HTMLElement>(null);
  const firstCardRef = useRef<HTMLDivElement>(null);
  const secondCardRef = useRef<HTMLDivElement>(null);
  const thirdCardRef = useRef<HTMLDivElement>(null);
  const cardRefs = useMemo(
    () => [firstCardRef, secondCardRef, thirdCardRef],
    [],
  );

  /* ── hero card mouse parallax effect ── */
  useEffect(() => {
    if (reduceMotion || window.innerWidth < 768) return;
    const hero = heroRef.current;
    if (!hero) return;
    const speeds = [0.03, 0.05, 0.04];
    let raf = 0;
    const updateCards = (mx: number, my: number) => {
      cardRefs.forEach((ref, i) => {
        if (!ref.current) return;
        const s = speeds[i];
        const x = mx * s * 200;
        const y = my * s * 200;
        const rot = mx * s * 15;
        ref.current.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
      });
    };

    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const mx = (e.clientX / window.innerWidth - 0.5) * 2;
        const my = (e.clientY / window.innerHeight - 0.5) * 2;
        updateCards(mx, my);
      });
    };
    hero.addEventListener('pointermove', onMove, { passive: true });
    return () => { cancelAnimationFrame(raf); hero.removeEventListener('pointermove', onMove); };
  }, [cardRefs, reduceMotion]);

  /* ── CSS injected globally (keyframes + glow card + carousel) ── */
  const floatKeyframes = `
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.6)} }
    @keyframes scrollFill { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
    /* visible keyboard focus ring on hero/CTA links (a11y — WCAG 2.4.7) */
    .home-btn:focus-visible { outline: 2px solid ${C.accent2}; outline-offset: 3px; border-radius: 9999px; }
    /* spotlight hover on glass cards — teal */
    .glow-card { position:relative; overflow:hidden; }
    .glow-card::before {
      content:''; position:absolute; inset:0; z-index:2; pointer-events:none;
      opacity:0; transition:opacity 0.4s ease;
      background:radial-gradient(350px circle at var(--card-x,50%) var(--card-y,50%), rgba(0,196,224,0.16), rgba(56,217,245,0.06) 40%, transparent 65%);
    }
    .glow-card:hover::before { opacity:1; }
  `;

  /* ── magnetic button handlers ── */
  const onMagneticMove = (e: MouseEvent<HTMLAnchorElement>) => {
    if (window.innerWidth < 768) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    e.currentTarget.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
  };
  const onMagneticLeave = (e: MouseEvent<HTMLAnchorElement>) => {
    if (window.innerWidth < 768) return;
    const el = e.currentTarget;
    el.style.transition = 'transform 0.4s cubic-bezier(0.22,1,0.36,1)';
    el.style.transform = '';
    setTimeout(() => { el.style.transition = ''; }, 400);
  };

  return (
    <>
      <style>{floatKeyframes}</style>

      {/* ─────────────── HERO ─────────────── */}
      <section
        ref={heroRef}
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden z-10 lg:flex-row"
        style={{ padding: '8rem clamp(1.5rem,4vw,4rem) 4rem' }}
      >
        <div className="w-full max-w-200 relative z-10 lg:w-[55%]">
          {/* badge */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible"
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full mb-10"
            style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)', fontSize: '0.78rem', fontWeight: 500, color: C.muted, letterSpacing: '0.04em' }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, boxShadow: `0 0 8px ${C.green}`, animation: 'pulse 2s ease-in-out infinite' }} />
            <span>20+ Años Transformando Empresas</span>
          </motion.div>

          {/* title */}
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(3rem,9vw,7rem)', fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.03em', marginBottom: '2rem' }}>
            {['Innovación', 'Tecnológica'].map((word, i) => (
              <div key={word} className="overflow-hidden">
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, y: '120%' }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.9, ease: EASE_APPLE }}
                >
                  {word}
                </motion.span>
              </div>
            ))}
            <div className="overflow-hidden">
              <motion.span
                className="inline-block"
                initial={{ opacity: 0, y: '120%' }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24, duration: 0.9, ease: EASE_APPLE }}
                style={{ WebkitTextStroke: `1.5px ${C.text}`, color: 'transparent' }}
              >
                para tu negocio
              </motion.span>
            </div>
          </h1>

          {/* subtitle */}
          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.4 }}
            className="max-w-120 mb-12" style={{ fontSize: 'clamp(1rem,1.8vw,1.15rem)', color: '#7aa3b8', lineHeight: 1.8 }}
          >
            Soluciones informáticas de vanguardia para empresas e industrias.<br />
            Servidores, cableado, CCTV, domótica y más.
          </motion.p>

          {/* buttons — magnetic */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.5 }} className="flex gap-4 flex-wrap">
            <Link
              to="/login"
              onMouseMove={onMagneticMove}
              onMouseLeave={onMagneticLeave}
              className="home-btn inline-flex items-center gap-2.5 rounded-full hover:shadow-[0_12px_40px_rgba(0,196,224,0.28)]"
              style={{ padding: '0.9rem 2rem', fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.03em', background: C.accent, color: '#fff', transition: 'box-shadow 0.3s' }}
            >
              <span>Enviar Ticket</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <Link
              to="/servicios"
              onMouseMove={onMagneticMove}
              onMouseLeave={onMagneticLeave}
              className="home-btn inline-flex items-center gap-2.5 rounded-full"
              style={{ padding: '0.9rem 2rem', fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.03em', background: 'transparent', color: C.text, border: '1px solid rgba(255,255,255,0.12)', transition: 'border-color 0.3s' }}
            >
              <span>Servicios</span>
            </Link>
          </motion.div>
        </div>

        {/* hero__cards — right half of hero */}
        <div className="home-hero-cards relative z-2 mt-12 grid w-full shrink-0 grid-cols-3 gap-2.5 pointer-events-none lg:absolute lg:inset-y-0 lg:right-0 lg:mt-0 lg:block lg:w-[45%]">
          {([
            { Icon: Server,  label: 'Servidores', top: '15%',    right: '15%', bottom: undefined, iconColor: C.accent  },
            { Icon: Network, label: 'Cableado',   top: '50%',    right: '5%',  bottom: undefined, iconColor: C.accent2 },
            { Icon: Cctv,    label: 'CCTV',       top: undefined, right: '20%', bottom: '15%',    iconColor: C.accent  },
          ] as const).map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.2, duration: 0.9, ease: EASE_APPLE }}
              className="home-hero-card relative lg:absolute"
              style={{
                ['--hero-card-top' as string]: c.top,
                ['--hero-card-right' as string]: c.right,
                ['--hero-card-bottom' as string]: c.bottom,
              }}
            >
              {/* outer: JS mouse parallax via cardRefs[i] */}
              <div ref={cardRefs[i]} className="h-24 w-full sm:h-28 md:h-40 md:w-40">
                {/* CSS compositor animation avoids a permanent JavaScript frame loop. */}
                <div
                  className="home-hero-card__surface w-full h-full flex flex-col items-center justify-center gap-2 rounded-2xl md:gap-3 md:rounded-[20px]"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                    animation: reduceMotion ? undefined : `float${i + 1} ${[12, 10, 14][i]}s ease-in-out infinite`,
                  }}
                >
                  <c.Icon className="h-6 w-6 md:h-8 md:w-8" color={c.iconColor} strokeWidth={1.5} />
                  <span className="text-[0.6rem] md:text-xs" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, letterSpacing: '0.08em', color: C.muted }}>{c.label}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* scroll indicator */}
        <div className="absolute bottom-12 right-[clamp(1.5rem,4vw,4rem)] hidden md:flex flex-col items-center gap-4 z-10">
          <span style={{ writingMode: 'vertical-rl', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.muted }}>Scroll</span>
          <div className="w-px h-15 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="w-full h-[30%]" style={{ background: C.accent, animation: 'scrollFill 2s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      {/* ─────────────── MARQUEE ─────────────── */}
      <section className="relative z-10 overflow-hidden py-6" style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div
          className="animate-marquee flex"
          style={{ ['--marquee-duration' as string]: '42s' }}
        >
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center gap-10 pr-10" aria-hidden={copy === 1}>
              {MARQUEE.map((item, i) => (
                <span key={`${copy}-${i}`} className="flex items-center gap-10 whitespace-nowrap">
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(0.8rem,1.5vw,1rem)', fontWeight: 600, letterSpacing: '0.12em', color: C.muted }}>{item}</span>
                  <span style={{ color: C.accent, fontSize: '0.6rem' }}>◆</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────── ABOUT ─────────────── */}
      <section ref={aboutRef} className="relative z-10" style={{ padding: 'clamp(6rem,12vw,10rem) 0' }}>
        <div className="mx-auto" style={{ maxWidth: 1400, padding: '0 clamp(1.5rem,4vw,4rem)' }}>
          <div className="mb-[clamp(3rem,5vw,5rem)]">
            <motion.div variants={fadeUp} initial="hidden" animate={aboutInView ? 'visible' : 'hidden'} className="inline-flex items-center gap-3 mb-6" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.accent }}>
              <span style={{ width: 32, height: 1, background: C.accent }} />
              <span>Sobre Nosotros</span>
            </motion.div>
            <motion.h2
              variants={fadeUp} initial="hidden" animate={aboutInView ? 'visible' : 'hidden'}
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2.5rem,5vw,4rem)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em' }}
            >
              20+ años liderando<br />proyectos tecnológicos
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[clamp(3rem,6vw,6rem)] items-start">
            {/* text column */}
            <div>
              <motion.p variants={fadeUp} initial="hidden" animate={aboutInView ? 'visible' : 'hidden'} className="text-base leading-[1.9] mb-8" style={{ color: '#7aa3b8' }}>
                SASS BLUM ha dedicado más de 20 años a dar soluciones informáticas a empresas e industrias, liderando proyectos y siendo el nexo perfecto entre directivos y sus diferentes proveedores de tecnología.
              </motion.p>
              <motion.div variants={fadeUp} initial="hidden" animate={aboutInView ? 'visible' : 'hidden'} transition={{ delay: 0.15 }}>
                <Link
                  to="/nosotros"
                  onMouseMove={onMagneticMove}
                  onMouseLeave={onMagneticLeave}
                  className="home-btn inline-flex items-center gap-2.5 rounded-full"
                  style={{ padding: '0.9rem 2rem', fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.03em', background: 'transparent', color: C.text, border: '1px solid rgba(255,255,255,0.12)', transition: 'border-color 0.3s' }}
                >
                  <span>Conoce más</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
              </motion.div>
            </div>

            {/* stats column */}
            <div className="flex flex-col gap-8">
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  variants={stagger(i)}
                  initial="hidden"
                  animate={aboutInView ? 'visible' : 'hidden'}
                  onMouseMove={glowMouse}
                  className="glow-card rounded-2xl transition-all duration-300 hover:translate-x-1"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '2rem', borderRadius: 16, transition: 'border-color 0.3s, transform 0.3s' }}
                >
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2.5rem,4vw,3.5rem)', fontWeight: 700, color: C.accent }}>
                    {counters[i]}{s.suffix}
                  </div>
                  <div className="mt-1" style={{ fontSize: '0.85rem', color: C.muted }}>{s.label}</div>
                  <div className="w-full h-0.75 mt-4 rounded-sm overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-sm transition-all duration-[1.5s]" style={{ background: C.accent, width: aboutInView ? s.fill : '0%', transitionTimingFunction: 'cubic-bezier(0.22,1,0.36,1)' }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── IMMERSIVE QUOTE ─────────────── */}
      <section className="relative z-10 flex items-center justify-center" style={{ height: '70vh', minHeight: 440 }}>
        {/* radial teal glow — no image */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 55% 55% at 50% 50%, rgba(0,196,224,0.12) 0%, rgba(0,196,224,0.03) 50%, transparent 75%)' }} />
        {/* subtle crosshair lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:1, height:'100%', background:'linear-gradient(to bottom, transparent 0%, rgba(0,196,224,0.2) 40%, rgba(0,196,224,0.2) 60%, transparent 100%)' }} />
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'100%', height:1, background:'linear-gradient(to right, transparent 0%, rgba(0,196,224,0.2) 30%, rgba(0,196,224,0.2) 70%, transparent 100%)' }} />
        </div>
        {/* fades on edges so it blends with surrounding sections */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(to bottom, ${C.bg} 0%, transparent 18%, transparent 82%, ${C.bg} 100%)` }} />

        <div className="relative z-10 text-center px-6">
          <motion.h2
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE_APPLE }}
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(2.4rem,5.5vw,5rem)',
              fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em',
              textShadow: '0 0 80px rgba(0,196,224,0.4), 0 2px 40px rgba(0,0,0,0.9)',
            }}
          >
            El nexo perfecto entre<br />
            <span style={{ color: C.accent2 }}>tu empresa</span> y la tecnología
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.7, ease: EASE_APPLE }}
            className="mt-6 mx-auto" style={{ fontSize: '1.1rem', color: C.muted, maxWidth: 520, textShadow: '0 1px 12px rgba(0,0,0,0.8)' }}
          >
            Conectamos directivos con soluciones tecnológicas reales
          </motion.p>
        </div>
      </section>

      {/* La galería de proyectos se movió a la página /galeria (ProjectGalleryCarousel) */}

      {/* ─────────────── CTA ─────────────── */}
      <section className="relative z-10 text-center" style={{ padding: 'clamp(6rem,12vw,10rem) 0' }}>
        <div className="mx-auto px-6" style={{ maxWidth: 800 }}>
          <motion.h2
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE_APPLE }}
            className="mb-10"
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2.5rem,5vw,4rem)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em' }}
          >
            ¿Listo para transformar<br />tu infraestructura?
          </motion.h2>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}>
            <Link
              to="/login"
              onMouseMove={onMagneticMove}
              onMouseLeave={onMagneticLeave}
              className="home-btn inline-flex items-center gap-2.5 rounded-full hover:shadow-[0_12px_40px_rgba(0,196,224,0.28)]"
              style={{ padding: '1rem 2.5rem', fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.03em', background: C.accent, color: '#fff', transition: 'box-shadow 0.3s' }}
            >
              <span>Comenzar ahora</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
