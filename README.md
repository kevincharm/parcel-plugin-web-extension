[![Build Status](https://travis-ci.org/kevincharm/parcel-plugin-web-extension.svg?branch=master)](https://travis-ci.org/kevincharm/parcel-plugin-web-extension)

# parcel-plugin-web-extension

This [parcel](https://github.com/parcel-bundler/parcel) plugin enables you to use a WebExtension `manifest.json` as an entry point. For more information about `manifest.json`, please refer to the [MDN docs](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/manifest.json).

## Installation

Install via npm:
```sh
npm install --save-dev parcel-plugin-web-extension
```
or via yarn:
```sh
yarn add -D parcel-plugin-web-extension
```

## Usage

### Quick Start

After installing this plugin, use `manifest.json` as your entry point, like so:
```sh
parcel src/manifest.json
```
Your assets will now be resolved from the contents of your manifest file.

Assets resolved by this plugin:
- `background.scripts`
- `background.page`
- `content_scripts`
- `browser_action.default_popup`
- `browser_action.default_icon`
- `page_action.default_popup`
- `page_action.default_icon`
- `icons`
- `web_accessible_resources`
- `chrome_url_overrides.bookmarks`
- `chrome_url_overrides.newtab`
- `chrome_url_overrides.history`

### Environments

This plugin will try to resolve and merge environment-specific manifest files in the format `manifest.${NODE_ENV}.json`. For example, in development, you can run:
```sh
NODE_ENV=development parcel src/manifest.json
```
and the plugin will also look for `manifest.development.json` and merge those keys into the base manifest.

## Licence

Apache 2.0
