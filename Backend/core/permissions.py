from rest_framework.permissions import BasePermission


class IsTenantMember(BasePermission):
    message = "Acesso negado para este tenant."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superadmin:
            return True
        return bool(user.barbearia_id and user.barbearia.ativa)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_superadmin:
            return True
        tenant_id = getattr(obj, "barbearia_id", None)
        if tenant_id is None and hasattr(obj, "id"):
            tenant_id = obj.id
        return tenant_id in view.get_allowed_tenant_ids()
