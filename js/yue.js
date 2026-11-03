/* Yue's companion behavior is kept separate from the museum navigation. */
(function () {
    "use strict";

    const companion = document.getElementById("yue-companion");
    const cat = document.getElementById("yue-cat");
    const speech = document.getElementById("yue-speech");
    const speechText = companion.querySelector(".yue-speech-text");
    const soundToggle = document.getElementById("yue-sound-toggle");
    const yueAudio = document.getElementById("yue-audio");
    const effects = companion.querySelector(".yue-effects");
    const landing = document.getElementById("landing");
    const gallery = document.getElementById("gallery");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const firstMeetLines = [
        "Hey, Mama, I'm Yue!",
        "Hey, Mama.",
        "Papa made a special gift for you.",
        "Meow.",
        "Papa loves you a lot."
    ];

    const dialogue = {
        tap: ["You found my favorite human!", "A happy little meow for Mama!", "I saved that purr just for you."],
        pet: ["That feels lovely, Mama.", "More cuddles, please!", "I could stay here all day."],
        play: [
            "You found my secret play button!",
            "Catch me if you can, Mama!",
            "Papa says I have the best zoomies.",
            "Secret message: Papa loves you more than all the stars.",
            "Papa made this little world just to make you smile."
        ],
        drag: ["An adventure? Hold on tight!", "Where are we going, Mama?", "I trust you with my tiny paws."],
        drop: ["That was a fun little trip!", "Home is wherever you are.", "Ta-da! Yue has landed."],
        wake: ["I was dreaming about cuddles.", "I'm awake! Did you miss me?", "Good morning, Mama. Even if it isn't morning."],
        sound: ["A little sound just for you.", "Listen close: that is my happy sound.", "I saved this sound just for you."]
    };

    const protectedSelectors = [
        "#music-toggle", "#music-note",
        "#landing .landing-kicker", "#landing .landing-title",
        "#landing .landing-message", "#landing .landing-subtitle",
        "#landing #enter-button", "#landing .profile-buttons",
        "#landing .profile-card", "#landing .profile-panels"
    ];
    const recentLines = [];
    const pendingSpeech = [];
    const lastSpoken = new Map();
    const moodClasses = ["is-happy", "is-playing", "is-surprised", "is-petting", "is-dragging", "is-dropped", "is-stretching"];
    const bounds = { x: 12, y: 120 };
    const pointer = { id: null, startX: 0, startY: 0, offsetX: 0, offsetY: 0, dragging: false, petting: false };

    let speechTimer;
    let speechQueueTimer;
    let clickTimer;
    let moodTimer;
    let idleTimer;
    let lastActionAt = Date.now();
    let lastSpeechAt = 0;
    let lastPlayAt = 0;
    let ignoreClickUntil = 0;
    let soundsEnabled = false;

    function scheduleQueuedSpeech() {
        if (speechQueueTimer || pendingSpeech.length === 0) return;
        const delay = Math.max(0, lastSpeechAt + 1500 - Date.now());
        speechQueueTimer = window.setTimeout(function () {
            speechQueueTimer = null;
            if (Date.now() - lastSpeechAt < 1500) {
                scheduleQueuedSpeech();
                return;
            }
            const nextLine = pendingSpeech.shift();
            if (nextLine) speak(nextLine, false, true);
            scheduleQueuedSpeech();
        }, delay);
    }

    function chooseLine(category) {
        const lines = dialogue[category];
        const available = lines.filter(function (line) { return !recentLines.includes(line); });
        const choice = available[Math.floor(Math.random() * available.length)] || lines[0];
        recentLines.push(choice);
        if (recentLines.length > 6) recentLines.shift();
        return choice;
    }

    function speak(line, force, fromQueue) {
        const now = Date.now();
        if (!force && now - (lastSpoken.get(line) || 0) < 12000) return;
        if (!force && !fromQueue && (pendingSpeech.length > 0 || now - lastSpeechAt < 1500)) {
            if (!pendingSpeech.includes(line)) pendingSpeech.push(line);
            if (pendingSpeech.length > 8) pendingSpeech.shift();
            scheduleQueuedSpeech();
            return;
        }

        lastSpeechAt = now;
        lastSpoken.set(line, now);
        speechText.textContent = line;
        companion.classList.add("is-speaking");
        clearTimeout(speechTimer);
        speechTimer = window.setTimeout(function () {
            companion.classList.remove("is-speaking");
            placeCompanion();
        }, 5200);
        window.requestAnimationFrame(placeCompanion);
        scheduleQueuedSpeech();
    }

    function react(mood, category, effect) {
        moodClasses.forEach(function (className) { companion.classList.remove(className); });
        void cat.offsetWidth;
        companion.classList.add("is-" + mood);
        clearTimeout(moodTimer);
        moodTimer = window.setTimeout(function () {
            companion.classList.remove("is-" + mood);
        }, mood === "dragging" ? 0 : 1100);

        if (category) speak(chooseLine(category), false);
        if (effect) addEffects(effect);
    }

    function addEffects(symbol) {
        if (reducedMotion.matches) return;
        for (let index = 0; index < 3; index += 1) {
            const particle = document.createElement("span");
            particle.className = "yue-effect";
            particle.textContent = symbol;
            particle.style.setProperty("--yue-drift", (index - 1) * 22 + "px");
            effects.appendChild(particle);
            window.setTimeout(function () { particle.remove(); }, 1150);
        }
    }

    function playSound() {
        if (!soundsEnabled) return;
        yueAudio.pause();
        yueAudio.currentTime = 0;
        const playback = yueAudio.play();
        if (playback) {
            playback.catch(function (error) {
                if (error.name !== "AbortError") {
                    console.error("Yue's sound could not be played.", error);
                    speak("I couldn't play my sound just now. Please check the audio file.", true);
                }
            });
        }
    }

    function updateSoundButton() {
        soundToggle.setAttribute("aria-pressed", String(soundsEnabled));
        soundToggle.textContent = "♪";
        soundToggle.setAttribute(
            "aria-label",
            soundsEnabled ? "Mute Yue's sounds (currently on)" : "Turn on Yue's sounds (currently muted)"
        );
    }

    function toggleSound() {
        soundsEnabled = !soundsEnabled;
        updateSoundButton();
        lastActionAt = Date.now();
        if (soundsEnabled) {
            playSound();
            speak(chooseLine("sound"), false);
        } else {
            yueAudio.pause();
            yueAudio.currentTime = 0;
        }
    }

    function rectsOverlap(first, second) {
        return first.left < second.right && first.right > second.left &&
            first.top < second.bottom && first.bottom > second.top;
    }

    function getProtectedRects() {
        const rects = [];
        protectedSelectors.forEach(function (selector) {
            document.querySelectorAll(selector).forEach(function (element) {
                const style = window.getComputedStyle(element);
                const rect = element.getBoundingClientRect();
                if (style.display !== "none" && style.visibility !== "hidden" &&
                    rect.width > 0 && rect.height > 0) rects.push(rect);
            });
        });
        return rects;
    }

    function getFootprint(x, y, bubbleWidth, bubbleHeight, isRight) {
        const size = companion.offsetWidth;
        const catRect = { left: x, right: x + size, top: y, bottom: y + size };
        if (!companion.classList.contains("is-speaking")) return [catRect];
        const bubbleLeft = isRight ? x + size - bubbleWidth : x;
        const bubbleRect = {
            left: bubbleLeft,
            right: bubbleLeft + bubbleWidth,
            top: y - bubbleHeight + 10,
            bottom: y + 10
        };
        return [catRect, bubbleRect];
    }

    function placeCompanion(preferredX, preferredY) {
        if (!companion || gallery.hidden === false || landing.hidden || landing.classList.contains("is-leaving")) {
            companion.hidden = true;
            return false;
        }

        companion.hidden = false;
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        const size = companion.offsetWidth;
        const margin = 12;
        const maxX = Math.max(margin, viewportWidth - size - margin);
        const maxY = Math.max(margin, viewportHeight - size - margin);
        const bubbleWidth = speech.offsetWidth || Math.min(216, viewportWidth - 24);
        const bubbleHeight = speech.offsetHeight || 62;
        const xValues = [margin, maxX, Math.max(margin, Math.min(maxX, (viewportWidth - size) / 2))];
        const yValues = [Math.min(maxY, Math.max(margin, 120)), maxY, Math.max(margin, Math.min(maxY, viewportHeight * 0.54 - size / 2))];
        const candidates = [];
        xValues.forEach(function (x) {
            yValues.forEach(function (y) {
                candidates.push({ x: x, y: y, right: x > viewportWidth / 2 });
            });
        });
        if (Number.isFinite(preferredX) && Number.isFinite(preferredY)) {
            candidates.unshift({
                x: Math.max(margin, Math.min(maxX, preferredX)),
                y: Math.max(margin, Math.min(maxY, preferredY)),
                right: preferredX > viewportWidth / 2
            });
        }

        // Score each spot by how much it covers protected content or leaves the viewport.
        // Small screens (like the Android app) rarely have a fully clear spot, so Yue
        // takes the least-crowded one instead of disappearing.
        const obstacles = getProtectedRects();
        function overlapArea(first, second) {
            if (!rectsOverlap(first, second)) return 0;
            return (Math.min(first.right, second.right) - Math.max(first.left, second.left)) *
                (Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
        }
        function score(candidate) {
            const footprint = getFootprint(candidate.x, candidate.y, bubbleWidth, bubbleHeight, candidate.right);
            return footprint.reduce(function (total, rect) {
                const outside = Math.max(0, margin - rect.left) + Math.max(0, rect.right - (viewportWidth - margin)) +
                    Math.max(0, margin - rect.top) + Math.max(0, rect.bottom - (viewportHeight - margin));
                return total + outside * 1000 + obstacles.reduce(function (sum, obstacle) {
                    return sum + overlapArea(rect, obstacle);
                }, 0);
            }, 0);
        }

        let safe = null;
        let bestScore = Infinity;
        candidates.some(function (candidate) {
            const value = score(candidate);
            if (value < bestScore) {
                bestScore = value;
                safe = candidate;
            }
            return value === 0;
        });

        bounds.x = safe.x;
        bounds.y = safe.y;
        companion.classList.toggle("is-right", safe.right);
        companion.style.setProperty("--yue-x", safe.x + "px");
        companion.style.setProperty("--yue-y", safe.y + "px");
        companion.hidden = false;
        return true;
    }

    function handleSingleClick() {
        if (Date.now() - lastPlayAt < 500) return;
        lastActionAt = Date.now();
        if (companion.classList.contains("is-sleeping")) {
            companion.classList.remove("is-sleeping");
            react("happy", "wake", "♡");
            playSound();
        } else {
            react("happy", "tap", "♥");
            playSound();
        }
    }

    function handlePlay() {
        if (Date.now() - lastPlayAt < 500) return;
        lastPlayAt = Date.now();
        lastActionAt = Date.now();
        clearTimeout(clickTimer);
        react("playing", "play", "✦");
        playSound();
    }

    function onPointerDown(event) {
        if (!event.isPrimary || (event.button !== undefined && event.button !== 0)) return;
        pointer.id = event.pointerId;
        pointer.startX = event.clientX;
        pointer.startY = event.clientY;
        const rect = companion.getBoundingClientRect();
        pointer.offsetX = event.clientX - rect.left;
        pointer.offsetY = event.clientY - rect.top;
        pointer.dragging = false;
        pointer.petting = false;
        lastActionAt = Date.now();
        if (cat.setPointerCapture) cat.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event) {
        if (pointer.id !== event.pointerId) return;
        const dx = event.clientX - pointer.startX;
        const dy = event.clientY - pointer.startY;
        const distance = Math.hypot(dx, dy);

        if (!pointer.dragging && distance >= 28) {
            pointer.dragging = true;
            companion.classList.remove("is-sleeping");
            react("surprised", "drag", null);
            companion.classList.add("is-dragging");
            lastActionAt = Date.now();
        } else if (!pointer.dragging && distance >= 4) {
            pointer.petting = true;
        }

        if (pointer.dragging) {
            const size = companion.offsetWidth;
            const x = Math.max(8, Math.min(window.innerWidth - size - 8, event.clientX - pointer.offsetX));
            const y = Math.max(8, Math.min(window.innerHeight - size - 8, event.clientY - pointer.offsetY));
            bounds.x = x;
            bounds.y = y;
            companion.style.setProperty("--yue-x", x + "px");
            companion.style.setProperty("--yue-y", y + "px");
        }
    }

    function onPointerUp(event) {
        if (pointer.id !== event.pointerId) return;
        const wasDragging = pointer.dragging;
        const wasPetting = pointer.petting;
        pointer.id = null;
        pointer.dragging = false;
        pointer.petting = false;
        companion.classList.remove("is-dragging");
        if (cat.hasPointerCapture && cat.hasPointerCapture(event.pointerId)) {
            cat.releasePointerCapture(event.pointerId);
        }

        if (wasDragging) {
            ignoreClickUntil = Date.now() + 600;
            react("dropped", "drop", "♡");
            companion.classList.add("is-dropped");
            window.setTimeout(function () { placeCompanion(bounds.x, bounds.y); }, 480);
            playSound();
        } else if (wasPetting) {
            ignoreClickUntil = Date.now() + 600;
            react("petting", "pet", "♥");
            playSound();
            window.setTimeout(function () { placeCompanion(bounds.x, bounds.y); }, 500);
        }
    }

    function resetIdleTimer() {
        clearTimeout(idleTimer);
        idleTimer = window.setTimeout(function () {
            if (Date.now() - lastActionAt >= 70000 && !companion.hidden && gallery.hidden) {
                if (companion.classList.contains("is-sleeping")) {
                    resetIdleTimer();
                    return;
                }
                companion.classList.add("is-sleeping");
                speak("Purr... I'll nap here until Mama wants cuddles.", false);
            } else if (!companion.hidden && !companion.classList.contains("is-sleeping")) {
                if (Math.random() < 0.5) {
                    companion.classList.add("is-stretching");
                    window.setTimeout(function () { companion.classList.remove("is-stretching"); }, 1200);
                }
                speak(chooseLine("tap"), false);
            }
            resetIdleTimer();
        }, 22000);
    }

    function startFirstMeet() {
        let index = 0;
        function sayNext() {
            if (index >= firstMeetLines.length) {
                resetIdleTimer();
                return;
            }
            if (!companion.hidden) speak(firstMeetLines[index], true);
            index += 1;
            window.setTimeout(sayNext, index === 1 ? 8500 : 8000);
        }
        window.setTimeout(sayNext, 900);
    }

    cat.addEventListener("pointerdown", onPointerDown);
    cat.addEventListener("pointermove", onPointerMove);
    cat.addEventListener("pointerup", onPointerUp);
    cat.addEventListener("pointercancel", onPointerUp);
    cat.addEventListener("click", function (event) {
        if (pointer.dragging || pointer.petting || Date.now() < ignoreClickUntil) return;
        if (event.detail > 1) {
            handlePlay();
            return;
        }
        clearTimeout(clickTimer);
        clickTimer = window.setTimeout(handleSingleClick, 260);
    });
    cat.addEventListener("dblclick", handlePlay);
    soundToggle.addEventListener("click", toggleSound);

    window.addEventListener("resize", function () { placeCompanion(bounds.x, bounds.y); });
    window.addEventListener("scroll", function () { placeCompanion(bounds.x, bounds.y); }, { passive: true });
    const layoutObserver = new MutationObserver(function () { placeCompanion(bounds.x, bounds.y); });
    layoutObserver.observe(landing, { attributes: true, attributeFilter: ["class", "hidden"], subtree: true });
    layoutObserver.observe(gallery, { attributes: true, attributeFilter: ["class", "hidden"] });

    updateSoundButton();
    placeCompanion();
    startFirstMeet();
})();
