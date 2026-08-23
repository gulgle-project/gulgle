# Gulgle Chrome extension

This Manifest V3 extension configures Gulgle as Chrome's new tab page, homepage,
startup page, and default search provider. The new tab is a stripped-down build
of the web app's shared start-page components, and the extension asks for no
permissions.

## Build and load in Chrome

From the repository root:

```sh
pnpm build:extension
```

Then open `chrome://extensions`, enable **Developer mode**, choose **Load
unpacked**, and select `apps/extension/dist`.

After editing the manifest or icons, run the build command again and select the
extension's **Reload** button on `chrome://extensions`.

Open a new tab after reloading the extension to verify the new tab override.

Chrome allows only one extension to control a particular setting. Disable any
other extension that overrides the homepage, startup pages, or search provider
while testing Gulgle.

## Chrome Web Store publishing

The developer account that publishes the extension must verify ownership of
`gulgle.link` through Google Search Console before the settings overrides can be
published.
