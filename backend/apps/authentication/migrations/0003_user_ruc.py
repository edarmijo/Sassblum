from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0002_remove_user_username_alter_user_bloqueado_hasta_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='ruc',
            field=models.CharField(blank=True, default='', max_length=13, verbose_name='RUC'),
        ),
    ]
