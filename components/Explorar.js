'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import BarraNav from '@/components/BarraNav'
import Chips from '@/components/Chips'
import Estrellas from '@/components/Estrellas'
import Portada from '@/components/Portada'
import { TarjetaPartido, PARTIDO_CAMPOS } from '@/components/Comunidad'
import { supabase } from '@/lib/supabase'
import { useCanchas, useUsuario, useNoLeidas, useFavoritos, deportesDe, precio, sinAcentos, fechaISO } from '@/lib/canchas'

const PREGUNTAS = ['¿A qué querés jugar?', '¿Dónde querés jugar?', '¿En qué cancha querés jugar?']

const ICONO = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

export default function Explorar() {
  const { canchas, error, cargar } = useCanchas()
  const [deporte, setDeporte] = useState('Todos')
  const [texto, setTexto] = useState('')
  const [favoritos, alternarFavorito] = useFavoritos()
  const noLeidas = useNoLeidas(useUsuario())
  const [pregunta, setPregunta] = useState(0)
  const [abiertos, setAbiertos] = useState([])

  // Partidos abiertos de los próximos días
  useEffect(() => {
    supabase.from('partidos').select(PARTIDO_CAMPOS).gte('fecha', fechaISO(new Date())).order('fecha').order('hora_inicio').limit(8)
      .then(({ data }) => setAbiertos(data || []))
  }, [])

  // La pregunta del buscador va rotando
  useEffect(() => {
    const t = setInterval(() => setPregunta((n) => (n + 1) % PREGUNTAS.length), 3000)
    return () => clearInterval(t)
  }, [])

  const busca = sinAcentos(texto.trim())
  const coincide = (deportes, ...campos) =>
    (deporte === 'Todos' || deportes.includes(deporte)) &&
    (!busca || sinAcentos([...campos, ...deportes].join(' ')).includes(busca))

  const partidos = useMemo(
    () => abiertos.filter((p) => coincide([p.deporte], p.canchas?.nombre, p.canchas?.barrio)),
    [abiertos, deporte, busca] // eslint-disable-line react-hooks/exhaustive-deps
  )
  const visibles = useMemo(
    () => (canchas || []).filter((c) => coincide(c.deportes || [], c.nombre, c.barrio)),
    [canchas, deporte, busca] // eslint-disable-line react-hooks/exhaustive-deps
  )
  const filtrando = deporte !== 'Todos' || busca !== ''
  const limpiar = () => {
    setDeporte('Todos')
    setTexto('')
  }

  return (
    <>
      <main className="ex">
        <div className="ex-fila ex-cabecera">
          <Link href="/app/explorar" className="ex-logo"><Logo height={30} /></Link>
          <Link href="/app/notificaciones" className="ex-redondo" aria-label={noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : 'Notificaciones'}>
            <svg width="20" height="20" {...ICONO}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
            {noLeidas > 0 && <span className="ex-punto" />}
          </Link>
        </div>

        <div className="ex-fila ex-busqueda">
          <label className="ex-buscador">
            <svg width="20" height="20" {...ICONO} strokeWidth={2.4}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <span className="ex-buscador-campo">
              <input
                type="search"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                aria-label="Buscar por cancha, barrio o deporte"
                enterKeyHint="search"
              />
              {texto === '' && <span key={pregunta} className="ex-pregunta" aria-hidden="true">{PREGUNTAS[pregunta]}</span>}
            </span>
          </label>
        </div>

        <Chips deporte={deporte} onChange={setDeporte} />

        {partidos.length > 0 && (
          <section className="ex-seccion">
            <div className="ex-fila ex-titulo">
              <h2>Partidos abiertos cerca tuyo</h2>
              <Link href="/app/comunidad">Ver todos</Link>
            </div>
            <div className="ex-carrusel">
              {partidos.map((p) => <TarjetaPartido key={p.id} p={p} />)}
            </div>
          </section>
        )}

        <section className="ex-seccion ex-fila">
          <div className="ex-titulo">
            <h2>{deporte === 'Todos' ? 'Canchas en Buenos Aires' : `Canchas de ${deporte.toLowerCase()}`}</h2>
          </div>

          {canchas === null && (
            <div aria-busy="true" aria-label="Cargando canchas">
              <div className="ex-esqueleto" />
              <div className="ex-esqueleto linea" />
              <div className="ex-esqueleto linea" style={{ width: '40%' }} />
            </div>
          )}

          {error && (
            <div className="ex-vacio" role="alert">
              <b>No pudimos cargar las canchas</b>
              Revisá tu conexión y probá de nuevo.
              <br />
              <button type="button" onClick={cargar}>Reintentar</button>
            </div>
          )}

          {canchas !== null && !error && visibles.length === 0 && (
            <div className="ex-vacio">
              <b>No encontramos canchas</b>
              {filtrando ? 'Probá con otro deporte o barrio.' : 'Todavía no hay canchas cargadas.'}
              {filtrando && (
                <>
                  <br />
                  <button type="button" onClick={limpiar}>Ver todas las canchas</button>
                </>
              )}
            </div>
          )}

          <div className="ex-lista">
            {visibles.map((c) => {
              const fav = favoritos.includes(c.id)
              return (
                <div key={c.id} className="ex-cancha">
                  <Link href={`/app/cancha/${c.id}`}>
                    <Portada cancha={c} className="ex-foto">
                      {c.superficie && <span className="ex-superficie">{c.superficie}</span>}
                    </Portada>
                    <span className="ex-cancha-datos">
                      <span className="ex-cancha-nombre">{c.nombre}</span>
                      <Estrellas nota={c.nota} total={c.total_resenas} />
                      <span className="ex-sub">{c.barrio} · {deportesDe(c)}</span>
                      <span className="ex-precio"><b>{precio(c.precio_hora)}</b> / hora</span>
                    </span>
                  </Link>
                  <button type="button" className="ex-fav" aria-pressed={fav} aria-label={fav ? `Quitar ${c.nombre} de favoritos` : `Guardar ${c.nombre} en favoritos`} onClick={() => alternarFavorito(c.id)}>
                    <svg width="20" height="20" {...ICONO}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      </main>
      <BarraNav activa="explorar" mapa />
    </>
  )
}
