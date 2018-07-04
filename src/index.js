function WebExtensionPlugin(bundler) {
    bundler.addAssetType('json', require.resolve('./ManifestAsset'))
    bundler.addPackager('@@webext', require.resolve('./WebExtensionPackager'))
}

module.exports = WebExtensionPlugin
