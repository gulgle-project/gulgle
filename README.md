# Gulgle - Custom bangs and more

DuckDuckGo's bang redirects are too slow. Add the following URL as a custom search engine to your browser. Enables all of ~~DuckDuckGo's~~ Kagi's bangs to work, but much faster.

```
https://gulgle.link?q=%s
```

## How is it that much faster?

DuckDuckGo does their redirects server side. Their DNS is...not always great. Result is that it often takes ages.

We solved this by doing all of the work client side. After you've went to https://gulgle.link/ once, the JS is all cached and will never need to be downloaded again. Your device does the redirects without the need for a server.

## Features

- Fast Client-Side Redirects: Redirects for bang commands are handled directly in the user's browser, making them faster than server-side redirects.
- Comprehensive ~~DuckDuckGo's~~ Kagi's Bang Support: The application includes a large list of bang commands sourced from ~~DuckDuckGo's~~ Kagi's official list.
- Custom Bangs: Users can add their own custom bang shortcuts directly within the application's settings, which are stored locally in the browser.
- Configurable Default Search Engine: Users can choose their preferred default search engine from a list of popular options, including any custom bangs they have added.
- Settings import & export: Users can backup their data (custom bangs, default bang) in JSON format.
- Automated Bang List Updates: A GitHub Actions workflow is set up to automatically fetch and update the list of default bangs from ~~DuckDuckGo~~ Kagi on a monthly basis.

## Chrome extension

Build the unpacked Manifest V3 extension with:

```sh
pnpm build:extension
```

See [`apps/extension/README.md`](apps/extension/README.md) for instructions on
loading it in Chrome's Developer mode.

## Development

This monorepo uses [VitePlus](https://viteplus.dev/) with pnpm as its package manager. After installing dependencies with `pnpm install`, the primary commands are:

```sh
pnpm check
pnpm test
pnpm dev
pnpm build
```

`pnpm dev` and `pnpm build` open an interactive selector for the web app, the
server, or both. For a non-interactive, targeted command, use `pnpm dev:web`,
`pnpm dev:server`, `pnpm build:web`, or `pnpm build:server`.

`pnpm check` runs Oxfmt, Oxlint, and type-aware checks through VitePlus. Tests run with VitePlus's bundled Vitest, web builds use Vite, and server builds use the bundled tsdown packer.

## Acknowledgments

This project is built upon and was initially forked from [unduck](https://github.com/T3-Content/unduck).
