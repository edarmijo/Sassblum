import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tickets", "0003_ticketevent_autor_nullable"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="ticketevent",
            name="asignado_anterior",
            field=models.ForeignKey(
                blank=True,
                help_text="Solo se completa para conservar la auditoría de una reasignación.",
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="reasignaciones_salientes",
                to=settings.AUTH_USER_MODEL,
                verbose_name="trabajador anterior",
            ),
        ),
    ]
