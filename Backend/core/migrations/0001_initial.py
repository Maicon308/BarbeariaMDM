# Generated for BarbeariaMDM initial schema.

import django.contrib.auth.models
import django.contrib.auth.validators
import django.core.validators
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.CreateModel(
            name="Plano",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("nome", models.CharField(max_length=80)),
                ("tipo", models.CharField(choices=[("BASICO", "Basico"), ("PRO", "Pro"), ("VIP", "VIP")], max_length=20, unique=True)),
                ("preco_mensal", models.DecimalField(decimal_places=2, max_digits=10)),
                ("limite_barbeiros", models.PositiveIntegerField(blank=True, null=True)),
                ("limite_clientes", models.PositiveIntegerField(blank=True, null=True)),
                ("permite_filiais", models.BooleanField(default=False)),
                ("ativo", models.BooleanField(default=True)),
            ],
            options={"abstract": False},
        ),
        migrations.CreateModel(
            name="Barbearia",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("nome", models.CharField(max_length=160)),
                ("documento", models.CharField(blank=True, max_length=32)),
                ("whatsapp", models.CharField(blank=True, max_length=32)),
                ("endereco", models.TextField(blank=True)),
                ("ativa", models.BooleanField(default=True)),
                ("matriz", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="filiais", to="core.barbearia")),
                ("plano", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="barbearias", to="core.plano")),
            ],
            options={"indexes": [models.Index(fields=["matriz"], name="core_barbea_matriz__e2d9fd_idx"), models.Index(fields=["ativa"], name="core_barbea_ativa_61ad5c_idx")]},
        ),
        migrations.CreateModel(
            name="UsuarioCustomizado",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("password", models.CharField(max_length=128, verbose_name="password")),
                ("last_login", models.DateTimeField(blank=True, null=True, verbose_name="last login")),
                ("is_superuser", models.BooleanField(default=False, help_text="Designates that this user has all permissions without explicitly assigning them.", verbose_name="superuser status")),
                ("username", models.CharField(error_messages={"unique": "A user with that username already exists."}, help_text="Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.", max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name="username")),
                ("first_name", models.CharField(blank=True, max_length=150, verbose_name="first name")),
                ("last_name", models.CharField(blank=True, max_length=150, verbose_name="last name")),
                ("email", models.EmailField(blank=True, max_length=254, verbose_name="email address")),
                ("is_staff", models.BooleanField(default=False, help_text="Designates whether the user can log into this admin site.", verbose_name="staff status")),
                ("is_active", models.BooleanField(default=True, help_text="Designates whether this user should be treated as active. Unselect this instead of deleting accounts.", verbose_name="active")),
                ("date_joined", models.DateTimeField(default=django.utils.timezone.now, verbose_name="date joined")),
                ("papel", models.CharField(choices=[("SUPERADMIN", "SuperAdmin"), ("DONO", "Dono"), ("GERENTE", "Gerente"), ("BARBEIRO", "Barbeiro"), ("ATENDENTE", "Atendente")], default="ATENDENTE", max_length=20)),
                ("whatsapp", models.CharField(blank=True, max_length=32)),
                ("barbearia", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="usuarios", to="core.barbearia")),
                ("groups", models.ManyToManyField(blank=True, help_text="The groups this user belongs to. A user will get all permissions granted to each of their groups.", related_name="user_set", related_query_name="user", to="auth.group", verbose_name="groups")),
                ("user_permissions", models.ManyToManyField(blank=True, help_text="Specific permissions for this user.", related_name="user_set", related_query_name="user", to="auth.permission", verbose_name="user permissions")),
            ],
            options={"verbose_name": "user", "verbose_name_plural": "users", "abstract": False},
            managers=[("objects", django.contrib.auth.models.UserManager())],
        ),
        migrations.CreateModel(
            name="Cliente",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("nome", models.CharField(max_length=160)),
                ("whatsapp", models.CharField(max_length=32)),
                ("endereco", models.TextField(blank=True)),
                ("observacoes", models.TextField(blank=True)),
                ("barbearia", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="core.barbearia")),
            ],
            options={"abstract": False, "indexes": [models.Index(fields=["barbearia"], name="core_client_barbear_f5b681_idx")]},
        ),
        migrations.CreateModel(
            name="Servico",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("nome", models.CharField(max_length=120)),
                ("descricao", models.TextField(blank=True)),
                ("valor", models.DecimalField(decimal_places=2, max_digits=10)),
                ("duracao_minutos", models.PositiveIntegerField()),
                ("ativo", models.BooleanField(default=True)),
                ("barbearia", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="core.barbearia")),
            ],
            options={"abstract": False, "indexes": [models.Index(fields=["barbearia"], name="core_servic_barbear_75fc35_idx")]},
        ),
        migrations.CreateModel(
            name="Cadeira",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("identificador", models.CharField(max_length=80)),
                ("alugada", models.BooleanField(default=False)),
                ("modelo_cobranca", models.CharField(choices=[("FIXO", "Aluguel fixo"), ("COMISSAO", "Comissao"), ("MISTO", "Aluguel e comissao")], default="FIXO", max_length=20)),
                ("valor_aluguel", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("percentual_comissao", models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ("ativa", models.BooleanField(default=True)),
                ("barbearia", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="core.barbearia")),
                ("barbeiro_atual", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="cadeiras_operando", to=settings.AUTH_USER_MODEL)),
            ],
            options={"abstract": False, "indexes": [models.Index(fields=["barbearia"], name="core_cadeir_barbear_6386e1_idx")]},
        ),
        migrations.CreateModel(
            name="Agendamento",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("inicio", models.DateTimeField()),
                ("fim", models.DateTimeField()),
                ("status", models.CharField(choices=[("AGENDADO", "Agendado"), ("CONCLUIDO", "Concluido"), ("CANCELADO", "Cancelado")], default="AGENDADO", max_length=20)),
                ("valor_total", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("observacoes", models.TextField(blank=True)),
                ("barbearia", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="core.barbearia")),
                ("barbeiro", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="agendamentos", to=settings.AUTH_USER_MODEL)),
                ("cadeira", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="core.cadeira")),
                ("cliente", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="agendamentos", to="core.cliente")),
                ("servicos", models.ManyToManyField(related_name="agendamentos", to="core.servico")),
            ],
            options={"ordering": ["-inicio"], "abstract": False, "indexes": [models.Index(fields=["barbearia"], name="core_agenda_barbear_95e074_idx"), models.Index(fields=["barbearia", "inicio"], name="core_agenda_barbear_755e73_idx"), models.Index(fields=["barbearia", "status"], name="core_agenda_barbear_68e4f6_idx")]},
        ),
        migrations.CreateModel(
            name="RegistroPagamento",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("forma", models.CharField(choices=[("DINHEIRO", "Dinheiro"), ("CREDITO", "Cartao de credito"), ("DEBITO", "Cartao de debito"), ("PIX", "PIX")], max_length=20)),
                ("status", models.CharField(choices=[("PENDENTE", "Pendente"), ("APROVADO", "Aprovado"), ("RECUSADO", "Recusado"), ("ESTORNADO", "Estornado")], default="PENDENTE", max_length=20)),
                ("valor", models.DecimalField(decimal_places=2, max_digits=10)),
                ("referencia_externa", models.CharField(blank=True, max_length=120)),
                ("metadados_pix", models.JSONField(blank=True, default=dict)),
                ("pago_em", models.DateTimeField(blank=True, null=True)),
                ("agendamento", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="pagamentos", to="core.agendamento")),
                ("barbearia", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="core.barbearia")),
            ],
            options={"abstract": False, "indexes": [models.Index(fields=["barbearia"], name="core_regist_barbear_13c508_idx")]},
        ),
        migrations.AddConstraint(
            model_name="cliente",
            constraint=models.UniqueConstraint(fields=("barbearia", "whatsapp"), name="cliente_unico_por_whatsapp_e_barbearia"),
        ),
        migrations.AddConstraint(
            model_name="cadeira",
            constraint=models.UniqueConstraint(fields=("barbearia", "identificador"), name="cadeira_unica_por_barbearia"),
        ),
    ]
