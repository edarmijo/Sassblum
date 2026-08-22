from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0005_alter_user_managers"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="ruc",
            field=models.CharField(
                blank=True,
                default="",
                max_length=20,
                verbose_name="RUC",
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="ruc_original",
            field=models.CharField(
                blank=True,
                default="",
                help_text=(
                    "Valor sin normalizar conservado durante la migración histórica."
                ),
                max_length=32,
                verbose_name="identificación original del legado",
            ),
        ),
    ]
