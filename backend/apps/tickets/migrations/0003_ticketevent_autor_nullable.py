import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0002_ticket_legacy_codigo'),
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='ticketevent',
            name='autor',
            field=models.ForeignKey(
                blank=True,
                help_text='Null = evento del sistema (p. ej. migración de datos legados).',
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='ticket_events',
                to='authentication.user',
                verbose_name='autor',
            ),
        ),
    ]
