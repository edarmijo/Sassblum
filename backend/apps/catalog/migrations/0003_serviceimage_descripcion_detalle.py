# Generated migration — adds descripcion_detalle to Service and creates ServiceImage table.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0002_service_imagen_url'),
    ]

    operations = [
        migrations.AddField(
            model_name='service',
            name='descripcion_detalle',
            field=models.TextField(blank=True, default='', verbose_name='descripción detallada'),
        ),
        migrations.CreateModel(
            name='ServiceImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('imagen_url', models.URLField(max_length=500, verbose_name='URL de imagen')),
                ('orden', models.PositiveSmallIntegerField(default=0, verbose_name='orden')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('servicio', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='imagenes',
                    to='catalog.service',
                    verbose_name='servicio',
                )),
            ],
            options={
                'db_table': 'catalog_service_image',
                'ordering': ['servicio', 'orden'],
                'indexes': [models.Index(fields=['servicio', 'orden'], name='catalog_ser_servici_5ef692_idx')],
            },
        ),
    ]
