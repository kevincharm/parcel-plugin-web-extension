const path = require('path')
const glob = require('fast-glob')

function WebExtensionPlugin(bundler) {
    bundler.addAssetType('json', require.resolve('./ManifestAsset'))

    const options = bundler.options
    const locales = glob.sync(
        path.resolve(options.rootDir, '_locales/**/messages.json')
    )
    bundler.entryFiles.push(...locales)
}

module.exports = WebExtensionPlugin
