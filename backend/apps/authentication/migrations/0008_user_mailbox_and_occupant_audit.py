from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def mark_existing_workers_pending(apps, schema_editor):
    user_model = apps.get_model('authentication', 'User')
    user_model.objects.filter(role='worker').update(
        buzon_estado='pendiente',
        buzon_gestion='manual',
    )


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0007_user_tipo_identificacion'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='buzon_estado',
            field=models.CharField(
                choices=[
                    ('creado', 'Creado'),
                    ('pendiente', 'Pendiente'),
                    ('no_aplica', 'No aplica'),
                ],
                default='no_aplica',
                max_length=16,
                verbose_name='estado del buzón corporativo',
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='buzon_gestion',
            field=models.CharField(
                choices=[
                    ('manual', 'Manual'),
                    ('uapi', 'UAPI'),
                    ('no_aplica', 'No aplica'),
                ],
                default='no_aplica',
                max_length=16,
                verbose_name='modo de gestión del buzón corporativo',
            ),
        ),
        migrations.RunPython(
            mark_existing_workers_pending,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.CreateModel(
            name='UserOccupantChange',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('correo_puesto', models.EmailField(max_length=254, verbose_name='correo estable del puesto')),
                ('nombre_anterior', models.CharField(max_length=150)),
                ('apellido_anterior', models.CharField(max_length=150)),
                ('nombre_nuevo', models.CharField(max_length=150)),
                ('apellido_nuevo', models.CharField(max_length=150)),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='creado en')),
                ('actor', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='cambios_ocupante_realizados', to=settings.AUTH_USER_MODEL, verbose_name='administrador responsable')),
                ('usuario', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='cambios_ocupante', to=settings.AUTH_USER_MODEL, verbose_name='cuenta del puesto')),
            ],
            options={
                'db_table': 'auth_user_occupant_change',
                'ordering': ['-created_at'],
                'indexes': [models.Index(fields=['usuario', '-created_at'], name='auth_user_o_usuario_4e8e93_idx')],
            },
        ),
        migrations.CreateModel(
            name='UserMailboxEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('correo_puesto', models.EmailField(max_length=254, verbose_name='correo estable del puesto')),
                ('action', models.CharField(choices=[('manual_confirmado', 'Buzón manual confirmado'), ('manual_rotado', 'Contraseña manual rotada')], max_length=32)),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='creado en')),
                ('actor', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='eventos_buzon_realizados', to=settings.AUTH_USER_MODEL, verbose_name='administrador responsable')),
                ('usuario', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='eventos_buzon', to=settings.AUTH_USER_MODEL, verbose_name='cuenta del puesto')),
            ],
            options={
                'db_table': 'auth_user_mailbox_event',
                'ordering': ['-created_at'],
            },
        ),
    ]
