import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.catalog.models import Service
from apps.gallery.models import Project

PROJECTS = [
    {'tag': 'Impresión', 'titulo': 'Equipos de Oficina', 'imagen_url': 'https://opiywavbmidgpzzkkivy.supabase.co/storage/v1/object/public/SassBlumImagenes/gallery/media__1782781509631.png', 'descripcion': 'Suministro e instalación de equipos multifuncionales.'},
    {'tag': 'Audiovisual', 'titulo': 'Salas Interactivas', 'imagen_url': 'https://opiywavbmidgpzzkkivy.supabase.co/storage/v1/object/public/SassBlumImagenes/gallery/media__1782781509594.png', 'descripcion': 'Pantallas para salas de juntas.'},
    {'tag': 'Corporativo', 'titulo': 'Recepción Corporativa', 'imagen_url': 'https://opiywavbmidgpzzkkivy.supabase.co/storage/v1/object/public/SassBlumImagenes/gallery/media__1782781509532.jpg', 'descripcion': 'Mobiliario y tecnología para recepción.'},
    {'tag': 'Mobiliario', 'titulo': 'Espacios de Colaboración', 'imagen_url': 'https://opiywavbmidgpzzkkivy.supabase.co/storage/v1/object/public/SassBlumImagenes/gallery/media__1782781509500.jpg', 'descripcion': 'Diseño de áreas de descanso y cafetería.'},
    {'tag': 'Integración', 'titulo': 'Salas Especializadas', 'imagen_url': 'https://opiywavbmidgpzzkkivy.supabase.co/storage/v1/object/public/SassBlumImagenes/gallery/media__1782781509427.jpg', 'descripcion': 'Equipamiento completo para salas SONY.'}
]

SERVICES = [
    {'categoria': 'soporte', 'nombre': 'Soporte Tecnico Especializado', 'descripcion': 'Asistencia remota e in-situ.', 'imagen_url': 'https://images.unsplash.com/photo-1588508065123-287b28e01390?w=800&q=80'},
    {'categoria': 'redes', 'nombre': 'Cableado y Redes', 'descripcion': 'Redes LAN/WAN corporativas.', 'imagen_url': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80'},
    {'categoria': 'servidores', 'nombre': 'Administracion de Servidores', 'descripcion': 'Gestion de data centers.', 'imagen_url': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80'},
    {'categoria': 'cctv', 'nombre': 'Seguridad y CCTV', 'descripcion': 'Videovigilancia 24/7.', 'imagen_url': 'https://images.unsplash.com/photo-1563986768609-322da13575f2?w=800&q=80'},
    {'categoria': 'domotica', 'nombre': 'Domotica e IoT', 'descripcion': 'Automatizacion total.', 'imagen_url': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80'}
]

for p in PROJECTS:
    Project.objects.get_or_create(titulo=p['titulo'], defaults={'tag': p['tag'], 'imagen_url': p['imagen_url'], 'descripcion': p['descripcion'], 'activo': True})

for s in SERVICES:
    Service.objects.get_or_create(nombre=s['nombre'], defaults={'categoria': s['categoria'], 'descripcion': s['descripcion'], 'imagen_url': s['imagen_url'], 'activo': True})

print("Database seeded successfully.")
