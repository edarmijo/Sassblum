from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0006_user_legacy_ruc'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='tipo_identificacion',
            field=models.CharField(
                choices=[('RUC', 'RUC'), ('Cedula', 'Cédula')],
                default='RUC',
                max_length=6,
                verbose_name='tipo de identificación',
            ),
        ),
    ]
