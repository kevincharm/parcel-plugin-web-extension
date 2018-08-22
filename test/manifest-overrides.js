const { bundlerWithPlugin, assertBundleTree } = require('./utils')
const assert = require('assert')

describe('Manifest overrides', () => {
    let nodeEnv
    beforeEach(() => {
        nodeEnv = process.env.NODE_ENV
    })
    afterEach(() => {
        process.env.NODE_ENV = nodeEnv
    })

    it('should merge manifest.json with manifest.development.json in NODE_ENV=development', async () => {
        process.env.NODE_ENV = 'development'
        const bundler = await bundlerWithPlugin(
            __dirname + '/integration/manifest-overrides/manifest.json'
        )
        const bundle = await bundler.bundle()

        await assertBundleTree(bundle, {
            type: 'json',
            assets: ['manifest.json'],
            childBundles: [{ name: 'content_script.js' }]
        })
        const finalManifest = JSON.parse(bundle.entryAsset.generated.json)
        assert.deepStrictEqual(finalManifest, {
            manifest_version: 2,
            name: 'parcel-web-extension-test',
            version: '1.0.0',
            permissions: [],
            content_scripts: [
                {
                    matches: ['<all_urls>'],
                    js: ['content_script.js'],
                    run_at: 'document_start'
                }
            ],
            content_security_policy:
                "script-src 'self' 'unsafe-eval'; object-src 'self'"
        })
    })

    it('should merge manifest.json with manifest.production.json when NODE_ENV=production', async () => {
        process.env.NODE_ENV = 'production'
        const bundler = await bundlerWithPlugin(
            __dirname + '/integration/manifest-overrides/manifest.json'
        )
        const bundle = await bundler.bundle()

        await assertBundleTree(bundle, {
            type: 'json',
            assets: ['manifest.json'],
            childBundles: [{ name: 'content_script.js' }]
        })
        const finalManifest = JSON.parse(bundle.entryAsset.generated.json)
        assert.deepStrictEqual(finalManifest, {
            manifest_version: 2,
            name: 'parcel-web-extension-test',
            version: '1.0.0',
            permissions: [],
            content_scripts: [
                {
                    matches: ['<all_urls>'],
                    js: ['content_script.js'],
                    run_at: 'document_start'
                }
            ],
            externally_connectable: {
                ids: ['aaa', 'bbb'],
                matches: ['https://*.google.com/*', '*://*.chromium.org/*']
            }
        })
    })
})
