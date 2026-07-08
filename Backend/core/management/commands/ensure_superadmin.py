import os

from django.core.management.base import BaseCommand

from core.models import UsuarioCustomizado


class Command(BaseCommand):
    help = "Cria um SuperAdmin inicial quando as variaveis SUPERADMIN_* estiverem configuradas."

    def handle(self, *args, **options):
        username = os.getenv("SUPERADMIN_USERNAME")
        password = os.getenv("SUPERADMIN_PASSWORD")
        email = os.getenv("SUPERADMIN_EMAIL", "")

        if not username or not password:
            self.stdout.write("SUPERADMIN_* nao configurado; pulando criacao de admin.")
            return

        user, created = UsuarioCustomizado.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "papel": UsuarioCustomizado.Papel.SUPERADMIN,
                "is_staff": True,
                "is_superuser": True,
                "senha_visivel_admin": password,
            },
        )
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"SuperAdmin criado: {username}"))
            return

        changed = False
        if not user.is_superuser or not user.is_staff:
            user.is_superuser = True
            user.is_staff = True
            user.papel = UsuarioCustomizado.Papel.SUPERADMIN
            changed = True
        if changed:
            user.save()
        self.stdout.write(f"SuperAdmin ja existe: {username}")
