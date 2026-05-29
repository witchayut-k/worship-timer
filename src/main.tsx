import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { applyFlashBlinkCssVars } from './config/app.config'
import { LocaleProvider } from './i18n/LocaleProvider'
import { appRoutes } from './routes'
import './index.css'
import './styles/stage/index.scss'

applyFlashBlinkCssVars()

const router = createBrowserRouter(appRoutes)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <RouterProvider router={router} />
    </LocaleProvider>
  </StrictMode>,
)
