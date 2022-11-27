import { resolve } from 'path'
import { defineConfig } from 'vite'
import babel from 'vite-plugin-babel'
import dts from 'vite-plugin-dts'

/** @type {import('vite').UserConfig} */
export default defineConfig({
    plugins: [
        babel(),
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
            fileName: () => 'suiweb.js',
        },
        outDir: 'dist',
        emptyOutDir: true,
    },
})
