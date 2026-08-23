from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tickets", "0006_ticket_legacy_import_metadata"),
    ]

    operations = [
        migrations.AddField(
            model_name="ticket",
            name="contacto_email",
            field=models.EmailField(
                blank=True,
                max_length=254,
                null=True,
                verbose_name="correo histórico del contacto",
            ),
        ),
        migrations.AlterField(
            model_name="ticketevent",
            name="tipo_evento",
            field=models.CharField(
                choices=[
                    ("creacion", "Creación"),
                    ("cambio_estado", "Cambio de estado"),
                    ("comentario", "Comentario"),
                    ("asignacion", "Asignación"),
                    ("reasignacion", "Reasignación"),
                    ("contacto_actualizado", "Contacto actualizado"),
                ],
                max_length=20,
                verbose_name="tipo de evento",
            ),
        ),
    ]
