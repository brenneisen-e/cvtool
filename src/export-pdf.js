// ══════════════════════════════════════════════
// PDF Export — Screenshot-based via html2canvas + jsPDF
// Dependencies: loadScript (utils.js)
// ══════════════════════════════════════════════

async function downloadPDF() {
    const btn = document.querySelector('.download-btn');
    btn.textContent = 'Wird erstellt...';
    btn.disabled = true;

    if (!window.html2canvas) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    }
    if (!window.jspdf) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }

    const element = document.getElementById('cvPage');

    try {
        const canvas = await html2canvas(element, {
            scale: 3,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: element.scrollWidth,
            height: element.scrollHeight
        });

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        pdf.save('Lebenslauf_Irena_Rentel.pdf');
    } catch (error) {
        console.error('PDF Error:', error);
        alert('PDF-Erstellung fehlgeschlagen.');
    }

    btn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Als PDF herunterladen';
    btn.disabled = false;
}
