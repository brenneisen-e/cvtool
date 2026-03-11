// ══════════════════════════════════════════════
// Shared Utilities
// ══════════════════════════════════════════════

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function createCircularPhoto(src, size) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            // Draw circular clip
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            // Draw image covering the circle
            const aspect = img.width / img.height;
            let sw, sh, sx, sy;
            if (aspect > 1) {
                sh = img.height;
                sw = img.height;
                sx = (img.width - sw) / 2;
                sy = 0;
            } else {
                sw = img.width;
                sh = img.width;
                sx = 0;
                sy = 0;
            }
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);

            canvas.toBlob(blob => {
                blob.arrayBuffer().then(resolve).catch(reject);
            }, 'image/png');
        };
        img.onerror = reject;
        img.src = src;
    });
}
