import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.tickets.services.storage_service import StorageService
from apps.gallery.models import Project

storage = StorageService()

images = [
    ('media__1782781509631.png', 'Equipos de Oficina', 'Suministro e instalación de equipos multifuncionales.', 'Impresión'),
    ('media__1782781509594.png', 'Salas Interactivas', 'Pantallas para salas de juntas.', 'Audiovisual'),
    ('media__1782781509532.jpg', 'Recepción Corporativa', 'Mobiliario y tecnología para recepción.', 'Corporativo'),
    ('media__1782781509500.jpg', 'Espacios de Colaboración', 'Diseño de áreas de descanso y cafetería.', 'Mobiliario'),
    ('media__1782781509427.jpg', 'Salas Especializadas', 'Equipamiento completo para salas SONY.', 'Integración')
]

Project.objects.all().delete()
print('Proyectos antiguos eliminados.')

base_path = r'C:\Users\erick\.gemini\antigravity-ide\brain\f215cf68-cbf3-46be-bb41-355c182ee111'

for filename, title, desc, tag in images:
    filepath = os.path.join(base_path, filename)
    if not os.path.exists(filepath):
        print(f'Error: no se encontró {filepath}')
        continue
    
    with open(filepath, 'rb') as f:
        # Usamos un path unico para supabase
        remote_path = f'gallery/{filename}'
        try:
            url = storage.upload(f, remote_path)
            Project.objects.create(
                titulo=title,
                descripcion=desc,
                tag=tag,
                imagen_url=url,
                activo=True
            )
            print(f'Creado: {title} con URL {url}')
        except Exception as e:
            print(f'Error subiendo {filename}: {e}')

