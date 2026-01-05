import { defineConfig } from 'vite'

// Allow host for external access (e.g. budget.cristobaljjg.com)
export default defineConfig({
    server: {
        allowedHosts: ['budget.cristobaljjg.com']
    }
})
