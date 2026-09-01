# eSpeak-NG browser engine

This app uses the eSpeak-NG 1.49.1 browser port for English speech. The browser build uses a Web Worker and Web Audio API and is licensed under GPLv3.

For the fully local/offline copy, keep these three files together in this folder:

- `espeakng.min.js`
- `espeakng.worker.js`
- `espeakng.worker.data`

The app checks for the local worker first. If the worker/data files are not present, V24 uses the matching public jsDelivr build as a temporary fallback so the app can still be tested without a paid API.

The `.data` file is binary and is not meant to be opened directly.
