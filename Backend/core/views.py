from datetime import datetime, time, timedelta

from django.db.models import Sum
from django.utils import timezone
from rest_framework import decorators, exceptions, permissions, response, status, views, viewsets

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
    BarbeariaSignupSerializer,
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
        if getattr(user, "papel", None) == UsuarioCustomizado.Papel.CLIENTE:
            if queryset.model is Cliente:
                return queryset.filter(usuario=user)
            if queryset.model is Agendamento:
                return queryset.filter(cliente__usuario=user)
        if self.tenant_field == "id":
            return queryset.filter(id__in=tenant_ids)
        return queryset.filter(**{f"{self.tenant_field}_id__in": tenant_ids})

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_superadmin and serializer.validated_data.get("barbearia"):
            serializer.save()
            return
        if user.is_superadmin:
            raise exceptions.ValidationError("Informe a barbearia para este cadastro.")
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
        if user.is_superadmin:
            serializer.save()
            return
        if not user.is_superadmin and not user.barbearia.plano.permite_filiais:
            raise exceptions.ValidationError("Somente plano VIP pode criar filiais.")
        if not user.is_superadmin and serializer.validated_data.get("matriz") != user.barbearia:
            serializer.save(matriz=user.barbearia, plano=user.barbearia.plano)
            return
        serializer.save()


class UsuarioViewSet(TenantScopedViewSet):
    queryset = UsuarioCustomizado.objects.select_related("barbearia").all()
    serializer_class = UsuarioSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.papel == UsuarioCustomizado.Papel.CLIENTE:
            return queryset.filter(
                papel__in=[
                    UsuarioCustomizado.Papel.DONO,
                    UsuarioCustomizado.Papel.GERENTE,
                    UsuarioCustomizado.Papel.BARBEIRO,
                    UsuarioCustomizado.Papel.ATENDENTE,
                ]
            )
        return queryset

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
        user = self.request.user
        barbearia = serializer.validated_data.get("barbearia") if user.is_superadmin else user.barbearia
        if not barbearia:
            raise exceptions.ValidationError("Informe a barbearia do cliente.")
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

    @decorators.action(detail=False, methods=["get"], url_path="horarios-livres")
    def horarios_livres(self, request):
        data_texto = request.query_params.get("data")
        servico_id = request.query_params.get("servico")
        barbeiro_id = request.query_params.get("barbeiro")
        if not data_texto or not servico_id:
            raise exceptions.ValidationError("Informe data e servico.")

        data = datetime.strptime(data_texto, "%Y-%m-%d").date()
        servico = Servico.objects.filter(
            id=servico_id,
            barbearia_id__in=self.get_allowed_tenant_ids(),
            ativo=True,
        ).first()
        if not servico:
            raise exceptions.NotFound("Servico nao encontrado para esta barbearia.")

        inicio_dia = timezone.make_aware(datetime.combine(data, time(hour=9)))
        fim_dia = timezone.make_aware(datetime.combine(data, time(hour=19)))
        passo = timedelta(minutes=30)
        duracao = timedelta(minutes=servico.duracao_minutos)
        ocupados = self.get_queryset().filter(
            inicio__date=data,
            status__in=[Agendamento.Status.AGENDADO, Agendamento.Status.CONCLUIDO],
        )
        if barbeiro_id:
            ocupados = ocupados.filter(barbeiro_id=barbeiro_id)

        horarios = []
        cursor = inicio_dia
        while cursor + duracao <= fim_dia:
            livre = not ocupados.filter(inicio__lt=cursor + duracao, fim__gt=cursor).exists()
            if livre:
                horarios.append(
                    {
                        "inicio": cursor.isoformat(),
                        "fim": (cursor + duracao).isoformat(),
                        "livre": True,
                        "servico": servico.id,
                        "servico_nome": servico.nome,
                        "valor": servico.valor,
                    }
                )
            cursor += passo
        return response.Response(horarios)

    @decorators.action(detail=False, methods=["post"], url_path="reservar")
    def reservar(self, request):
        user = request.user
        if user.papel != UsuarioCustomizado.Papel.CLIENTE or not hasattr(user, "cliente_perfil"):
            raise exceptions.PermissionDenied("Somente cliente pode reservar por este endpoint.")
        data = request.data.copy()
        data["barbearia"] = user.barbearia_id
        data["cliente"] = user.cliente_perfil.id
        data["status"] = Agendamento.Status.AGENDADO
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        inicio = serializer.validated_data["inicio"]
        fim = serializer.validated_data["fim"]
        barbeiro = serializer.validated_data["barbeiro"]
        ocupado = self.get_queryset().filter(
            barbeiro=barbeiro,
            inicio__lt=fim,
            fim__gt=inicio,
            status__in=[Agendamento.Status.AGENDADO, Agendamento.Status.CONCLUIDO],
        ).exists()
        if ocupado:
            raise exceptions.ValidationError("Este horario acabou de ser reservado. Escolha outro horario.")
        serializer.save(barbearia=user.barbearia, cliente=user.cliente_perfil, status=Agendamento.Status.AGENDADO)
        return response.Response(serializer.data, status=status.HTTP_201_CREATED)

    def _ensure_cliente_can_change(self, agendamento):
        limite = timezone.now() + timedelta(minutes=30)
        if agendamento.inicio <= limite:
            raise exceptions.ValidationError("Alteracoes sao permitidas ate 30 minutos antes do horario.")
        if agendamento.status != Agendamento.Status.AGENDADO:
            raise exceptions.ValidationError("Somente reservas agendadas podem ser alteradas.")

    @decorators.action(detail=True, methods=["post"], url_path="cancelar")
    def cancelar(self, request, pk=None):
        agendamento = self.get_object()
        if request.user.papel == UsuarioCustomizado.Papel.CLIENTE:
            self._ensure_cliente_can_change(agendamento)
        agendamento.status = Agendamento.Status.CANCELADO
        agendamento.save(update_fields=["status", "atualizado_em"])
        return response.Response(self.get_serializer(agendamento).data)

    @decorators.action(detail=True, methods=["post"], url_path="reagendar")
    def reagendar(self, request, pk=None):
        agendamento = self.get_object()
        if request.user.papel == UsuarioCustomizado.Papel.CLIENTE:
            self._ensure_cliente_can_change(agendamento)

        data = request.data.copy()
        inicio = data.get("inicio")
        fim = data.get("fim")
        barbeiro_id = data.get("barbeiro") or agendamento.barbeiro_id
        servicos_ids = data.get("servicos")
        if not inicio or not fim:
            raise exceptions.ValidationError("Informe inicio e fim para reagendar.")

        novo_inicio = datetime.fromisoformat(str(inicio).replace("Z", "+00:00"))
        novo_fim = datetime.fromisoformat(str(fim).replace("Z", "+00:00"))
        if timezone.is_naive(novo_inicio):
            novo_inicio = timezone.make_aware(novo_inicio)
        if timezone.is_naive(novo_fim):
            novo_fim = timezone.make_aware(novo_fim)

        ocupado = self.get_queryset().exclude(id=agendamento.id).filter(
            barbeiro_id=barbeiro_id,
            inicio__lt=novo_fim,
            fim__gt=novo_inicio,
            status__in=[Agendamento.Status.AGENDADO, Agendamento.Status.CONCLUIDO],
        ).exists()
        if ocupado:
            raise exceptions.ValidationError("Este horario acabou de ser reservado. Escolha outro horario.")

        agendamento.inicio = novo_inicio
        agendamento.fim = novo_fim
        agendamento.barbeiro_id = barbeiro_id
        agendamento.status = Agendamento.Status.AGENDADO
        if data.get("valor_total"):
            agendamento.valor_total = data["valor_total"]
        agendamento.save()
        if servicos_ids:
            agendamento.servicos.set(servicos_ids)
        return response.Response(self.get_serializer(agendamento).data)

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

    def perform_create(self, serializer):
        agendamento = serializer.validated_data.get("agendamento")
        if not agendamento:
            raise exceptions.ValidationError("Informe o agendamento do pagamento.")
        serializer.save(barbearia=agendamento.barbearia)


class MeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        barbearia = user.barbearia
        return response.Response(
            {
                "usuario": UsuarioSerializer(user).data,
                "barbearia": BarbeariaSerializer(barbearia).data if barbearia else None,
                "filiais": BarbeariaSerializer(barbearia.filiais.all(), many=True).data
                if barbearia and barbearia.is_matriz
                else [],
                "is_cliente": user.papel == UsuarioCustomizado.Papel.CLIENTE,
                "is_superadmin": user.is_superadmin,
            }
        )


class BarbeariaSignupView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = BarbeariaSignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        return response.Response(
            {
                "barbearia": BarbeariaSerializer(result["barbearia"]).data,
                "usuario": UsuarioSerializer(result["usuario"]).data,
            },
            status=status.HTTP_201_CREATED,
        )
