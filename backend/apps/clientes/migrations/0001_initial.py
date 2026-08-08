# Generated manually to keep the new bounded context self-contained.

from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="ClientLogo",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nombre", models.CharField(max_length=120, unique=True, verbose_name="nombre")),
                ("logo_url", models.URLField(blank=True, default="", max_length=500, verbose_name="URL del logotipo")),
                ("sitio_web", models.URLField(blank=True, default="", max_length=500, verbose_name="sitio web")),
                ("activo", models.BooleanField(default=True, verbose_name="activo")),
                ("orden", models.PositiveIntegerField(default=0, verbose_name="orden")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="creado en")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="actualizado en")),
            ],
            options={
                "db_table": "clientes_client_logo",
                "ordering": ["orden", "nombre"],
                "indexes": [models.Index(fields=["activo", "orden"], name="clientes_lo_activo_8f1b9d_idx")],
            },
        ),
    ]
