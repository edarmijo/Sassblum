import { Mail, Phone, ArrowUpRight } from 'lucide-react'

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#00c4e0',
  marginBottom: '1rem',
  fontWeight: 600,
  fontFamily: "'Space Grotesk', sans-serif",
}

const linkBaseStyle: React.CSSProperties = {
  display: 'block',
  color: '#a0a0b8',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontFamily: "'Space Grotesk', sans-serif",
  transition: 'color 0.25s ease, transform 0.25s ease',
  marginBottom: '0.6rem',
}

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ backgroundColor: 'transparent', color: '#ffffff', position: 'relative', zIndex: 10 }}>
      {/* transparent footer — el fondo de partículas se ve a través (estética de
          la sección "El nexo perfecto"); solo una hairline superior para separar */}
      <div style={{
        margin: '0 clamp(1rem,3vw,3rem)',
        borderRadius: '24px 24px 0 0',
        background: 'transparent',
        borderTop: '1px solid rgba(0,196,224,0.12)',
      }}>
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '3.5rem 1.5rem 0',
        }}
      >
        {/* Top section: brand (2fr) + link columns (3fr) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 3fr',
            gap: '3rem',
            paddingBottom: '3rem',
          }}
        >
          {/* Brand column */}
          <div>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '1.6rem',
                fontWeight: 700,
                marginBottom: '1rem',
                letterSpacing: '-0.02em',
              }}
            >
              SASS<span style={{ color: '#00c4e0' }}>BLUM</span>
            </div>
            <p
              style={{
                color: '#6b6b85',
                fontSize: '0.9rem',
                lineHeight: 1.7,
                maxWidth: '320px',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              Innovación tecnológica para tu negocio. 20+ años de experiencia.
            </p>
          </div>

          {/* Link columns */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '2rem',
            }}
          >
            {/* Servicios */}
            <div>
              <h4 style={sectionHeaderStyle}>Servicios</h4>
              <a
                href="#services"
                style={linkBaseStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00c4e0'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b6b85'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                Infraestructura IT
              </a>
              <a
                href="#services"
                style={linkBaseStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00c4e0'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b6b85'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                Soporte Técnico
              </a>
              <a
                href="#services"
                style={linkBaseStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00c4e0'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b6b85'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                Cableado Estructurado
              </a>
            </div>

            {/* Más */}
            <div>
              <h4 style={sectionHeaderStyle}>Más</h4>
              <a
                href="#services"
                style={linkBaseStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00c4e0'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b6b85'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                Sistema CCTV
              </a>
              <a
                href="#services"
                style={linkBaseStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00c4e0'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b6b85'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                Domótica
              </a>
              <a
                href="#services"
                style={linkBaseStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00c4e0'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b6b85'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                Servidores
              </a>
            </div>

            {/* Contacto */}
            <div>
              <h4 style={sectionHeaderStyle}>Contacto</h4>
              <a
                href="mailto:info@sassblum.com"
                style={{ ...linkBaseStyle, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00c4e0'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b6b85'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                <Mail size={14} />
                info@sassblum.com
              </a>
              <a
                href="tel:+593969990990"
                style={{ ...linkBaseStyle, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00c4e0'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b6b85'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                <Phone size={14} />
                +593-9-6999-0990
              </a>
              <a
                href="https://www.instagram.com/sassblum/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...linkBaseStyle, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00c4e0'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b6b85'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                <ArrowUpRight size={14} />
                Instagram
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            borderTop: '1px solid rgba(107, 107, 133, 0.2)',
            paddingTop: '1.5rem',
            paddingBottom: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <p
              style={{
                color: '#6b6b85',
                fontSize: '0.82rem',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              © {year} sassblum.com — Todos los derechos reservados
            </p>
            <p
              style={{
                color: '#6b6b85',
                fontSize: '0.82rem',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              Diseñado con{' '}
              <span style={{ color: '#00c4e0' }}>♥</span>
            </p>
          </div>
        </div>
      </div>
      </div>{/* close glass card */}
    </footer>
  )
}
