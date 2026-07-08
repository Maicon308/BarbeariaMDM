import { Search, Scissors } from "lucide-react";
import { FormEvent, useState } from "react";

import api from "../services/api";

type Slot = {
  inicio: string;
  fim: string;
  livre: boolean;
  servico: number;
  servico_nome: string;
  valor: string | number;
};

export default function CustomerPortal() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [message, setMessage] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selection, setSelection] = useState({ servico: "", barbeiro: "" });

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("");
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
    } catch {
      setMessage("Nao foi possivel buscar horarios. Verifique servico e data.");
    }
  }

  async function reserve() {
    if (!selectedSlot) return;
    if (!selection.barbeiro) {
      setMessage("Escolha um barbeiro para reservar.");
      return;
    }
    try {
      await api.post("/agendamentos/reservar/", {
        barbeiro: Number(selection.barbeiro),
        inicio: selectedSlot.inicio,
        fim: selectedSlot.fim,
        valor_total: Number(selectedSlot.valor),
        servicos: [Number(selection.servico)],
      });
      setMessage("Horario reservado com sucesso.");
    } catch {
      setMessage("Nao foi possivel reservar. O horario pode ter sido ocupado.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-black text-[#191512]">Area do cliente</h1>
        <p className="text-sm text-zinc-600">Cliente entra com a propria senha, ve horarios livres, escolhe corte e sabe o valor antes de reservar.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <form className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" onSubmit={search}>
          <div className="mb-4 flex items-center gap-2 font-semibold">
            <Scissors className="text-[#8b1e24]" size={19} />
            Escolher servico
          </div>
          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-semibold uppercase text-zinc-500">Data</span>
            <input className={inputClass} name="data" type="date" required />
          </label>
          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-semibold uppercase text-zinc-500">ID do servico</span>
            <input className={inputClass} name="servico" placeholder="Ex: 1" type="number" required />
          </label>
          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-semibold uppercase text-zinc-500">ID do barbeiro</span>
            <input className={inputClass} name="barbeiro" placeholder="Opcional" type="number" />
          </label>
          <button className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#8b1e24] px-4 py-3 text-sm font-semibold text-white">
            <Search size={17} />
            Ver horarios livres
          </button>
          {message && <p className="mt-3 rounded-md bg-[#f0dfbc] px-3 py-2 text-sm text-[#5a3e18]">{message}</p>}
        </form>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Horarios disponiveis</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {slots.map((slot) => (
              <button
                className={`rounded-md border px-3 py-3 text-left text-sm ${
                  !slot.livre
                    ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                    : selectedSlot?.inicio === slot.inicio
                      ? "border-[#8b1e24] bg-[#fff4f1] text-[#8b1e24]"
                      : "border-zinc-200 bg-white hover:border-[#8b1e24]"
                }`}
                disabled={!slot.livre}
                key={slot.inicio}
                onClick={() => setSelectedSlot(slot)}
                type="button"
              >
                <p className="font-semibold">
                  {new Date(slot.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p>{slot.livre ? "Livre" : "Ocupado"}</p>
                <p className="text-xs">{slot.servico_nome} - R$ {Number(slot.valor).toFixed(2)}</p>
              </button>
            ))}
          </div>
          <button
            className="mt-4 rounded-md bg-[#191512] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
            disabled={!selectedSlot}
            onClick={reserve}
          >
            Reservar horario selecionado
          </button>
        </section>
      </div>
    </div>
  );
}

const inputClass = "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-[#8b1e24]";
