import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import Navbar from '../components/Navbar'
import './globals.css'

export const metadata = {
  title: 'CampusNotify',
  description: 'Campus notification platform'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <Navbar />
          <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>{children}</main>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
