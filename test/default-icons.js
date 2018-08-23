const { bundlerWithPlugin, assertBundleTree } = require('./utils')

describe('Default icons', () => {
    it('should handle default_icons specified as strings or objects', async () => {
        const bundler = await bundlerWithPlugin(
            __dirname + '/integration/default-icons/manifest.json'
        )
        const bundle = await bundler.bundle()

        await assertBundleTree(bundle, {
            type: 'json',
            assets: ['manifest.json'],
            childBundles: [
                { name: 'favicon-16.ico' },
                { name: 'favicon-32.ico' },
                { name: 'favicon-64.ico' }
            ]
        })
    })
})
