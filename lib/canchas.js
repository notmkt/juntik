'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export const DEPORTES = ['Todos', 'Fútbol 5', 'Fútbol 7', 'Pádel', 'Tenis', 'Básquet', 'Vóley']

const lista = new Intl.ListFormat('es', { style: 'long', type: 'conjunction' })
const numero = new Intl.NumberFormat('es-AR')
const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
// Texto del horario: "Todos los días · 8 a 24 h" / "Lun a sáb · 10 a 23 h"
export function horarioDe(c) {
  const cerrados = c.dias_cerrados || []
  const dias =
    cerrados.length === 0 ? 'Todos los días'
    : cerrados.length === 1 && cerrados[0] === 0 ? 'Lun a sáb'
    : `Cierra ${lista.format(cerrados.map((d) => DIAS_CORTOS[d]))}`
  return `${dias} · ${c.abre ?? 9} a ${c.cierra ?? 23} h`
}
export const deportesDe = (c) => lista.format(c.deportes || [])
export const precio = (n) => `$ ${numero.format(n)}`
export const sinAcentos = (t = '') => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function urlFoto(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return supabase.storage.from('fotos').getPublicUrl(path).data.publicUrl
}

// Distancia en línea recta entre dos puntos (km)
export function distanciaKm(a, b) {
  const rad = (g) => (g * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}
export const textoDistancia = (km) =>
  km < 1 ? `${Math.round(km * 100) * 10} m` : `${km.toFixed(1).replace('.', ',')} km`

// Carga las canchas (solo con sesión; sin sesión vuelve al login). canchas = null mientras carga.
export function useCanchas() {
  const router = useRouter()
  const [canchas, setCanchas] = useState(null)
  const [error, setError] = useState(false)

  async function cargar() {
    setError(false)
    setCanchas(null)
    const { data, error } = await supabase.from('canchas_resumen').select('*').order('nombre')
    if (error) {
      setError(true)
      setCanchas([])
    } else {
      setCanchas(data.map((c, i) => ({ ...c, variante: i % 3 })))
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/app')
      else cargar()
    })
  }, [router])

  return { canchas, error, cargar }
}

// Usuario con sesión (undefined = cargando). Sin sesión vuelve al login.
export function useUsuario() {
  const router = useRouter()
  const [usuario, setUsuario] = useState(undefined)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/app')
      else setUsuario(data.session.user)
    })
  }, [router])
  return usuario
}

// Una cancha por id. cancha = undefined mientras carga, null si no existe.
export function useCancha(id, usuario) {
  const [cancha, setCancha] = useState(undefined)
  const [error, setError] = useState(false)
  async function cargar() {
    setError(false)
    const { data, error } = await supabase.from('canchas_resumen').select('*').eq('id', id).maybeSingle()
    if (error) setError(true)
    else setCancha(data ? { ...data, variante: 0 } : null)
  }
  useEffect(() => {
    if (usuario) cargar()
  }, [id, usuario]) // eslint-disable-line react-hooks/exhaustive-deps
  return { cancha, error, cargar }
}

// Cantidad de notificaciones sin leer del usuario
export function useNoLeidas(usuario) {
  const [cantidad, setCantidad] = useState(0)
  useEffect(() => {
    if (!usuario) return
    supabase
      .from('notificaciones')
      .select('id')
      .eq('leida', false)
      .limit(20)
      .then(({ data }) => setCantidad((data || []).length))
  }, [usuario])
  return cantidad
}

// Favoritos: se guardan en la cuenta
export function useFavoritos() {
  const [favoritos, setFavoritos] = useState([])
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return
      const r = await supabase.from('favoritos').select('cancha_id')
      setFavoritos((r.data || []).map((f) => f.cancha_id))
    })
  }, [])
  function alternar(id) {
    const esta = favoritos.includes(id)
    setFavoritos(esta ? favoritos.filter((f) => f !== id) : [...favoritos, id])
    if (esta) supabase.from('favoritos').delete().eq('cancha_id', id).then(() => {})
    else supabase.from('favoritos').insert({ cancha_id: id }).then(() => {})
  }
  return [favoritos, alternar]
}

// ───── Fechas y turnos ─────
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const dos = (n) => String(n).padStart(2, '0')
export const fechaISO = (d) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`
export const deISO = (iso, hora = '00:00') => {
  const [a, m, d] = iso.split('-').map(Number)
  const [h, mi] = hora.split(':').map(Number)
  return new Date(a, m - 1, d, h, mi)
}
export const partesFecha = (d) => ({ dia: DIAS[d.getDay()], numero: d.getDate(), mes: MESES[d.getMonth()] })
export const fechaCorta = (d) => `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`
export const horaTexto = (minutos) => `${dos(Math.floor(minutos / 60) % 24)}:${dos(minutos % 60)}`
export const duracionTexto = (min) => (min === 60 ? '1 h' : min === 90 ? '1 h 30' : '2 h')
export const proximosDias = (n = 7) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + i)
    return d
  })

// Horario pico: de 19 a 22 h el turno cuesta 20 % más
export const esPico = (hora) => hora >= 19 && hora <= 21
export const precioTurno = (cancha, hora, minutos, promo) =>
  Math.round((cancha.precio_hora * (minutos / 60) * (esPico(hora) ? 1.2 : 1) * (promo ? 1 - promo.descuento / 100 : 1)) / 100) * 100

// Promoción que aplica a un día y hora (la de mayor descuento)
export const mejorPromo = (promos, fecha, hora) =>
  (promos || [])
    .filter((p) => p.activa && p.dias.includes(fecha.getDay()) && hora >= p.hora_desde && hora < p.hora_hasta)
    .sort((a, b) => b.descuento - a.descuento)[0] || null
export async function promosDe(canchaId) {
  const { data } = await supabase.from('promociones').select('*').eq('cancha_id', canchaId).eq('activa', true)
  return data || []
}
const DIAS_PROMO = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
export const textoPromo = (p) =>
  `${p.descuento} % off · ${p.dias.length === 7 ? 'todos los días' : p.dias.map((d) => DIAS_PROMO[d]).join(', ')} · ${p.hora_desde} a ${p.hora_hasta} h`

// Precios de ejemplo del equipamiento en alquiler
export const EQUIPOS = {
  Pelotas: { nombre: 'Pelota', precio: 3000, unidad: 'por turno' },
  Pecheras: { nombre: 'Pecheras (juego de 10)', precio: 4000, unidad: 'por turno' },
  Botines: { nombre: 'Botines', precio: 5000, unidad: 'por par' },
  Paletas: { nombre: 'Paleta de pádel', precio: 4000, unidad: 'por unidad' },
  Raquetas: { nombre: 'Raqueta de tenis', precio: 5000, unidad: 'por unidad' },
}

// ¿El rango [inicio, inicio + minutos) está libre? `ocupados` viene de turnos_ocupados()
export function rangoLibre(ocupados, inicioMin, minutos) {
  return !ocupados.some((o) => {
    const [h, m] = o.hora_inicio.split(':').map(Number)
    const ini = h * 60 + m
    return inicioMin < ini + o.duracion_min && ini < inicioMin + minutos
  })
}

// Turnos (cada hora) de una cancha en un día
export function turnosDelDia(cancha, fecha, ocupados, ahora = new Date()) {
  if ((cancha.dias_cerrados || []).includes(fecha.getDay())) return []
  const turnos = []
  for (let h = cancha.abre; h < cancha.cierra; h++) {
    const inicio = new Date(fecha)
    inicio.setHours(h, 0, 0, 0)
    turnos.push({ hora: h, pico: esPico(h), pasado: inicio <= ahora, ocupado: !rangoLibre(ocupados, h * 60, 60) })
  }
  return turnos
}

export async function turnosOcupados(canchaId, fecha) {
  const { data } = await supabase.rpc('turnos_ocupados', { p_cancha: canchaId, p_fecha: fechaISO(fecha) })
  return data || []
}

// ───── Comunidad, perfil y liga ─────
export const NIVELES = ['Principiante', 'Intermedio', 'Avanzado']
export const CUPOS = { 'Fútbol 5': 10, 'Fútbol 7': 14, Pádel: 4, Tenis: 2, Básquet: 10, Vóley: 12 }
export const BARRIOS = {
  Palermo: [-34.5795, -58.4246], Belgrano: [-34.5627, -58.456], 'Villa Crespo': [-34.599, -58.438],
  Colegiales: [-34.5746, -58.4495], Almagro: [-34.6098, -58.421], Caballito: [-34.6186, -58.441],
  Núñez: [-34.545, -58.461], Recoleta: [-34.588, -58.396], 'Villa Urquiza': [-34.573, -58.487],
  Chacarita: [-34.587, -58.454], 'San Telmo': [-34.621, -58.372], Flores: [-34.629, -58.463],
}
export const primerNombre = (n) => (n || 'Jugador').split(' ')[0]
export const iniciales = (n) => (n || 'J').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
export const codigoReserva = (id) => `JTK-${id.slice(0, 6).toUpperCase()}`

// "Hoy 21:00", "Mañana 19:30", "Sáb 14 nov 11:00"
export function cuandoEs(fecha, hora) {
  const d = deISO(fecha, hora)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const dias = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - hoy) / 86400000)
  const h = hora.slice(0, 5)
  return dias === 0 ? `Hoy ${h}` : dias === 1 ? `Mañana ${h}` : `${fechaCorta(d)} ${h}`
}

// Desafíos e insignias: se calculan con los puntos que registra la base
export const DESAFIOS = [
  { id: 'r1', nombre: 'Primer turno', detalle: 'Hacé tu primera reserva', clave: 'reservas', meta: 1 },
  { id: 'r5', nombre: 'Habitué', detalle: 'Reservá 5 turnos', clave: 'reservas', meta: 5 },
  { id: 'c1', nombre: 'Crítico', detalle: 'Calificá una cancha', clave: 'resenas', meta: 1 },
  { id: 'c5', nombre: 'Voz del barrio', detalle: 'Calificá 5 canchas', clave: 'resenas', meta: 5 },
  { id: 'f1', nombre: 'Fotógrafo', detalle: 'Subí una foto de una cancha', clave: 'fotos', meta: 1 },
  { id: 'p3', nombre: 'Se prende a todas', detalle: 'Sumate a 3 partidos', clave: 'partidos', meta: 3 },
  { id: 't1', nombre: 'Competidor', detalle: 'Inscribí un equipo en un torneo', clave: 'torneos', meta: 1 },
  { id: 'j3', nombre: 'Fair play', detalle: 'Evaluá a 3 jugadores', clave: 'fairplay', meta: 3 },
]
export function conteos(puntos) {
  const n = (m) => puntos.filter((p) => p.motivo === m).length
  return {
    reservas: Math.max(0, n('Reserva confirmada') - n('Reserva cancelada')),
    resenas: n('Reseña de una cancha'), fotos: n('Foto de una cancha'), partidos: n('Se sumó a un partido'),
    torneos: n('Inscripción a un torneo'), fairplay: n('Evaluó a un jugador'),
    total: puntos.reduce((t, p) => t + p.cantidad, 0),
  }
}
export async function puntosDe(userId) {
  const { data } = await supabase.from('puntos').select('motivo, cantidad, created_at').eq('user_id', userId).order('created_at', { ascending: false })
  return data || []
}
