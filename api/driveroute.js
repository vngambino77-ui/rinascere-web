import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  // 👉 toma el ID desde la URL (?folder=...)
  const folder = searchParams.get("folder");

  // 👉 si no viene, usa el general de Vercel
  const FOLDER_ID = folder || process.env.GOOGLE_FOLDER_ID;

  const API_KEY = process.env.GOOGLE_API_KEY;

  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents&key=${API_KEY}&fields=files(id,name,mimeType)`
    );

    const data = await res.json();

    const images = data.files
      .filter(file => file.mimeType.includes("image"))
      .map(file =>
        `https://drive.google.com/uc?export=view&id=${file.id}`
      );

    return NextResponse.json(images);

  } catch (error) {
    return NextResponse.json(
      { error: "Error cargando imágenes" },
      { status: 500 }
    );
  }
}