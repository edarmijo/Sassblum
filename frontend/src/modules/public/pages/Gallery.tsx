import { PageHero } from '../../../core/ui/layout/PageHero'
import { ProjectGalleryCarousel } from '../../../core/ui/ProjectGalleryCarousel'

export function Gallery() {
  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Portafolio"
        title="Galería"
        subtitle="Proyectos y soluciones que hemos implementado"
        accent="indigo"
        orbPosition="bottom-right"
      />

      {/* Carrusel infinito de proyectos */}
      <ProjectGalleryCarousel />
    </div>
  )
}
