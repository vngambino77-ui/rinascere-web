"use client";
import { useSearchParams } from "next/navigation";

export default function Descarga() {
  const params = useSearchParams();
  const ok = params.get("ok");

  if (!ok) {
    return <h2>Pago no confirmado</h2>;
  }

  return (
    <div style={{ textAlign: "center", padding: "40px" }}>
      <h2>✅ Pago recibido</h2>
      <p>Ya podés descargar tus fotos</p>

      <a href="LINK_DE_TU_CARPETA_ORIGINAL" target="_blank">
        <button>Descargar fotos</button>
      </a>
    </div>
  );
}