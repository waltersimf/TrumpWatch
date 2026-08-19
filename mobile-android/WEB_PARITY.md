# Android web parity contract

The production web application rendered from
`https://trumpdash-njn2ba2j.manus.space` is the canonical TrumpWatch UI.
The Android main activity must display that application directly and must not
reimplement, translate, reorder, or restyle its dashboard in React Native.

## Unavoidable platform differences

These differences exist outside the canonical web product surface:

- Android draws its own status and navigation/gesture bars. The React Native
  shell reserves the status-bar inset so web content is not obscured.
- Before the first web frame, and when a network-level load fails, Android
  shows a minimal native loading or retry surface because the web application
  is not available to render one yet.
- The Android back action first follows WebView history, then exits the app.
- Links that leave the production TrumpWatch origin open in the system browser.
  Canonical TrumpWatch navigation remains inside the WebView.
- Rendering is performed by the device Android System WebView, so glyph
  rasterization and browser chrome can differ slightly from desktop Chrome.

Android home-screen widgets remain native surfaces. They intentionally keep
their existing API, cache, and background-refresh pipeline and are not part of
the main-activity visual parity requirement.
