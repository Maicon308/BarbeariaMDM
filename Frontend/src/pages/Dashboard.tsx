import { Armchair, Building2, CalendarClock, CircleDollarSign, CreditCard, Scissors, UserRoundPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import ThermalReceipt from "../components/ThermalReceipt";
import api from "../services/api";
import type { DashboardData, ReceiptData } from "../types";

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
    { nome: "Corte degradê", valor: 45 },
    { nome: "Barba completa", valor: 35 },
  ],
  pagamentos: [{ forma: "PIX", valor: 80 }],
  total: 80,
};

export default function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardData>("/agendamentos/dashboard/")
      .then((response) => setDashboard(response.data))
      .catch(() =>
        setDashboard({
          data: new Date().toISOString().slice(0, 10),
          faturamento_hoje: 0,
          agendados_hoje: 0,
          concluidos_hoje: 0,
          cancelados_hoje: 0,
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  const faturamento = Number(dashboard?.faturamento_hoje ?? 0);

  return (
    <main className="mx-auto max-w-7xl space-y-5">
      <section className="rounded-lg bg-[#191512] p-5 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#c8a45d]">Operacao do dia</p>
            <h1 className="mt-1 text-3xl font-black">Painel executivo da barbearia</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              Acompanhe agenda, faturamento, clientes e operacao por tenant. Use o menu para acessar cada cadastro.
            </p>
          </div>
          <div className="rounded-md border border-white/15 bg-white/10 px-4 py-3 text-right">
            <p className="text-xs text-white/60">Hoje</p>
            <p className="text-xl font-bold">{new Date().toLocaleDateString("pt-BR")}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <Metric
              icon={<CircleDollarSign size={19} />}
              label="Faturamento hoje"
              value={loading ? "..." : currency.format(faturamento)}
            />
            <Metric
              icon={<CalendarClock size={19} />}
              label="Agendamentos"
              value={String(dashboard?.agendados_hoje ?? 0)}
            />
            <Metric
              icon={<Scissors size={19} />}
              label="Concluidos"
              value={String(dashboard?.concluidos_hoje ?? 0)}
            />
            <Metric
              icon={<Users size={19} />}
              label="Cancelados"
              value={String(dashboard?.cancelados_hoje ?? 0)}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["Clientes", "Cadastrar cliente e senha", <UserRoundPlus size={18} />],
              ["Filiais", "Criar filial VIP isolada", <Building2 size={18} />],
              ["Servicos", "Preco e duracao", <Scissors size={18} />],
              ["Cadeiras", "Aluguel e comissao", <Armchair size={18} />],
              ["Pagamentos", "Dinheiro, cartao e PIX", <CreditCard size={18} />],
              ["Agenda", "Reserva e historico", <CalendarClock size={18} />],
            ].map(([title, subtitle, icon]) => (
              <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" key={String(title)}>
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#fff4f1] text-[#8b1e24]">
                  {icon}
                </div>
                <p className="font-semibold text-[#191512]">{title}</p>
                <p className="text-sm text-zinc-500">{subtitle}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-950">Agendamentos do dia</h2>
              <span className="rounded-full bg-[#f0dfbc] px-3 py-1 text-xs font-medium text-[#5a3e18]">
                Isolado por barbearia
              </span>
            </div>

            <div className="overflow-hidden rounded-md border border-zinc-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Horario</th>
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Servico</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {[
                    ["09:00", "Joao Silva", "Corte + barba", "Agendado", "R$ 80,00"],
                    ["10:30", "Carlos Lima", "Corte", "Concluido", "R$ 45,00"],
                    ["14:00", "Rafael Souza", "Barba", "Agendado", "R$ 35,00"],
                  ].map((row) => (
                    <tr key={row.join("-")} className="text-zinc-700">
                      {row.map((cell) => (
                        <td className="px-4 py-3" key={cell}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#fff4f1] text-[#8b1e24]">
        {icon}
      </div>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-950">{value}</p>
    </div>
  );
}
