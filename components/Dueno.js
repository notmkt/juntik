'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Estrellas from '@/components/Estrellas'
import { Cabecera, Pestanas, Cargando, Vacio, Multi } from '@/components/Piezas'
import {
  useUsuario, precio, fechaISO, deISO, fechaCorta, partesFecha, horaTexto, proximosDias, turnosDelDia, primerNombre, codigoReserva, textoPromo,
  DEPORTES, BARRIOS, EQUIPOS,
} from '@/lib/canchas'

const COMODIDADES = ['Vestuarios', 'Duchas', 'Estacionamiento', 'Bar', 'Parrilla', 'Wi-Fi']
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const NUEVA = { nombre: '', barrio: 'Palermo', direccion: '', deportes: ['Fútbol 5'], precio_hora: 40000, superficie: 'Césped sintético', techada: false, iluminacion: true, abre: 9, cierra: 23, comodidades: [], equipamiento: [], descripcion: '', politica_cancelacion: 'Cancelación gratis hasta 24 h antes.', reglas: '' }

export default function Dueno() {
  const usuario = useUsuario()
  const [pestana, setPestana] = useState('panel')
  const [canchas, setCanchas] = useState(null)
  const [reservas, setReservas] = useState([])
  const [promos, setPromos] = useState([])
  const [resenas, setResenas] = useState([])
  const [consultas, setConsultas] = useState([])
  const [form, setForm] = useState(null) // cancha en edición
  const [promo, setPromo] = useState(null)
  const [agenda, setAgenda] = useState({ cancha: null, dia: 0 })
  const [textos, setTextos] = useState({})
  const [aviso, setAviso] = useState('')
  const dias = useMemo(() => proximosDias(7), [])

  async function cargar() {
    const { data: cs } = await supabase.from('canchas').select('*').eq('owner_id', usuario.id).order('created_at')
    setCanchas(cs || [])
    const ids = (cs || []).map((c) => c.id)
    if (!ids.length) return
    setAgenda((a) => ({ ...a, cancha: a.cancha && ids.includes(a.cancha) ? a.cancha : ids[0] }))
    const [r, p, q, m] = await Promise.all([
      supabase.from('reservas').select('*, profiles(full_name)').in('cancha_id', ids).order('fecha').order('hora_inicio'),
      supabase.from('promociones').select('*').in('cancha_id', ids).order('created_at'),
      supabase.from('calificaciones').select('*, profiles(full_name), resena_respuestas(texto)').in('cancha_id', ids).order('created_at', { ascending: false }),
      supabase.from('consultas').select('*, profiles(full_name)').in('cancha_id', ids).order('created_at', { ascending: false }),
    ])
    setReservas(r.data || [])
    setPromos(p.data || [])
    setResenas(q.data || [])
    setConsultas(m.data || [])
  }
  useEffect(() => {
    if (usuario) cargar()
  }, [usuario]) // eslint-disable-line react-hooks/exhaustive-deps

  const nombreDe = (id) => canchas?.find((c) => c.id === id)?.nombre || ''
  async function hacer(fn, ok) {
    setAviso('')
    const { error } = await fn()
    setAviso(error ? 'No pudimos guardar el cambio. Probá de nuevo.' : ok || '')
    cargar()
    return !error
  }

  // ── Canchas
  async function guardarCancha(e) {
    e.preventDefault()
    if (form.nombre.trim().length < 3) return setAviso('Poné el nombre de la cancha.')
    if (!form.deportes.length) return setAviso('Elegí al menos un deporte.')
    if (Number(form.cierra) <= Number(form.abre)) return setAviso('El horario de cierre tiene que ser después de la apertura.')
    const { id, foto, ...d } = form
    const datos = {
      nombre: d.nombre.trim(), barrio: d.barrio, direccion: d.direccion.trim() || `${d.barrio}, Ciudad de Buenos Aires`, deportes: d.deportes,
      precio_hora: Number(d.precio_hora) || 0, superficie: d.superficie || null, techada: d.techada, iluminacion: d.iluminacion,
      abre: Number(d.abre), cierra: Number(d.cierra), comodidades: d.comodidades, equipamiento: d.equipamiento,
      descripcion: d.descripcion || null, politica_cancelacion: d.politica_cancelacion || null, reglas: d.reglas || null,
    }
    if (!id) {
      const [lat, lng] = BARRIOS[d.barrio]
      Object.assign(datos, { owner_id: usuario.id, lat: lat + (Math.random() - 0.5) * 0.008, lng: lng + (Math.random() - 0.5) * 0.008 })
    }
    if (foto) {
      if (foto.size > 2 * 1024 * 1024) return setAviso('La foto pesa más de 2 MB.')
      const path = `${usuario.id}/portada-${Date.now()}.${foto.type === 'image/png' ? 'png' : foto.type === 'image/webp' ? 'webp' : 'jpg'}`
      const s = await supabase.storage.from('fotos').upload(path, foto, { contentType: foto.type })
      if (s.error) return setAviso('No pudimos subir la foto.')
      datos.foto_portada = path
    }
    const ok = await hacer(() => (id ? supabase.from('canchas').update(datos).eq('id', id) : supabase.from('canchas').insert(datos)), id ? 'Cancha actualizada.' : '¡Cancha publicada! Ya aparece en Explorar y en el Mapa.')
    if (ok) setForm(null)
  }
  const borrarCancha = (c) => hacer(() => supabase.from('canchas').delete().eq('id', c.id), 'Cancha borrada.')

  // ── Datos derivados
  const hoy = fechaISO(new Date())
  const activas = reservas.filter((r) => r.estado === 'confirmada')
  const deHoy = activas.filter((r) => r.fecha === hoy && r.tipo === 'reserva')
  const mes = hoy.slice(0, 7)
  const cobradas = activas.filter((r) => r.tipo === 'reserva')
  const facturado = cobradas.filter((r) => r.fecha.slice(0, 7) === mes).reduce((t, r) => t + r.total, 0)
  const horasHoy = (canchas || []).reduce((t, c) => t + ((c.dias_cerrados || []).includes(new Date().getDay()) ? 0 : c.cierra - c.abre), 0)
  const ocupacion = horasHoy ? Math.round((activas.filter((r) => r.fecha === hoy).reduce((t, r) => t + r.duracion_min / 60, 0) / horasHoy) * 100) : 0

  // ── Agenda
  const canchaAgenda = canchas?.find((c) => c.id === agenda.cancha)
  const diaAgenda = dias[agenda.dia]
  const delDia = activas.filter((r) => r.cancha_id === agenda.cancha && r.fecha === fechaISO(diaAgenda))
  const enHora = (h) => delDia.find((r) => { const [hh, mm] = r.hora_inicio.split(':').map(Number); const ini = hh * 60 + mm; return h * 60 < ini + r.duracion_min && ini < h * 60 + 60 })
  const bloquear = (h) => hacer(() => supabase.from('reservas').insert({ cancha_id: agenda.cancha, fecha: fechaISO(diaAgenda), hora_inicio: `${horaTexto(h * 60)}:00`, duracion_min: 60, deporte: 'Bloqueo', total: 0, tipo: 'bloqueo' }))
  const desbloquear = (r) => hacer(() => supabase.from('reservas').update({ estado: 'cancelada' }).eq('id', r.id))

  // ── Promos
  async function guardarPromo(e) {
    e.preventDefault()
    if (!promo.nombre.trim()) return setAviso('Poné un nombre para la promoción.')
    if (Number(promo.hora_hasta) <= Number(promo.hora_desde)) return setAviso('La hora de fin tiene que ser después de la de inicio.')
    if (!promo.dias.length) return setAviso('Elegí al menos un día.')
    const ok = await hacer(() => supabase.from('promociones').insert({ cancha_id: promo.cancha_id, nombre: promo.nombre.trim(), descuento: Number(promo.descuento), hora_desde: Number(promo.hora_desde), hora_hasta: Number(promo.hora_hasta), dias: promo.dias.map((d) => DIAS.indexOf(d)) }), 'Promoción publicada.')
    if (ok) setPromo(null)
  }

  if (canchas === null) return <><Cabecera titulo="Modo dueño" volver="/app/perfil" /><main className="pag"><Cargando /></main></>

  const formulario = form && (
    <form className="tarjeta formulario" onSubmit={guardarCancha}>
      <h2>{form.id ? 'Editar cancha' : 'Nueva cancha'}</h2>
      <div className="campo"><label htmlFor="c-nombre">Nombre</label><input id="c-nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
      <div className="dos-campos">
        <div className="campo"><label htmlFor="c-barrio">Barrio</label><select id="c-barrio" value={form.barrio} disabled={Boolean(form.id)} onChange={(e) => setForm({ ...form, barrio: e.target.value })}>{Object.keys(BARRIOS).map((b) => <option key={b}>{b}</option>)}</select></div>
        <div className="campo"><label htmlFor="c-precio">Precio por hora ($)</label><input id="c-precio" type="number" min={0} step={500} value={form.precio_hora} onChange={(e) => setForm({ ...form, precio_hora: e.target.value })} /></div>
      </div>
      <div className="campo"><label htmlFor="c-dir">Dirección</label><input id="c-dir" value={form.direccion || ''} onChange={(e) => setForm({ ...form, direccion: e.target.value })} /></div>
      <div className="campo"><span className="campo-titulo">Deportes</span><Multi opciones={DEPORTES.slice(1)} valor={form.deportes} onChange={(v) => setForm({ ...form, deportes: v })} etiqueta="Deportes" /></div>
      <div className="dos-campos">
        <div className="campo"><label htmlFor="c-abre">Abre (hora)</label><input id="c-abre" type="number" min={0} max={23} value={form.abre} onChange={(e) => setForm({ ...form, abre: e.target.value })} /></div>
        <div className="campo"><label htmlFor="c-cierra">Cierra (hora)</label><input id="c-cierra" type="number" min={1} max={24} value={form.cierra} onChange={(e) => setForm({ ...form, cierra: e.target.value })} /></div>
      </div>
      <div className="campo"><label htmlFor="c-sup">Superficie</label><input id="c-sup" value={form.superficie || ''} onChange={(e) => setForm({ ...form, superficie: e.target.value })} /></div>
      <label className="interruptor"><input type="checkbox" checked={form.techada} onChange={(e) => setForm({ ...form, techada: e.target.checked })} /><span>Techada</span></label>
      <label className="interruptor"><input type="checkbox" checked={form.iluminacion} onChange={(e) => setForm({ ...form, iluminacion: e.target.checked })} /><span>Con iluminación</span></label>
      <div className="campo"><span className="campo-titulo">Comodidades</span><Multi opciones={COMODIDADES} valor={form.comodidades || []} onChange={(v) => setForm({ ...form, comodidades: v })} etiqueta="Comodidades" /></div>
      <div className="campo"><span className="campo-titulo">Equipamiento en alquiler</span><Multi opciones={Object.keys(EQUIPOS)} valor={form.equipamiento || []} onChange={(v) => setForm({ ...form, equipamiento: v })} etiqueta="Equipamiento en alquiler" /></div>
      <div className="campo"><label htmlFor="c-desc">Descripción</label><textarea id="c-desc" rows={2} value={form.descripcion || ''} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
      <div className="campo"><label htmlFor="c-pol">Política de cancelación</label><input id="c-pol" value={form.politica_cancelacion || ''} onChange={(e) => setForm({ ...form, politica_cancelacion: e.target.value })} /></div>
      <div className="campo"><label htmlFor="c-reg">Llegada y reglas</label><textarea id="c-reg" rows={2} value={form.reglas || ''} onChange={(e) => setForm({ ...form, reglas: e.target.value })} /></div>
      <div className="campo"><label htmlFor="c-foto">Foto de portada (JPG, PNG o WebP, hasta 2 MB)</label><input id="c-foto" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setForm({ ...form, foto: e.target.files?.[0] || null })} /></div>
      <div className="dos-campos">
        <button type="button" className="boton boton-borde" onClick={() => setForm(null)}>Cancelar</button>
        <button type="submit" className="boton boton-verde">{form.id ? 'Guardar' : 'Publicar cancha'}</button>
      </div>
    </form>
  )

  return (
    <>
      <Cabecera titulo="Modo dueño" sub={canchas.length ? `${canchas.length} ${canchas.length === 1 ? 'cancha' : 'canchas'}` : 'Publicá tu cancha'} volver="/app/perfil" />
      <main className="pag">
        {aviso && <div className="aviso aviso-ok" role="status">{aviso}</div>}

        {canchas.length === 0 && !form && (
          <Vacio titulo="Todavía no tenés canchas">
            Publicá tu cancha para recibir reservas, manejar la agenda y crear promociones.
            <br />
            <button type="button" onClick={() => setForm({ ...NUEVA })}>Publicar mi cancha</button>
          </Vacio>
        )}
        {canchas.length === 0 && formulario}

        {canchas.length > 0 && (
          <>
            <div className="pestanas-deslizar">
              <Pestanas valor={pestana} onChange={(p) => { setPestana(p); setAviso('') }} opciones={[['panel', 'Panel'], ['agenda', 'Agenda'], ['canchas', 'Mis canchas'], ['promos', 'Promociones'], ['resenas', 'Reseñas'], ['pagos', 'Pagos']]} />
            </div>

            {pestana === 'panel' && (
              <>
                <div className="numeros">
                  <div><b>{deHoy.length}</b><span>reservas hoy</span></div>
                  <div><b>{ocupacion} %</b><span>ocupación hoy</span></div>
                  <div><b>{precio(facturado)}</b><span>este mes</span></div>
                </div>
                <section className="tarjeta">
                  <h2>Reservas de hoy</h2>
                  {deHoy.length === 0 && <span className="ex-sub">No hay reservas para hoy.</span>}
                  <ul className="gente">
                    {deHoy.map((r) => (
                      <li key={r.id}>
                        <span className="gente-datos">
                          <b>{r.hora_inicio.slice(0, 5)} · {primerNombre(r.profiles?.full_name)} · {r.deporte}</b>
                          <span className="ex-sub">{nombreDe(r.cancha_id)} · {codigoReserva(r.id)}</span>
                        </span>
                        {r.checkin ? <span className="etiqueta ok">Check-in</span> : <button type="button" className="mini" onClick={() => hacer(() => supabase.from('reservas').update({ checkin: true }).eq('id', r.id), 'Check-in registrado.')}>Hacer check-in</button>}
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="tarjeta">
                  <h2>Mensajes de jugadores</h2>
                  {consultas.length === 0 && <span className="ex-sub">No recibiste mensajes.</span>}
                  {consultas.map((q) => (
                    <div key={q.id} className="bloque">
                      <b>{primerNombre(q.profiles?.full_name)} · {nombreDe(q.cancha_id)}</b>
                      <p className="texto">{q.texto}</p>
                      {q.respuesta ? <p className="texto respuesta">Tu respuesta: {q.respuesta}</p> : (
                        <form className="fila" onSubmit={(e) => { e.preventDefault(); const t = (textos[q.id] || '').trim(); if (t) hacer(() => supabase.from('consultas').update({ respuesta: t, respondida_at: new Date().toISOString() }).eq('id', q.id), 'Respuesta enviada.') }}>
                          <input value={textos[q.id] || ''} onChange={(e) => setTextos({ ...textos, [q.id]: e.target.value })} maxLength={500} placeholder="Responder" aria-label={`Responder a ${primerNombre(q.profiles?.full_name)}`} />
                          <button type="submit" className="mini">Enviar</button>
                        </form>
                      )}
                    </div>
                  ))}
                </section>
              </>
            )}

            {pestana === 'agenda' && canchaAgenda && (
              <>
                {canchas.length > 1 && (
                  <div className="campo"><label htmlFor="a-cancha">Cancha</label><select id="a-cancha" value={agenda.cancha} onChange={(e) => setAgenda({ ...agenda, cancha: e.target.value })}>{canchas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
                )}
                <div className="reservar-dias" role="group" aria-label="Día">
                  {dias.map((d, i) => { const p = partesFecha(d); return <button key={i} type="button" aria-pressed={i === agenda.dia} onClick={() => setAgenda({ ...agenda, dia: i })}><span>{i === 0 ? 'Hoy' : p.dia}</span><b>{p.numero}</b></button> })}
                </div>
                <span className="ex-sub">Tocá un turno libre para bloquearlo (no se podrá reservar). Tocá un bloqueo para liberarlo.</span>
                <div className="agenda">
                  {turnosDelDia(canchaAgenda, diaAgenda, [], new Date(0)).length === 0 && <span className="ex-sub">La cancha está cerrada este día.</span>}
                  {turnosDelDia(canchaAgenda, diaAgenda, [], new Date(0)).map((t) => {
                    const r = enHora(t.hora)
                    return (
                      <button key={t.hora} type="button" className={r ? (r.tipo === 'bloqueo' ? 'bloqueado' : 'reservado') : ''} disabled={Boolean(r && r.tipo === 'reserva')} onClick={() => (r ? desbloquear(r) : bloquear(t.hora))}>
                        <b>{horaTexto(t.hora * 60)}</b>
                        <span>{r ? (r.tipo === 'bloqueo' ? 'Bloqueado' : `${primerNombre(r.profiles?.full_name)} · ${r.deporte}`) : 'Libre'}</span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {pestana === 'canchas' && (
              <>
                {!form && canchas.map((c) => (
                  <div key={c.id} className="res-tarjeta">
                    <b>{c.nombre}</b>
                    <span className="ex-sub">{c.barrio} · {(c.deportes || []).join(', ')} · {precio(c.precio_hora)} / hora · {c.abre} a {c.cierra} h</span>
                    <div className="res-botones">
                      <Link href={`/app/cancha/${c.id}`}>Ver ficha</Link>
                      <button type="button" onClick={() => setForm({ ...c, foto: null })}>Editar</button>
                      <button type="button" onClick={() => borrarCancha(c)}>Borrar</button>
                    </div>
                  </div>
                ))}
                {!form && <button type="button" className="boton boton-borde" onClick={() => setForm({ ...NUEVA })}>Agregar otra cancha</button>}
                {formulario}
              </>
            )}

            {pestana === 'promos' && (
              <>
                {promos.length === 0 && !promo && <Vacio titulo="No tenés promociones">Creá descuentos para llenar los horarios vacíos.</Vacio>}
                {promos.map((p) => (
                  <div key={p.id} className="res-tarjeta">
                    <span className="ex-partido-arriba"><b>{p.nombre}</b><span className={`etiqueta${p.activa ? ' ok' : ''}`}>{p.activa ? 'Activa' : 'Pausada'}</span></span>
                    <span className="ex-sub">{nombreDe(p.cancha_id)} · {textoPromo(p)}</span>
                    <div className="res-botones dos">
                      <button type="button" onClick={() => hacer(() => supabase.from('promociones').update({ activa: !p.activa }).eq('id', p.id))}>{p.activa ? 'Pausar' : 'Activar'}</button>
                      <button type="button" onClick={() => hacer(() => supabase.from('promociones').delete().eq('id', p.id))}>Borrar</button>
                    </div>
                  </div>
                ))}
                {!promo && <button type="button" className="boton boton-borde" onClick={() => setPromo({ cancha_id: canchas[0].id, nombre: '', descuento: 20, hora_desde: 9, hora_hasta: 13, dias: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'] })}>Crear promoción</button>}
                {promo && (
                  <form className="tarjeta formulario" onSubmit={guardarPromo}>
                    <h2>Nueva promoción</h2>
                    {canchas.length > 1 && <div className="campo"><label htmlFor="pr-cancha">Cancha</label><select id="pr-cancha" value={promo.cancha_id} onChange={(e) => setPromo({ ...promo, cancha_id: e.target.value })}>{canchas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>}
                    <div className="campo"><label htmlFor="pr-nombre">Nombre</label><input id="pr-nombre" value={promo.nombre} placeholder="Ej.: Mañanas de semana" onChange={(e) => setPromo({ ...promo, nombre: e.target.value })} /></div>
                    <div className="campo"><label htmlFor="pr-desc">Descuento (%)</label><input id="pr-desc" type="number" min={5} max={80} value={promo.descuento} onChange={(e) => setPromo({ ...promo, descuento: e.target.value })} /></div>
                    <div className="dos-campos">
                      <div className="campo"><label htmlFor="pr-desde">Desde (hora)</label><input id="pr-desde" type="number" min={0} max={23} value={promo.hora_desde} onChange={(e) => setPromo({ ...promo, hora_desde: e.target.value })} /></div>
                      <div className="campo"><label htmlFor="pr-hasta">Hasta (hora)</label><input id="pr-hasta" type="number" min={1} max={24} value={promo.hora_hasta} onChange={(e) => setPromo({ ...promo, hora_hasta: e.target.value })} /></div>
                    </div>
                    <div className="campo"><span className="campo-titulo">Días</span><Multi opciones={DIAS} valor={promo.dias} onChange={(v) => setPromo({ ...promo, dias: v })} etiqueta="Días" /></div>
                    <div className="dos-campos">
                      <button type="button" className="boton boton-borde" onClick={() => setPromo(null)}>Cancelar</button>
                      <button type="submit" className="boton boton-verde">Publicar</button>
                    </div>
                  </form>
                )}
              </>
            )}

            {pestana === 'resenas' && (
              <>
                {resenas.length === 0 && <Vacio titulo="Todavía no hay reseñas">Cuando un jugador califique tu cancha la vas a ver acá.</Vacio>}
                {resenas.map((r) => (
                  <div key={r.id} className="res-tarjeta">
                    <span className="ex-partido-arriba"><b>{primerNombre(r.profiles?.full_name)} · {nombreDe(r.cancha_id)}</b><Estrellas nota={r.general} total={1} size={13} soloEstrellas /></span>
                    {r.comentario && <p className="texto">{r.comentario}</p>}
                    {r.resena_respuestas ? <p className="texto respuesta">Tu respuesta: {r.resena_respuestas.texto}</p> : (
                      <form className="fila" onSubmit={(e) => { e.preventDefault(); const t = (textos[r.id] || '').trim(); if (t) hacer(() => supabase.from('resena_respuestas').insert({ calificacion_id: r.id, cancha_id: r.cancha_id, texto: t }), 'Respuesta publicada.') }}>
                        <input value={textos[r.id] || ''} onChange={(e) => setTextos({ ...textos, [r.id]: e.target.value })} maxLength={500} placeholder="Responder la reseña" aria-label={`Responder a ${primerNombre(r.profiles?.full_name)}`} />
                        <button type="submit" className="mini">Publicar</button>
                      </form>
                    )}
                  </div>
                ))}
              </>
            )}

            {pestana === 'pagos' && (
              <>
                <div className="numeros">
                  <div><b>{precio(cobradas.reduce((t, r) => t + r.total, 0))}</b><span>total cobrado</span></div>
                  <div><b>{cobradas.length}</b><span>reservas</span></div>
                </div>
                <button type="button" className="boton boton-verde" onClick={() => setAviso('Prototipo académico: los retiros son simulados, no se transfiere dinero.')}>Retirar a mi cuenta</button>
                <section className="tarjeta">
                  <h2>Historial</h2>
                  {cobradas.length === 0 && <span className="ex-sub">Todavía no hay pagos.</span>}
                  <dl className="ficha-datos">
                    {[...cobradas].reverse().slice(0, 20).map((r) => <div key={r.id}><dt>{fechaCorta(deISO(r.fecha)).toLowerCase()} · {primerNombre(r.profiles?.full_name)} · {nombreDe(r.cancha_id)}</dt><dd>{precio(r.total)}</dd></div>)}
                  </dl>
                </section>
              </>
            )}
          </>
        )}
      </main>
    </>
  )
}
