const { promisify } = require('util')
const zipDir = promisify(require('zip-dir'))
const path = require('path')
const fs = require('parcel-bundler/src/utils/fs')
const Packager = require('parcel-bundler/src/packagers/Packager')

class WebExtensionPackager extends Packager {
    async addAsset(asset) {
        const artifactsDir = path.resolve(
            asset.options.outDir,
            '..',
            'artifacts'
        )
        await fs.mkdirp(artifactsDir)

        // Write the manifest.json
        const bundlePath = path.parse(this.bundle.name)
        const contents = await this.resolveAssetContents(asset)
        const manifestJsonFilename = path.resolve(
            bundlePath.dir,
            bundlePath.name + '.json'
        )
        await fs.writeFile(manifestJsonFilename, contents, { encoding: 'utf8' })

        // Package the extension (XPI/CRX)
        const zipped = await zipDir(this.options.outDir)
        const zippedFilename = path.resolve(
            artifactsDir,
            bundlePath.name + '.zip'
        )
        this.size = zipped.length
        await fs.writeFile(zippedFilename, zipped)
    }

    async resolveAssetContents(asset) {
        let contents = asset.generated[this.bundle.type]
        if (!contents || (contents && contents.path)) {
            contents = await fs.readFile(contents ? contents.path : asset.name)
        }
        // Create sub-directories if needed
        if (this.bundle.name.includes(path.sep)) {
            await fs.mkdirp(path.dirname(this.bundle.name))
        }
        return contents
    }

    setup() {}

    end() {}

    getSize() {
        return this.size || 0
    }
}

module.exports = WebExtensionPackager
