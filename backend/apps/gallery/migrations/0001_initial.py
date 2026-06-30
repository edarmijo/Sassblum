from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titulo', models.CharField(max_length=120, verbose_name='título')),
                ('descripcion', models.TextField(blank=True, default='', verbose_name='descripción')),
                ('tag', models.CharField(blank=True, default='', max_length=80, verbose_name='etiqueta')),
                ('imagen_url', models.URLField(blank=True, default='', max_length=500, verbose_name='URL de imagen')),
                ('activo', models.BooleanField(default=True, verbose_name='activo')),
                ('orden', models.PositiveIntegerField(default=0, verbose_name='orden')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='creado en')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='actualizado en')),
            ],
            options={
                'db_table': 'gallery_project',
                'ordering': ['orden', '-created_at'],
                'indexes': [models.Index(fields=['activo', 'orden'], name='gallery_pro_activo_idx')],
            },
        ),
    ]
