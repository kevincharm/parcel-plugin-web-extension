const { bundlerWithPlugin, assertBundleTree } = require('./utils')

describe('Wildcard paths', () => {
    it('should handle path globbing in web_accessible_resources', async () => {
        const bundler = await bundlerWithPlugin(
            __dirname + '/integration/wildcard-paths/manifest.json'
        )
        const bundle = await bundler.bundle()

        await assertBundleTree(bundle, {
            type: 'json',
            assets: ['manifest.json'],
            childBundles: [
                { name: 'one-deep.js' },
                { name: 'two-deep.js' },
                { name: 'zero-deep-1.js' },
                { name: 'zero-deep-2.js' }
            ]
        })
    })
})
