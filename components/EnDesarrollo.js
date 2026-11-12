'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { supabase } from '@/lib/supabase'

export default function EnDesarrollo() {
  const [conSesion, setConSesion] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setConSesion(Boolean(data.session)))
  }, [])

  return (
    <main className="dev">
      <Link href="/" className="dev-logo"><Logo height={36} /></Link>
      <h1>Página en desarrollo</h1>
      <p>
        Juntik es un proyecto académico de la Universidad de Palermo. Estamos construyendo esta sección.
      </p>
      <p>
        Para más información, escribinos a{' '}
        <a href="mailto:somos@juntik.com">somos@juntik.com</a>.
      </p>
      <div className="dev-acciones">
        {conSesion ? (
          <Link href="/app/explorar" className="boton boton-verde">Volver a Explorar</Link>
        ) : (
          <>
            <Link href="/app" className="boton boton-verde">Iniciar sesión</Link>
            <Link href="/app/registro" className="boton boton-borde">Crear mi cuenta</Link>
          </>
        )}
      </div>
      <span className="dev-pie">Universidad de Palermo · 2026</span>
    </main>
  )
}
