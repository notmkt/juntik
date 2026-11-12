'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import { capaBase } from '@/lib/mapa'

// Mapa chico y fijo con un pin en la cancha
export default function MiniMapa({ lat, lng, nombre }) {
  const caja = useRef(null)
  useEffect(() => {
    let mapa
    let cancelado = false
    import('leaflet').then((mod) => {
      if (cancelado) return
      const L = mod.default
      mapa = L.map(caja.current, {
        zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
        touchZoom: false, boxZoom: false, keyboard: false,
      }).setView([lat, lng], 15)
      mapa.attributionControl.setPrefix(false)
      capaBase(L).addTo(mapa)
      L.marker([lat, lng], {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: 'pin-caja',
          iconSize: [0, 0],
          html: '<span class="pin-lugar"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></span>',
        }),
      }).addTo(mapa)
    })
    return () => {
      cancelado = true
      if (mapa) mapa.remove()
    }
  }, [lat, lng])
  return <div ref={caja} className="minimapa" role="img" aria-label={`Mapa con la ubicación de ${nombre}`} />
}
