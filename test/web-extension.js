const { bundlerWithPlugin, assertBundleTree } = require('./utils')

describe('WebExtension', () => {
    it('should produce a basic WebExtension bundle', async () => {
        const bundler = await bundlerWithPlugin(
            __dirname + '/integration/web-extension/manifest.json'
        )
        const bundle = await bundler.bundle()

        await assertBundleTree(bundle, {
            type: 'json',
            assets: ['manifest.json'],
            childBundles: [
                { name: 'background_script.js' },
                { name: 'content_script.css' },
                { name: 'content_script.js' },
                { name: 'favicon.ico' },
                { name: 'inject.js' },
                { name: 'popup.html' }
            ]
        })
    })
})
