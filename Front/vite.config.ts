import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        host: true,
        port: 4200,
        allowedHosts: ['budget.cristobaljjg.com']
    },
    build: {
        target: 'es2020'
    }
})
