import { Building2, KeyRound, Lock, Scissors } from "lucide-react";
import { FormEvent, useState } from "react";

import api from "../services/api";

type Props = {
  onLogin: () => void;
};

export default function LoginPage({ onLogin }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
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

  async function submitSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      await api.post("/cadastro-barbearia/", {
        nome_barbearia: form.get("nome_barbearia"),
        documento: form.get("documento"),
        whatsapp: form.get("whatsapp"),
        endereco: form.get("endereco"),
        plano: Number(form.get("plano")),
        nome_admin: form.get("nome_admin"),
        email_admin: form.get("email_admin"),
        username_admin: form.get("username_admin"),
        senha_admin: form.get("senha_admin"),
      });
      setMode("login");
      setMessage("Barbearia cadastrada. Entre com o usuario criado.");
    } catch {
      setMessage("Nao foi possivel cadastrar. Confira os dados e o plano.");
    }
  }

  return (
    <main className="min-h-screen bg-[#191512] text-white">
      <div className="grid min-h-screen lg:grid-cols-[1fr_460px]">
        <section className="relative flex flex-col justify-between overflow-hidden px-8 py-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#191512_0%,#2a1f1b_42%,#8b1e24_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,.08)_0_12px,transparent_12px_24px)]" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#c8a45d] text-[#191512]">
              <Scissors size={22} />
            </div>
            <div>
              <p className="text-xl font-bold">BarbeariaMDM</p>
              <p className="text-sm text-white/70">SaaS multi-tenant profissional</p>
            </div>
          </div>
          <div className="relative z-10 max-w-2xl pb-10">
            <p className="mb-4 inline-flex rounded-full border border-white/20 px-3 py-1 text-sm text-white/80">
              Login obrigatorio por barbearia, filial e cliente
            </p>
            <h1 className="text-5xl font-black leading-tight">
              Controle agenda, caixa, filiais e clientes sem misturar dados.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/75">
              Cada usuario entra no tenant correto. Matriz VIP ve consolidado, filial trabalha isolada e cliente reserva horario livre.
            </p>
          </div>
        </section>

        <section className="flex items-center bg-[#f7f2ea] px-6 py-8 text-zinc-950">
          <div className="w-full rounded-lg border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="mb-5 grid grid-cols-2 rounded-md bg-zinc-100 p-1">
              <button className={tabClass(mode === "login")} onClick={() => setMode("login")} type="button">
                Entrar
              </button>
              <button className={tabClass(mode === "signup")} onClick={() => setMode("signup")} type="button">
                Cadastrar
              </button>
            </div>

            {mode === "login" ? (
              <form className="space-y-4" onSubmit={submitLogin}>
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <KeyRound size={20} />
                  Acesso ao sistema
                </div>
                <Field label="Usuario" value={username} onChange={setUsername} />
                <Field label="Senha" value={password} onChange={setPassword} type="password" />
                <button className="flex w-full items-center justify-center gap-2 rounded-md bg-[#8b1e24] px-4 py-3 font-semibold text-white hover:bg-[#74181d]">
                  <Lock size={18} />
                  Entrar com seguranca
                </button>
              </form>
            ) : (
              <form className="grid gap-3" onSubmit={submitSignup}>
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Building2 size={20} />
                  Nova barbearia
                </div>
                <input className={inputClass} name="nome_barbearia" placeholder="Nome da barbearia" required />
                <input className={inputClass} name="documento" placeholder="CNPJ/CPF" />
                <input className={inputClass} name="whatsapp" placeholder="WhatsApp" />
                <input className={inputClass} name="endereco" placeholder="Endereco" />
                <select className={inputClass} name="plano" defaultValue="1">
                  <option value="1">Basico</option>
                  <option value="2">Pro</option>
                  <option value="3">VIP</option>
                </select>
                <input className={inputClass} name="nome_admin" placeholder="Nome do responsavel" required />
                <input className={inputClass} name="email_admin" placeholder="Email do responsavel" type="email" required />
                <input className={inputClass} name="username_admin" placeholder="Usuario de acesso" required />
                <input className={inputClass} name="senha_admin" placeholder="Senha inicial" type="password" required />
                <button className="rounded-md bg-[#8b1e24] px-4 py-3 font-semibold text-white hover:bg-[#74181d]">
                  Criar barbearia
                </button>
              </form>
            )}

            {message && <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

const inputClass = "w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8b1e24]";

function tabClass(active: boolean) {
  return `rounded px-3 py-2 text-sm font-semibold ${active ? "bg-white text-[#8b1e24] shadow-sm" : "text-zinc-500"}`;
}

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

