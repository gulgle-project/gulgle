# Unduckling - Custom duckduckgo bangs and more


https://github.com/user-attachments/assets/d1d56012-022b-45cb-8606-5c735eed4864


DuckDuckGo's bang redirects are too slow. Add the following URL as a custom search engine to your browser. Enables all of DuckDuckGo's bangs to work, but much faster.

```
https://unduckling.pages.dev?q=%s
```

## How is it that much faster?

DuckDuckGo does their redirects server side. Their DNS is...not always great. Result is that it often takes ages.

I solved this by doing all of the work client side. Once you've went to https://unduckling.pages.dev/ once, the JS is all cache'd and will never need to be downloaded again. Your device does the redirects, not me.

## Features

- Fast Client-Side Redirects: Redirects for bang commands are handled directly in the user's browser, making them faster than server-side redirects.
- Comprehensive DuckDuckGo Bang Support: The application includes a large list of bang commands sourced from DuckDuckGo's official API.
- Custom Bangs: Users can add their own custom bang shortcuts directly within the application's settings, which are stored locally in the browser.
- Configurable Default Search Engine: Users can choose their preferred default search engine from a list of popular options, including any custom bangs they have added.
- Automated Bang List Updates: A GitHub Actions workflow is set up to automatically fetch and update the list of default bangs from DuckDuckGo's API on a monthly basis.



