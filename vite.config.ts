import { defineConfig } from 'vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    publicDir: 'public', // This will copy everything from public/ to dist/
    build: {
        minify: false,
        rollupOptions: {
            input: {
                background: resolve(__dirname, 'src/background.ts'),
                content: resolve(__dirname, 'src/content.ts')
            },
            output: {
                entryFileNames: '[name].js',
                format: 'cjs'
            }
        }
    }
})
