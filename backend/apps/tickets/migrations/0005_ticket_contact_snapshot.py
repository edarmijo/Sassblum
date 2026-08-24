from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tickets", "0004_ticketevent_asignado_anterior"),
    ]

    operations = [
        migrations.AddField(
            model_name="ticket",
            name="contacto_empresa",
            field=models.CharField(
                blank=True,
                max_length=150,
                null=True,
                verbose_name="empresa histórica del contacto",
            ),
        ),
        migrations.AddField(
            model_name="ticket",
            name="contacto_nombre",
            field=models.CharField(
                blank=True,
                max_length=301,
                null=True,
                verbose_name="nombre histórico del contacto",
            ),
        ),
        migrations.AddField(
            model_name="ticket",
            name="contacto_ruc",
            field=models.CharField(
                blank=True,
                max_length=13,
                null=True,
                verbose_name="identificación histórica del contacto",
            ),
        ),
    ]
