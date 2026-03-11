// ══════════════════════════════════════════════
// DOCX Export — Two-column table layout via docx-js
// Dependencies: tokens.js, utils.js (TOKENS, loadScript, createCircularPhoto)
// ══════════════════════════════════════════════

async function downloadDOCX() {
    const btn = document.getElementById('docxBtn');
    btn.textContent = 'Wird erstellt...';
    btn.disabled = true;

    if (!window.docx) {
        await loadScript('./docx.umd.js');
    }

    try {
        const {
            Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
            WidthType, AlignmentType, BorderStyle, ShadingType, ImageRun,
            TableLayoutType, VerticalAlign, PageOrientation
        } = docx;

        // Read live colors from pickers (override token defaults)
        const sidebarColorHex = document.getElementById('sidebarColor').value || '#1e4d91';
        const accentColorHex = document.getElementById('accentColor').value || '#4aaa48';
        const sidebarBg = sidebarColorHex.replace('#', '');
        const accent = accentColorHex.replace('#', '');

        // Shorthand references to tokens
        const T = TOKENS;
        const F = T.fonts;
        const S = T.spacing;
        const LS = T.letterSpacing;
        const LN = T.lineSpacing;
        const C = { ...T.colors, sidebar_bg: sidebarBg, accent: accent };
        const L = T.layout;

        // Prepare circular photo (high-res for print)
        let photoBlob = null;
        const photoEl = document.getElementById('cvPhoto');
        if (photoEl && photoEl.src && photoEl.style.display !== 'none') {
            photoBlob = await createCircularPhoto(photoEl.src, 360);
        } else if (photoData && photoData.startsWith('data:')) {
            photoBlob = await createCircularPhoto(photoData, 360);
        }

        // --- Read content from DOM ---
        const cvPage = document.getElementById('cvPage');
        const mainEl = cvPage.querySelector('.main');
        const sidebarEl = cvPage.querySelector('.sidebar');

        // No borders helper
        const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
        const noBorders = () => ({ top: noBorder, bottom: noBorder, left: noBorder, right: noBorder });

        // ══════════════════════════════════════
        // SIDEBAR — all values from TOKENS
        // ══════════════════════════════════════
        const sidebarChildren = [];

        if (photoBlob) {
            sidebarChildren.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: S.sidebar_section_mb },
                children: [new ImageRun({
                    data: photoBlob,
                    transformation: { width: 140, height: 140 },
                    type: 'png'
                })]
            }));
        }

        function sidebarHeading(text) {
            return new Paragraph({
                spacing: { before: S.sidebar_section_mb, after: S.sidebar_h3_mb },
                children: [new TextRun({
                    text: text.toUpperCase(),
                    font: F.sidebar_heading.family,
                    size: F.sidebar_heading.size,
                    bold: true,
                    color: C.white,
                    characterSpacing: LS.sidebar_heading
                })]
            });
        }

        function sidebarLine(text, opts = {}) {
            return new Paragraph({
                spacing: { after: opts.after || S.contact_mb, line: LN.sidebar },
                children: [new TextRun({
                    text: text,
                    font: (opts.font || F.sidebar_text).family,
                    size: (opts.font || F.sidebar_text).size,
                    color: C.white,
                    bold: opts.bold || false
                })]
            });
        }

        // Read sidebar sections from DOM
        sidebarEl.querySelectorAll('.sidebar-section').forEach(section => {
            const heading = section.querySelector('h3');
            if (heading) sidebarChildren.push(sidebarHeading(heading.textContent.trim()));

            section.querySelectorAll('.contact-item').forEach(item => {
                sidebarChildren.push(sidebarLine(
                    item.textContent.trim().replace(/\s+/g, ' ')
                ));
            });

            section.querySelectorAll('.skill-item').forEach(item => {
                const span = item.querySelector('span');
                const text = span ? span.textContent.trim() : item.textContent.trim();
                const prefix = item.classList.contains('skill-with-icon') ? '• ' : '';
                sidebarChildren.push(sidebarLine(prefix + text, { font: F.sidebar_small }));
            });

            section.querySelectorAll('.reference-item').forEach(ref => {
                const name = ref.querySelector('.ref-name');
                const title = ref.querySelector('.ref-title');
                const email = ref.querySelector('.ref-email');
                if (name) sidebarChildren.push(sidebarLine(name.textContent.trim(), { bold: true }));
                if (title) sidebarChildren.push(sidebarLine(title.textContent.trim()));
                if (email) sidebarChildren.push(sidebarLine(email.textContent.trim(), {
                    after: S.ref_mb, font: F.ref_email
                }));
            });
        });

        // ══════════════════════════════════════
        // MAIN CONTENT — all values from TOKENS
        // ══════════════════════════════════════
        const mainChildren = [];
        const nameEl = mainEl.querySelector('h1');
        const subtitleEl = mainEl.querySelector('.subtitle');

        // Name
        if (nameEl) {
            mainChildren.push(new Paragraph({
                spacing: { after: 0 },
                children: [new TextRun({
                    text: nameEl.textContent.trim(),
                    font: F.name.family,
                    size: F.name.size,
                    color: C.dark
                })]
            }));
        }

        // Subtitle
        if (subtitleEl) {
            mainChildren.push(new Paragraph({
                spacing: { after: S.subtitle_mb },
                children: [new TextRun({
                    text: subtitleEl.textContent.trim(),
                    font: F.subtitle.family,
                    size: F.subtitle.size,
                    color: accent,
                    characterSpacing: LS.subtitle
                })]
            }));
        }

        // Section heading — dark text, green bottom border
        function sectionTitle(text) {
            return new Paragraph({
                spacing: { before: S.section_mb, after: S.h2_mb },
                border: {
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: accent }
                },
                children: [new TextRun({
                    text: text.toUpperCase(),
                    font: F.section_heading.family,
                    size: F.section_heading.size,
                    bold: true,
                    color: C.dark,
                    characterSpacing: LS.section_heading
                })]
            });
        }

        // Experience/education item
        function expItem(role, meta, descText) {
            const p = [];
            p.push(new Paragraph({
                spacing: { before: S.exp_mb / 2, after: 0 },
                children: [new TextRun({
                    text: role,
                    font: F.role.family,
                    size: F.role.size,
                    bold: true,
                    color: C.dark
                })]
            }));
            if (meta) {
                p.push(new Paragraph({
                    spacing: { before: 0, after: S.meta_mb },
                    children: [new TextRun({
                        text: meta,
                        font: F.meta.family,
                        size: F.meta.size,
                        color: accent
                    })]
                }));
            }
            if (descText) {
                descText.split('\n').forEach(line => {
                    if (line.trim()) {
                        p.push(new Paragraph({
                            spacing: { after: 20, line: LN.desc },
                            children: [new TextRun({
                                text: line.trim(),
                                font: F.desc.family,
                                size: F.desc.size,
                                color: C.gray
                            })]
                        }));
                    }
                });
            }
            return p;
        }

        // Read sections from DOM
        mainEl.querySelectorAll('.section').forEach(section => {
            const h2 = section.querySelector('h2');
            if (h2) mainChildren.push(sectionTitle(h2.textContent.trim()));

            const summary = section.querySelector('.summary');
            if (summary) {
                mainChildren.push(new Paragraph({
                    spacing: { after: S.h2_mb, line: LN.summary },
                    children: [new TextRun({
                        text: summary.textContent.trim(),
                        font: F.summary.family,
                        size: F.summary.size,
                        color: C.gray
                    })]
                }));
            }

            section.querySelectorAll('.exp-item').forEach(item => {
                const role = item.querySelector('.role');
                const meta = item.querySelector('.meta');
                const desc = item.querySelector('.desc');
                const descText = desc
                    ? desc.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim()
                    : '';
                mainChildren.push(...expItem(
                    role ? role.textContent.trim() : '',
                    meta ? meta.textContent.trim() : '',
                    descText
                ));
            });
        });

        const cvName = nameEl ? nameEl.textContent.trim().replace(/\s+/g, '_') : 'Lebenslauf';

        // ══════════════════════════════════════
        // ASSEMBLE — Two-column table, 0 page margins
        // Cell margins = CSS padding (from TOKENS)
        // ══════════════════════════════════════
        const mainTable = new Table({
            rows: [
                new TableRow({
                    height: { value: T.page.height_dxa, rule: docx.HeightRule.ATLEAST },
                    children: [
                        new TableCell({
                            width: { size: L.main_width_dxa, type: WidthType.DXA },
                            borders: noBorders(),
                            margins: {
                                top: L.main_padding_dxa,
                                bottom: L.main_padding_dxa,
                                left: L.main_padding_dxa,
                                right: L.main_padding_dxa
                            },
                            children: mainChildren.length > 0 ? mainChildren : [new Paragraph('')],
                            verticalAlign: VerticalAlign.TOP
                        }),
                        new TableCell({
                            width: { size: L.sidebar_width_dxa, type: WidthType.DXA },
                            borders: noBorders(),
                            margins: {
                                top: L.sidebar_padding_v_dxa,
                                bottom: L.sidebar_padding_v_dxa,
                                left: L.sidebar_padding_h_dxa,
                                right: L.sidebar_padding_h_dxa
                            },
                            shading: { type: ShadingType.CLEAR, fill: sidebarBg },
                            children: sidebarChildren.length > 0 ? sidebarChildren : [new Paragraph('')],
                            verticalAlign: VerticalAlign.TOP
                        })
                    ]
                })
            ],
            width: { size: T.page.width_dxa, type: WidthType.DXA },
            layout: TableLayoutType.FIXED
        });

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        size: {
                            width: T.page.width_dxa,
                            height: T.page.height_dxa,
                            orientation: PageOrientation.PORTRAIT
                        },
                        margin: { top: 0, bottom: 0, left: 0, right: 0 }
                    }
                },
                children: [mainTable]
            }]
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Lebenslauf_' + cvName + '.docx';
        a.click();
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('DOCX Error:', error);
        alert('DOCX-Erstellung fehlgeschlagen: ' + error.message);
    }

    btn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> Als DOCX herunterladen';
    btn.disabled = false;
}

// ══════════════════════════════════════════════
// PPTX EXPORT — Portrait DIN A4, absolute positioning
// Uses TOKENS + PptxGenJS
