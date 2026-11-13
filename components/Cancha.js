'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Estrellas from '@/components/Estrellas'
import EstrellasInput from '@/components/EstrellasInput'
import Portada from '@/components/Portada'
import MiniMapa from '@/components/MiniMapa'
import EnDesarrollo from '@/components/EnDesarrollo'
import { comoLlegar } from '@/lib/mapa'
import {
  useUsuario, useCancha, useFavoritos, urlFoto, precio, horarioDe, proximosDias, turnosDelDia, turnosOcupados,
  fechaISO, fechaCorta, horaTexto, EQUIPOS, promosDe, textoPromo, primerNombre,
} from '@/lib/canchas'

const ICONO = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
const TRAZOS = {
  Techada: 'm3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  'Al aire libre': 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  Iluminación: 'M9 18h6M10 22h4M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14',
  Vestuarios: 'M20.38 6.46 16 4a4 4 0 0 1-8 0L3.62 6.46a1 1 0 0 0-.56 1.17l1 3a1 1 0 0 0 1.2.66L7 11v10h10V11l1.74.29a1 1 0 0 0 1.2-.66l1-3a1 1 0 0 0-.56-1.17z',
  Duchas: 'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z',
  Estacionamiento: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 17V7h4a3 3 0 0 1 0 6H9',
  Bar: 'M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4ZM6 2v2M10 2v2M14 2v2',
  Parrilla: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  'Wi-Fi': 'M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01',
  'Alquiler de equipo': 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 7l4 3-1.5 4.5h-5L8 10z',
}
const CATEGORIAS = [
  ['piso', 'Estado del piso'],
  ['iluminacion', 'Iluminación'],
  ['vestuarios', 'Vestuarios'],
  ['atencion', 'Atención'],
  ['puntualidad', 'Puntualidad del turno'],
]
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const coma = (n) => Number(n).toFixed(1).replace('.', ',')

export default function Cancha({ id }) {
  const usuario = useUsuario()
  const { cancha, error, cargar } = useCancha(id, usuario)
  const [favoritos, alternarFavorito] = useFavoritos()
  const [fotos, setFotos] = useState([])
  const [resenas, setResenas] = useState([])
  const [promos, setPromos] = useState([])
  const [dueno, setDueno] = useState(null)
  const [consultas, setConsultas] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [todas, setTodas] = useState(false)
  const [disponibilidad, setDisponibilidad] = useState(null) // { fecha, turnos }
  const [fotoActual, setFotoActual] = useState(1)
  const [aviso, setAviso] = useState('')
  const [subiendo, setSubiendo] = useState(false)
  const archivo = useRef(null)
  // Formulario de reseña
  const [form, setForm] = useState({ general: 0, comentario: '' })
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')
  const [okForm, setOkForm] = useState('')

  async function cargarFotos() {
    const { data } = await supabase.from('fotos').select('id, path').eq('cancha_id', id).order('created_at', { ascending: false })
    setFotos(data || [])
  }
  async function cargarResenas() {
    const { data } = await supabase.from('calificaciones').select('*, profiles(full_name), resena_respuestas(texto)').eq('cancha_id', id).order('created_at', { ascending: false })
    setResenas(data || [])
    const mia = (data || []).find((r) => r.user_id === usuario.id)
    if (mia) setForm({ general: mia.general, piso: mia.piso, iluminacion: mia.iluminacion, vestuarios: mia.vestuarios, atencion: mia.atencion, puntualidad: mia.puntualidad, comentario: mia.comentario || '' })
  }

  useEffect(() => {
    if (!usuario) return
    cargarFotos()
    cargarResenas()
  }, [id, usuario]) // eslint-disable-line react-hooks/exhaustive-deps

  // Promociones, dueño y mis mensajes
  async function cargarConsultas() {
    const { data } = await supabase.from('consultas').select('*').eq('cancha_id', id).eq('user_id', usuario.id).order('created_at')
    setConsultas(data || [])
  }
  useEffect(() => {
    if (!cancha) return
    promosDe(cancha.id).then(setPromos)
    if (cancha.owner_id) {
      supabase.from('profiles').select('id, full_name').eq('id', cancha.owner_id).maybeSingle().then(({ data }) => setDueno(data))
      cargarConsultas()
    }
  }, [cancha]) // eslint-disable-line react-hooks/exhaustive-deps
  async function enviarMensaje(e) {
    e.preventDefault()
    const t = mensaje.trim()
    if (!t) return
    const { error } = await supabase.from('consultas').insert({ cancha_id: cancha.id, texto: t })
    setAviso(error ? 'No pudimos enviar el mensaje.' : 'Mensaje enviado al dueño.')
    if (!error) setMensaje('')
    cargarConsultas()
  }

  // Disponibilidad: el primer día (desde hoy) con turnos por delante
  useEffect(() => {
    if (!cancha) return
    let cancelado = false
    ;(async () => {
      for (const fecha of proximosDias(7)) {
        const turnos = turnosDelDia(cancha, fecha, await turnosOcupados(cancha.id, fecha)).filter((t) => !t.pasado)
        if (cancelado) return
        if (turnos.length > 0) return setDisponibilidad({ fecha, turnos: turnos.slice(0, 5) })
      }
      setDisponibilidad({ fecha: null, turnos: [] })
    })()
    return () => {
      cancelado = true
    }
  }, [cancha])

  // Si se llegó con #resenas o #calificar, bajar hasta ahí cuando cargó
  useEffect(() => {
    if (cancha && window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView()
  }, [cancha])

  const imagenes = useMemo(
    () => [cancha?.foto_portada, ...fotos.map((f) => f.path)].filter(Boolean).map(urlFoto),
    [cancha, fotos]
  )
  const promedios = useMemo(
    () =>
      CATEGORIAS.map(([campo, etiqueta]) => {
        const notas = resenas.map((r) => r[campo]).filter(Boolean)
        return { etiqueta, nota: notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null }
      }).filter((c) => c.nota !== null),
    [resenas]
  )

  if (cancha === null) return <EnDesarrollo />
  if (error) {
    return (
      <main className="ficha-estado">
        <div className="ex-vacio" role="alert">
          <b>No pudimos cargar la cancha</b>
          Revisá tu conexión y probá de nuevo.
          <br />
          <button type="button" onClick={cargar}>Reintentar</button>
        </div>
      </main>
    )
  }
  if (!cancha) {
    return (
      <main className="ficha-estado" aria-busy="true" aria-label="Cargando cancha">
        <div className="ex-esqueleto" style={{ height: 300, borderRadius: 0 }} />
        <div style={{ padding: 20 }}>
          <div className="ex-esqueleto linea" style={{ height: 26 }} />
          <div className="ex-esqueleto linea" style={{ width: '40%' }} />
        </div>
      </main>
    )
  }

  const fav = favoritos.includes(cancha.id)
  const ofrece = [cancha.techada ? 'Techada' : 'Al aire libre', ...(cancha.iluminacion ? ['Iluminación'] : []), ...(cancha.comodidades || []), ...((cancha.equipamiento || []).length ? ['Alquiler de equipo'] : [])]
  const miResena = resenas.find((r) => r.user_id === usuario.id)
  const visibles = todas ? resenas : resenas.slice(0, 3)

  async function compartir() {
    const datos = { title: `${cancha.nombre} · Juntik`, url: window.location.href.split('#')[0] }
    try {
      if (navigator.share) await navigator.share(datos)
      else {
        await navigator.clipboard.writeText(datos.url)
        setAviso('Enlace copiado.')
      }
    } catch {}
  }

  async function subirFoto(e) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setAviso('')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) return setAviso('La foto tiene que ser JPG, PNG o WebP.')
    if (f.size > 2 * 1024 * 1024) return setAviso('La foto pesa más de 2 MB. Probá con una más liviana.')
    setSubiendo(true)
    const ext = f.type === 'image/png' ? 'png' : f.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `${usuario.id}/${cancha.id}-${Date.now()}.${ext}`
    const subida = await supabase.storage.from('fotos').upload(path, f, { contentType: f.type })
    const fila = subida.error ? subida : await supabase.from('fotos').insert({ cancha_id: cancha.id, user_id: usuario.id, path })
    setSubiendo(false)
    if (fila.error) return setAviso('No pudimos subir la foto. Probá de nuevo.')
    setAviso('¡Foto agregada!')
    cargarFotos()
  }

  async function guardarResena(e) {
    e.preventDefault()
    setErrorForm('')
    setOkForm('')
    if (!form.general) return setErrorForm('Elegí cuántas estrellas le das a la cancha.')
    setGuardando(true)
    const { error } = await supabase.from('calificaciones').upsert(
      {
        cancha_id: cancha.id, user_id: usuario.id, general: form.general,
        piso: form.piso || null, iluminacion: form.iluminacion || null, vestuarios: form.vestuarios || null,
        atencion: form.atencion || null, puntualidad: form.puntualidad || null,
        comentario: form.comentario.trim() || null,
      },
      { onConflict: 'cancha_id,user_id' }
    )
    setGuardando(false)
    if (error) return setErrorForm('No pudimos guardar tu reseña. Probá de nuevo.')
    setOkForm(miResena ? 'Reseña actualizada.' : '¡Gracias! Tu reseña ya está publicada.')
    cargarResenas()
    cargar()
  }

  return (
    <>
      <main className="ficha">
        <div className="ficha-fotos">
          {imagenes.length > 0 ? (
            <div
              className="ficha-carrusel"
              onScroll={(e) => setFotoActual(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth) + 1)}
            >
              {imagenes.map((src, i) => <img key={src} src={src} alt={`Foto ${i + 1} de ${cancha.nombre}`} loading={i ? 'lazy' : undefined} />)}
            </div>
          ) : (
            <Portada cancha={cancha} className="ficha-portada" simbolo={280} />
          )}
          <Link href="/app/explorar" className="mapa-redondo ficha-volver" aria-label="Volver a Explorar">
            <svg width="20" height="20" {...ICONO} strokeWidth={2.4}><path d="m15 18-6-6 6-6" /></svg>
          </Link>
          <div className="ficha-acciones">
            <button type="button" className="mapa-redondo" onClick={compartir} aria-label="Compartir">
              <svg width="18" height="18" {...ICONO} strokeWidth={2.2}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
            </button>
            <button type="button" className="mapa-redondo ex-fav-icono" aria-pressed={fav} onClick={() => alternarFavorito(cancha.id)} aria-label={fav ? 'Quitar de favoritos' : 'Guardar en favoritos'}>
              <svg width="18" height="18" {...ICONO} strokeWidth={2.2}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
            </button>
          </div>
          {imagenes.length > 1 && <span className="ficha-contador">{fotoActual} / {imagenes.length}</span>}
        </div>

        <section className="ficha-seccion ficha-cabecera">
          {cancha.destacada && <span className="ex-etiqueta" style={{ alignSelf: 'flex-start' }}>Cancha destacada</span>}
          <h1>{cancha.nombre}</h1>
          <span className="ficha-lugar">{cancha.barrio}, Ciudad de Buenos Aires</span>
          <a href="#resenas" className="ficha-nota"><Estrellas nota={cancha.nota} total={cancha.total_resenas} /></a>
          {cancha.descripcion && <p>{cancha.descripcion}</p>}
          {promos.map((p) => <span key={p.id} className="promo"><b>{p.nombre}</b> · {textoPromo(p)}</span>)}
          <div className="ficha-subir">
            <input ref={archivo} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={subirFoto} />
            <button type="button" className="ficha-enlace" onClick={() => archivo.current.click()} disabled={subiendo}>
              {subiendo ? 'Subiendo foto…' : 'Agregar una foto de la cancha'}
            </button>
            {aviso && <span role="status">{aviso}</span>}
          </div>
        </section>

        <section className="ficha-seccion">
          <h2>Deportes disponibles</h2>
          <div className="ficha-deportes">
            {(cancha.deportes || []).map((d) => <span key={d}>{d}</span>)}
          </div>
        </section>

        <section className="ficha-seccion">
          <h2>Lo que ofrece este lugar</h2>
          <div className="ficha-ofrece">
            {ofrece.map((o) => (
              <span key={o}>
                <svg width="22" height="22" {...ICONO}><path d={TRAZOS[o] || 'M20 6 9 17l-5-5'} /></svg>
                {o}
              </span>
            ))}
          </div>
        </section>

        <section className="ficha-seccion">
          <h2>Datos de la cancha</h2>
          <dl className="ficha-datos">
            {cancha.superficie && <div><dt>Superficie</dt><dd>{cancha.superficie}</dd></div>}
            <div><dt>Horario</dt><dd>{horarioDe(cancha)}</dd></div>
            <div><dt>Horario pico</dt><dd>19 a 22 h (+20 %)</dd></div>
            {(cancha.equipamiento || []).length > 0 && (
              <div><dt>Equipo en alquiler</dt><dd>{cancha.equipamiento.map((e) => EQUIPOS[e]?.nombre || e).join(', ')}</dd></div>
            )}
          </dl>
        </section>

        <section className="ficha-seccion">
          <div>
            <h2>Disponibilidad</h2>
            {disponibilidad?.fecha && <span className="ex-sub">{fechaISO(disponibilidad.fecha) === fechaISO(new Date()) ? 'Hoy, ' : ''}{fechaCorta(disponibilidad.fecha).toLowerCase()}</span>}
          </div>
          {!disponibilidad && <div className="ex-esqueleto" style={{ height: 44 }} />}
          {disponibilidad && disponibilidad.turnos.length === 0 && <span className="ex-sub">No hay turnos libres en los próximos 7 días.</span>}
          {disponibilidad && disponibilidad.turnos.length > 0 && (
            <div className="ficha-turnos">
              {disponibilidad.turnos.map((t) =>
                t.ocupado ? (
                  <span key={t.hora} className="ocupado" aria-label={`${horaTexto(t.hora * 60)}, ocupado`}>{horaTexto(t.hora * 60)}</span>
                ) : (
                  <Link key={t.hora} href={`/app/cancha/${cancha.id}/reservar?fecha=${fechaISO(disponibilidad.fecha)}&hora=${t.hora}`}>{horaTexto(t.hora * 60)}</Link>
                )
              )}
            </div>
          )}
          <Link href={`/app/cancha/${cancha.id}/reservar`} className="ficha-enlace">Ver todos los horarios</Link>
        </section>

        <section className="ficha-seccion" id="resenas">
          <h2 className="ficha-resumen">
            {cancha.total_resenas > 0 ? (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                {coma(cancha.nota)} · {cancha.total_resenas} {cancha.total_resenas === 1 ? 'reseña' : 'reseñas'}
              </>
            ) : 'Reseñas'}
          </h2>
          {promedios.length > 0 && (
            <div className="ficha-barras">
              {promedios.map((c) => (
                <div key={c.etiqueta}>
                  <span>{c.etiqueta}</span>
                  <span className="barra"><span style={{ width: `${(c.nota / 5) * 100}%` }} /></span>
                  <b>{coma(c.nota)}</b>
                </div>
              ))}
            </div>
          )}
          {resenas.length === 0 && <span className="ex-sub">Todavía no hay reseñas. ¡Sé la primera persona en calificar esta cancha!</span>}
          {visibles.map((r) => {
            const nombre = (r.profiles?.full_name || 'Jugador').split(' ')[0]
            const f = new Date(r.created_at)
            return (
              <article key={r.id} className="ficha-resena">
                <div>
                  <span className="avatar">{nombre.slice(0, 2).toUpperCase()}</span>
                  <span>
                    <b>{nombre}{r.user_id === usuario.id ? ' (vos)' : ''}</b>
                    <span className="ex-sub">{MESES[f.getMonth()]} {f.getFullYear()}</span>
                  </span>
                  <Estrellas nota={r.general} total={1} size={13} soloEstrellas />
                </div>
                {r.comentario && <p>{r.comentario}</p>}
                {r.resena_respuestas && <p className="texto respuesta">Respuesta del dueño: {r.resena_respuestas.texto}</p>}
              </article>
            )
          })}
          {resenas.length > 3 && !todas && (
            <button type="button" className="boton boton-borde" onClick={() => setTodas(true)}>Mostrar las {resenas.length} reseñas</button>
          )}

          <form className="ficha-calificar" id="calificar" onSubmit={guardarResena}>
            <h3>{miResena ? 'Tu reseña' : 'Calificá esta cancha'}</h3>
            <EstrellasInput valor={form.general} onChange={(n) => setForm({ ...form, general: n })} etiqueta="Calificación general" size={36} />
            <div className="ficha-categorias">
              {CATEGORIAS.map(([campo, etiqueta]) => (
                <div key={campo}>
                  <span>{etiqueta}</span>
                  <EstrellasInput valor={form[campo]} onChange={(n) => setForm({ ...form, [campo]: n })} etiqueta={etiqueta} size={24} />
                </div>
              ))}
            </div>
            <div className="campo">
              <label htmlFor="comentario">Comentario (opcional)</label>
              <textarea id="comentario" rows={3} maxLength={1000} value={form.comentario} onChange={(e) => setForm({ ...form, comentario: e.target.value })} placeholder="¿Cómo estuvo el piso, la luz, la atención?" />
            </div>
            {errorForm && <div className="aviso aviso-error" role="alert">{errorForm}</div>}
            {okForm && <div className="aviso aviso-ok" role="status">{okForm}</div>}
            <button type="submit" className="boton boton-borde" disabled={guardando}>
              {guardando ? 'Guardando…' : miResena ? 'Actualizar mi reseña' : 'Publicar reseña'}
            </button>
          </form>
        </section>

        {cancha.politica_cancelacion && (
          <section className="ficha-seccion">
            <h2>Política de cancelación</h2>
            <div className="ficha-politica">
              <svg width="22" height="22" {...ICONO}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              <span>{cancha.politica_cancelacion}</span>
            </div>
          </section>
        )}

        {cancha.reglas && (
          <section className="ficha-seccion">
            <h2>Llegada y reglas</h2>
            <p className="texto">{cancha.reglas}</p>
          </section>
        )}

        <section className="ficha-seccion">
          <h2>Ubicación</h2>
          <MiniMapa lat={cancha.lat} lng={cancha.lng} nombre={cancha.nombre} />
          <div className="ficha-direccion">
            <span>{cancha.direccion || `${cancha.barrio}, Ciudad de Buenos Aires`}</span>
            <a href={comoLlegar(cancha)} target="_blank" rel="noopener noreferrer" className="ficha-enlace">Cómo llegar</a>
          </div>
        </section>
        <section className="ficha-seccion">
          <h2>Conocé al dueño</h2>
          {dueno ? (
            <>
              <div className="perfil-cab">
                <span className="avatar grande">{primerNombre(dueno.full_name).slice(0, 2).toUpperCase()}</span>
                <div><b>{primerNombre(dueno.full_name)}</b><span className="ex-sub">Dueño de {cancha.nombre}</span></div>
              </div>
              {consultas.map((q) => (
                <div key={q.id} className="bloque">
                  <p className="texto">Vos: {q.texto}</p>
                  {q.respuesta ? <p className="texto respuesta">{primerNombre(dueno.full_name)}: {q.respuesta}</p> : <span className="ex-sub">Todavía sin respuesta</span>}
                </div>
              ))}
              {dueno.id !== usuario.id && (
                <form className="fila" onSubmit={enviarMensaje}>
                  <input value={mensaje} onChange={(e) => setMensaje(e.target.value)} maxLength={500} placeholder="Escribile un mensaje" aria-label="Mensaje para el dueño" />
                  <button type="submit" className="mini">Enviar</button>
                </form>
              )}
            </>
          ) : <span className="ex-sub">Cancha de demostración de Juntik: no tiene un dueño con cuenta para escribirle.</span>}
        </section>
      </main>

      <div className="barra-accion">
        <div>
          <span className="barra-precio"><b>{precio(cancha.precio_hora)}</b> / hora</span>
          <span className="ex-sub">{horarioDe(cancha)}</span>
        </div>
        <Link href={`/app/cancha/${cancha.id}/reservar`} className="boton boton-verde">Reservar</Link>
      </div>
    </>
  )
}
