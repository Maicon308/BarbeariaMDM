import { CalendarPlus, Save } from "lucide-react";
import { FormEvent, useState } from "react";

import api from "../services/api";

type ModuleKey = "barbearias" | "clientes" | "agenda" | "servicos" | "cadeiras" | "pagamentos";

const configs = {
  barbearias: {
    title: "Barbearias e filiais",
    subtitle: "Matriz VIP cria filiais; cada filial opera isolada.",
    endpoint: "/barbearias/",
    fields: [
      ["nome", "Nome da filial", "text"],
      ["documento", "Documento", "text"],
      ["whatsapp", "WhatsApp", "text"],
      ["endereco", "Endereco", "text"],
    ],
  },
  clientes: {
    title: "Cadastro de clientes",
    subtitle: "Cliente fica preso ao tenant logado e pode receber acesso proprio.",
    endpoint: "/clientes/",
    fields: [
      ["nome", "Nome completo", "text"],
      ["whatsapp", "WhatsApp", "text"],
      ["email", "Email", "email"],
      ["endereco", "Endereco", "text"],
      ["username", "Usuario do cliente", "text"],
      ["password", "Senha inicial do cliente", "password"],
      ["observacoes", "Observacoes", "text"],
    ],
  },
  agenda: {
    title: "Agenda de horarios",
    subtitle: "Historico completo de servico, barbeiro, status e valor.",
    endpoint: "/agendamentos/",
    fields: [
      ["cliente", "ID do cliente", "number"],
      ["barbeiro", "ID do barbeiro", "number"],
      ["cadeira", "ID da cadeira", "number"],
      ["inicio", "Inicio", "datetime-local"],
      ["fim", "Fim", "datetime-local"],
      ["status", "Status", "text"],
      ["valor_total", "Valor total", "number"],
      ["servicos", "IDs dos servicos separados por virgula", "text"],
    ],
  },
  servicos: {
    title: "Servicos",
    subtitle: "Tipos de corte/barba com preco e duracao.",
    endpoint: "/servicos/",
    fields: [
      ["nome", "Nome do servico", "text"],
      ["descricao", "Descricao", "text"],
      ["valor", "Valor", "number"],
      ["duracao_minutos", "Duracao em minutos", "number"],
    ],
  },
  cadeiras: {
    title: "Cadeiras",
    subtitle: "Controle aluguel, comissao e barbeiro em operacao.",
    endpoint: "/cadeiras/",
    fields: [
      ["identificador", "Identificador", "text"],
      ["alugada", "Alugada? true/false", "text"],
      ["modelo_cobranca", "FIXO, COMISSAO ou MISTO", "text"],
      ["valor_aluguel", "Valor aluguel", "number"],
      ["percentual_comissao", "Comissao %", "number"],
      ["barbeiro_atual", "ID barbeiro atual", "number"],
    ],
  },
  pagamentos: {
    title: "Pagamentos",
    subtitle: "Dinheiro, credito, debito e base para PIX automatizado.",
    endpoint: "/pagamentos/",
    fields: [
      ["agendamento", "ID do agendamento", "number"],
      ["forma", "DINHEIRO, CREDITO, DEBITO ou PIX", "text"],
      ["status", "PENDENTE, APROVADO, RECUSADO ou ESTORNADO", "text"],
      ["valor", "Valor", "number"],
      ["referencia_externa", "Referencia PIX/adquirente", "text"],
    ],
  },
} satisfies Record<ModuleKey, { title: string; subtitle: string; endpoint: string; fields: string[][] }>;

export default function OperationsPage({ moduleKey }: { moduleKey: ModuleKey }) {
  const config = configs[moduleKey];
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {};
    config.fields.forEach(([name, , type]) => {
      const value = String(form.get(name) ?? "");
      if (!value) return;
      if (name === "servicos") {
        payload[name] = value.split(",").map((item) => Number(item.trim()));
      } else if (type === "number") {
        payload[name] = Number(value);
      } else if (value === "true" || value === "false") {
        payload[name] = value === "true";
      } else {
        payload[name] = value;
      }
    });

    try {
      await api.post(config.endpoint, payload);
      event.currentTarget.reset();
      setMessage("Cadastro salvo com isolamento do tenant logado.");
    } catch {
      setMessage("Nao foi possivel salvar. Confira campos obrigatorios e permissoes.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#191512]">{config.title}</h1>
          <p className="text-sm text-zinc-600">{config.subtitle}</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-[#8b1e24] px-4 py-2 text-sm font-semibold text-white">
          <CalendarPlus size={17} />
          Novo cadastro
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <form className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" onSubmit={submit}>
          <h2 className="mb-4 text-base font-semibold">Formulario</h2>
          <div className="grid gap-3">
            {config.fields.map(([name, label, type]) => (
              <label className="block" key={name}>
                <span className="mb-1 block text-xs font-semibold uppercase text-zinc-500">{label}</span>
                <input className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-[#8b1e24]" name={name} type={type} />
              </label>
            ))}
          </div>
          <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#191512] px-4 py-3 text-sm font-semibold text-white">
            <Save size={17} />
            Salvar
          </button>
          {message && <p className="mt-3 rounded-md bg-[#f0dfbc] px-3 py-2 text-sm text-[#5a3e18]">{message}</p>}
        </form>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-base font-semibold">Visao do modulo</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {["Tenant automatico", "Dados isolados", "Auditoria por historico"].map((item) => (
              <div className="rounded-md border border-zinc-200 bg-[#fbfaf7] p-4" key={item}>
                <p className="font-semibold text-[#8b1e24]">{item}</p>
                <p className="mt-1 text-sm text-zinc-600">Operacao vinculada a barbearia ou filial do usuario autenticado.</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

