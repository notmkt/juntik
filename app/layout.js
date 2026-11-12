import './globals.css'

export const metadata = {
  title: 'Juntik — Juntate a jugar',
  applicationName: 'Juntik',
  appleWebApp: { capable: true, title: 'Juntik', statusBarStyle: 'default' },
  description: 'Juntik conecta personas y grupos que quieren hacer deporte con canchas y espacios deportivos. Proyecto académico de la Universidad de Palermo.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#F7F8F5',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
