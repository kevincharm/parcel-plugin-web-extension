const { bundlerWithPlugin, assertBundleTree } = require('./utils')

describe('chrome_url_overrides', () => {
    it('should handle chrome_url_overrides options', async () => {
        const bundler = await bundlerWithPlugin(
            __dirname + '/integration/chrome-url-overrides/manifest.json'
        )
        const bundle = await bundler.bundle()

        await assertBundleTree(bundle, {
            type: 'json',
            assets: ['manifest.json'],
            childBundles: [
                { name: 'bookmarks.html' },
                { name: 'history.html' },
                { name: 'newtab.html' }
            ]
        })
    })
})
