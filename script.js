const html = document.documentElement;
const canvas = document.getElementById("hero-lightpass");
const context = canvas.getContext("2d");

const frameCount = 240;
const currentFrame = index => (
  `frames/frames_24fps/frame_${(index + 1).toString().padStart(6, '0')}.png`
);

const images = [];

// Preload all images
const preloadImages = () => {
  for (let i = 0; i < frameCount; i++) {
    const img = new Image();
    img.src = currentFrame(i);
    images.push(img);
  }
};

preloadImages();

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

// Render the initial frame when it loads
const firstImg = images[0];
firstImg.onload = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawImageProp(context, firstImg, 0, 0, canvas.width, canvas.height);
};

const updateImage = index => {
  if(images[index].complete) {
    drawImageProp(context, images[index], 0, 0, canvas.width, canvas.height);
  } else {
    images[index].onload = () => {
      drawImageProp(context, images[index], 0, 0, canvas.width, canvas.height);
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
  
  if (images[frameIndex] && images[frameIndex].complete) {
      requestAnimationFrame(() => updateImage(frameIndex));
  }
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
    
    // Need to check if complete because we are resizing, it should be
    if(images[frameIndex].complete) {
        drawImageProp(context, images[frameIndex], 0, 0, canvas.width, canvas.height);
    }
});
