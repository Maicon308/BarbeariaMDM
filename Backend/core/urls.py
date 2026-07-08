from rest_framework.routers import DefaultRouter

from .views import (
    AgendamentoViewSet,
    BarbeariaViewSet,
    CadeiraViewSet,
    ClienteViewSet,
    PlanoViewSet,
    RegistroPagamentoViewSet,
    ServicoViewSet,
    UsuarioViewSet,
)

router = DefaultRouter()
router.register("planos", PlanoViewSet, basename="planos")
router.register("barbearias", BarbeariaViewSet, basename="barbearias")
router.register("usuarios", UsuarioViewSet, basename="usuarios")
router.register("clientes", ClienteViewSet, basename="clientes")
router.register("servicos", ServicoViewSet, basename="servicos")
router.register("cadeiras", CadeiraViewSet, basename="cadeiras")
router.register("agendamentos", AgendamentoViewSet, basename="agendamentos")
router.register("pagamentos", RegistroPagamentoViewSet, basename="pagamentos")

urlpatterns = router.urls

