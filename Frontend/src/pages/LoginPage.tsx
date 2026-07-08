import { ArrowRight, CalendarCheck, KeyRound, Lock, Scissors, ShieldCheck, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";

import api from "../services/api";

type Props = {
  onLogin: () => void;
};

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submitLogin(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      const { data } = await api.post("/auth/token/", { username, password });
      localStorage.setItem("barbearia_mdm_access_token", data.access);
      localStorage.setItem("barbearia_mdm_refresh_token", data.refresh);
      onLogin();
    } catch (error: any) {
      if (!error.response) {
        setMessage("Nao foi possivel conectar na API. Confira se o backend esta rodando.");
        return;
      }
      setMessage(error.response?.data?.detail ?? "Usuario ou senha invalidos.");
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#080605] text-white">
      <div className="grid min-h-screen lg:grid-cols-[1fr_480px]">
        <section className="relative flex min-h-[520px] flex-col justify-between overflow-hidden px-6 py-7 sm:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(228,185,91,.32),transparent_30%),linear-gradient(135deg,#080605_0%,#21120f_42%,#8e1825_100%)]" />
          <div className="absolute inset-y-0 right-0 w-1/3 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.14)_0_14px,transparent_14px_28px)] opacity-35" />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/70 to-transparent" />

          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#e5b85b] text-[#120b09] shadow-lg shadow-black/30">
                <Scissors size={23} />
              </div>
              <div>
                <p className="text-xl font-black tracking-normal">BarbeariaMDM</p>
                <p className="text-sm text-white/65">Gestao inteligente para barbearias</p>
              </div>
            </div>
            <span className="hidden rounded-md border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 sm:inline-flex">
              Operacao multi-unidade
            </span>
          </div>

          <div className="relative z-10 max-w-3xl pb-8">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold text-[#f2d28b]">
              <Sparkles size={15} />
              Plataforma completa para barbearias
            </p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-6xl">Gestao elegante para barbearias modernas.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/72 sm:text-lg">
              Rede, unidade e cliente conectados em uma rotina simples, organizada e profissional.
            </p>
            <div className="mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                ["Rede", "Matriz, filiais e planos"],
                ["Operacao", "Agenda, equipe e servicos"],
                ["Cliente", "Reservas e comprovantes"],
              ].map(([title, text]) => (
                <div className="rounded-md border border-white/15 bg-white/10 p-3 backdrop-blur" key={title}>
                  <p className="text-sm font-bold text-[#f2d28b]">{title}</p>
                  <p className="mt-1 text-xs text-white/68">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center bg-[#f6efe3] px-5 py-8 text-zinc-950">
          <div className="w-full rounded-lg border border-[#e4d6bf] bg-white p-6 shadow-2xl shadow-black/20">
            <form className="space-y-4" onSubmit={submitLogin}>
              <div>
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-md bg-[#8b1e24] text-white">
                  <KeyRound size={21} />
                </div>
                <h2 className="text-2xl font-black text-[#16100d]">Entrar no painel</h2>
                <p className="mt-1 text-sm text-zinc-500">Use seu usuario para acessar o perfil correto.</p>
              </div>
              <Field label="Usuario" value={username} onChange={setUsername} />
              <Field label="Senha" value={password} onChange={setPassword} type="password" />
              <button className="flex w-full items-center justify-center gap-2 rounded-md bg-[#8b1e24] px-4 py-3 font-bold text-white shadow-lg shadow-[#8b1e24]/20 hover:bg-[#74181d]">
                <Lock size={18} />
                Acessar
                <ArrowRight size={18} />
              </button>
            </form>

            {message && <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">{message}</p>}

            <div className="mt-5 grid gap-2 text-sm text-zinc-600">
              <p className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#8b1e24]" />
                Controle de acesso por plano, unidade e perfil.
              </p>
              <p className="flex items-center gap-2">
                <CalendarCheck size={16} className="text-[#8b1e24]" />
                Reservas, historico e comprovantes em um so lugar.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

const inputClass = "w-full rounded-md border border-zinc-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#8b1e24] focus:ring-2 focus:ring-[#8b1e24]/10";

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-600">{label}</span>
      <input className={inputClass} value={value} onChange={(event) => onChange(event.target.value)} type={type} required />
    </label>
  );
}
