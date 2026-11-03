# A Whole Year With You

A romantic memory-museum website: a landing page, profile panels for Rai and Yanyan, and twelve monthly chapters you flip through like a book. Plain HTML, CSS and JavaScript, with no frameworks.

## Folder structure

```
whole-year-with-you/
├── index.html      ← all text, all 12 months, profiles
├── css/style.css   ← colors, layout, 3D page flip
├── css/yue.css     ← Yue companion illustration and animation
├── js/script.js    ← navigation, profile toggles, flipping
├── js/yue.js       ← Yue dialogue, interactions, and optional sounds
├── images/         ← put your photos here
├── audio/          ← background music
└── README.md
```

## Run it locally

1. Keep the folder structure exactly as shown.
2. Double-click `index.html` to open it in your browser.
3. Optional: in the folder, run `python3 -m http.server` and open http://localhost:8000.

The Google Fonts link needs internet; offline, the site falls back to Georgia and system fonts.

## Deploy to GitHub Pages

Push to the `main` branch to deploy the website automatically. The site will be available at `https://johnefraimpastrana970-rgb.github.io/download-me/`. The landing page's Android download link serves `downloads/Download-Me.apk` (the ILOVEYOU app).

## Build the Android app

The `android/` folder contains a native Android WebView app. It packages the current website files as local app assets, so the photos, chapters, and audio work without hosting the site.

1. Install Android Studio with the Android SDK Platform 35 and a compatible JDK (17 or later).
2. Open the `android/` folder in Android Studio and allow Gradle to sync.
3. Or run `android\\gradlew.bat assembleDebug` from the project root. The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.

The build copies `index.html`, `css/`, `js/`, `images/`, and `audio/` from the project root automatically, so edits to the website are included in the next build. The app supports Android 6.0 and newer and uses the couple photo as its launcher icon. Google Fonts still require an internet connection; the local content works offline.

## Where to put photographs

The `images/` folder already contains the twelve monthly photos. The numbered photo files are shown in order from January to December:

| Month | Image file |
|---|---|
| January | `1.jpg` |
| February | `2 (2).jpg` |
| March | `3.jpg` |
| April | `4 (2).jpg` |
| May | `5.jpg` |
| June | `6.jpg` |
| July | `7.jpg` |
| August | `8.jpg` |
| September | `9.jpg` |
| October | `10.jpg` |
| November | `11.png` |
| December | `12.jpg` |

The profile photos are `rai-profile.jpg` and `yanyan-profile.jpg` in the `images/` folder. To use a different monthly filename or format, change the `src="images/..."` in `index.html`.

## Add your song

1. The current song is `_Mahal Magmahal_ _ Esremborak [UNOFFICIAL MV].mp3` in the `audio/` folder.
2. The song starts when a visitor clicks "Proceed to Our Story" (browsers block sound before a click) and loops. The round ♪ button in the top-right corner pauses and resumes it.

Use audio you own or have permission to use. If you plan to put the site online, check the song's licensing first.

## Meet Yue

Yue is a small illustrated cat companion on the entrance page. She introduces herself and then shares the five welcome lines in order. Click or tap her for a happy reaction, pet her with a short pointer movement, double-click to play, or drag and drop her somewhere safe. After a while she stretches and eventually naps; tap her to wake her. Her short dialogue is randomized without immediately repeating lines.

Yue's sound button stays beside her and starts muted. Turn it on to play `audio/Play this to attract your cat and make it meow back (works instantly!) (1).mp3` when Yue reacts; turn it off to stop the sound. The companion respects reduced-motion settings, can be focused and activated by keyboard, and stays within the viewport. Yue moves to an available edge position when possible and hides rather than cover the landing-page content; she also hides while the full-screen chapter gallery is open. No extra dependencies or setup are required.

## Edit the profiles

In `index.html`, search for `ABOUT RAI` or `ABOUT YANYAN`. Change the description (`profile-description`), biography (`profile-bio`), the favorite-thing tags (`<li>` items), and the `alt` text.

## Personalize each month

Search for `MONTH 01: JANUARY`, `MONTH 02: FEBRUARY`, and so on. Inside each block, edit:

- `<h3>` – the chapter title
- `<p>` – the memory text
- `<figcaption>` – an optional date or caption
- `alt="..."` – a description of the photo

Do not change the section `id`s, the `01 / 12` numbers, or the order. The order is what keeps the book correct.

The December closing message is the `<blockquote class="closing-message">` at the bottom of the December block.

## Customize colors and animations

At the top of `css/style.css`, the `:root` block holds everything:

- Colors: `--bg-midnight`, `--accent`, `--lavender`, `--highlight`, `--text`, `--text-muted`
- Fonts: `--font-display`, `--font-body`
- Page-flip speed: `--flip-duration` (default `1.1s`)
- Fade and hover speeds: `--fade-duration`, `--hover-duration`

The number of floating particles is the `createParticles(34)` call near the end of `js/script.js`.

## Features

- Previous / next buttons, month thumbnails, and left/right arrow keys
- Chapter indicator (`03 / 12`) and a visited-chapters progress bar
- Previous is disabled on January and next on December
- Rapid clicking is safe: each page's state comes from one `currentIndex` value
- Respects `prefers-reduced-motion`, with visible focus outlines and `aria-expanded` on the profile buttons
