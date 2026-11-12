export const metadata = {
  title: 'Juntik App',
}

// juntik.com/app — siempre en formato celular
export default function AppLayout({ children }) {
  return (
    <div className="app-afuera">
      <div className="app-marco">{children}</div>
    </div>
  )
}
