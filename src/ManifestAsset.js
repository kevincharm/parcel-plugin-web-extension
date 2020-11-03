const path = require('path')
const upath = require('upath')
const glob = require('fast-glob')
const Asset = require('parcel-bundler/src/Asset')
const JSONAsset = require('parcel-bundler/src/assets/JSONAsset')
const fs = require('@parcel/fs')

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
        this.dependencyProcessors = {
            background: this.processBackground,
            content_scripts: this.processContentScripts,
            web_accessible_resources: this.processWebAccessibleResources,
            browser_action: this.processBrowserAction,
            page_action: this.processPageAction,
            icons: this.processIcons,
            options_ui: this.processOptionsUi,
            options_page: this.processOptionsPage,
            chrome_url_overrides: this.processURLOverrides
        }

        this.replaceBundleNames = bundleNameMap => {
            // copied from https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/Asset.js#L253
            let copied = false
            for (let key in this.generated) {
                let value = this.generated[key]
                if (typeof value === 'string') {
                    // Replace temporary bundle names in the output with the final content-hashed names.
                    let newValue = value
                    for (let [name, map] of bundleNameMap) {
                        // replace windows paths with POSIX ones
                        map = upath.toUnix(map)
                        newValue = newValue.split(name).join(map)
                    }

                    // Copy `this.generated` on write so we don't end up writing the final names to the cache.
                    if (newValue !== value && !copied) {
                        this.generated = Object.assign({}, this.generated)
                        copied = true
                    }

                    this.generated[key] = newValue
                }
            }
        }
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

    processBackground() {
        const background = this.ast.background
        if (Array.isArray(background.scripts)) {
            background.scripts = this.processMultipleDependencies(
                background.scripts
            )
        }
        if (background.page) {
            background.page = this.processSingleDependency(background.page)
        }
    }

    processURLOverrides() {
        const urlOverrides = this.ast.chrome_url_overrides
        if (urlOverrides.bookmarks) {
            urlOverrides.bookmarks = this.processSingleDependency(
                urlOverrides.bookmarks
            )
        }
        if (urlOverrides.newtab) {
            urlOverrides.newtab = this.processSingleDependency(
                urlOverrides.newtab
            )
        }
        if (urlOverrides.history) {
            urlOverrides.history = this.processSingleDependency(
                urlOverrides.history
            )
        }
    }

    processContentScripts() {
        const contentScripts = this.ast.content_scripts
        if (!Array.isArray(contentScripts)) {
            return
        }
        for (const script of contentScripts) {
            if (script.js) {
                script.js = this.processMultipleDependencies(script.js)
            }
            if (script.css) {
                script.css = this.processMultipleDependencies(script.css)
            }
        }
    }

    processWebAccessibleResources() {
        const webAccessibleResources = this.ast.web_accessible_resources
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

        this.ast.web_accessible_resources = this.processMultipleDependencies(
            resolvedPaths
        )
    }

    processBrowserAction() {
        const action = this.ast.browser_action
        if (!action) {
            return
        }

        if (action.default_popup) {
            action.default_popup = this.processSingleDependency(
                action.default_popup
            )
        }
        const defaultIcon = action.default_icon
        if (defaultIcon) {
            action.default_icon =
                typeof defaultIcon === 'string'
                    ? this.processSingleDependency(defaultIcon)
                    : this.processAllIcons(defaultIcon)
        }

        const themeIcons = action.theme_icons;
        if (themeIcons) {
            action.theme_icons = themeIcons.map(this.processThemeIcon.bind(this))
        }
    }

    processPageAction() {
        const action = this.ast.page_action
        if (!action) {
            return
        }

        if (action.default_popup) {
            action.default_popup = this.processSingleDependency(
                action.default_popup
            )
        }
        const defaultIcon = action.default_icon
        if (defaultIcon) {
            action.default_icon =
                typeof defaultIcon === 'string'
                    ? this.processSingleDependency(defaultIcon)
                    : this.processAllIcons(defaultIcon)
        }
    }

    processOptionsPage() {
        // Chrome
        const optionsPage = this.ast.options_page
        if (typeof optionsPage === 'string') {
            this.ast.options_page = this.processSingleDependency(optionsPage)
        }
    }

    processOptionsUi() {
        // FF
        const optionsUi = this.ast.options_ui
        if (optionsUi && optionsUi.page) {
            optionsUi.page = this.processSingleDependency(optionsUi.page)
        }
    }

    processAllIcons(icons) {
        for (const size of Object.keys(icons)) {
            icons[size] = this.processSingleDependency(icons[size])
        }
        return icons
    }

    processIcons() {
        const icons = this.ast.icons
        this.processAllIcons(icons)
    }

    processThemeIcon(iconSet) {
        const light = iconSet.light;
        if (light) iconSet.light = this.processSingleDependency(light);
 
        const dark = iconSet.dark;
        if (dark) iconSet.dark = this.processSingleDependency(dark);

        return iconSet;
    }

    collectDependenciesForWebExtension() {
        for (const nodeName of Object.keys(this.ast)) {
            const processor = this.dependencyProcessors[nodeName]
            if (processor) {
                processor.call(this)
                this.isAstDirty = true
            }
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
        return requiredKeys.every(key => !!this.ast[key])
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
