from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0003_user_ruc'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='empresa',
            field=models.CharField(blank=True, default='', max_length=150, verbose_name='empresa'),
        ),
    ]
