'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Muestra quién está logueado y permite salir (solo si hay sesión)
export default function CerrarSesion() {
  const router = useRouter()
  const [nombre, setNombre] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      if (u) setNombre(u.user_metadata?.full_name || u.email)
    })
  }, [])

  if (!nombre) return null

  async function salir() {
    await supabase.auth.signOut()
    router.replace('/app')
  }

  return (
    <p className="dev-pie">
      Sesión iniciada como <b>{nombre}</b> ·{' '}
      <button type="button" onClick={salir} style={{ background: 'none', border: 'none', padding: '10px 4px', color: 'var(--tinta)', fontWeight: 800, fontSize: 13, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'var(--verde)', textDecorationThickness: 2 }}>
        Cerrar sesión
      </button>
    </p>
  )
}
