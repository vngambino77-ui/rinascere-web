"use client";
import { useEffect, useState } from "react";

export default function Galeria({ carpeta }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!carpeta) return;

    const fetchImages = async () => {
      try {
        const res = await fetch(`/api/imagenes?carpeta=${carpeta}`);
        const data = await res.json();

        setImages(data);
      } catch (error) {
        console.error("Error cargando imágenes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [carpeta]);

  if (loading) return <p>Cargando galería...</p>;
  if (!images.length) return <p>No hay imágenes</p>;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
      gap: "10px"
    }}>
      {images.map((img, i) => (
        <img
          key={i}
          src={img}
          alt="foto"
          style={{
            width: "100%",
            borderRadius: "10px"
          }}
        />
      ))}
    </div>
  );
}