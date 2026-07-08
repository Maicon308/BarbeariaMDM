import {
  Armchair,
  Ban,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Crown,
  Scissors,
  ShieldCheck,
  Store,
  UserRoundPlus,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import ThermalReceipt from "../components/ThermalReceipt";
import type { NavKey } from "../components/AppShell";
import api from "../services/api";
import type { BarbeariaData, DashboardData, MeData, PlanoData, ReceiptData } from "../types";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const demoReceipt: ReceiptData = {
  barbearia: "Barbearia MDM",
  whatsapp: "(00) 00000-0000",
  cliente: "Cliente Exemplo",
  barbeiro: "Barbeiro Principal",
  data: new Date().toLocaleString("pt-BR"),
  servicos: [
    { nome: "Corte degrade", valor: 45 },
    { nome: "Barba completa", valor: 35 },
  ],
  pagamentos: [{ forma: "PIX", valor: 80 }],
  total: 80,
};

export default function Dashboard({ me, onNavigate }: { me: MeData; onNavigate: (key: NavKey) => void }) {
  if (me.is_superadmin) {
    return <SuperAdminDashboard onNavigate={onNavigate} />;
  }
  return <BarbeariaDashboard me={me} onNavigate={onNavigate} />;
}

function SuperAdminDashboard({ onNavigate }: { onNavigate: (key: NavKey) => void }) {
  const [barbearias, setBarbearias] = useState<BarbeariaData[]>([]);
  const [planos, setPlanos] = useState<PlanoData[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [reservas, setReservas] = useState<any[]>([]);
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [selectedBarbeariaId, setSelectedBarbeariaId] = useState<number | null>(null);
  const [clientesTotal, setClientesTotal] = useState(0);
  const [servicosTotal, setServicosTotal] = useState(0);
  const [reservasTotal, setReservasTotal] = useState(0);

  useEffect(() => {
    void Promise.all([
      api.get<BarbeariaData[]>("/barbearias/"),
      api.get<PlanoData[]>("/planos/"),
      api.get<any[]>("/clientes/").catch(() => ({ data: [] as any[] })),
      api.get<any[]>("/servicos/").catch(() => ({ data: [] as any[] })),
      api.get<any[]>("/agendamentos/").catch(() => ({ data: [] as any[] })),
      api.get<any[]>("/pagamentos/").catch(() => ({ data: [] as any[] })),
    ]).then(
      ([barbeariasResponse, planosResponse, clientesResponse, servicosResponse, reservasResponse, pagamentosResponse]) => {
        setBarbearias(barbeariasResponse.data);
        setPlanos(planosResponse.data);
        setClientes(clientesResponse.data);
        setServicos(servicosResponse.data);
        setReservas(reservasResponse.data);
        setPagamentos(pagamentosResponse.data);
        setClientesTotal(clientesResponse.data.length);
        setServicosTotal(servicosResponse.data.length);
        setReservasTotal(reservasResponse.data.length);
        if (!selectedBarbeariaId && barbeariasResponse.data[0]) {
          setSelectedBarbeariaId(barbeariasResponse.data[0].id);
        }
      },
    );
  }, []);

  const bloqueadas = barbearias.filter((barbearia) => !barbearia.ativa);
  const matrizes = barbearias.filter((barbearia) => !barbearia.matriz);
  const filiais = barbearias.filter((barbearia) => barbearia.matriz);
  const selectedBarbearia = barbearias.find((barbearia) => barbearia.id === selectedBarbeariaId) ?? barbearias[0] ?? null;
  const receitaPrevista = useMemo(
    () =>
      barbearias
        .filter((barbearia) => barbearia.ativa)
        .reduce((total, barbearia) => {
          const plano = planos.find((item) => item.id === barbearia.plano);
          return total + Number(plano?.preco_mensal ?? 0);
        }, 0),
    [barbearias, planos],
  );

  return (
    <main className="mx-auto max-w-7xl space-y-5">
      <section className="overflow-hidden rounded-lg bg-[#120d0b] text-white shadow-sm">
        <div className="relative px-4 py-3 sm:px-5">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.10)_0_12px,transparent_12px_24px)] opacity-35" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-[#f0c76a]/15 px-2.5 py-1 text-xs font-bold text-[#f0c76a]">
                <Crown size={16} />
                Painel do SuperAdmin
              </p>
              <h1 className="mt-2 max-w-3xl text-xl font-black sm:text-2xl">Planos, unidades e acessos da rede.</h1>
            </div>
            <button className="rounded-md bg-[#8b1e24] px-3 py-2 text-sm font-bold text-white" onClick={() => onNavigate("barbearias")}>
              Nova barbearia
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric icon={<Store size={19} />} label="Barbearias" value={String(barbearias.length)} />
        <Metric icon={<Users size={19} />} label="Clientes" value={String(clientesTotal)} />
        <Metric icon={<Scissors size={19} />} label="Servicos" value={String(servicosTotal)} />
        <Metric icon={<CalendarClock size={19} />} label="Reservas" value={String(reservasTotal)} />
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric icon={<Building2 size={19} />} label="Matrizes" value={String(matrizes.length)} />
        <Metric icon={<ShieldCheck size={19} />} label="Filiais" value={String(filiais.length)} />
        <Metric icon={<Ban size={19} />} label="Bloqueadas" value={String(bloqueadas.length)} />
        <Metric icon={<CircleDollarSign size={19} />} label="Receita mensal prevista" value={currency.format(receitaPrevista)} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-[#15100d]">Controle das barbearias</h2>
              <p className="text-sm text-zinc-500">Altere plano e status no modulo Barbearias.</p>
            </div>
            <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold" onClick={() => onNavigate("barbearias")}>
              Gerenciar
            </button>
          </div>
          <div className="overflow-hidden rounded-md border border-zinc-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Barbearia</th>
                  <th className="px-4 py-3 font-semibold">Plano</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Relatorio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {barbearias.slice(0, 8).map((barbearia) => (
                  <tr key={barbearia.id}>
                    <td className="px-4 py-3 font-semibold text-zinc-900">{barbearia.nome}</td>
                    <td className="px-4 py-3 text-zinc-600">{barbearia.plano_nome}</td>
                    <td className="px-4 py-3 text-zinc-600">{barbearia.matriz ? `Filial de ${barbearia.matriz_nome}` : "Matriz"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge active={barbearia.ativa} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-bold text-zinc-700 hover:border-[#8b1e24] hover:text-[#8b1e24]"
                        onClick={() => setSelectedBarbeariaId(barbearia.id)}
                        type="button"
                      >
                        Abrir painel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-[#8b1e24]">
              <Ban size={19} />
              <h2 className="font-black text-[#15100d]">Bloqueios</h2>
            </div>
            <p className="text-sm text-zinc-500">Barbearia com pagamento pendente deve ficar inativa.</p>
            <div className="mt-4 space-y-2">
              {(bloqueadas.length ? bloqueadas : barbearias.slice(0, 2)).map((barbearia) => (
                <div className="rounded-md border border-zinc-200 bg-[#fbfaf7] p-3" key={barbearia.id}>
                  <p className="font-semibold text-zinc-900">{barbearia.nome}</p>
                  <p className="text-xs text-zinc-500">{barbearia.ativa ? "Liberada" : "Bloqueada por inadimplencia"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-black text-[#15100d]">Planos ativos</h2>
            <div className="space-y-2">
              {planos.map((plano) => (
                <div className="rounded-md bg-[#f6efe3] p-3" key={plano.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-[#15100d]">{plano.nome}</p>
                    <p className="text-sm font-black text-[#8b1e24]">{currency.format(Number(plano.preco_mensal))}</p>
                  </div>
                  <p className="mt-1 text-xs text-zinc-600">{plano.permite_filiais ? "Permite matriz e filial" : "Sem filiais"}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <BarbeariaReport
        barbearia={selectedBarbearia}
        clientes={clientes}
        pagamentos={pagamentos}
        reservas={reservas}
        servicos={servicos}
      />
    </main>
  );
}

function BarbeariaReport({
  barbearia,
  clientes,
  pagamentos,
  reservas,
  servicos,
}: {
  barbearia: BarbeariaData | null;
  clientes: any[];
  pagamentos: any[];
  reservas: any[];
  servicos: any[];
}) {
  if (!barbearia) {
    return (
      <section className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500">
        Cadastre uma barbearia para abrir o relatorio operacional.
      </section>
    );
  }

  const sameTenant = (item: any) => Number(item.barbearia) === barbearia.id;
  const clientesDaBarbearia = clientes.filter(sameTenant);
  const servicosDaBarbearia = servicos.filter(sameTenant);
  const reservasDaBarbearia = reservas.filter(sameTenant);
  const pagamentosDaBarbearia = pagamentos.filter(sameTenant);
  const faturamento = pagamentosDaBarbearia
    .filter((pagamento) => pagamento.status === "APROVADO")
    .reduce((total, pagamento) => total + Number(pagamento.valor ?? 0), 0);
  const reservasAbertas = reservasDaBarbearia.filter((reserva) => reserva.status === "AGENDADO").length;
  const ultimasReservas = [...reservasDaBarbearia]
    .sort((a, b) => new Date(b.inicio ?? 0).getTime() - new Date(a.inicio ?? 0).getTime())
    .slice(0, 6);
  const ultimosPagamentos = [...pagamentosDaBarbearia].slice(-5).reverse();

  return (
    <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#8b1e24]">Relatorio individual</p>
            <h2 className="mt-1 text-xl font-black text-[#191512]">{barbearia.nome}</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {barbearia.plano_nome} {barbearia.matriz_nome ? `- filial de ${barbearia.matriz_nome}` : "- matriz"}
            </p>
          </div>
          <StatusBadge active={barbearia.ativa} />
        </div>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-5">
        <Metric icon={<Users size={19} />} label="Clientes" value={String(clientesDaBarbearia.length)} />
        <Metric icon={<Scissors size={19} />} label="Servicos" value={String(servicosDaBarbearia.length)} />
        <Metric icon={<CalendarClock size={19} />} label="Reservas" value={String(reservasDaBarbearia.length)} />
        <Metric icon={<ShieldCheck size={19} />} label="Em aberto" value={String(reservasAbertas)} />
        <Metric icon={<CircleDollarSign size={19} />} label="Faturamento" value={currency.format(faturamento)} />
      </div>

      <div className="grid gap-5 border-t border-zinc-200 p-5 lg:grid-cols-[1.2fr_.8fr]">
        <div>
          <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-zinc-500">Ultimas reservas</h3>
          <div className="overflow-hidden rounded-md border border-zinc-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Servico</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {ultimasReservas.length ? (
                  ultimasReservas.map((reserva) => (
                    <tr className="text-zinc-700" key={reserva.id}>
                      <td className="px-4 py-3 font-semibold text-zinc-950">{reserva.cliente_nome ?? "Cliente"}</td>
                      <td className="px-4 py-3">
                        {reserva.inicio ? new Date(reserva.inicio).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "-"}
                      </td>
                      <td className="px-4 py-3">{(reserva.servicos_nomes ?? []).join(", ") || "-"}</td>
                      <td className="px-4 py-3">{reserva.status}</td>
                      <td className="px-4 py-3">{currency.format(Number(reserva.valor_total ?? 0))}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-center text-zinc-500" colSpan={5}>
                      Sem reservas registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside>
          <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-zinc-500">Pagamentos recentes</h3>
          <div className="space-y-2">
            {ultimosPagamentos.length ? (
              ultimosPagamentos.map((pagamento) => (
                <div className="rounded-md border border-zinc-200 bg-[#fbfaf7] p-3" key={pagamento.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-zinc-950">{pagamento.forma}</p>
                    <p className="font-black text-[#8b1e24]">{currency.format(Number(pagamento.valor ?? 0))}</p>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{pagamento.status}</p>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-zinc-300 p-5 text-sm text-zinc-500">Sem pagamentos registrados.</p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function BarbeariaDashboard({ me, onNavigate }: { me: MeData; onNavigate: (key: NavKey) => void }) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [clientesTotal, setClientesTotal] = useState(0);
  const [servicosTotal, setServicosTotal] = useState(0);
  const [equipeTotal, setEquipeTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([
      api.get<DashboardData>("/agendamentos/dashboard/").catch(() => ({
        data: {
          data: new Date().toISOString().slice(0, 10),
          faturamento_hoje: 0,
          agendados_hoje: 0,
          concluidos_hoje: 0,
          cancelados_hoje: 0,
        },
      })),
      api.get<any[]>("/clientes/").catch(() => ({ data: [] as any[] })),
      api.get<any[]>("/servicos/").catch(() => ({ data: [] as any[] })),
      api.get<any[]>("/usuarios/").catch(() => ({ data: [] as any[] })),
    ])
      .then(([dashboardResponse, clientesResponse, servicosResponse, usuariosResponse]) => {
        setDashboard(dashboardResponse.data);
        setClientesTotal(clientesResponse.data.length);
        setServicosTotal(servicosResponse.data.length);
        setEquipeTotal(usuariosResponse.data.filter((user) => user.papel !== "CLIENTE").length);
      })
      .finally(() => setLoading(false));
  }, []);

  const faturamento = Number(dashboard?.faturamento_hoje ?? 0);

  return (
    <main className="mx-auto max-w-7xl space-y-5">
      <section className="rounded-lg bg-[#191512] p-5 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#c8a45d]">Operacao da barbearia</p>
            <h1 className="mt-1 text-3xl font-black">{me.barbearia?.nome ?? "Painel executivo"}</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              Controle agenda, clientes, servicos, cadeiras, pagamentos e filiais no mesmo painel.
            </p>
          </div>
          <div className="rounded-md border border-white/15 bg-white/10 px-4 py-3 text-right">
            <p className="text-xs text-white/60">Plano</p>
            <p className="text-xl font-bold">{me.barbearia?.plano_nome ?? "Ativo"}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <Metric icon={<CircleDollarSign size={19} />} label="Faturamento hoje" value={loading ? "..." : currency.format(faturamento)} />
            <Metric icon={<CalendarClock size={19} />} label="Agendamentos" value={String(dashboard?.agendados_hoje ?? 0)} />
            <Metric icon={<Users size={19} />} label="Clientes" value={String(clientesTotal)} />
            <Metric icon={<Scissors size={19} />} label="Servicos" value={String(servicosTotal)} />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Metric icon={<Users size={19} />} label="Equipe" value={String(equipeTotal)} />
            <Metric icon={<CheckCircle2 size={19} />} label="Concluidos hoje" value={String(dashboard?.concluidos_hoje ?? 0)} />
            <Metric icon={<Ban size={19} />} label="Cancelados hoje" value={String(dashboard?.cancelados_hoje ?? 0)} />
            <Metric icon={<Building2 size={19} />} label="Filiais" value={String(me.filiais.length)} />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["Clientes", "Cadastrar cliente e senha", <UserRoundPlus size={18} />, "clientes"],
              ["Filiais", "Criar unidade vinculada", <Building2 size={18} />, "barbearias"],
              ["Servicos", "Preco e duracao", <Scissors size={18} />, "servicos"],
              ["Cadeiras", "Aluguel e comissao", <Armchair size={18} />, "cadeiras"],
              ["Pagamentos", "Dinheiro, cartao e PIX", <CreditCard size={18} />, "pagamentos"],
              ["Agenda", "Reserva e historico", <CalendarClock size={18} />, "agenda"],
            ].map(([title, subtitle, icon, key]) => (
              <button
                className="rounded-lg border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:border-[#8b1e24]"
                key={String(title)}
                onClick={() => onNavigate(key as NavKey)}
                type="button"
              >
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#fff4f1] text-[#8b1e24]">{icon}</div>
                <p className="font-semibold text-[#191512]">{title}</p>
                <p className="text-sm text-zinc-500">{subtitle}</p>
              </button>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="mb-3 text-base font-semibold text-zinc-950">Cupom termico</h2>
            <ThermalReceipt receipt={demoReceipt} />
          </div>
        </aside>
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#fff4f1] text-[#8b1e24]">{icon}</div>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      }`}
    >
      {active ? <CheckCircle2 size={14} /> : <Ban size={14} />}
      {active ? "Liberada" : "Bloqueada"}
    </span>
  );
}
