from django.db.models import Sum
from django.utils import timezone
from rest_framework import decorators, exceptions, response, viewsets

from .models import (
    Agendamento,
    Barbearia,
    Cadeira,
    Cliente,
    Plano,
    RegistroPagamento,
    Servico,
    UsuarioCustomizado,
)
from .permissions import IsTenantMember
from .serializers import (
    AgendamentoSerializer,
    BarbeariaSerializer,
    CadeiraSerializer,
    ClienteSerializer,
    PlanoSerializer,
    RegistroPagamentoSerializer,
    ServicoSerializer,
    UsuarioSerializer,
)


class TenantScopedViewSet(viewsets.ModelViewSet):
    permission_classes = [IsTenantMember]
    tenant_field = "barbearia"

    def get_allowed_tenant_ids(self):
        user = self.request.user
        if user.is_superadmin:
            return list(Barbearia.objects.values_list("id", flat=True))

        if not user.barbearia_id:
            return []

        include_filiais = self.request.query_params.get("consolidado") == "1"
        barbearia = user.barbearia
        if include_filiais and barbearia.is_matriz and barbearia.plano.permite_filiais:
            return [barbearia.id, *barbearia.filiais.values_list("id", flat=True)]
        return [barbearia.id]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_superadmin:
            return queryset

        tenant_ids = self.get_allowed_tenant_ids()
        if self.tenant_field == "id":
            return queryset.filter(id__in=tenant_ids)
        return queryset.filter(**{f"{self.tenant_field}_id__in": tenant_ids})

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_superadmin and serializer.validated_data.get("barbearia"):
            serializer.save()
            return
        serializer.save(barbearia=user.barbearia)


class PlanoViewSet(viewsets.ModelViewSet):
    queryset = Plano.objects.all().order_by("preco_mensal")
    serializer_class = PlanoSerializer

    def get_queryset(self):
        if self.request.user.is_superadmin:
            return self.queryset
        return self.queryset.filter(ativo=True)


class BarbeariaViewSet(TenantScopedViewSet):
    queryset = Barbearia.objects.select_related("plano", "matriz").all()
    serializer_class = BarbeariaSerializer
    tenant_field = "id"

    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_superadmin and serializer.validated_data.get("matriz") != user.barbearia:
            serializer.save(matriz=user.barbearia, plano=user.barbearia.plano)
            return
        serializer.save()


class UsuarioViewSet(TenantScopedViewSet):
    queryset = UsuarioCustomizado.objects.select_related("barbearia").all()
    serializer_class = UsuarioSerializer

    def perform_create(self, serializer):
        user = self.request.user
        barbearia = serializer.validated_data.get("barbearia") if user.is_superadmin else user.barbearia
        papel = serializer.validated_data.get("papel")
        if papel == UsuarioCustomizado.Papel.BARBEIRO and barbearia.plano.limite_barbeiros is not None:
            total = UsuarioCustomizado.objects.filter(
                barbearia=barbearia,
                papel=UsuarioCustomizado.Papel.BARBEIRO,
            ).count()
            if total >= barbearia.plano.limite_barbeiros:
                raise exceptions.ValidationError("Limite de barbeiros do plano atingido.")
        serializer.save(barbearia=barbearia)


class ClienteViewSet(TenantScopedViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer

    def perform_create(self, serializer):
        barbearia = self.request.user.barbearia
        if barbearia.plano.limite_clientes is not None:
            total = Cliente.objects.filter(barbearia=barbearia).count()
            if total >= barbearia.plano.limite_clientes:
                raise exceptions.ValidationError("Limite de clientes do plano atingido.")
        serializer.save(barbearia=barbearia)


class ServicoViewSet(TenantScopedViewSet):
    queryset = Servico.objects.all()
    serializer_class = ServicoSerializer


class CadeiraViewSet(TenantScopedViewSet):
    queryset = Cadeira.objects.select_related("barbeiro_atual").all()
    serializer_class = CadeiraSerializer


class AgendamentoViewSet(TenantScopedViewSet):
    queryset = Agendamento.objects.select_related("cliente", "barbeiro", "cadeira").prefetch_related("servicos")
    serializer_class = AgendamentoSerializer

    @decorators.action(detail=False, methods=["get"], url_path="dashboard")
    def dashboard(self, request):
        hoje = timezone.localdate()
        qs = self.get_queryset()
        agendamentos_hoje = qs.filter(inicio__date=hoje)
        faturamento = RegistroPagamento.objects.filter(
            barbearia_id__in=self.get_allowed_tenant_ids(),
            status=RegistroPagamento.Status.APROVADO,
            pago_em__date=hoje,
        ).aggregate(total=Sum("valor"))["total"] or 0

        return response.Response(
            {
                "data": hoje,
                "faturamento_hoje": faturamento,
                "agendados_hoje": agendamentos_hoje.count(),
                "concluidos_hoje": agendamentos_hoje.filter(status=Agendamento.Status.CONCLUIDO).count(),
                "cancelados_hoje": agendamentos_hoje.filter(status=Agendamento.Status.CANCELADO).count(),
            }
        )

    @decorators.action(detail=True, methods=["get"], url_path="cupom-termico")
    def cupom_termico(self, request, pk=None):
        agendamento = self.get_object()
        pagamentos = agendamento.pagamentos.all()
        linhas_servicos = [
            f"{servico.nome:<22} R$ {servico.valor:>8.2f}"
            for servico in agendamento.servicos.all()
        ]
        linhas_pagamentos = [
            f"{pagamento.get_forma_display():<22} R$ {pagamento.valor:>8.2f}"
            for pagamento in pagamentos
        ]
        largura = 32
        separador = "-" * largura
        barbearia = agendamento.barbearia
        texto = "\n".join(
            [
                barbearia.nome.center(largura),
                (barbearia.whatsapp or "").center(largura),
                separador,
                "CUPOM NAO FISCAL".center(largura),
                separador,
                f"Cliente: {agendamento.cliente.nome}",
                f"WhatsApp: {agendamento.cliente.whatsapp}",
                f"Barbeiro: {agendamento.barbeiro.get_full_name() or agendamento.barbeiro.username}",
                f"Data: {timezone.localtime(agendamento.inicio):%d/%m/%Y %H:%M}",
                separador,
                "SERVICOS",
                *linhas_servicos,
                separador,
                f"TOTAL{'':<19} R$ {agendamento.valor_total:>8.2f}",
                separador,
                "PAGAMENTO",
                *(linhas_pagamentos or ["Pagamento pendente"]),
                separador,
                "Obrigado pela preferencia!".center(largura),
            ]
        )
        return response.Response(
            {
                "agendamento": agendamento.id,
                "largura_colunas": largura,
                "texto": texto,
                "html": texto.replace("\n", "<br/>"),
            }
        )


class RegistroPagamentoViewSet(TenantScopedViewSet):
    queryset = RegistroPagamento.objects.select_related("agendamento").all()
    serializer_class = RegistroPagamentoSerializer
