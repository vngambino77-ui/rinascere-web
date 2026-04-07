"use client";
import { useEffect, useState } from "react";

export default function Album({ params }) {
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetch("/api/drive")
      .then(res => res.json())
      .then(data => setImages(data));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Álbum de {params.nombre}</h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        gap: "10px"
      }}>
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            style={{ width: "100%", borderRadius: "10px" }}
          />
        ))}
      </div>
    </div>
  );
}