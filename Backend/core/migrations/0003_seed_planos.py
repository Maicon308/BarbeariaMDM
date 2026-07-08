from decimal import Decimal

from django.db import migrations


def seed_planos(apps, schema_editor):
    Plano = apps.get_model("core", "Plano")
    planos = [
        {
            "tipo": "BASICO",
            "nome": "Basico",
            "preco_mensal": Decimal("49.90"),
            "limite_barbeiros": 3,
            "limite_clientes": 300,
            "permite_filiais": False,
        },
        {
            "tipo": "PRO",
            "nome": "Pro",
            "preco_mensal": Decimal("99.90"),
            "limite_barbeiros": 10,
            "limite_clientes": 1500,
            "permite_filiais": False,
        },
        {
            "tipo": "VIP",
            "nome": "VIP",
            "preco_mensal": Decimal("199.90"),
            "limite_barbeiros": None,
            "limite_clientes": None,
            "permite_filiais": True,
        },
    ]
    for plano in planos:
        Plano.objects.update_or_create(tipo=plano["tipo"], defaults=plano)


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0002_cliente_usuario_email_usuario_senha_cliente_role"),
    ]

    operations = [
        migrations.RunPython(seed_planos, migrations.RunPython.noop),
    ]
