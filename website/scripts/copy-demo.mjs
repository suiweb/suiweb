import cpy from 'cpy'
import { deleteAsync } from 'del'

async function copyFiles(source, destination) {
    await deleteAsync(`${destination}/*`)
    await cpy(source, destination)
}

copyFiles('../demos/**/*', './static/demos')
