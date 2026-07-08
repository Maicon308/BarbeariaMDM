import { CalendarCheck, Clock, FileText, MapPin, ReceiptText, RefreshCcw, Search, Scissors, UserRoundCheck, XCircle } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import api from "../services/api";
import type { ServicoData, UserData } from "../types";

type Slot = {
  inicio: string;
  fim: string;
  livre: boolean;
  servico: number;
  servico_nome: string;
  valor: string | number;
};

type Appointment = {
  id: number;
  inicio: string;
  fim: string;
  status: string;
  valor_total: string | number;
  barbearia_nome?: string;
  servicos_nomes?: string[];
  barbeiro_nome?: string;
};

type Receipt = {
  agendamento: number;
  texto: string;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const tabs = [
  { key: "reservar", label: "Reservar", icon: <CalendarCheck size={17} /> },
  { key: "servicos", label: "Meus servicos", icon: <Scissors size={17} /> },
  { key: "cupom", label: "Cupom", icon: <ReceiptText size={17} /> },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function CustomerPortal() {
  const [activeTab, setActiveTab] = useState<TabKey>("reservar");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [message, setMessage] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selection, setSelection] = useState({ servico: "", barbeiro: "" });
  const [servicos, setServicos] = useState<ServicoData[]>([]);
  const [barbeiros, setBarbeiros] = useState<UserData[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  async function loadData() {
    const [servicosResponse, usuariosResponse, appointmentsResponse] = await Promise.all([
      api.get<ServicoData[]>("/servicos/"),
      api.get<UserData[]>("/usuarios/"),
      api.get<Appointment[]>("/agendamentos/"),
    ]);
    setServicos(servicosResponse.data.filter((servico) => servico.ativo));
    setBarbeiros(usuariosResponse.data.filter((usuario) => ["DONO", "GERENTE", "BARBEIRO", "ATENDENTE"].includes(usuario.papel)));
    setAppointments(appointmentsResponse.data);
    setSelectedAppointment((current) => current ?? appointmentsResponse.data[0] ?? null);
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!selectedAppointment) {
      setReceipt(null);
      return;
    }
    void api
      .get<Receipt>(`/agendamentos/${selectedAppointment.id}/cupom-termico/`)
      .then((response) => setReceipt(response.data))
      .catch(() => setReceipt(null));
  }, [selectedAppointment]);

  const nextAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === "AGENDADO"),
    [appointments],
  );

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("");
    setSelectedSlot(null);
    try {
      const { data } = await api.get<Slot[]>("/agendamentos/horarios-livres/", {
        params: {
          data: form.get("data"),
          servico: form.get("servico"),
          barbeiro: form.get("barbeiro") || undefined,
        },
      });
      setSelection({ servico: String(form.get("servico") ?? ""), barbeiro: String(form.get("barbeiro") ?? "") });
      setSlots(data);
      if (!data.length) {
        setMessage("Nao ha horarios livres para essa combinacao. Escolha outra data ou barbeiro.");
      }
    } catch (error: any) {
      setMessage(error.response?.data?.detail ?? "Nao foi possivel buscar horarios.");
    }
  }

  async function reserve() {
    if (!selectedSlot) return;
    if (!selection.barbeiro) {
      setMessage("Escolha um barbeiro para reservar.");
      return;
    }
    try {
      const payload = {
        barbeiro: Number(selection.barbeiro),
        inicio: selectedSlot.inicio,
        fim: selectedSlot.fim,
        valor_total: Number(selectedSlot.valor),
        servicos: [Number(selection.servico)],
      };
      if (rescheduling) {
        await api.post(`/agendamentos/${rescheduling.id}/reagendar/`, payload);
      } else {
        await api.post("/agendamentos/reservar/", payload);
      }
      setMessage(rescheduling ? "Horario reagendado com sucesso." : "Horario reservado com sucesso.");
      setSlots((current) => current.filter((slot) => slot.inicio !== selectedSlot.inicio));
      setSelectedSlot(null);
      setRescheduling(null);
      await loadData();
      setActiveTab("servicos");
    } catch (error: any) {
      const data = error.response?.data;
      const detail = data?.detail ?? data?.non_field_errors?.[0] ?? "Nao foi possivel reservar. Atualize os horarios e tente novamente.";
      setMessage(String(detail));
    }
  }

  async function cancelAppointment(appointment: Appointment) {
    try {
      await api.post(`/agendamentos/${appointment.id}/cancelar/`);
      setMessage("Reserva cancelada com sucesso.");
      await loadData();
    } catch (error: any) {
      const data = error.response?.data;
      setMessage(String(data?.detail ?? data?.[0] ?? "Nao foi possivel cancelar esta reserva."));
    }
  }

  function startReschedule(appointment: Appointment) {
    setRescheduling(appointment);
    setSelectedSlot(null);
    setSlots([]);
    setMessage("Escolha uma nova data e horario. Reagendamento permitido ate 30 minutos antes.");
    setActiveTab("reservar");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="overflow-hidden rounded-lg bg-[#191512] text-white">
        <div className="relative p-5 sm:p-6">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.10)_0_12px,transparent_12px_24px)] opacity-30" />
          <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-[#f0c76a]">
                <UserRoundCheck size={16} />
                Portal do cliente
              </p>
              <h1 className="mt-3 text-3xl font-black">Reservas, historico e comprovantes.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                Acompanhe seus atendimentos por unidade, profissional, servico e valor.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MiniMetric label="Reservas" value={String(nextAppointments.length)} />
              <MiniMetric label="Historico" value={String(appointments.length)} />
              <MiniMetric label="Servicos" value={String(servicos.length)} />
            </div>
          </div>
        </div>
      </section>

      <nav className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold ${
              activeTab === tab.key ? "bg-[#8b1e24] text-white" : "border border-zinc-200 bg-white text-zinc-700"
            }`}
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            type="button"
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "reservar" && (
        <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
          <form className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" onSubmit={search}>
            <div className="mb-4 flex items-center gap-2 font-black text-[#191512]">
              <Scissors className="text-[#8b1e24]" size={19} />
              {rescheduling ? "Reagendar reserva" : "Nova reserva"}
            </div>
            {rescheduling && (
              <div className="mb-3 rounded-md border border-[#f0dfbc] bg-[#fff8e8] px-3 py-2 text-sm font-medium text-[#5a3e18]">
                Reagendando #{rescheduling.id}. Escolha novo servico, profissional e horario.
              </div>
            )}
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-bold uppercase text-zinc-500">Data</span>
              <input className={inputClass} name="data" type="date" required />
            </label>
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-bold uppercase text-zinc-500">Servico</span>
              <select className={inputClass} name="servico" required>
                {servicos.map((servico) => (
                  <option key={servico.id} value={servico.id}>
                    {servico.nome} - {currency.format(Number(servico.valor))}
                  </option>
                ))}
              </select>
            </label>
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-bold uppercase text-zinc-500">Profissional</span>
              <select className={inputClass} name="barbeiro" required>
                {barbeiros.map((barbeiro) => (
                  <option key={barbeiro.id} value={barbeiro.id}>
                    {barbeiro.nome_completo || barbeiro.first_name || barbeiro.username}
                  </option>
                ))}
              </select>
            </label>
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#8b1e24] px-4 py-3 text-sm font-bold text-white">
              <Search size={17} />
              Ver horarios livres
            </button>
            {message && <p className="mt-3 rounded-md bg-[#f0dfbc] px-3 py-2 text-sm font-medium text-[#5a3e18]">{message}</p>}
          </form>

          <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-black text-[#191512]">
              <Clock size={18} className="text-[#8b1e24]" />
              Horarios livres
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {slots.map((slot) => (
                <button
                  className={`rounded-md border px-3 py-3 text-left text-sm ${
                    selectedSlot?.inicio === slot.inicio
                      ? "border-[#8b1e24] bg-[#fff4f1] text-[#8b1e24]"
                      : "border-zinc-200 bg-white hover:border-[#8b1e24]"
                  }`}
                  key={slot.inicio}
                  onClick={() => setSelectedSlot(slot)}
                  type="button"
                >
                  <p className="font-bold">{new Date(slot.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                  <p>Livre</p>
                  <p className="text-xs">{currency.format(Number(slot.valor))}</p>
                </button>
              ))}
            </div>
            {!slots.length && <p className="rounded-md border border-dashed border-zinc-300 p-5 text-sm text-zinc-500">Busque uma data para ver os horarios livres.</p>}
            <button
              className="mt-4 rounded-md bg-[#191512] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
              disabled={!selectedSlot}
              onClick={reserve}
            >
              {rescheduling ? "Confirmar reagendamento" : "Confirmar reserva"}
            </button>
            {rescheduling && (
              <button
                className="ml-2 mt-4 rounded-md border border-zinc-300 px-4 py-3 text-sm font-bold text-zinc-700"
                onClick={() => {
                  setRescheduling(null);
                  setSelectedSlot(null);
                  setMessage("");
                }}
                type="button"
              >
                Cancelar reagendamento
              </button>
            )}
          </section>
        </div>
      )}

      {activeTab !== "reservar" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-black text-[#191512]">
              <FileText size={18} className="text-[#8b1e24]" />
              Meus servicos
            </h2>
            <div className="grid gap-3">
              {appointments.map((appointment) => (
                <button
                  className={`rounded-md border p-4 text-left transition ${
                    selectedAppointment?.id === appointment.id ? "border-[#8b1e24] bg-[#fff4f1]" : "border-zinc-200 bg-[#fbfaf7] hover:border-[#8b1e24]"
                  }`}
                  key={appointment.id}
                  onClick={() => {
                    setSelectedAppointment(appointment);
                    setActiveTab("cupom");
                  }}
                  type="button"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-zinc-950">{(appointment.servicos_nomes ?? []).join(", ") || "Servico"}</p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-zinc-600">
                        <MapPin size={15} />
                        {appointment.barbearia_nome ?? "Barbearia"}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#f0dfbc] px-2.5 py-1 text-xs font-bold text-[#5a3e18]">{appointment.status}</span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-zinc-600 sm:grid-cols-3">
                    <p>Data: {new Date(appointment.inicio).toLocaleDateString("pt-BR")}</p>
                    <p>Hora: {new Date(appointment.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                    <p>Profissional: {appointment.barbeiro_nome || "Equipe"}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="font-bold text-[#8b1e24]">{currency.format(Number(appointment.valor_total ?? 0))}</p>
                    {canChangeAppointment(appointment) && (
                      <span className="flex gap-2" onClick={(event) => event.stopPropagation()}>
                        <button
                          className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-700"
                          onClick={() => startReschedule(appointment)}
                          type="button"
                        >
                          <RefreshCcw size={14} />
                          Reagendar
                        </button>
                        <button
                          className="inline-flex items-center gap-1 rounded-md bg-red-50 px-3 py-2 text-xs font-bold text-red-700"
                          onClick={() => cancelAppointment(appointment)}
                          type="button"
                        >
                          <XCircle size={14} />
                          Cancelar
                        </button>
                      </span>
                    )}
                  </div>
                </button>
              ))}
              {!appointments.length && <p className="rounded-md border border-dashed border-zinc-300 p-5 text-sm text-zinc-500">Voce ainda nao possui servicos cadastrados.</p>}
            </div>
          </section>

          <ReceiptPanel receipt={receipt} appointment={selectedAppointment} />
        </div>
      )}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/15 bg-white/10 px-3 py-2 text-right">
      <p className="text-xs text-white/55">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}

function ReceiptPanel({ receipt, appointment }: { receipt: Receipt | null; appointment: Appointment | null }) {
  return (
    <aside className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 font-black text-[#191512]">
        <ReceiptText size={18} className="text-[#8b1e24]" />
        Cupom termico
      </h2>
      {appointment ? (
        <div className="rounded-md border border-zinc-200 bg-[#f8f5ef] p-4">
          <pre className="whitespace-pre-wrap font-mono text-[12px] leading-5 text-zinc-800">
            {receipt?.texto ?? "Cupom indisponivel para este atendimento."}
          </pre>
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-zinc-300 p-5 text-sm text-zinc-500">Selecione um servico para abrir o cupom.</p>
      )}
    </aside>
  );
}

function canChangeAppointment(appointment: Appointment) {
  if (appointment.status !== "AGENDADO") return false;
  return new Date(appointment.inicio).getTime() - Date.now() > 30 * 60 * 1000;
}

const inputClass = "w-full rounded-md border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-[#8b1e24] focus:ring-2 focus:ring-[#8b1e24]/10";
