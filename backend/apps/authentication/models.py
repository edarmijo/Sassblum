import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """Custom manager that uses email instead of username (SRP: only manages User persistence)."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El correo electrónico es requerido.')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        # Regla de negocio: el administrador es ÚNICO en todo el sistema.
        # Para reemplazarlo, se edita/borra el existente — nunca se crea un segundo.
        if self.model.objects.filter(role='admin').exists():
            raise ValueError(
                'Ya existe un administrador. El sistema permite un solo admin: '
                'edita o elimina el actual antes de crear otro.'
            )
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('estado', 'activo')
        extra_fields.setdefault('email_verificado', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):

    class Role(models.TextChoices):
        CLIENT = 'client', 'Cliente'
        WORKER = 'worker', 'Trabajador'
        ADMIN  = 'admin',  'Administrador'

    class Estado(models.TextChoices):
        ACTIVE  = 'activo',    'Activo'
        BLOCKED = 'bloqueado', 'Bloqueado'
        PENDING = 'pendiente', 'Pendiente'

    objects = UserManager()

    username          = None
    email             = models.EmailField(unique=True, verbose_name='correo electrónico')
    ruc               = models.CharField(
        max_length=13,
        blank=True,
        default='',
        verbose_name='RUC',
    )
    empresa           = models.CharField(
        max_length=150,
        blank=True,
        default='',
        verbose_name='empresa',
    )
    role              = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CLIENT,
        verbose_name='rol',
    )
    estado            = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.PENDING,
        verbose_name='estado',
    )
    intentos_fallidos = models.PositiveSmallIntegerField(
        default=0,
        verbose_name='intentos fallidos',
    )
    bloqueado_hasta   = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='bloqueado hasta',
    )
    email_verificado  = models.BooleanField(
        default=False,
        verbose_name='email verificado',
    )

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'auth_user_custom'

    def __str__(self):
        return f'{self.email} ({self.role})'


class PasswordResetToken(models.Model):
    """
    One-time password reset token (SRP — data only).
    Generation/validation logic lives in TokenService, never in the model.
    """

    usuario = models.ForeignKey(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='reset_tokens',
        verbose_name='usuario',
    )
    token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        verbose_name='token',
    )
    expira_en = models.DateTimeField(verbose_name='expira en')
    usado = models.BooleanField(default=False, verbose_name='usado')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='creado en')

    class Meta:
        db_table = 'auth_password_reset_token'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
        ]

    def __str__(self):
        estado = 'usado' if self.usado else 'activo'
        return f'reset {self.token} ({estado})'
