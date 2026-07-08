# Generated for BarbeariaMDM customer access and visible initial password.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="usuariocustomizado",
            name="senha_visivel_admin",
            field=models.CharField(blank=True, max_length=128),
        ),
        migrations.AddField(
            model_name="cliente",
            name="email",
            field=models.EmailField(blank=True, max_length=254),
        ),
        migrations.AddField(
            model_name="cliente",
            name="usuario",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="cliente_perfil",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="usuariocustomizado",
            name="papel",
            field=models.CharField(
                choices=[
                    ("SUPERADMIN", "SuperAdmin"),
                    ("DONO", "Dono"),
                    ("GERENTE", "Gerente"),
                    ("BARBEIRO", "Barbeiro"),
                    ("ATENDENTE", "Atendente"),
                    ("CLIENTE", "Cliente"),
                ],
                default="ATENDENTE",
                max_length=20,
            ),
        ),
    ]
