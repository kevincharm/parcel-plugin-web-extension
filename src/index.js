function WebExtensionPlugin(bundler) {
    bundler.addAssetType('json', require.resolve('./ManifestAsset'))
}

module.exports = WebExtensionPlugin
