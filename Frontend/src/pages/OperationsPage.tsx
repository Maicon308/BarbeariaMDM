import { Ban, CheckCircle2, CalendarPlus, Save, ShieldAlert } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import api from "../services/api";
import type { BarbeariaData, CadeiraData, ClienteData, PlanoData, ServicoData, UserData } from "../types";

type ModuleKey = "barbearias" | "clientes" | "agenda" | "servicos" | "cadeiras" | "pagamentos";
type FieldType = "text" | "email" | "password" | "number" | "datetime-local" | "select" | "textarea";
type Option = { value: string; label: string };
type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: Option[];
  placeholder?: string;
};

const moduleCopy = {
  barbearias: ["Barbearias", "Plano, acesso, matriz e filial sob controle do SuperAdmin."],
  clientes: ["Clientes", "Cadastro com login proprio para reserva online."],
  agenda: ["Agenda", "Atendimento com cliente, barbeiro, servico, horario e valor."],
  servicos: ["Servicos", "Catalogo comercial da barbearia."],
  cadeiras: ["Cadeiras", "Controle de aluguel, comissao e barbeiro."],
  pagamentos: ["Pagamentos", "Registro financeiro por atendimento."],
} satisfies Record<ModuleKey, [string, string]>;

const endpoints = {
  barbearias: "/barbearias/",
  clientes: "/clientes/",
  agenda: "/agendamentos/",
  servicos: "/servicos/",
  cadeiras: "/cadeiras/",
  pagamentos: "/pagamentos/",
} satisfies Record<ModuleKey, string>;

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function OperationsPage({ moduleKey }: { moduleKey: ModuleKey }) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"ok" | "error">("ok");
  const [barbearias, setBarbearias] = useState<BarbeariaData[]>([]);
  const [planos, setPlanos] = useState<PlanoData[]>([]);
  const [clientes, setClientes] = useState<ClienteData[]>([]);
  const [usuarios, setUsuarios] = useState<UserData[]>([]);
  const [servicos, setServicos] = useState<ServicoData[]>([]);
  const [cadeiras, setCadeiras] = useState<CadeiraData[]>([]);
  const [rows, setRows] = useState<any[]>([]);

  async function loadBase() {
    const [meRes, barbeariasRes, planosRes, clientesRes, usuariosRes, servicosRes, cadeirasRes, rowsRes] = await Promise.all([
      api.get("/me/"),
      api.get<BarbeariaData[]>("/barbearias/"),
      api.get<PlanoData[]>("/planos/"),
      api.get<ClienteData[]>("/clientes/").catch(() => ({ data: [] as ClienteData[] })),
      api.get<UserData[]>("/usuarios/").catch(() => ({ data: [] as UserData[] })),
      api.get<ServicoData[]>("/servicos/").catch(() => ({ data: [] as ServicoData[] })),
      api.get<CadeiraData[]>("/cadeiras/").catch(() => ({ data: [] as CadeiraData[] })),
      api.get<any[]>(endpoints[moduleKey]).catch(() => ({ data: [] as any[] })),
    ]);
    setIsSuperAdmin(Boolean(meRes.data.is_superadmin));
    setBarbearias(barbeariasRes.data);
    setPlanos(planosRes.data);
    setClientes(clientesRes.data);
    setUsuarios(usuariosRes.data);
    setServicos(servicosRes.data);
    setCadeiras(cadeirasRes.data);
    setRows(rowsRes.data);
  }

  useEffect(() => {
    void loadBase();
  }, [moduleKey]);

  const fields = useMemo(
    () =>
      buildFields(moduleKey, {
        barbearias,
        planos,
        clientes,
        usuarios,
        servicos,
        cadeiras,
      }, isSuperAdmin),
    [moduleKey, barbearias, planos, clientes, usuarios, servicos, cadeiras, isSuperAdmin],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const payload: Record<string, unknown> = {};

    fields.forEach((field) => {
      const rawValue = form.get(field.name);
      const value = typeof rawValue === "string" ? rawValue.trim() : "";
      if (!value) return;
      if (field.name === "servicos") {
        payload[field.name] = [Number(value)];
      } else if (field.type === "number" || field.type === "select") {
        if (value === "true" || value === "false") {
          payload[field.name] = value === "true";
        } else if (["status", "forma", "papel", "modelo_cobranca"].includes(field.name)) {
          payload[field.name] = value;
        } else {
          payload[field.name] = Number(value);
        }
      } else {
        payload[field.name] = value;
      }
    });

    try {
      await api.post(endpoints[moduleKey], payload);
      formEl.reset();
      setMessageTone("ok");
      setMessage(moduleKey === "barbearias" ? "Barbearia criada. Entregue o usuario e senha ao dono." : "Cadastro salvo.");
      await loadBase();
    } catch (error: any) {
      setMessageTone("error");
      setMessage(readApiError(error));
    }
  }

  async function toggleBarbearia(barbearia: BarbeariaData) {
    try {
      await api.patch(`/barbearias/${barbearia.id}/`, { ativa: !barbearia.ativa });
      setMessageTone("ok");
      setMessage(!barbearia.ativa ? "Sistema liberado para a barbearia." : "Sistema bloqueado para a barbearia.");
      await loadBase();
    } catch (error: any) {
      setMessageTone("error");
      setMessage(readApiError(error));
    }
  }

  const [title, subtitle] = moduleCopy[moduleKey];

  function focusNewRecord() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      const firstField = formRef.current?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea");
      firstField?.focus();
    }, 250);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#191512]">{title}</h1>
          <p className="text-sm text-zinc-600">{subtitle}</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-[#191512] px-3 py-2 text-sm font-bold text-white hover:bg-[#8b1e24]" onClick={focusNewRecord} type="button">
          <CalendarPlus size={17} />
          Novo registro
        </button>
      </div>

      {moduleKey === "barbearias" ? (
        <BarbeariasCadastro
          barbearias={barbearias}
          fields={fields}
          formRef={formRef}
          isSuperAdmin={isSuperAdmin}
          message={message}
          messageTone={messageTone}
          onToggle={toggleBarbearia}
          submit={submit}
        />
      ) : moduleKey === "clientes" ? (
        <ClientesCadastro
          fields={fields}
          formRef={formRef}
          message={message}
          messageTone={messageTone}
          rows={rows}
          submit={submit}
        />
      ) : (
      <div className="grid gap-5 lg:grid-cols-[430px_1fr]">
        <form className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" onSubmit={submit} ref={formRef}>
          <h2 className="mb-1 text-lg font-black text-[#191512]">Cadastro profissional</h2>
          <p className="mb-4 text-sm text-zinc-500">Preencha os dados principais e acompanhe os registros ao lado.</p>
          <div className="grid gap-3">
            {fields.map((field) => (
              <FieldInput field={field} key={field.name} />
            ))}
          </div>
          <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#8b1e24] px-4 py-3 text-sm font-bold text-white">
            <Save size={17} />
            Salvar
          </button>
          {message && (
            <p
              className={`mt-3 rounded-md px-3 py-2 text-sm font-medium ${
                messageTone === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}
            >
              {message}
            </p>
          )}
        </form>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <GenericTable rows={rows} moduleKey={moduleKey} />
        </section>
      </div>
      )}
    </div>
  );
}

function BarbeariasCadastro({
  barbearias,
  fields,
  formRef,
  isSuperAdmin,
  message,
  messageTone,
  onToggle,
  submit,
}: {
  barbearias: BarbeariaData[];
  fields: Field[];
  formRef: { current: HTMLFormElement | null };
  isSuperAdmin: boolean;
  message: string;
  messageTone: "ok" | "error";
  onToggle: (barbearia: BarbeariaData) => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const byName = (name: string) => fields.find((field) => field.name === name);
  const renderField = (name: string) => {
    const field = byName(name);
    return field ? <FieldInput field={field} key={field.name} /> : null;
  };

  return (
    <div className="space-y-5">
      <form className="rounded-lg border border-zinc-200 bg-white shadow-sm" onSubmit={submit} ref={formRef}>
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-black text-[#191512]">Ficha da empresa</h2>
          <p className="mt-1 text-sm text-zinc-500">Cadastre a unidade, plano, dados comerciais e acesso inicial do responsavel.</p>
        </div>

        <div className="grid gap-6 p-5">
          <section>
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-[#8b1e24]">Dados da unidade</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {renderField("nome")}
              {renderField("documento")}
              {renderField("whatsapp")}
              {renderField("matriz")}
              <div className="md:col-span-2">{renderField("endereco")}</div>
            </div>
          </section>

          {isSuperAdmin && (
            <section>
              <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-[#8b1e24]">Plano e situacao</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {renderField("plano")}
                {renderField("ativa")}
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-[#8b1e24]">Responsavel da barbearia</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {renderField("nome_admin")}
              {renderField("email_admin")}
              {renderField("username_admin")}
              {renderField("senha_admin")}
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-[#fbfaf7] px-5 py-4">
          <p className="text-sm text-zinc-500">Use este cadastro como ficha principal da empresa/unidade.</p>
          <button className="inline-flex items-center justify-center gap-2 rounded-md bg-[#8b1e24] px-5 py-3 text-sm font-bold text-white">
            <Save size={17} />
            Salvar barbearia
          </button>
        </div>

        {message && (
          <div className="px-5 pb-5">
            <p
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                messageTone === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}
            >
              {message}
            </p>
          </div>
        )}
      </form>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-[#191512]">Empresas cadastradas</h2>
            <p className="text-sm text-zinc-500">Resumo operacional das matrizes e filiais registradas.</p>
          </div>
          <span className="rounded-full bg-[#f0dfbc] px-3 py-1 text-xs font-bold text-[#5a3e18]">{barbearias.length} unidade(s)</span>
        </div>

        <div className="overflow-hidden rounded-md border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Empresa</th>
                <th className="px-4 py-3 font-semibold">Plano</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">WhatsApp</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                {isSuperAdmin && <th className="px-4 py-3 font-semibold">Acao</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {barbearias.length ? (
                barbearias.map((barbearia) => (
                  <tr className="text-zinc-700" key={barbearia.id}>
                    <td className="px-4 py-3 font-semibold text-zinc-950">{barbearia.nome}</td>
                    <td className="px-4 py-3">{barbearia.plano_nome}</td>
                    <td className="px-4 py-3">{barbearia.matriz_nome ? `Filial de ${barbearia.matriz_nome}` : "Matriz"}</td>
                    <td className="px-4 py-3">{barbearia.whatsapp || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          barbearia.ativa ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}
                      >
                        {barbearia.ativa ? "Liberada" : "Bloqueada"}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3">
                        <button
                          className={`rounded-md px-3 py-2 text-xs font-bold ${
                            barbearia.ativa ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                          }`}
                          onClick={() => onToggle(barbearia)}
                          type="button"
                        >
                          {barbearia.ativa ? "Bloquear" : "Liberar"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-center text-zinc-500" colSpan={isSuperAdmin ? 6 : 5}>
                    Nenhuma barbearia cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ClientesCadastro({
  fields,
  formRef,
  message,
  messageTone,
  rows,
  submit,
}: {
  fields: Field[];
  formRef: { current: HTMLFormElement | null };
  message: string;
  messageTone: "ok" | "error";
  rows: any[];
  submit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const byName = (name: string) => fields.find((field) => field.name === name);
  const renderField = (name: string) => {
    const field = byName(name);
    return field ? <FieldInput field={field} key={field.name} /> : null;
  };

  return (
    <div className="space-y-5">
      <form className="rounded-lg border border-zinc-200 bg-white shadow-sm" onSubmit={submit} ref={formRef}>
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-black text-[#191512]">Cadastro de cliente</h2>
          <p className="mt-1 text-sm text-zinc-500">Crie o perfil do cliente e, se desejar, entregue usuario e senha para acesso ao portal.</p>
        </div>

        <div className="grid gap-6 p-5">
          <section>
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-[#8b1e24]">Dados pessoais</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {renderField("barbearia")}
              {renderField("nome")}
              {renderField("whatsapp")}
              {renderField("email")}
              <div className="md:col-span-2">{renderField("endereco")}</div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-[#8b1e24]">Acesso do cliente</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {renderField("username")}
              {renderField("password")}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-[#8b1e24]">Observacoes</h3>
            {renderField("observacoes")}
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-[#fbfaf7] px-5 py-4">
          <p className="text-sm text-zinc-500">Campos de acesso podem ficar vazios se o cliente ainda nao usar o portal.</p>
          <button className="inline-flex items-center justify-center gap-2 rounded-md bg-[#8b1e24] px-5 py-3 text-sm font-bold text-white">
            <Save size={17} />
            Salvar cliente
          </button>
        </div>

        {message && (
          <div className="px-5 pb-5">
            <p
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                messageTone === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}
            >
              {message}
            </p>
          </div>
        )}
      </form>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-[#191512]">Clientes cadastrados</h2>
            <p className="text-sm text-zinc-500">Acompanhe quem ja possui cadastro e acesso vinculado.</p>
          </div>
          <span className="rounded-full bg-[#f0dfbc] px-3 py-1 text-xs font-bold text-[#5a3e18]">{rows.length} cliente(s)</span>
        </div>

        <div className="overflow-hidden rounded-md border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">WhatsApp</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Total gasto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.length ? (
                rows.map((cliente) => (
                  <tr className="text-zinc-700" key={cliente.id}>
                    <td className="px-4 py-3 font-semibold text-zinc-950">{cliente.nome}</td>
                    <td className="px-4 py-3">{cliente.whatsapp || "-"}</td>
                    <td className="px-4 py-3">{cliente.email || "-"}</td>
                    <td className="px-4 py-3">{currency.format(Number(cliente.total_gasto ?? 0))}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-center text-zinc-500" colSpan={4}>
                    Nenhum cliente cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function buildFields(
  moduleKey: ModuleKey,
  data: {
    barbearias: BarbeariaData[];
    planos: PlanoData[];
    clientes: ClienteData[];
    usuarios: UserData[];
    servicos: ServicoData[];
    cadeiras: CadeiraData[];
  },
  isSuperAdmin: boolean,
): Field[] {
  const barbeariaOptions = data.barbearias.map((item) => ({ value: String(item.id), label: `${item.nome} - ${item.plano_nome}` }));
  const matrizOptions = [{ value: "", label: "Sem matriz" }, ...data.barbearias.map((item) => ({ value: String(item.id), label: item.nome }))];
  const planoOptions = data.planos.map((item) => ({ value: String(item.id), label: `${item.nome} - ${currency.format(Number(item.preco_mensal))}` }));
  const clienteOptions = data.clientes.map((item) => ({ value: String(item.id), label: item.nome }));
  const barbeiroOptions = data.usuarios
    .filter((item) => ["DONO", "GERENTE", "BARBEIRO", "ATENDENTE"].includes(item.papel))
    .map((item) => ({ value: String(item.id), label: item.nome_completo || item.first_name || item.username }));
  const servicoOptions = data.servicos.map((item) => ({ value: String(item.id), label: `${item.nome} - ${currency.format(Number(item.valor))}` }));
  const cadeiraOptions = [{ value: "", label: "Sem cadeira" }, ...data.cadeiras.map((item) => ({ value: String(item.id), label: item.identificador }))];

  if (moduleKey === "barbearias") {
    const baseFields: Field[] = [
      { name: "nome", label: "Nome da barbearia", type: "text", required: true },
      { name: "documento", label: "Documento", type: "text" },
      { name: "whatsapp", label: "WhatsApp", type: "text" },
      { name: "endereco", label: "Endereco", type: "textarea" },
      { name: "matriz", label: "Matriz", type: "select", options: matrizOptions },
    ];
    if (isSuperAdmin) {
      baseFields.splice(4, 0, { name: "plano", label: "Plano", type: "select", required: true, options: planoOptions });
      baseFields.push(
      {
        name: "ativa",
        label: "Acesso ao sistema",
        type: "select",
        required: true,
        options: [
          { value: "true", label: "Liberado" },
          { value: "false", label: "Bloqueado" },
        ],
      },
      );
    }
    baseFields.push(
      { name: "nome_admin", label: "Nome do responsavel", type: "text", required: isSuperAdmin },
      { name: "email_admin", label: "Email do responsavel", type: "email", required: isSuperAdmin },
      { name: "username_admin", label: "Usuario de acesso", type: "text", required: isSuperAdmin },
      { name: "senha_admin", label: "Senha inicial", type: "password", required: isSuperAdmin },
    );
    return baseFields;
  }
  if (moduleKey === "clientes") {
    return [
      { name: "barbearia", label: "Barbearia", type: "select", required: true, options: barbeariaOptions },
      { name: "nome", label: "Nome completo", type: "text", required: true },
      { name: "whatsapp", label: "WhatsApp", type: "text", required: true },
      { name: "email", label: "Email", type: "email" },
      { name: "endereco", label: "Endereco", type: "textarea" },
      { name: "username", label: "Usuario do cliente", type: "text" },
      { name: "password", label: "Senha inicial", type: "password" },
      { name: "observacoes", label: "Observacoes", type: "textarea" },
    ];
  }
  if (moduleKey === "agenda") {
    return [
      { name: "barbearia", label: "Barbearia", type: "select", required: true, options: barbeariaOptions },
      { name: "cliente", label: "Cliente", type: "select", required: true, options: clienteOptions },
      { name: "barbeiro", label: "Barbeiro", type: "select", required: true, options: barbeiroOptions },
      { name: "cadeira", label: "Cadeira", type: "select", options: cadeiraOptions },
      { name: "servicos", label: "Servico", type: "select", required: true, options: servicoOptions },
      { name: "inicio", label: "Inicio", type: "datetime-local", required: true },
      { name: "fim", label: "Fim", type: "datetime-local", required: true },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "AGENDADO", label: "Agendado" },
          { value: "CONCLUIDO", label: "Concluido" },
          { value: "CANCELADO", label: "Cancelado" },
        ],
      },
      { name: "valor_total", label: "Valor total", type: "number", required: true },
    ];
  }
  if (moduleKey === "servicos") {
    return [
      { name: "barbearia", label: "Barbearia", type: "select", required: true, options: barbeariaOptions },
      { name: "nome", label: "Nome do servico", type: "text", required: true },
      { name: "descricao", label: "Descricao", type: "textarea" },
      { name: "valor", label: "Valor", type: "number", required: true },
      { name: "duracao_minutos", label: "Duracao em minutos", type: "number", required: true },
    ];
  }
  if (moduleKey === "cadeiras") {
    return [
      { name: "barbearia", label: "Barbearia", type: "select", required: true, options: barbeariaOptions },
      { name: "identificador", label: "Identificador", type: "text", required: true },
      {
        name: "alugada",
        label: "Ocupacao",
        type: "select",
        options: [
          { value: "false", label: "Livre" },
          { value: "true", label: "Alugada" },
        ],
      },
      {
        name: "modelo_cobranca",
        label: "Modelo de cobranca",
        type: "select",
        required: true,
        options: [
          { value: "FIXO", label: "Aluguel fixo" },
          { value: "COMISSAO", label: "Comissao" },
          { value: "MISTO", label: "Aluguel e comissao" },
        ],
      },
      { name: "valor_aluguel", label: "Valor aluguel", type: "number" },
      { name: "percentual_comissao", label: "Comissao %", type: "number" },
      { name: "barbeiro_atual", label: "Barbeiro atual", type: "select", options: [{ value: "", label: "Sem barbeiro" }, ...barbeiroOptions] },
    ];
  }
  return [
    { name: "agendamento", label: "Agendamento", type: "number", required: true },
    {
      name: "forma",
      label: "Forma",
      type: "select",
      required: true,
      options: [
        { value: "DINHEIRO", label: "Dinheiro" },
        { value: "CREDITO", label: "Cartao de credito" },
        { value: "DEBITO", label: "Cartao de debito" },
        { value: "PIX", label: "PIX" },
      ],
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { value: "PENDENTE", label: "Pendente" },
        { value: "APROVADO", label: "Aprovado" },
        { value: "RECUSADO", label: "Recusado" },
        { value: "ESTORNADO", label: "Estornado" },
      ],
    },
    { name: "valor", label: "Valor", type: "number", required: true },
    { name: "referencia_externa", label: "Referencia", type: "text" },
  ];
}

function FieldInput({ field }: { field: Field }) {
  const className = "w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8b1e24] focus:ring-2 focus:ring-[#8b1e24]/10";

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase text-zinc-500">{field.label}</span>
      {field.type === "select" ? (
        <select className={className} name={field.name} required={field.required}>
          {field.options?.map((option) => (
            <option key={`${field.name}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea className={className} name={field.name} placeholder={field.placeholder} required={field.required} rows={3} />
      ) : (
        <input className={className} name={field.name} placeholder={field.placeholder} required={field.required} step="0.01" type={field.type} />
      )}
    </label>
  );
}

function BarbeariasTable({
  barbearias,
  isSuperAdmin,
  onToggle,
}: {
  barbearias: BarbeariaData[];
  isSuperAdmin: boolean;
  onToggle: (barbearia: BarbeariaData) => void;
}) {
  return (
    <div>
      <h2 className="mb-4 text-base font-black text-[#191512]">{isSuperAdmin ? "Controle das unidades" : "Minhas unidades"}</h2>
      <div className="grid gap-3">
        {barbearias.map((barbearia) => (
          <div className="rounded-md border border-zinc-200 bg-[#fbfaf7] p-3" key={barbearia.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-zinc-950">{barbearia.nome}</p>
                <p className="text-sm text-zinc-500">
                  {barbearia.plano_nome} {barbearia.matriz_nome ? `- filial de ${barbearia.matriz_nome}` : "- matriz"}
                </p>
              </div>
              {isSuperAdmin && (
                <button
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-bold ${
                    barbearia.ativa ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                  }`}
                  onClick={() => onToggle(barbearia)}
                  type="button"
                >
                  {barbearia.ativa ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                  {barbearia.ativa ? "Bloquear" : "Liberar"}
                </button>
              )}
            </div>
            {isSuperAdmin && !barbearia.ativa && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                <ShieldAlert size={15} />
                Acesso bloqueado ate regularizar pagamento.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function GenericTable({ rows, moduleKey }: { rows: any[]; moduleKey: ModuleKey }) {
  const preview = rows.slice(0, 8);
  return (
    <div>
      <h2 className="mb-4 text-base font-black text-[#191512]">Ultimos registros</h2>
      <div className="grid gap-3">
        {preview.length ? (
          preview.map((row) => (
            <div className="rounded-md border border-zinc-200 bg-[#fbfaf7] p-3" key={`${moduleKey}-${row.id}`}>
              <p className="font-bold text-zinc-950">{row.nome || row.identificador || row.cliente_nome || `Registro #${row.id}`}</p>
              <p className="text-sm text-zinc-500">{describeRow(row, moduleKey)}</p>
            </div>
          ))
        ) : (
          <div className="rounded-md border border-dashed border-zinc-300 p-5 text-sm text-zinc-500">Nenhum registro ainda.</div>
        )}
      </div>
    </div>
  );
}

function describeRow(row: any, moduleKey: ModuleKey) {
  if (moduleKey === "clientes") return `${row.whatsapp || "Sem WhatsApp"} - total ${currency.format(Number(row.total_gasto ?? 0))}`;
  if (moduleKey === "servicos") return `${currency.format(Number(row.valor ?? 0))} - ${row.duracao_minutos ?? 0} min`;
  if (moduleKey === "cadeiras") return row.alugada ? "Alugada" : "Livre";
  if (moduleKey === "agenda") {
    const data = row.inicio ? new Date(row.inicio).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "Sem data";
    return `${row.cliente_nome ?? "Cliente"} - ${data} - ${(row.servicos_nomes ?? []).join(", ") || "Servico"} - ${row.barbeiro_nome || "Profissional"}`;
  }
  if (moduleKey === "pagamentos") return `${row.forma ?? "Forma"} - ${row.status ?? "Status"} - ${currency.format(Number(row.valor ?? 0))}`;
  return `Registro #${row.id}`;
}

function readApiError(error: any) {
  const data = error.response?.data;
  if (!data) return "Nao foi possivel salvar. Confira a conexao com a API.";
  if (typeof data === "string") return data;
  if (data.detail) return String(data.detail);
  const firstKey = Object.keys(data)[0];
  if (!firstKey) return "Nao foi possivel salvar. Confira campos obrigatorios e permissoes.";
  const value = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
  return `${firstKey}: ${value}`;
}
