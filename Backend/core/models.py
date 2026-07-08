from decimal import Decimal

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Plano(TimeStampedModel):
    class Tipo(models.TextChoices):
        BASICO = "BASICO", "Basico"
        PRO = "PRO", "Pro"
        VIP = "VIP", "VIP"

    nome = models.CharField(max_length=80)
    tipo = models.CharField(max_length=20, choices=Tipo.choices, unique=True)
    preco_mensal = models.DecimalField(max_digits=10, decimal_places=2)
    limite_barbeiros = models.PositiveIntegerField(null=True, blank=True)
    limite_clientes = models.PositiveIntegerField(null=True, blank=True)
    permite_filiais = models.BooleanField(default=False)
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return self.nome


class Barbearia(TimeStampedModel):
    nome = models.CharField(max_length=160)
    documento = models.CharField(max_length=32, blank=True)
    whatsapp = models.CharField(max_length=32, blank=True)
    endereco = models.TextField(blank=True)
    plano = models.ForeignKey(Plano, on_delete=models.PROTECT, related_name="barbearias")
    matriz = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="filiais",
    )
    ativa = models.BooleanField(default=True)

    class Meta:
        indexes = [
            models.Index(fields=["matriz"]),
            models.Index(fields=["ativa"]),
        ]

    @property
    def is_matriz(self):
        return self.matriz_id is None

    def clean(self):
        if self.matriz_id and not self.matriz.plano.permite_filiais:
            raise ValidationError("Somente barbearias VIP podem criar filiais.")
        if self.matriz_id and self.matriz_id == self.id:
            raise ValidationError("Uma barbearia nao pode ser filial dela mesma.")

    def __str__(self):
        return self.nome


class UsuarioCustomizado(AbstractUser):
    class Papel(models.TextChoices):
        SUPERADMIN = "SUPERADMIN", "SuperAdmin"
        DONO = "DONO", "Dono"
        GERENTE = "GERENTE", "Gerente"
        BARBEIRO = "BARBEIRO", "Barbeiro"
        ATENDENTE = "ATENDENTE", "Atendente"

    barbearia = models.ForeignKey(
        Barbearia,
        on_delete=models.PROTECT,
        related_name="usuarios",
        null=True,
        blank=True,
    )
    papel = models.CharField(max_length=20, choices=Papel.choices, default=Papel.ATENDENTE)
    whatsapp = models.CharField(max_length=32, blank=True)

    @property
    def is_superadmin(self):
        return self.is_superuser or self.papel == self.Papel.SUPERADMIN


class TenantOwnedModel(TimeStampedModel):
    barbearia = models.ForeignKey(Barbearia, on_delete=models.PROTECT)

    class Meta:
        abstract = True
        indexes = [models.Index(fields=["barbearia"])]


class Cliente(TenantOwnedModel):
    nome = models.CharField(max_length=160)
    whatsapp = models.CharField(max_length=32)
    endereco = models.TextField(blank=True)
    observacoes = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["barbearia", "whatsapp"],
                name="cliente_unico_por_whatsapp_e_barbearia",
            )
        ]

    @property
    def total_gasto(self):
        return self.agendamentos.filter(status=Agendamento.Status.CONCLUIDO).aggregate(
            total=models.Sum("valor_total")
        )["total"] or Decimal("0.00")

    def __str__(self):
        return self.nome


class Servico(TenantOwnedModel):
    nome = models.CharField(max_length=120)
    descricao = models.TextField(blank=True)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    duracao_minutos = models.PositiveIntegerField()
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return self.nome


class Cadeira(TenantOwnedModel):
    class ModeloCobranca(models.TextChoices):
        FIXO = "FIXO", "Aluguel fixo"
        COMISSAO = "COMISSAO", "Comissao"
        MISTO = "MISTO", "Aluguel e comissao"

    identificador = models.CharField(max_length=80)
    alugada = models.BooleanField(default=False)
    modelo_cobranca = models.CharField(
        max_length=20,
        choices=ModeloCobranca.choices,
        default=ModeloCobranca.FIXO,
    )
    valor_aluguel = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    percentual_comissao = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    barbeiro_atual = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cadeiras_operando",
    )
    ativa = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["barbearia", "identificador"],
                name="cadeira_unica_por_barbearia",
            )
        ]

    def __str__(self):
        return self.identificador


class Agendamento(TenantOwnedModel):
    class Status(models.TextChoices):
        AGENDADO = "AGENDADO", "Agendado"
        CONCLUIDO = "CONCLUIDO", "Concluido"
        CANCELADO = "CANCELADO", "Cancelado"

    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name="agendamentos")
    servicos = models.ManyToManyField(Servico, related_name="agendamentos")
    barbeiro = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="agendamentos",
    )
    cadeira = models.ForeignKey(Cadeira, on_delete=models.SET_NULL, null=True, blank=True)
    inicio = models.DateTimeField()
    fim = models.DateTimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AGENDADO)
    valor_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    observacoes = models.TextField(blank=True)

    class Meta:
        ordering = ["-inicio"]
        indexes = [
            models.Index(fields=["barbearia", "inicio"]),
            models.Index(fields=["barbearia", "status"]),
        ]

    def clean(self):
        related_tenants = [
            self.cliente.barbearia_id if self.cliente_id else None,
            self.barbeiro.barbearia_id if self.barbeiro_id else None,
            self.cadeira.barbearia_id if self.cadeira_id else None,
        ]
        if any(tenant and tenant != self.barbearia_id for tenant in related_tenants):
            raise ValidationError("Agendamento contem dados de outra barbearia.")
        if self.fim <= self.inicio:
            raise ValidationError("O termino deve ser maior que o inicio.")

    def __str__(self):
        return f"{self.cliente} - {timezone.localtime(self.inicio):%d/%m/%Y %H:%M}"


class RegistroPagamento(TenantOwnedModel):
    class Forma(models.TextChoices):
        DINHEIRO = "DINHEIRO", "Dinheiro"
        CREDITO = "CREDITO", "Cartao de credito"
        DEBITO = "DEBITO", "Cartao de debito"
        PIX = "PIX", "PIX"

    class Status(models.TextChoices):
        PENDENTE = "PENDENTE", "Pendente"
        APROVADO = "APROVADO", "Aprovado"
        RECUSADO = "RECUSADO", "Recusado"
        ESTORNADO = "ESTORNADO", "Estornado"

    agendamento = models.ForeignKey(
        Agendamento,
        on_delete=models.PROTECT,
        related_name="pagamentos",
    )
    forma = models.CharField(max_length=20, choices=Forma.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDENTE)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    referencia_externa = models.CharField(max_length=120, blank=True)
    metadados_pix = models.JSONField(default=dict, blank=True)
    pago_em = models.DateTimeField(null=True, blank=True)

    def clean(self):
        if self.agendamento_id and self.agendamento.barbearia_id != self.barbearia_id:
            raise ValidationError("Pagamento contem agendamento de outra barbearia.")

    def __str__(self):
        return f"{self.forma} - {self.valor}"

