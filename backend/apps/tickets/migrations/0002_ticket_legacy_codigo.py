from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='ticket',
            name='legacy_codigo',
            field=models.IntegerField(
                blank=True,
                help_text='Número del ticket en el sistema anterior (cPanel). Solo para tickets migrados.',
                null=True,
                unique=True,
                verbose_name='código legado',
            ),
        ),
    ]
