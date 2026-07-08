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
    class Meta:
        model = Barbearia
        fields = "__all__"


class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)

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
            "password",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = UsuarioCustomizado(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user


class ClienteSerializer(serializers.ModelSerializer):
    total_gasto = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cliente
        fields = "__all__"
        read_only_fields = ["barbearia", "total_gasto"]


class ServicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Servico
        fields = "__all__"
        read_only_fields = ["barbearia"]


class CadeiraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cadeira
        fields = "__all__"
        read_only_fields = ["barbearia"]


class AgendamentoSerializer(serializers.ModelSerializer):
    cliente_nome = serializers.CharField(source="cliente.nome", read_only=True)
    barbeiro_nome = serializers.CharField(source="barbeiro.get_full_name", read_only=True)
    servicos_nomes = serializers.SerializerMethodField()

    class Meta:
        model = Agendamento
        fields = "__all__"
        read_only_fields = ["barbearia"]

    def get_servicos_nomes(self, obj):
        return [servico.nome for servico in obj.servicos.all()]


class RegistroPagamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroPagamento
        fields = "__all__"
        read_only_fields = ["barbearia"]
