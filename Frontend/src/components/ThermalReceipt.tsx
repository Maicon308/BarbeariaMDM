import { Printer } from "lucide-react";

import type { ReceiptData } from "../types";

type Props = {
  receipt: ReceiptData;
  width?: "58mm" | "80mm";
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function ThermalReceipt({ receipt, width = "80mm" }: Props) {
  return (
    <div className="space-y-3">
      <div
        id="thermal-receipt"
        style={{ width }}
        className="bg-white p-3 font-receipt text-[11px] leading-tight text-black shadow-sm"
      >
        <div className="text-center">
          <p className="text-sm font-bold uppercase">{receipt.barbearia}</p>
          <p>{receipt.whatsapp}</p>
          <p className="my-2 border-y border-dashed border-black py-1 font-bold">
            CUPOM NAO FISCAL
          </p>
        </div>

        <div className="space-y-1">
          <p>Cliente: {receipt.cliente}</p>
          <p>Barbeiro: {receipt.barbeiro}</p>
          <p>Data: {receipt.data}</p>
        </div>

        <div className="my-2 border-t border-dashed border-black pt-2">
          <p className="mb-1 font-bold">SERVICOS</p>
          {receipt.servicos.map((servico) => (
            <div className="flex justify-between gap-2" key={servico.nome}>
              <span className="break-words">{servico.nome}</span>
              <span>{currency.format(servico.valor)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black pt-2">
          <div className="flex justify-between font-bold">
            <span>TOTAL</span>
            <span>{currency.format(receipt.total)}</span>
          </div>
        </div>

        <div className="my-2 border-t border-dashed border-black pt-2">
          <p className="mb-1 font-bold">PAGAMENTO</p>
          {receipt.pagamentos.map((pagamento) => (
            <div className="flex justify-between gap-2" key={pagamento.forma}>
              <span>{pagamento.forma}</span>
              <span>{currency.format(pagamento.valor)}</span>
            </div>
          ))}
        </div>

        <p className="border-t border-dashed border-black pt-2 text-center">
          Obrigado pela preferencia!
        </p>
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        <Printer size={16} />
        Imprimir cupom
      </button>
    </div>
  );
}

