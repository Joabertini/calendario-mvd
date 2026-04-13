import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Cambiá 'calendario-mvd' si renombrás el repo
  base: '/calendario-mvd/',
})
