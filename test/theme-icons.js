const { bundlerWithPlugin, assertBundleTree } = require('./utils')

describe('Theme icons', () => {
    it('should handle theme_icons for a browser_action specified as strings or objects', async () => {
        const bundler = await bundlerWithPlugin(
            __dirname + '/integration/theme-icons/manifest.json'
        )
        const bundle = await bundler.bundle()

        await assertBundleTree(bundle, {
            type: 'json',
            assets: ['manifest.json'],
            childBundles: [
                { name: 'favicon-dark-16.ico' },
                { name: 'favicon-dark-32.ico' },
                { name: 'favicon-light-16.ico' },
                { name: 'favicon-light-32.ico' }
            ]
        })
    })
})
