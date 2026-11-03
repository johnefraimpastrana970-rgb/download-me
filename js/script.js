/* =========================================
   01. SETTINGS AND PAGE ELEMENTS
========================================= */
// The twelve months, in order. Short names are used on the thumbnail buttons.
const MONTHS = [
    { id: "january",   name: "January",   short: "Jan" },
    { id: "february",  name: "February",  short: "Feb" },
    { id: "march",     name: "March",     short: "Mar" },
    { id: "april",     name: "April",     short: "Apr" },
    { id: "may",       name: "May",       short: "May" },
    { id: "june",      name: "June",      short: "Jun" },
    { id: "july",      name: "July",      short: "Jul" },
    { id: "august",    name: "August",    short: "Aug" },
    { id: "september", name: "September", short: "Sep" },
    { id: "october",   name: "October",   short: "Oct" },
    { id: "november",  name: "November",  short: "Nov" },
    { id: "december",  name: "December",  short: "Dec" }
];

const landing = document.getElementById("landing");
const gallery = document.getElementById("gallery");
const enterButton = document.getElementById("enter-button");
const homeButton = document.getElementById("home-button");
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");
const chapterIndicator = document.getElementById("chapter-indicator");
const visitedText = document.getElementById("visited-text");
const progressBar = document.getElementById("progress-bar");
const thumbnailList = document.getElementById("thumbnails");
const leaves = Array.from(document.querySelectorAll(".leaf"));

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

// Reads the animation speed from the CSS variable (in milliseconds).
function getFlipDurationMs() {
    if (reducedMotionQuery.matches) return 20;
    const value = getComputedStyle(document.documentElement).getPropertyValue("--flip-duration");
    return parseFloat(value) * 1000 || 1100;
}

function getFadeDurationMs() {
    return reducedMotionQuery.matches ? 20 : 800;
}

/* =========================================
   02. LANDING PAGE PARTICLES
========================================= */
function createParticles(count) {
    const container = document.getElementById("particles");
    const symbols = ["✦", "♥", "✧"];

    for (let i = 0; i < count; i++) {
        const particle = document.createElement("span");
        particle.className = "particle";

        if (i % 3 === 0) {
            const size = 3 + Math.random() * 5;
            particle.classList.add("is-dot");
            particle.style.width = particle.style.height = size + "px";
        } else {
            particle.textContent = symbols[i % symbols.length];
            particle.style.fontSize = 10 + Math.random() * 14 + "px";
        }

        particle.style.left = Math.random() * 100 + "%";
        particle.style.animationDuration = 9 + Math.random() * 12 + "s";
        particle.style.animationDelay = -Math.random() * 20 + "s";
        container.appendChild(particle);
    }
}

/* =========================================
   03. PROFILE PANEL TOGGLES
   Each button controls its own panel, independently.
========================================= */
function setupProfileToggle(buttonId, panelId) {
    const button = document.getElementById(buttonId);
    const panel = document.getElementById(panelId);

    button.addEventListener("click", function () {
        const willOpen = button.getAttribute("aria-expanded") !== "true";
        button.setAttribute("aria-expanded", String(willOpen));
        panel.classList.toggle("is-open", willOpen);
    });
}

/* =========================================
   04. IMAGE PLACEHOLDERS
   If a photo file is missing, show a purple placeholder instead.
========================================= */
function makePlaceholderImage(label) {
    const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="#2A1747"/><stop offset="1" stop-color="#10091C"/></linearGradient></defs>' +
        '<rect width="800" height="1000" fill="url(#g)"/>' +
        '<text x="400" y="490" fill="#C4B5FD" font-family="Georgia,serif" font-size="44" text-anchor="middle">' + label + '</text>' +
        '<text x="400" y="550" fill="#B8A9CC" font-family="Georgia,serif" font-size="28" text-anchor="middle">Replace this image in the images folder</text>' +
        '</svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function usePlaceholderIfMissing(image) {
    const showPlaceholder = function () {
        image.onerror = null;   // prevents an endless loop
        image.src = makePlaceholderImage(image.dataset.placeholder || "Photo");
    };
    image.onerror = showPlaceholder;
    // The image may have failed before this script ran.
    if (image.complete && image.naturalWidth === 0) showPlaceholder();
}

/* =========================================
   05. BOOK STATE AND PAGE FLIPPING
   currentIndex = which chapter is showing (0 = January, 11 = December).
   Leaves before currentIndex are "turned"; the rest are not.
========================================= */
let currentIndex = 0;
const visitedChapters = new Set([0]);
const flipTimers = new Map();

function updateBook(previousIndex) {
    leaves.forEach(function (leaf, index) {
        const shouldBeTurned = index < currentIndex;
        const wasTurned = index < previousIndex;
        const isTurned = leaf.classList.contains("is-turned");

        if (shouldBeTurned !== isTurned) {
            startFlip(leaf, index, shouldBeTurned);
        }
        if (wasTurned === shouldBeTurned && !leaf.classList.contains("is-flipping")) {
            setStackOrder(leaf, index, shouldBeTurned);
        }

        // Only the visible chapter can be reached by keyboard or screen reader.
        leaf.inert = index !== currentIndex;
        leaf.setAttribute("aria-hidden", String(index !== currentIndex));
    });
}

function setStackOrder(leaf, index, isTurned) {
    // Un-turned pages: earlier months sit on top. Turned pages: later ones on top.
    leaf.style.zIndex = isTurned ? index : 100 + (MONTHS.length - index);
}

function startFlip(leaf, index, turnIt) {
    clearTimeout(flipTimers.get(leaf));
    leaf.classList.add("is-flipping");
    leaf.style.zIndex = 500 + index;            // a turning page stays on top
    leaf.classList.toggle("is-turned", turnIt);

    // When the animation ends, settle the page into its final stack position.
    flipTimers.set(leaf, setTimeout(function () {
        leaf.classList.remove("is-flipping");
        setStackOrder(leaf, index, turnIt);
    }, getFlipDurationMs()));
}

/* =========================================
   06. NAVIGATION CONTROLS
========================================= */
function goToChapter(newIndex) {
    if (newIndex < 0 || newIndex >= MONTHS.length || newIndex === currentIndex) return;

    const previousIndex = currentIndex;
    currentIndex = newIndex;
    visitedChapters.add(newIndex);

    updateBook(previousIndex);
    updateNavigation();
}

function updateNavigation() {
    const number = String(currentIndex + 1).padStart(2, "0");
    chapterIndicator.textContent = number + " / 12";
    visitedText.textContent = "Visited " + visitedChapters.size + " of 12";
    progressBar.style.width = (visitedChapters.size / MONTHS.length) * 100 + "%";

    prevButton.disabled = currentIndex === 0;                    // January: no previous
    nextButton.disabled = currentIndex === MONTHS.length - 1;    // December: no next

    Array.from(thumbnailList.querySelectorAll("button")).forEach(function (button, index) {
        button.classList.toggle("is-visited", visitedChapters.has(index));
        if (index === currentIndex) {
            button.setAttribute("aria-current", "true");
        } else {
            button.removeAttribute("aria-current");
        }
    });
}

function buildThumbnails() {
    MONTHS.forEach(function (month, index) {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "thumbnail-button";
        button.textContent = month.short;
        button.setAttribute("aria-label", "Go to " + month.name + ", chapter " + (index + 1));
        button.addEventListener("click", function () { goToChapter(index); });
        item.appendChild(button);
        thumbnailList.appendChild(item);
    });
}

/* =========================================
   06b. BACKGROUND MUSIC
   Browsers only allow sound after a click, so the song starts
   when the visitor presses "Proceed to Our Story".
========================================= */
const music = document.getElementById("music");
const musicToggle = document.getElementById("music-toggle");
const musicNote = document.getElementById("music-note");
let musicFileMissing = false;
let visitorPausedMusic = false;

function showMusicNote(message) {
    musicNote.textContent = message;
    musicNote.classList.add("is-visible");
    setTimeout(function () { musicNote.classList.remove("is-visible"); }, 4500);
}

function updateMusicButton() {
    const isPlaying = !music.paused;
    musicToggle.classList.toggle("is-playing", isPlaying);
    musicToggle.setAttribute("aria-pressed", String(isPlaying));
    musicToggle.setAttribute("aria-label", isPlaying ? "Pause music" : "Play music");
}

function playMusic() {
    if (musicFileMissing) return;
    const attempt = music.play();
    if (attempt) attempt.catch(updateMusicButton);   // ignore blocked or failed playback
}

function toggleMusic() {
    if (musicFileMissing) {
        showMusicNote("The song in the audio folder could not be played.");
        return;
    }
    if (music.paused) {
        visitorPausedMusic = false;
        playMusic();
    } else {
        visitorPausedMusic = true;
        music.pause();
    }
}

music.volume = 0.6;
music.addEventListener("play", updateMusicButton);
music.addEventListener("pause", updateMusicButton);
music.addEventListener("error", function () { musicFileMissing = true; updateMusicButton(); });
musicToggle.addEventListener("click", toggleMusic);

/* =========================================
   07. ENTERING AND LEAVING THE GALLERY
========================================= */
function enterGallery() {
    if (!visitorPausedMusic) playMusic();     // start the song on this click
    landing.classList.add("is-leaving");
    setTimeout(function () {
        landing.hidden = true;
        gallery.hidden = false;
        void gallery.offsetWidth;               // lets the browser register the change before fading in
        gallery.classList.add("is-visible");
        nextButton.focus();
    }, getFadeDurationMs());
}

function leaveGallery() {
    gallery.classList.remove("is-visible");
    setTimeout(function () {
        gallery.hidden = true;
        landing.hidden = false;
        void landing.offsetWidth;
        landing.classList.remove("is-leaving");
        enterButton.focus();
    }, getFadeDurationMs());
}

function isGalleryOpen() {
    return !gallery.hidden;
}

/* =========================================
   08. KEYBOARD NAVIGATION
========================================= */
document.addEventListener("keydown", function (event) {
    if (!isGalleryOpen()) return;
    if (event.key === "ArrowRight") goToChapter(currentIndex + 1);
    if (event.key === "ArrowLeft") goToChapter(currentIndex - 1);
});

/* =========================================
   09. START EVERYTHING
========================================= */
createParticles(34);
setupProfileToggle("rai-toggle", "rai-panel");
setupProfileToggle("yanyan-toggle", "yanyan-panel");
document.querySelectorAll("img[data-placeholder]").forEach(usePlaceholderIfMissing);
buildThumbnails();

enterButton.addEventListener("click", enterGallery);
homeButton.addEventListener("click", leaveGallery);
prevButton.addEventListener("click", function () { goToChapter(currentIndex - 1); });
nextButton.addEventListener("click", function () { goToChapter(currentIndex + 1); });

updateBook(0);
updateNavigation();
