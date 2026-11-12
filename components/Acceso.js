'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const DESTINO = '/app/explorar'

function traducirError(msg = '') {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'Email o contraseña incorrectos.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'Ya existe una cuenta con ese email. Probá iniciar sesión.'
  if (m.includes('password should be at least') || m.includes('weak')) return 'La contraseña tiene que tener al menos 6 caracteres.'
  if (m.includes('email not confirmed')) return 'Tenés que confirmar tu email antes de entrar. Revisá tu casilla.'
  if (m.includes('invalid') && m.includes('email')) return 'Ese email no es válido.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Demasiados intentos. Esperá un momento y probá de nuevo.'
  return 'Algo salió mal. Probá de nuevo en un momento.'
}

export default function Acceso({ modo }) {
  const esRegistro = modo === 'registro'
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  // Si ya hay sesión, entrar directo
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(DESTINO)
    })
  }, [router])

  async function enviar(e) {
    e.preventDefault()
    setError('')
    setOk('')
    if (esRegistro && nombre.trim().split(/\s+/).length < 2) {
      setError('Escribí tu nombre y apellido.')
      return
    }
    if (clave.length < 6) {
      setError('La contraseña tiene que tener al menos 6 caracteres.')
      return
    }
    setCargando(true)
    if (esRegistro) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: clave,
        options: { data: { full_name: nombre.trim() } },
      })
      setCargando(false)
      if (error) return setError(traducirError(error.message))
      if (data.session) return router.replace(DESTINO)
      setOk('¡Cuenta creada! Te enviamos un email para confirmarla. Después iniciá sesión.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: clave })
      setCargando(false)
      if (error) return setError(traducirError(error.message))
      router.replace(DESTINO)
    }
  }

  return (
    <main className="acceso">
      <div className="acceso-marca">
        <Link href="/" className="acceso-logo">juntik</Link>
        <h1>{esRegistro ? 'Creá tu cuenta' : '¡Hola de nuevo!'}</h1>
        <p className="acceso-sub">
          {esRegistro
            ? 'Encontrá canchas, armá partidos y conocé gente para jugar.'
            : 'Iniciá sesión para reservar canchas y sumarte a partidos.'}
        </p>
      </div>

      <form className="form" onSubmit={enviar} noValidate>
        {esRegistro && (
          <div className="campo">
            <label htmlFor="nombre">Nombre completo</label>
            <input id="nombre" type="text" autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>
        )}
        <div className="campo">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="campo">
          <label htmlFor="clave">Contraseña</label>
          <input id="clave" type="password" autoComplete={esRegistro ? 'new-password' : 'current-password'} value={clave} onChange={(e) => setClave(e.target.value)} required minLength={6} />
          {esRegistro && <span className="campo-ayuda">Mínimo 6 caracteres.</span>}
        </div>

        {error && <div className="aviso aviso-error" role="alert">{error}</div>}
        {ok && <div className="aviso aviso-ok" role="status">{ok}</div>}

        <button type="submit" className="boton boton-verde" disabled={cargando}>
          {cargando ? 'Un momento…' : esRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
        </button>
      </form>

      <p className="acceso-cambio">
        {esRegistro ? (
          <>¿Ya tenés cuenta? <Link href="/app">Iniciá sesión</Link></>
        ) : (
          <>¿Todavía no tenés cuenta? <Link href="/app/registro">Creá una</Link></>
        )}
      </p>

      <p className="acceso-pie">
        Juntik es un proyecto académico de la Universidad de Palermo.<br />
        Consultas: <a href="mailto:somos@juntik.com">somos@juntik.com</a>
      </p>
    </main>
  )
}
