from rest_framework import serializers

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


class PlanoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plano
        fields = "__all__"


class BarbeariaSerializer(serializers.ModelSerializer):
    matriz_nome = serializers.CharField(source="matriz.nome", read_only=True)
    plano_nome = serializers.CharField(source="plano.nome", read_only=True)
    nome_admin = serializers.CharField(write_only=True, required=False, allow_blank=True)
    email_admin = serializers.EmailField(write_only=True, required=False, allow_blank=True)
    username_admin = serializers.CharField(write_only=True, required=False, allow_blank=True)
    senha_admin = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=4)

    class Meta:
        model = Barbearia
        fields = "__all__"

    def create(self, validated_data):
        nome_admin = validated_data.pop("nome_admin", "")
        email_admin = validated_data.pop("email_admin", "")
        username_admin = validated_data.pop("username_admin", "")
        senha_admin = validated_data.pop("senha_admin", "")
        barbearia = Barbearia.objects.create(**validated_data)

        if username_admin and senha_admin:
            user = UsuarioCustomizado(
                username=username_admin,
                email=email_admin,
                first_name=nome_admin or "Administrador",
                papel=UsuarioCustomizado.Papel.DONO,
                whatsapp=barbearia.whatsapp,
                barbearia=barbearia,
                senha_visivel_admin=senha_admin,
                is_staff=True,
            )
            user.set_password(senha_admin)
            user.save()

        return barbearia


class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=4)
    nome_completo = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        model = UsuarioCustomizado
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "papel",
            "whatsapp",
            "barbearia",
            "senha_visivel_admin",
            "nome_completo",
            "password",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = UsuarioCustomizado(**validated_data)
        if password:
            user.set_password(password)
            user.senha_visivel_admin = password
        else:
            user.set_unusable_password()
        user.save()
        return user

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        can_view_password = bool(
            request
            and request.user.is_authenticated
            and request.user.papel
            in [
                UsuarioCustomizado.Papel.SUPERADMIN,
                UsuarioCustomizado.Papel.DONO,
                UsuarioCustomizado.Papel.GERENTE,
            ]
        )
        if not can_view_password:
            data.pop("senha_visivel_admin", None)
        return data


class ClienteSerializer(serializers.ModelSerializer):
    total_gasto = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    password = serializers.CharField(write_only=True, required=False, min_length=4)
    username = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Cliente
        fields = "__all__"
        read_only_fields = ["total_gasto", "usuario"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        username = validated_data.pop("username", None)
        cliente = Cliente(**validated_data)
        if password:
            username = username or cliente.whatsapp
            user = UsuarioCustomizado(
                username=username,
                email=cliente.email,
                first_name=cliente.nome,
                papel=UsuarioCustomizado.Papel.CLIENTE,
                whatsapp=cliente.whatsapp,
                barbearia=cliente.barbearia,
                senha_visivel_admin=password,
            )
            user.set_password(password)
            user.save()
            cliente.usuario = user
        cliente.save()
        return cliente


class BarbeariaSignupSerializer(serializers.Serializer):
    nome_barbearia = serializers.CharField(max_length=160)
    documento = serializers.CharField(max_length=32, required=False, allow_blank=True)
    whatsapp = serializers.CharField(max_length=32, required=False, allow_blank=True)
    endereco = serializers.CharField(required=False, allow_blank=True)
    plano = serializers.PrimaryKeyRelatedField(queryset=Plano.objects.filter(ativo=True))
    nome_admin = serializers.CharField(max_length=160)
    email_admin = serializers.EmailField()
    username_admin = serializers.CharField(max_length=150)
    senha_admin = serializers.CharField(min_length=4, write_only=True)

    def create(self, validated_data):
        plano = validated_data["plano"]
        barbearia = Barbearia.objects.create(
            nome=validated_data["nome_barbearia"],
            documento=validated_data.get("documento", ""),
            whatsapp=validated_data.get("whatsapp", ""),
            endereco=validated_data.get("endereco", ""),
            plano=plano,
        )
        user = UsuarioCustomizado(
            username=validated_data["username_admin"],
            email=validated_data["email_admin"],
            first_name=validated_data["nome_admin"],
            papel=UsuarioCustomizado.Papel.DONO,
            whatsapp=validated_data.get("whatsapp", ""),
            barbearia=barbearia,
            senha_visivel_admin=validated_data["senha_admin"],
            is_staff=True,
        )
        user.set_password(validated_data["senha_admin"])
        user.save()
        return {"barbearia": barbearia, "usuario": user}


class ServicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Servico
        fields = "__all__"


class CadeiraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cadeira
        fields = "__all__"


class AgendamentoSerializer(serializers.ModelSerializer):
    cliente_nome = serializers.CharField(source="cliente.nome", read_only=True)
    barbeiro_nome = serializers.CharField(source="barbeiro.get_full_name", read_only=True)
    barbearia_nome = serializers.CharField(source="barbearia.nome", read_only=True)
    servicos_nomes = serializers.SerializerMethodField()

    class Meta:
        model = Agendamento
        fields = "__all__"

    def get_servicos_nomes(self, obj):
        return [servico.nome for servico in obj.servicos.all()]


class RegistroPagamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroPagamento
        fields = "__all__"
