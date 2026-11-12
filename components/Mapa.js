'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import 'leaflet/dist/leaflet.css'
import BarraNav from '@/components/BarraNav'
import Chips from '@/components/Chips'
import Estrellas from '@/components/Estrellas'
import Portada from '@/components/Portada'
import { useCanchas, deportesDe, horarioDe, precio, distanciaKm, textoDistancia } from '@/lib/canchas'

const CENTRO = [-34.585, -58.435] // Buenos Aires (zona norte de CABA)
const ICONO = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

export default function Mapa() {
  const { canchas, error, cargar } = useCanchas()
  const [deporte, setDeporte] = useState('Todos')
  const [elegida, setElegida] = useState(null) // id de la cancha
  const [posicion, setPosicion] = useState(null) // { lat, lng } del usuario
  const [aviso, setAviso] = useState('')
  const [listo, setListo] = useState(false)
  const caja = useRef(null)
  const mapa = useRef(null)
  const leaflet = useRef(null)
  const capaPins = useRef(null)
  const puntoYo = useRef(null)
  const encuadrado = useRef(false)

  const visibles = useMemo(
    () => (canchas || []).filter((c) => deporte === 'Todos' || (c.deportes || []).includes(deporte)),
    [canchas, deporte]
  )
  const cancha = visibles.find((c) => c.id === elegida) || null

  // Crear el mapa (Leaflet solo funciona en el navegador)
  useEffect(() => {
    let cancelado = false
    import('leaflet').then((mod) => {
      if (cancelado || mapa.current) return
      const L = mod.default
      leaflet.current = L
      const m = L.map(caja.current, { zoomControl: false, attributionControl: true }).setView(CENTRO, 13)
      m.attributionControl.setPrefix(false)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(m)
      capaPins.current = L.layerGroup().addTo(m)
      m.on('click', () => setElegida(null))
      mapa.current = m
      setListo(true)
    })
    return () => {
      cancelado = true
      if (mapa.current) {
        mapa.current.remove()
        mapa.current = null
      }
    }
  }, [])

  // Pins de precio
  useEffect(() => {
    const L = leaflet.current
    if (!listo || !L) return
    capaPins.current.clearLayers()
    visibles.forEach((c) => {
      const activa = c.id === elegida
      const icono = L.divIcon({
        className: 'pin-caja',
        iconSize: [0, 0],
        html: `<span class="pin${activa ? ' activa' : ''}">${precio(c.precio_hora)}</span>`,
      })
      L.marker([c.lat, c.lng], { icon: icono, title: `${c.nombre}, ${precio(c.precio_hora)} por hora`, zIndexOffset: activa ? 1000 : 0 })
        .on('click', (e) => {
          L.DomEvent.stopPropagation(e)
          setElegida(c.id)
        })
        .on('keypress', (e) => {
          if (e.originalEvent.key === 'Enter') setElegida(c.id)
        })
        .addTo(capaPins.current)
    })
  }, [listo, visibles, elegida])

  // Encuadrar todas las canchas visibles (al cargar y al cambiar de deporte)
  useEffect(() => {
    const L = leaflet.current
    if (!listo || !L || visibles.length === 0) return
    const limites = L.latLngBounds(visibles.map((c) => [c.lat, c.lng]))
    mapa.current.fitBounds(limites, { paddingTopLeft: [40, 130], paddingBottomRight: [40, 90], maxZoom: 15, animate: encuadrado.current })
    encuadrado.current = true
  }, [listo, visibles.length, deporte]) // eslint-disable-line react-hooks/exhaustive-deps

  // Al elegir una cancha, mover el mapa si el pin queda tapado por la tarjeta
  useEffect(() => {
    if (!listo || !cancha) return
    mapa.current.panInside([cancha.lat, cancha.lng], { paddingTopLeft: [60, 140], paddingBottomRight: [60, 270] })
  }, [listo, cancha])

  // Si la cancha elegida deja de estar visible por el filtro, cerrar la tarjeta
  useEffect(() => {
    if (elegida && !cancha) setElegida(null)
  }, [elegida, cancha])

  // Punto azul del usuario
  useEffect(() => {
    const L = leaflet.current
    if (!listo || !L || !posicion) return
    if (puntoYo.current) puntoYo.current.remove()
    puntoYo.current = L.marker([posicion.lat, posicion.lng], {
      icon: L.divIcon({ className: 'pin-caja', iconSize: [0, 0], html: '<span class="yo"><span></span></span>' }),
      interactive: false,
      keyboard: false,
    }).addTo(mapa.current)
  }, [listo, posicion])

  function ubicar(centrar) {
    if (!navigator.geolocation) return setAviso('Tu navegador no permite usar la ubicación.')
    setAviso('')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const yo = { lat: p.coords.latitude, lng: p.coords.longitude }
        setPosicion(yo)
        if (centrar && mapa.current) mapa.current.setView([yo.lat, yo.lng], 14)
      },
      () => centrar && setAviso('No pudimos acceder a tu ubicación. Revisá los permisos del navegador.'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }

  // Si el permiso de ubicación ya fue dado antes, usarlo sin preguntar
  useEffect(() => {
    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((r) => r.state === 'granted' && ubicar(false))
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const cuenta =
    canchas === null ? 'Cargando canchas…'
    : error ? 'No pudimos cargar las canchas'
    : visibles.length === 0 ? 'No hay canchas de este deporte'
    : `${visibles.length} ${visibles.length === 1 ? 'cancha' : 'canchas'}${deporte === 'Todos' ? '' : ` de ${deporte.toLowerCase()}`}`

  return (
    <div className="mapa-pagina">
      <main className="mapa">
        <div ref={caja} className="mapa-lienzo" role="application" aria-label="Mapa de canchas en Buenos Aires" />

        <div className="mapa-arriba">
          <div className="mapa-barra">
            <Link href="/app/explorar" className="mapa-redondo" aria-label="Volver a Explorar">
              <svg width="20" height="20" {...ICONO} strokeWidth={2.4}><path d="m15 18-6-6 6-6" /></svg>
            </Link>
            <Chips deporte={deporte} onChange={setDeporte} className="mapa-chips" />
          </div>
          <span className="mapa-cuenta" role="status">
            {cuenta}
            {error && <button type="button" onClick={cargar}>Reintentar</button>}
          </span>
        </div>

        <div className="mapa-abajo">
          {aviso && <span className="mapa-aviso" role="alert">{aviso}</span>}
          <div className="mapa-botones">
            <Link href="/app/explorar" className="nav-mapa mapa-lista">
              Lista
              <svg width="18" height="18" {...ICONO}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
            </Link>
            <button type="button" className="mapa-redondo mapa-ubicar" onClick={() => ubicar(true)} aria-label="Usar mi ubicación">
              <svg width="20" height="20" {...ICONO}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="7" /></svg>
            </button>
          </div>

          {cancha && (
            <Link href={`/app/cancha/${cancha.id}`} className="mapa-tarjeta">
              <Portada cancha={cancha} className="mapa-foto" simbolo={96} />
              <span className="mapa-datos">
                <span className="mapa-nombre">{cancha.nombre}</span>
                <Estrellas nota={cancha.nota} total={cancha.total_resenas} size={13} />
                <span className="ex-sub">
                  {cancha.barrio}
                  {posicion && ` · ${textoDistancia(distanciaKm(posicion, cancha))}`}
                </span>
                <span className="ex-sub">{deportesDe(cancha)}</span>
                <span className="mapa-horario">
                  <svg width="14" height="14" {...ICONO}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                  {horarioDe(cancha)}
                </span>
                <span className="mapa-precio"><b>{precio(cancha.precio_hora)}</b> / hora</span>
              </span>
            </Link>
          )}
        </div>
      </main>
      <BarraNav activa="explorar" />
    </div>
  )
}
