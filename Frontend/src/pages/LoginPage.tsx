import { KeyRound, Lock, Scissors } from "lucide-react";
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
    } catch {
      setMessage("Usuario ou senha invalidos.");
    }
  }

  return (
    <main className="min-h-screen bg-[#191512] text-white">
      <div className="grid min-h-screen lg:grid-cols-[1fr_460px]">
        <section className="relative flex flex-col justify-between overflow-hidden px-8 py-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#191512_0%,#2a1f1b_44%,#8b1e24_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,.08)_0_10px,transparent_10px_22px)]" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#c8a45d] text-[#191512]">
              <Scissors size={22} />
            </div>
            <div>
              <p className="text-xl font-bold">BarbeariaMDM</p>
              <p className="text-sm text-white/70">Painel de gestao da barbearia</p>
            </div>
          </div>
          <div className="relative z-10 max-w-2xl pb-10">
            <p className="mb-4 inline-flex rounded-full border border-white/20 px-3 py-1 text-sm text-white/80">
              Acesso restrito
            </p>
            <h1 className="text-5xl font-black leading-tight">
              Agenda, caixa, equipe e reservas em um painel elegante.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/75">
              Entre com seu usuario para acessar a administracao, a barbearia, a filial ou sua area de cliente.
            </p>
          </div>
        </section>

        <section className="flex items-center bg-[#f7f2ea] px-6 py-8 text-zinc-950">
          <div className="w-full rounded-lg border border-zinc-200 bg-white p-6 shadow-xl">
            <form className="space-y-4" onSubmit={submitLogin}>
              <div className="flex items-center gap-2 text-lg font-semibold">
                <KeyRound size={20} />
                Entrar no sistema
              </div>
              <Field label="Usuario" value={username} onChange={setUsername} />
              <Field label="Senha" value={password} onChange={setPassword} type="password" />
              <button className="flex w-full items-center justify-center gap-2 rounded-md bg-[#8b1e24] px-4 py-3 font-semibold text-white hover:bg-[#74181d]">
                <Lock size={18} />
                Acessar
              </button>
            </form>

            {message && <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

const inputClass = "w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8b1e24]";

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
