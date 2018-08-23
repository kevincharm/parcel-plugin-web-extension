const path = require('path')
const glob = require('fast-glob')
const Asset = require('parcel-bundler/src/Asset')
const JSONAsset = require('parcel-bundler/src/assets/JSONAsset')
const fs = require('parcel-bundler/src/utils/fs')

/**
 * A shared asset that handles:
 * - PWA .webmanifest
 * - PWA manifest.json
 * - WebExtension manifest.json
 * - WebExtension _locales/<locale>/messages.json
 */
class ManifestAsset extends Asset {
    constructor(name, pkg, options) {
        super(name, pkg, options)

        this.kind = ManifestAsset.determineKind(name)
        if (!this.kind) {
            return new JSONAsset(...arguments)
        }

        this.type = this.kind === 'pwa-manifest' ? 'webmanifest' : 'json'
        this.isAstDirty = false
    }

    static determineKind(name) {
        const basename = path.basename(name)

        if (basename.endsWith('.webmanifest')) {
            return 'pwa-manifest'
        }

        if (basename === 'manifest.json') {
            return 'webext-manifest'
        }

        if (name.match(/_locales\/.+\/messages\.json/)) {
            return 'locale-messages'
        }

        return null
    }

    parse(code) {
        return JSON.parse(code)
    }

    // Overrides default load method
    async load() {
        const name = this.name
        const encoding = this.encoding
        if (path.basename(name) !== 'manifest.json') {
            return await fs.readFile(name, encoding)
        }

        const manifestDir = path.dirname(name)
        const rawBaseManifest = await fs.readFile(name, encoding)
        const baseManifest = JSON.parse(rawBaseManifest)

        // Merge overrides
        if (typeof process.env.NODE_ENV === 'string') {
            const envManifestPath = path.resolve(
                manifestDir,
                `manifest.${process.env.NODE_ENV}.json`
            )
            try {
                const rawEnvManifest = await fs.readFile(
                    envManifestPath,
                    encoding
                )
                const envManifest = JSON.parse(rawEnvManifest)
                Object.assign(baseManifest, envManifest)
            } catch (err) {
                // No valid override found. Don't error.
            }
        }

        return JSON.stringify(baseManifest)
    }

    processSingleDependency(path, opts) {
        opts = opts || { entry: true }
        return this.addURLDependency(path, opts)
    }

    processMultipleDependencies(filenames, opts) {
        return filenames.map(filename =>
            this.processSingleDependency(filename, opts)
        )
    }

    processBackground(nodeName) {
        if (nodeName !== 'background') {
            return
        }

        const background = this.ast[nodeName]
        if (Array.isArray(background.scripts)) {
            background.scripts = this.processMultipleDependencies(
                background.scripts
            )
            this.isAstDirty = true
        }
        if (background.page) {
            background.page = this.processSingleDependency(background.page)
            this.isAstDirty = true
        }
    }

    processContentScripts(nodeName) {
        if (nodeName !== 'content_scripts') {
            return
        }

        const contentScripts = this.ast[nodeName]
        if (!Array.isArray(contentScripts)) {
            return
        }
        for (const script of contentScripts) {
            if (script.js) {
                script.js = this.processMultipleDependencies(script.js)
                this.isAstDirty = true
            }
            if (script.css) {
                script.css = this.processMultipleDependencies(script.css)
                this.isAstDirty = true
            }
        }
    }

    processWebAccessibleResources(nodeName) {
        if (nodeName !== 'web_accessible_resources') {
            return
        }

        const webAccessibleResources = this.ast[nodeName]
        if (!Array.isArray(webAccessibleResources)) {
            return
        }

        // Handle wildcards and glob-patterns
        const resolvedPaths = webAccessibleResources
            .map(resource => {
                const dir = path.dirname(this.name)
                const globbedPaths = glob
                    .sync(path.resolve(dir, resource))
                    .map(res => path.relative(dir, res))
                return globbedPaths
            })
            .reduce((p, c) => p.concat(c), [])

        this.ast[nodeName] = this.processMultipleDependencies(resolvedPaths)
        this.isAstDirty = true
    }

    processBrowserOrPageAction(nodeName) {
        if (!['browser_action', 'page_action'].includes(nodeName)) {
            return
        }

        const action = this.ast[nodeName]
        if (action.default_popup) {
            action.default_popup = this.processSingleDependency(
                action.default_popup
            )
            this.isAstDirty = true
        }
        const defaultIcon = action.default_icon
        if (defaultIcon) {
            action.default_icon =
                typeof defaultIcon === 'string'
                    ? this.processSingleDependency(defaultIcon)
                    : this.processAllIcons(action.default_icon)

            this.isAstDirty = true
        }
    }

    processOptionsPage(nodeName) {
        if (!['options_ui', 'options_page'].includes(nodeName)) {
            return
        }

        const options = this.ast[nodeName]
        if (options.page) {
            options.page = this.processSingleDependency(options.page)
            this.isAstDirty = true
        } else if (options) {
            this.ast[nodeName] = this.processSingleDependency(options)
            this.isAstDirty = true
        }
    }

    processAllIcons(icons) {
        for (const size of Object.keys(icons)) {
            icons[size] = this.processSingleDependency(icons[size])
        }
    }

    processIcons(nodeName) {
        if (nodeName !== 'icons') {
            return
        }

        const icons = this.ast[nodeName]

        this.processAllIcons(icons)

        this.isAstDirty = true
    }

    collectDependenciesForWebExtension() {
        for (const nodeName of Object.keys(this.ast)) {
            this.processBackground(nodeName)
            this.processContentScripts(nodeName)
            this.processWebAccessibleResources(nodeName)
            this.processBrowserOrPageAction(nodeName)
            this.processOptionsPage(nodeName)
            this.processIcons(nodeName)
        }
    }

    collectDependenciesForPwa() {
        if (Array.isArray(this.ast.icons)) {
            for (let icon of this.ast.icons) {
                icon.src = this.addURLDependency(icon.src)
            }
        }

        if (Array.isArray(this.ast.screenshots)) {
            for (let shot of this.ast.screenshots) {
                shot.src = this.addURLDependency(shot.src)
            }
        }

        if (this.ast.serviceworker && this.ast.serviceworker.src) {
            this.ast.serviceworker.src = this.addURLDependency(
                this.ast.serviceworker.src
            )
        }
    }

    hasWebExtensionManifestKeys() {
        const requiredKeys = ['manifest_version', 'name', 'version']
        const presentKeys = Object.keys(this.ast).filter(key =>
            requiredKeys.includes(key)
        )
        return presentKeys.length === requiredKeys.length
    }

    collectDependencies() {
        if (['pwa-manifest', 'webext-manifest'].includes(this.kind)) {
            if (this.hasWebExtensionManifestKeys()) {
                this.collectDependenciesForWebExtension()
                return
            }

            this.type = 'webmanifest'
            this.collectDependenciesForPwa()
            return
        }
    }

    generate() {
        if (this.isAstDirty) {
            return JSON.stringify(this.ast)
        }

        return this.contents
    }
}

module.exports = ManifestAsset
