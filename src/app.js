// ══════════════════════════════════════════════
// App Initialization & Event Handlers
// Dependencies: tokens.js, photo-data.js, utils.js
// ══════════════════════════════════════════════

// Photo file input handler
document.getElementById('photoInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = document.getElementById('cvPhoto');
            img.src = event.target.result;
            img.style.display = 'block';
            document.getElementById('photoPlaceholder').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
});

// Color pickers — update CSS custom properties
document.getElementById('sidebarColor').addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--sidebar-bg', e.target.value);
});

document.getElementById('accentColor').addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--accent', e.target.value);
    document.querySelectorAll('.download-btn').forEach(b => b.style.background = e.target.value);
});

// Initialize photo from embedded data
if (typeof photoData !== 'undefined' && photoData) {
    const img = document.getElementById('cvPhoto');
    img.src = photoData;
    img.style.display = 'block';
    document.getElementById('photoPlaceholder').style.display = 'none';
}
