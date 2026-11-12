import { Simbolo } from '@/components/Logo'
import { urlFoto } from '@/lib/canchas'

const COLOR = ['#20D68A', '#101828', '#C8F36A']

// Foto de portada de la cancha; si no tiene, una portada con el símbolo de la marca
export default function Portada({ cancha, className = '', simbolo = 190, children }) {
  const foto = urlFoto(cancha.foto_portada)
  const v = cancha.variante || 0
  return (
    <span className={`portada ${className}${!foto && v === 1 ? ' alt' : ''}`}>
      {foto ? <img src={foto} alt="" loading="lazy" /> : <Simbolo size={simbolo} color={COLOR[v]} />}
      {!foto && children}
    </span>
  )
}
