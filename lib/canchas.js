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

// Favoritos: se guardan en este navegador
const FAVORITOS = 'juntik:favoritos'
export function useFavoritos() {
  const [favoritos, setFavoritos] = useState([])
  useEffect(() => {
    try {
      setFavoritos(JSON.parse(localStorage.getItem(FAVORITOS)) || [])
    } catch {}
  }, [])
  function alternar(id) {
    setFavoritos((actual) => {
      const nuevo = actual.includes(id) ? actual.filter((f) => f !== id) : [...actual, id]
      try {
        localStorage.setItem(FAVORITOS, JSON.stringify(nuevo))
      } catch {}
      return nuevo
    })
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
export const precioTurno = (cancha, hora, minutos) =>
  Math.round((cancha.precio_hora * (minutos / 60) * (esPico(hora) ? 1.2 : 1)) / 100) * 100

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
