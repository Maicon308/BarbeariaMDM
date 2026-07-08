import { CalendarClock, CircleDollarSign, Plus, Scissors, Users } from "lucide-react";
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
    <main className="min-h-screen bg-[#f6f5f2]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-950">BarbeariaMDM</h1>
            <p className="text-sm text-zinc-500">Operacao, agenda e caixa por tenant</p>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50">
              <CalendarClock size={16} />
              Agenda
            </button>
            <button className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800">
              <Plus size={16} />
              Novo horario
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[1fr_340px]">
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

          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-950">Agendamentos do dia</h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
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
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
        {icon}
      </div>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-950">{value}</p>
    </div>
  );
}
