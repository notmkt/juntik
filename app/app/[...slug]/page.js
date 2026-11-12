import EnDesarrollo from '@/components/EnDesarrollo'
import CerrarSesion from '@/components/CerrarSesion'

// Cualquier pantalla del app que todavía no existe (ej.: /app/explorar, /app/mapa)
export default function AppEnDesarrollo() {
  return (
    <>
      <EnDesarrollo volverA="/app" textoVolver="Volver al app" />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 16, textAlign: 'center' }}>
        <CerrarSesion />
      </div>
    </>
  )
}
