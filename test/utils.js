const path = require('path')
const fs = require('fs')
const assert = require('assert')
const Bundler = require('parcel-bundler')
const WebExtensionPlugin = require('../src/index')

function removeHash(filename) {
    let match = /^(.+)\.[0-9abcdef]{8}(\.[^\.]+)$/.exec(filename)
    return match ? match[1] + match[2] : filename
}

async function bundlerWithPlugin(file, opts) {
    const b = new Bundler(
        file,
        Object.assign(
            {
                outDir: path.join(__dirname, 'dist'),
                watch: false,
                cache: false,
                killWorkers: false,
                hmr: false,
                logLevel: 0,
                contentHash: false
            },
            opts
        )
    )
    await WebExtensionPlugin(b)
    return b
}

async function assertBundleTree(bundle, tree) {
    if (tree.name) {
        assert.equal(
            removeHash(path.basename(bundle.name)),
            tree.name,
            'bundle names mismatched'
        )
    }

    if (tree.type) {
        assert.equal(
            bundle.type.toLowerCase(),
            tree.type.toLowerCase(),
            'bundle types mismatched'
        )
    }

    if (tree.assets) {
        assert.deepEqual(
            Array.from(bundle.assets)
                .map(a => a.basename)
                .sort(),
            tree.assets.sort()
        )
    }

    let childBundles = Array.isArray(tree) ? tree : tree.childBundles
    if (childBundles) {
        let children = Array.from(bundle.childBundles).sort((a, b) =>
            Array.from(a.assets).sort()[0].basename <
            Array.from(b.assets).sort()[0].basename
                ? -1
                : 1
        )
        assert.equal(
            bundle.childBundles.size,
            childBundles.length,
            'expected number of child bundles mismatched'
        )
        await Promise.all(
            childBundles.map((b, i) => assertBundleTree(children[i], b))
        )
    }

    if (/js|css/.test(bundle.type)) {
        assert(
            fs.existsSync(bundle.name),
            `expected file does not exist (${bundle.name})`
        )
    }
}

module.exports = {
    bundlerWithPlugin,
    assertBundleTree,
    removeHash
}
