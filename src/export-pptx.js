// ══════════════════════════════════════════════
// PPTX Export — Portrait DIN A4, absolute positioning via PptxGenJS
// Dependencies: tokens.js, utils.js (TOKENS, loadScript, createCircularPhoto)
// ══════════════════════════════════════════════

async function downloadPPTX() {
    const btn = document.getElementById('pptxBtn');
    btn.textContent = 'Wird erstellt...';
    btn.disabled = true;

    if (!window.PptxGenJS) {
        await loadScript('https://cdn.jsdelivr.net/gh/gitbrent/pptxgenjs@4.0.1/dist/pptxgen.bundle.js');
    }

    try {
        // Live colors from pickers
        const sidebarBg = (document.getElementById('sidebarColor').value || '#1e4d91').replace('#', '');
        const accent = (document.getElementById('accentColor').value || '#4aaa48').replace('#', '');

        const T = TOKENS;
        const C = { ...T.colors, sidebar_bg: sidebarBg, accent: accent };

        // DIN A4 Portrait in inches
        const PAGE_W = 8.267;   // 210mm
        const PAGE_H = 11.693;  // 297mm
        const mmToIn = (mm) => mm / 25.4;

        // Layout dimensions in inches (from TOKENS mm values)
        const SIDEBAR_W = mmToIn(72);       // 2.835"
        const MAIN_W = PAGE_W - SIDEBAR_W;  // 5.433"
        const MAIN_PAD = mmToIn(14);         // 0.551"
        const SB_PAD_V = mmToIn(8);          // 0.315"
        const SB_PAD_H = mmToIn(6);          // 0.236"
        const MAIN_X = 0;
        const SIDEBAR_X = MAIN_W;

        // Font sizes in pt (same as CSS tokens, direct to PptxGenJS)
        const FS = {
            name: 28, subtitle: 10, section_heading: 8,
            summary: 11, role: 12, meta: 10, desc: 10,
            sidebar_heading: 7.5, sidebar_text: 9,
            sidebar_small: 8.5, ref_email: 7.5,
        };

        // Letter spacing in pt (PptxGenJS charSpacing)
        const CS = { subtitle: 4, section_heading: 3, sidebar_heading: 2 };

        // Line spacing (lineSpacingMultiple is × 100)
        const LINE = { summary: 140, desc: 130, sidebar: 130 };

        // Helper: estimate text height in inches based on wrapping
        function textHeight(text, fontSize, availW, lineSpacing) {
            const avgCharW = fontSize * 0.52 / 72; // avg char width in inches
            const charsPerLine = Math.max(1, Math.floor(availW / avgCharW));
            const lines = Math.ceil(text.length / charsPerLine);
            return lines * fontSize * (lineSpacing / 100) / 72;
        }

        const pptx = new PptxGenJS();
        pptx.defineLayout({ name: 'A4_PORTRAIT', width: PAGE_W, height: PAGE_H });
        pptx.layout = 'A4_PORTRAIT';

        const slide = pptx.addSlide();
        slide.background = { color: 'FFFFFF' };

        // ── Sidebar background rectangle (full height) ──
        slide.addShape(pptx.shapes.RECTANGLE, {
            x: SIDEBAR_X, y: 0, w: SIDEBAR_W, h: PAGE_H,
            fill: { color: sidebarBg }
        });

        // ── Read content from DOM ──
        const cvPage = document.getElementById('cvPage');
        const mainEl = cvPage.querySelector('.main');
        const sidebarEl = cvPage.querySelector('.sidebar');

        // ── MAIN CONTENT ──
        let yMain = MAIN_PAD;
        const contentW = MAIN_W - (2 * MAIN_PAD);

        // Name
        const nameEl = mainEl.querySelector('h1');
        if (nameEl) {
            const h = 28 * 1.2 / 72; // single line height
            slide.addText(nameEl.textContent.trim(), {
                x: MAIN_PAD, y: yMain, w: contentW, h: h,
                fontFace: 'Georgia', fontSize: FS.name,
                color: C.dark, valign: 'top'
            });
            yMain += h + 0.02;
        }

        // Subtitle
        const subtitleEl = mainEl.querySelector('.subtitle');
        if (subtitleEl) {
            const h = 10 * 1.2 / 72;
            slide.addText(subtitleEl.textContent.trim(), {
                x: MAIN_PAD, y: yMain, w: contentW, h: h,
                fontFace: 'Arial', fontSize: FS.subtitle,
                color: accent, charSpacing: CS.subtitle, valign: 'top'
            });
            yMain += h + mmToIn(7); // subtitle margin-bottom
        }

        // Sections
        const sections = mainEl.querySelectorAll('.section');
        sections.forEach((section, sIdx) => {
            const h2 = section.querySelector('h2');
            if (h2) {
                if (sIdx > 0) yMain += mmToIn(4); // gap before section (not first)

                // Section heading with bottom border
                const hH = FS.section_heading * 1.3 / 72;
                slide.addText(h2.textContent.trim().toUpperCase(), {
                    x: MAIN_PAD, y: yMain, w: contentW, h: hH,
                    fontFace: 'Arial', fontSize: FS.section_heading,
                    bold: true, color: C.dark,
                    charSpacing: CS.section_heading, valign: 'bottom'
                });

                // Green underline
                slide.addShape(pptx.shapes.RECTANGLE, {
                    x: MAIN_PAD, y: yMain + hH, w: contentW, h: 0.018,
                    fill: { color: accent }
                });
                yMain += hH + 0.018 + mmToIn(2.5);
            }

            // Summary
            const summary = section.querySelector('.summary');
            if (summary) {
                const text = summary.textContent.trim();
                const h = textHeight(text, FS.summary, contentW, LINE.summary);
                slide.addText(text, {
                    x: MAIN_PAD, y: yMain, w: contentW, h: h,
                    fontFace: 'Arial', fontSize: FS.summary,
                    color: C.gray, valign: 'top',
                    lineSpacingMultiple: LINE.summary / 100
                });
                yMain += h + mmToIn(2);
            }

            // Experience/education items
            const items = section.querySelectorAll('.exp-item');
            items.forEach((item, iIdx) => {
                const role = item.querySelector('.role');
                const meta = item.querySelector('.meta');
                const desc = item.querySelector('.desc');

                if (role) {
                    const rText = role.textContent.trim();
                    const rH = textHeight(rText, FS.role, contentW, 120);
                    slide.addText(rText, {
                        x: MAIN_PAD, y: yMain, w: contentW, h: rH,
                        fontFace: 'Arial', fontSize: FS.role,
                        bold: true, color: C.dark, valign: 'top'
                    });
                    yMain += rH;
                }

                if (meta) {
                    const mText = meta.textContent.trim();
                    const mH = textHeight(mText, FS.meta, contentW, 120);
                    slide.addText(mText, {
                        x: MAIN_PAD, y: yMain, w: contentW, h: mH,
                        fontFace: 'Arial', fontSize: FS.meta,
                        color: accent, valign: 'top'
                    });
                    yMain += mH + mmToIn(1);
                }

                if (desc) {
                    const descText = desc.innerHTML
                        .replace(/<br\s*\/?>/gi, '\n')
                        .replace(/<[^>]+>/g, '').trim();
                    const dH = textHeight(descText, FS.desc, contentW, LINE.desc);
                    slide.addText(descText, {
                        x: MAIN_PAD, y: yMain, w: contentW, h: dH,
                        fontFace: 'Arial', fontSize: FS.desc,
                        color: C.gray, valign: 'top',
                        lineSpacingMultiple: LINE.desc / 100
                    });
                    yMain += dH;
                }

                // Gap between items (smaller for last item)
                if (iIdx < items.length - 1) yMain += mmToIn(3);
            });
        });

        // ── SIDEBAR CONTENT ──
        let ySb = SB_PAD_V;
        const sbContentW = SIDEBAR_W - (2 * SB_PAD_H);
        const sbX = SIDEBAR_X + SB_PAD_H;

        // Photo
        const photoEl = document.getElementById('cvPhoto');
        let photoBlob = null;
        if (photoEl && photoEl.src && photoEl.style.display !== 'none') {
            photoBlob = await createCircularPhoto(photoEl.src, 360);
        } else if (photoData && photoData.startsWith('data:')) {
            photoBlob = await createCircularPhoto(photoData, 360);
        }

        if (photoBlob) {
            const photoSize = mmToIn(42); // 42mm = ~1.654"
            const photoX = SIDEBAR_X + (SIDEBAR_W - photoSize) / 2;
            const base64 = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(new Blob([photoBlob], { type: 'image/png' }));
            });
            slide.addImage({
                data: base64,
                x: photoX, y: ySb, w: photoSize, h: photoSize,
                rounding: true
            });
            ySb += photoSize + mmToIn(5);
        }

        // Sidebar sections
        sidebarEl.querySelectorAll('.sidebar-section').forEach(section => {
            const heading = section.querySelector('h3');
            if (heading) {
                ySb += mmToIn(4); // gap before heading
                const hH = FS.sidebar_heading * 1.3 / 72;
                slide.addText(heading.textContent.trim().toUpperCase(), {
                    x: sbX, y: ySb, w: sbContentW, h: hH,
                    fontFace: 'Arial', fontSize: FS.sidebar_heading,
                    bold: true, color: 'FFFFFF',
                    charSpacing: CS.sidebar_heading, valign: 'top',
                    transparency: 20
                });
                ySb += hH + mmToIn(1.5);
            }

            // Contact items
            section.querySelectorAll('.contact-item').forEach(item => {
                const text = item.textContent.trim().replace(/\s+/g, ' ');
                const h = textHeight(text, FS.sidebar_text, sbContentW, LINE.sidebar);
                slide.addText(text, {
                    x: sbX, y: ySb, w: sbContentW, h: h,
                    fontFace: 'Arial', fontSize: FS.sidebar_text,
                    color: 'FFFFFF', valign: 'top',
                    lineSpacingMultiple: LINE.sidebar / 100
                });
                ySb += h + mmToIn(1);
            });

            // Skill items
            section.querySelectorAll('.skill-item').forEach(item => {
                const span = item.querySelector('span');
                const text = span ? span.textContent.trim() : item.textContent.trim();
                const prefix = item.classList.contains('skill-with-icon') ? '• ' : '';
                const fullText = prefix + text;
                const h = textHeight(fullText, FS.sidebar_small, sbContentW, LINE.sidebar);
                slide.addText(fullText, {
                    x: sbX, y: ySb, w: sbContentW, h: h,
                    fontFace: 'Arial', fontSize: FS.sidebar_small,
                    color: 'FFFFFF', valign: 'top',
                    transparency: 10,
                    lineSpacingMultiple: LINE.sidebar / 100
                });
                ySb += h + mmToIn(0.5);
            });

            // Reference items
            section.querySelectorAll('.reference-item').forEach(ref => {
                const name = ref.querySelector('.ref-name');
                const title = ref.querySelector('.ref-title');
                const email = ref.querySelector('.ref-email');

                if (name) {
                    const t = name.textContent.trim();
                    const h = textHeight(t, FS.sidebar_text, sbContentW, 120);
                    slide.addText(t, {
                        x: sbX, y: ySb, w: sbContentW, h: h,
                        fontFace: 'Arial', fontSize: FS.sidebar_text,
                        bold: true, color: 'FFFFFF', valign: 'top'
                    });
                    ySb += h;
                }
                if (title) {
                    const t = title.textContent.trim();
                    const h = textHeight(t, FS.sidebar_text, sbContentW, 120);
                    slide.addText(t, {
                        x: sbX, y: ySb, w: sbContentW, h: h,
                        fontFace: 'Arial', fontSize: FS.sidebar_text,
                        color: 'FFFFFF', valign: 'top', transparency: 20
                    });
                    ySb += h;
                }
                if (email) {
                    const t = email.textContent.trim();
                    const h = textHeight(t, FS.ref_email, sbContentW, 120);
                    slide.addText(t, {
                        x: sbX, y: ySb, w: sbContentW, h: h,
                        fontFace: 'Arial', fontSize: FS.ref_email,
                        color: 'FFFFFF', valign: 'top', transparency: 30
                    });
                    ySb += h + mmToIn(2);
                }
            });
        });

        // Download
        const cvName = nameEl ? nameEl.textContent.trim().replace(/\s+/g, '_') : 'Lebenslauf';
        await pptx.writeFile({ fileName: 'Lebenslauf_' + cvName + '.pptx' });

    } catch (error) {
        console.error('PPTX Error:', error);
        alert('PPTX-Erstellung fehlgeschlagen: ' + error.message);
    }

    btn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg> Als PPTX herunterladen';
    btn.disabled = false;
}

