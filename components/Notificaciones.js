'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BarraNav from '@/components/BarraNav'
import { useUsuario } from '@/lib/canchas'

const ICONO = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
const ICONOS = {
  bienvenida: <svg {...ICONO}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>,
  reserva: <svg {...ICONO}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" /></svg>,
  cancelacion: <svg {...ICONO}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M10 14l4 4M14 14l-4 4" /></svg>,
  resena: <svg {...ICONO}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
}

function hace(fecha) {
  const min = Math.round((Date.now() - new Date(fecha).getTime()) / 60000)
  if (min < 1) return 'Recién'
  if (min < 60) return `Hace ${min} min`
  if (min < 60 * 24) return `Hace ${Math.round(min / 60)} h`
  if (min < 60 * 48) return 'Ayer'
  return new Date(fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export default function Notificaciones() {
  const router = useRouter()
  const usuario = useUsuario()
  const [lista, setLista] = useState(null) // null = cargando
  const [error, setError] = useState(false)

  async function cargar() {
    setError(false)
    const { data, error } = await supabase.from('notificaciones').select('*').order('created_at', { ascending: false }).limit(50)
    if (error) setError(true)
    setLista(data || [])
  }
  useEffect(() => {
    if (usuario) cargar()
  }, [usuario])

  const sinLeer = (lista || []).filter((n) => !n.leida).length

  async function abrir(n) {
    if (!n.leida) {
      setLista((l) => l.map((x) => (x.id === n.id ? { ...x, leida: true } : x)))
      await supabase.from('notificaciones').update({ leida: true }).eq('id', n.id)
    }
    if (n.enlace) router.push(n.enlace)
  }
  async function leerTodas() {
    setLista((l) => l.map((x) => ({ ...x, leida: true })))
    await supabase.from('notificaciones').update({ leida: true }).eq('leida', false)
  }

  const nombre = usuario?.user_metadata?.full_name || usuario?.email

  return (
    <>
      <header className="cabecera">
        <Link href="/app/explorar" className="ex-redondo" aria-label="Volver a Explorar">
          <svg {...ICONO} strokeWidth={2.4}><path d="m15 18-6-6 6-6" /></svg>
        </Link>
        <div>
          <h1>Notificaciones</h1>
          {nombre && <span className="ex-sub">{nombre}</span>}
        </div>
      </header>
      <main className="noti">
        {sinLeer > 0 && (
          <div className="noti-barra">
            <span className="ex-sub">{sinLeer} sin leer</span>
            <button type="button" className="ficha-enlace" onClick={leerTodas}>Marcar todas como leídas</button>
          </div>
        )}

        {lista === null && <div className="ex-esqueleto" style={{ height: 80 }} aria-busy="true" aria-label="Cargando notificaciones" />}

        {error && (
          <div className="ex-vacio" role="alert">
            <b>No pudimos cargar tus notificaciones</b>
            <button type="button" onClick={cargar}>Reintentar</button>
          </div>
        )}

        {lista !== null && !error && lista.length === 0 && (
          <div className="ex-vacio">
            <b>No tenés notificaciones</b>
            Acá te vamos a avisar de tus reservas y reseñas.
          </div>
        )}

        <ul className="noti-lista">
          {(lista || []).map((n) => (
            <li key={n.id}>
              <button type="button" className={n.leida ? '' : 'nueva'} onClick={() => abrir(n)}>
                <span className="noti-icono">{ICONOS[n.tipo] || ICONOS.bienvenida}</span>
                <span className="noti-texto">
                  <b>{n.titulo}</b>
                  {n.cuerpo && <span>{n.cuerpo}</span>}
                  <span className="ex-sub">{hace(n.created_at)}</span>
                </span>
                {!n.leida && <span className="noti-punto" aria-label="Sin leer" />}
              </button>
            </li>
          ))}
        </ul>
      </main>
      <BarraNav />
    </>
  )
}
