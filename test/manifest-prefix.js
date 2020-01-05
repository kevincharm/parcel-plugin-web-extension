const { bundlerWithPlugin, assertBundleTree } = require('./utils')
const assert = require('assert')

describe('Manifest prefix', () => {
    let nodeEnv
    beforeEach(() => {
        nodeEnv = process.env.VENDOR
    })
    afterEach(() => {
        process.env.VENDOR = nodeEnv
    })

    it('should remain chrome prefix key when VENDOR=chrome', async () => {
        process.env.VENDOR = 'chrome'
        const bundler = await bundlerWithPlugin(
            __dirname + '/integration/manifest-prefix/manifest.json'
        )
        const bundle = await bundler.bundle()

        await assertBundleTree(bundle, {
            type: 'json',
            assets: ['manifest.json'],
            childBundles: [
                { name: 'content_script.js' }
            ]
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
            options_ui: {
                chrome_style: true,
                open_in_tab: false
            },
            minimum_chrome_version: '72.0'
        })
    })

    it('should remain firefox prefix key when VENDOR=firefox', async () => {
        process.env.VENDOR = 'firefox'
        const bundler = await bundlerWithPlugin(
            __dirname + '/integration/manifest-prefix/manifest.json'
        )
        const bundle = await bundler.bundle()

        await assertBundleTree(bundle, {
            type: 'json',
            assets: ['manifest.json'],
            childBundles: [
                { name: 'content_script.js' }
            ]
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
            options_ui: {
                browser_style: true,
                open_in_tab: false
            },
            browser_specific_settings: {
                gecko: {
                    id: 'test@addon.com',
                    strict_min_version: '63.0'
                }
            }
        })
    })
})
