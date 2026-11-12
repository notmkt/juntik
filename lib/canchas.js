'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export const DEPORTES = ['Todos', 'Fútbol 5', 'Fútbol 7', 'Pádel', 'Tenis', 'Básquet', 'Vóley']

// Horarios de ejemplo (la base todavía no tiene columna de horario; si se agrega `horario`, se usa esa)
const HORARIOS = {
  'Arena Caballito': 'Todos los días · 8 a 24 h',
  'Club Tenis Parque': 'Todos los días · 8 a 22 h',
  'Complejo La Redonda': 'Todos los días · 9 a 24 h',
  'La Canchita de Almagro': 'Lun a sáb · 10 a 23 h',
  'Núñez Pádel & Fútbol': 'Todos los días · 8 a 23 h',
  'Pádel Club Norte': 'Todos los días · 7 a 23 h',
  'Polideportivo Plaza Verde': 'Lun a sáb · 9 a 22 h',
  'Recoleta Sports': 'Todos los días · 8 a 21 h',
}
export const horarioDe = (c) => c.horario || HORARIOS[c.nombre] || 'Todos los días · 9 a 23 h'

const lista = new Intl.ListFormat('es', { style: 'long', type: 'conjunction' })
const numero = new Intl.NumberFormat('es-AR')
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
