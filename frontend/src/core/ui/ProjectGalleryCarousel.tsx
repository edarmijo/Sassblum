import { useRef, useEffect, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { useProjects } from '../../modules/gallery/hooks/useProjects';
import { EASE_APPLE } from './motion/ease';

/* ─── brand palette ─── */
const C = {
  accent: '#00c4e0',
  text: '#eef4f8',
  muted: '#5c7a94',
};

const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_APPLE } },
};

/* ─── gallery data ─── */
const GALLERY = [
  { tag: 'Impresión', title: 'Equipos de Oficina', img: 'https://opiywavbmidgpzzkkivy.supabase.co/storage/v1/object/public/SassBlumImagenes/gallery/media__1782781509631.png' },
  { tag: 'Audiovisual', title: 'Salas Interactivas', img: 'https://opiywavbmidgpzzkkivy.supabase.co/storage/v1/object/public/SassBlumImagenes/gallery/media__1782781509594.png' },
  { tag: 'Corporativo', title: 'Recepción Corporativa', img: 'https://opiywavbmidgpzzkkivy.supabase.co/storage/v1/object/public/SassBlumImagenes/gallery/media__1782781509532.jpg' },
  { tag: 'Mobiliario', title: 'Espacios de Colaboración', img: 'https://opiywavbmidgpzzkkivy.supabase.co/storage/v1/object/public/SassBlumImagenes/gallery/media__1782781509500.jpg' },
  { tag: 'Integración', title: 'Salas Especializadas', img: 'https://opiywavbmidgpzzkkivy.supabase.co/storage/v1/object/public/SassBlumImagenes/gallery/media__1782781509427.jpg' },
];

/* ─── gallery card hover CSS (info reveal + image zoom) ─── */
const galleryCss = `
  .pgc__info { position:absolute; inset:0; display:flex; flex-direction:column; justify-content:flex-end; padding:1.5rem; background:linear-gradient(to top,rgba(4,9,15,0.92) 0%,transparent 55%); opacity:0; transition:opacity 0.5s cubic-bezier(0.22,1,0.36,1); }
  .pgc__card:hover .pgc__info { opacity:1; }
  .pgc__shine { position:absolute; inset:0; pointer-events:none; opacity:0; transition:opacity 0.3s ease; }
  .pgc__card:hover .pgc__img { transform:scale(1.1); }
`;

/**
 * Carrusel infinito de proyectos.
 * El desplazamiento se conduce por RAF escribiendo `transform` directamente sobre
 * el track — inmune a `@media (prefers-reduced-motion)` (siempre anima, por decisión
 * del usuario). Pausa al pasar el cursor por encima.
 */
export function ProjectGalleryCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  /* Proyectos desde la API; si no hay ninguno (o falla), usa los de ejemplo. */
  const { projects } = useProjects();
  const items = projects.length > 0
    ? projects.map((p) => ({ tag: p.tag, title: p.titulo, img: p.imagenUrl }))
    : GALLERY;

  /* ── infinite scroll RAF — transform directo (inmune a reduced-motion) ── */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let x = 0;
    let half = 0;
    let rafId = 0;
    const step = () => {
      if (!half) half = track.scrollWidth / 2;        // se mide cuando ya hay layout
      if (!pausedRef.current && half) {
        x -= 0.6;
        if (x <= -half) x += half;                     // loop sin salto
        track.style.transform = `translateX(${x}px)`;
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [items.length]); // re-mide el ancho cuando cambian los proyectos

  /* ── 3D tilt + dynamic shine on each card ── */
  const onCardMove = (e: MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotX = (y - 0.5) * 12;
    const rotY = (x - 0.5) * -12;
    e.currentTarget.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
    const shine = e.currentTarget.querySelector<HTMLDivElement>('[data-shine]');
    if (shine) {
      shine.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.1), transparent 60%)`;
      shine.style.opacity = '1';
    }
  };
  const onCardLeave = (e: MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.transition = 'transform 0.6s cubic-bezier(0.22,1,0.36,1)';
    el.style.transform = '';
    setTimeout(() => { el.style.transition = ''; }, 600);
    const shine = el.querySelector<HTMLDivElement>('[data-shine]');
    if (shine) shine.style.opacity = '0';
  };

  return (
    <section className="relative z-10" style={{ padding: 'clamp(6rem,12vw,10rem) 0' }}>
      <style>{galleryCss}</style>

      {/* header */}
      <div className="mx-auto mb-[clamp(2.5rem,4vw,4rem)]" style={{ maxWidth: 1400, padding: '0 clamp(1.5rem,4vw,4rem)' }}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="inline-flex items-center gap-3 mb-4" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.accent }}>
          <span style={{ width: 32, height: 1, background: C.accent }} />
          <span>Proyectos</span>
        </motion.div>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <motion.h2
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2.5rem,5vw,4rem)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em', color: C.text }}
          >
            Galería de<br />proyectos
          </motion.h2>
          <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            style={{ color: C.muted, fontSize: '0.85rem', maxWidth: 260 }}
          >
            Pasa el cursor sobre una tarjeta para pausar
          </motion.p>
        </div>
      </div>

      {/* infinite carousel — RAF writes transform on the track */}
      <div style={{ overflow: 'hidden', WebkitMaskImage: 'linear-gradient(to right,transparent 0%,black 6%,black 94%,transparent 100%)', maskImage: 'linear-gradient(to right,transparent 0%,black 6%,black 94%,transparent 100%)' }}>
        <div
          ref={trackRef}
          className="flex"
          style={{ width: 'max-content', willChange: 'transform' }}
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
        >
          {/* Two identical sets for a seamless loop */}
          {([0, 1] as const).map((copy) => (
            <div key={copy} className="flex" style={{ gap: 20, paddingRight: 20 }} aria-hidden={copy === 1}>
              {items.map((g, i) => (
                <div
                  key={`${copy}-${i}`}
                  style={{ width: 'clamp(280px,28vw,380px)', height: 460, flexShrink: 0 }}
                >
                  <div
                    className="pgc__card relative w-full h-full rounded-2xl overflow-hidden cursor-pointer"
                    style={{ borderRadius: 16 }}
                    onMouseMove={onCardMove}
                    onMouseLeave={onCardLeave}
                  >
                    <div
                      style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: `url('${g.img}')`, backgroundSize: 'cover', backgroundPosition: 'center',
                        transition: 'transform 0.8s cubic-bezier(0.22,1,0.36,1)',
                      }}
                      className="pgc__img"
                    />
                    <div className="pgc__info">
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.accent, marginBottom: '0.4rem' }}>{g.tag}</span>
                      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.1rem', fontWeight: 600, color: C.text }}>{g.title}</h3>
                    </div>
                    <div data-shine="true" className="pgc__shine" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
