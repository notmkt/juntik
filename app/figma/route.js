import { NextResponse } from 'next/server';

// juntik.com/figma → presentación del segundo parcial en Figma Slides.
// 307 (temporal) para poder cambiar el destino más adelante sin caché.
const PRESENTACION =
  'https://www.figma.com/deck/FHNimcc6qkdKxtdZoTXuKX/Juntik-%E2%80%94-Segundo-Parcial-presentaci%C3%B3n';

export function GET() {
  return NextResponse.redirect(PRESENTACION, 307);
}
