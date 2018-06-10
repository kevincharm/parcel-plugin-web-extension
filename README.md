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

## Licence

Apache 2.0
