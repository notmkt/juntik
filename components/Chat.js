'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { primerNombre } from '@/lib/canchas'

// Chat de un partido o de un grupo (solo para quienes están adentro)
export default function Chat({ partidoId, grupoId, usuario }) {
  const [mensajes, setMensajes] = useState(null)
  const [texto, setTexto] = useState('')
  const [error, setError] = useState('')
  const fin = useRef(null)
  const filtro = partidoId ? ['partido_id', partidoId] : ['grupo_id', grupoId]

  async function cargar() {
    const { data } = await supabase.from('mensajes').select('id, texto, user_id, created_at, profiles(full_name)').eq(filtro[0], filtro[1]).order('created_at').limit(200)
    setMensajes(data || [])
  }
  useEffect(() => {
    cargar()
    const t = setInterval(cargar, 6000)
    return () => clearInterval(t)
  }, [partidoId, grupoId]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    fin.current?.scrollIntoView({ block: 'nearest' })
  }, [mensajes?.length])

  async function enviar(e) {
    e.preventDefault()
    const t = texto.trim()
    if (!t) return
    setError('')
    const { error } = await supabase.from('mensajes').insert({ [filtro[0]]: filtro[1], texto: t })
    if (error) return setError('No pudimos enviar el mensaje.')
    setTexto('')
    cargar()
  }

  return (
    <div className="chat">
      <div className="chat-lista" aria-live="polite">
        {mensajes === null && <span className="ex-sub">Cargando mensajes…</span>}
        {mensajes?.length === 0 && <span className="ex-sub">Todavía no hay mensajes. ¡Rompé el hielo!</span>}
        {(mensajes || []).map((m) => (
          <div key={m.id} className={`chat-msg${m.user_id === usuario.id ? ' mio' : ''}`}>
            {m.user_id !== usuario.id && <b>{primerNombre(m.profiles?.full_name)}</b>}
            <span>{m.texto}</span>
            <small>{new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</small>
          </div>
        ))}
        <div ref={fin} />
      </div>
      {error && <div className="aviso aviso-error" role="alert">{error}</div>}
      <form onSubmit={enviar}>
        <input value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={500} placeholder="Escribí un mensaje" aria-label="Mensaje" />
        <button type="submit" className="boton boton-verde" disabled={!texto.trim()}>Enviar</button>
      </form>
    </div>
  )
}
