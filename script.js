const html = document.documentElement;
const canvas = document.getElementById("hero-lightpass");
const context = canvas.getContext("2d");

// Helper function to scale and center the image to cover the canvas
function drawImageProp(ctx, img, x, y, w, h, offsetX, offsetY) {
    if (arguments.length === 2) {
        x = y = 0;
        w = ctx.canvas.width;
        h = ctx.canvas.height;
    }

    offsetX = typeof offsetX === "number" ? offsetX : 0.5;
    offsetY = typeof offsetY === "number" ? offsetY : 0.5;

    if (offsetX < 0) offsetX = 0;
    if (offsetY < 0) offsetY = 0;
    if (offsetX > 1) offsetX = 1;
    if (offsetY > 1) offsetY = 1;

    let iw = img.width,
        ih = img.height,
        r = Math.min(w / iw, h / ih),
        nw = iw * r,
        nh = ih * r,
        cx, cy, cw, ch, ar = 1;

    if (nw < w) ar = w / nw;
    if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;
    nw *= ar;
    nh *= ar;

    cw = iw / (nw / w);
    ch = ih / (nh / h);

    cx = (iw - cw) * offsetX;
    cy = (ih - ch) * offsetY;

    if (cx < 0) cx = 0;
    if (cy < 0) cy = 0;
    if (cw > iw) cw = iw;
    if (ch > ih) ch = ih;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}

const frameCount = 240;
const currentFrame = index => (
  `frames/frames_24fps/frame_${(index + 1).toString().padStart(6, '0')}.png`
);

const images = [];
for (let i = 0; i < frameCount; i++) {
  images.push(new Image());
}

// Preloader UI elements
const preloaderEl = document.getElementById("preloader");
const progressBarEl = document.getElementById("preloader-progress");
const percentEl = document.getElementById("preloader-percent");
const statusEl = document.getElementById("preloader-status");
const skipBtnEl = document.getElementById("preloader-skip-btn");

let loadedFrames = 0;
let isPreloaderDismissed = false;

function dismissPreloader() {
    if (isPreloaderDismissed) return;
    isPreloaderDismissed = true;
    
    if (statusEl) statusEl.textContent = "Welcome to my portfolio!";
    if (percentEl) percentEl.textContent = "100%";
    if (progressBarEl) progressBarEl.style.width = "100%";
    
    setTimeout(() => {
        if (preloaderEl) {
            preloaderEl.classList.add("fade-out");
            setTimeout(() => {
                preloaderEl.style.display = "none";
            }, 800);
        }
    }, 400);
}

if (skipBtnEl) {
    skipBtnEl.addEventListener("click", dismissPreloader);
}

function updatePreloaderUI() {
    loadedFrames++;
    const progress = Math.min(100, Math.round((loadedFrames / frameCount) * 100));
    
    if (progressBarEl) progressBarEl.style.width = `${progress}%`;
    if (percentEl) percentEl.textContent = `${progress}%`;
    
    if (statusEl) {
        if (progress < 25) {
            statusEl.textContent = "INITIALIZING ASSETS";
        } else if (progress < 60) {
            statusEl.textContent = "PRE-CACHING 3D SEQUENCE";
        } else if (progress < 90) {
            statusEl.textContent = "FINALIZING BUFFER";
        } else {
            statusEl.textContent = "SYSTEM READY";
        }
    }

    // Show skip button early if user doesn't want to wait
    if (progress >= 30 && skipBtnEl && skipBtnEl.style.display === "none") {
        skipBtnEl.style.display = "inline-flex";
    }

    if (loadedFrames >= frameCount) {
        dismissPreloader();
    }
}

// Preload all frames using concurrent queue for fast loading
const CONCURRENCY = 6;
let nextFrameToLoad = 0;

function loadNextInQueue() {
    if (nextFrameToLoad >= frameCount) return;
    const index = nextFrameToLoad++;
    const img = images[index];
    
    img.onload = () => {
        if (index === 0) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            drawImageProp(context, images[0], 0, 0, canvas.width, canvas.height);
        }
        updatePreloaderUI();
        loadNextInQueue();
    };
    
    img.onerror = () => {
        updatePreloaderUI();
        loadNextInQueue();
    };

    img.src = currentFrame(index);
}

// Start concurrent loader pool
for (let c = 0; c < CONCURRENCY; c++) {
    loadNextInQueue();
}

// Fallback timer: Dismiss preloader after max 5 seconds if connection is slow
setTimeout(() => {
    if (!isPreloaderDismissed) {
        dismissPreloader();
    }
}, 5000);

let currentRenderIndex = 0;

const updateImage = index => {
  currentRenderIndex = index;
  const img = images[index];
  if (!img.src) {
    img.src = currentFrame(index);
  }
  
  if (img.complete && img.naturalWidth !== 0) {
    drawImageProp(context, img, 0, 0, canvas.width, canvas.height);
  } else {
    img.onload = () => {
      // Only draw if we haven't scrolled past this frame
      if (currentRenderIndex === index) {
        drawImageProp(context, img, 0, 0, canvas.width, canvas.height);
      }
    };
  }
};

window.addEventListener('scroll', () => {  
  const scrollTop = html.scrollTop;
  const maxScrollTop = html.scrollHeight - window.innerHeight;
  let scrollFraction = scrollTop / maxScrollTop;
  if (isNaN(scrollFraction)) scrollFraction = 0;
  
  const frameIndex = Math.min(
    frameCount - 1,
    Math.floor(scrollFraction * frameCount)
  );
  
  requestAnimationFrame(() => updateImage(frameIndex));
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Maintain the correct frame on resize
    const scrollTop = html.scrollTop;
    const maxScrollTop = html.scrollHeight - window.innerHeight;
    let scrollFraction = scrollTop / maxScrollTop;
    if (isNaN(scrollFraction)) scrollFraction = 0;
    
    const frameIndex = Math.min(
      frameCount - 1,
      Math.floor(scrollFraction * frameCount)
    );
    
    requestAnimationFrame(() => updateImage(frameIndex));
});
