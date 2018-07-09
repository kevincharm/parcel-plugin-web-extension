const { bundlerWithPlugin, assertBundleTree } = require('./utils')

describe('WebExtension', () => {
    it('should produce a basic WebExtension bundle', async () => {
        const bundler = await bundlerWithPlugin(
            __dirname + '/integration/web-extension/manifest.json'
        )
        const bundle = await bundler.bundle()

        const childBundles = Array.from(bundle.childBundles.values())
        const mainBundle = childBundles[0]
        await assertBundleTree(mainBundle, {
            type: 'json',
            assets: ['manifest.json'],
            childBundles: [
                { name: 'background_script.js' },
                { name: 'content_script.css' },
                { name: 'content_script.js' },
                { name: 'favicon.ico' },
                { name: 'inject.js' },
                { name: 'options.html' },
                { name: 'popup.html' }
            ]
        })

        const enLocaleBundle = childBundles[1]
        await assertBundleTree(enLocaleBundle, {
            type: 'json',
            assets: ['messages.json']
        })
    })
})
