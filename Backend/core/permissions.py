from rest_framework.permissions import BasePermission


class IsTenantMember(BasePermission):
    message = "Acesso negado para este tenant."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.is_superadmin or user.barbearia_id))

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_superadmin:
            return True
        tenant_id = getattr(obj, "barbearia_id", None)
        if tenant_id is None and hasattr(obj, "id"):
            tenant_id = obj.id
        return tenant_id in view.get_allowed_tenant_ids()

