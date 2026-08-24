from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0006_user_legacy_ruc"),
        ("tickets", "0005_ticket_contact_snapshot"),
    ]

    operations = [
        migrations.AddField(
            model_name="ticket",
            name="contacto_ruc_original",
            field=models.CharField(
                blank=True,
                help_text=(
                    "Valor exacto anterior a la normalización de la migración histórica."
                ),
                max_length=32,
                null=True,
                verbose_name="identificación original del contacto legado",
            ),
        ),
        migrations.AddField(
            model_name="ticket",
            name="legacy_es_spam",
            field=models.BooleanField(
                default=False,
                help_text=(
                    "Clasificación conservada por la importación; el ticket no se elimina."
                ),
                verbose_name="marcado como spam legado",
            ),
        ),
        migrations.AlterField(
            model_name="ticket",
            name="asunto",
            field=models.CharField(max_length=120, verbose_name="asunto"),
        ),
    ]
