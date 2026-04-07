"use client";
import { useEffect, useState } from "react";

export default function Galeria() {
  const [images, setImages] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState([]);

  useEffect(() => {
    fetch("/api/drive")
      .then(res => res.json())
      .then(data => setImages(data));
  }, []);

  // ✅ Seleccionar fotos
  const toggleSeleccion = (img) => {
    if (seleccionadas.includes(img)) {
      setSeleccionadas(seleccionadas.filter(i => i !== img));
    } else {
      setSeleccionadas([...seleccionadas, img]);
    }
  };

  // 📸 Descargar una sola foto
  const descargarUna = (img) => {
    window.open(img, "_blank");
  };

  // 📦 Descargar todas las seleccionadas
  const descargarSeleccion = () => {
    seleccionadas.forEach((img, i) => {
      setTimeout(() => {
        window.open(img, "_blank");
      }, i * 500);
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      
      <h2>Seleccionadas: {seleccionadas.length}</h2>

      {/* 💳 BOTÓN DE PAGO */}
      <button
        onClick={() => window.open("https://mpago.la/TU_LINK")}
        style={{
          padding: "10px 20px",
          background: "#000",
          color: "#fff",
          border: "none",
          marginTop: "10px",
          cursor: "pointer"
        }}
      >
        Pagar y descargar
      </button>

      {/* 📦 DESCARGA DIRECTA (opcional, podés quitarla después) */}
      <button
        onClick={descargarSeleccion}
        style={{
          padding: "10px 20px",
          marginLeft: "10px",
          cursor: "pointer"
        }}
      >
        Descargar seleccionadas
      </button>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "10px",
        marginTop: "20px"
      }}>
        {images.map((img, i) => {
          const activa = seleccionadas.includes(img);

          return (
            <div
              key={i}
              style={{
                position: "relative",
                border: activa ? "3px solid #00ff99" : "none"
              }}
            >
              <img
                src={img}
                onClick={() => toggleSeleccion(img)}
                style={{
                  width: "100%",
                  cursor: "pointer",
                  userSelect: "none"
                }}
                onContextMenu={(e) => e.preventDefault()}
                draggable="false"
              />

              {/* ✔ Marca visual */}
              {activa && (
                <div style={{
                  position: "absolute",
                  top: "5px",
                  right: "5px",
                  background: "#00ff99",
                  color: "#000",
                  padding: "5px",
                  borderRadius: "50%"
                }}>
                  ✓
                </div>
              )}

              {/* ⬇ Descargar individual */}
              <button
                onClick={() => descargarUna(img)}
                style={{
                  position: "absolute",
                  bottom: "5px",
                  right: "5px",
                  background: "#000",
                  color: "#fff",
                  padding: "5px",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                ⬇
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}