import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const carpeta = searchParams.get("carpeta");

  const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;

  try {
    const res = await fetch(
      `https://res.cloudinary.com/${CLOUD_NAME}/image/list/${carpeta}.json`
    );

    const data = await res.json();

    const imagenes = data.resources.map(
      (img) => `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${img.public_id}.jpg`
    );

    return NextResponse.json(imagenes);
  } catch (error) {
    return NextResponse.json({ error: "Error cargando imágenes" }, { status: 500 });
  }
}