import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
    plugins: [
        dts({
            rollupTypes: true,
        }),
    ],
    build: {
        target: 'esnext',
        minify: true,
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'SuiWeb',
            formats: ['es'],
            fileName: () => 'suiweb.min.js',
        },
        outDir: 'dist/min.js',
        emptyOutDir: true,
    },
})
