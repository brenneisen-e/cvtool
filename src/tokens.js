const TOKENS = {
    page: {
        width_dxa: 11906,       // 210mm
        height_dxa: 16838,      // 297mm
    },
    layout: {
        sidebar_width_dxa: 4081,  // 72mm × 56.69
        main_width_dxa: 7825,     // (210 - 72)mm × 56.69
        main_padding_dxa: 794,    // 14mm × 56.69
        sidebar_padding_v_dxa: 454, // 8mm × 56.69
        sidebar_padding_h_dxa: 340, // 6mm × 56.69
    },
    // font sizes in half-points (hp) — docx-js convention: size = pt × 2
    fonts: {
        name:            { family: 'Georgia',  size: 56 },  // 28pt
        subtitle:        { family: 'Arial',    size: 20 },  // 10pt
        section_heading: { family: 'Arial',    size: 16 },  // 8pt
        summary:         { family: 'Arial',    size: 22 },  // 11pt
        role:            { family: 'Arial',    size: 24 },  // 12pt
        meta:            { family: 'Arial',    size: 20 },  // 10pt
        desc:            { family: 'Arial',    size: 20 },  // 10pt
        sidebar_heading: { family: 'Arial',    size: 15 },  // 7.5pt
        sidebar_text:    { family: 'Arial',    size: 18 },  // 9pt
        sidebar_small:   { family: 'Arial',    size: 17 },  // 8.5pt
        ref_email:       { family: 'Arial',    size: 15 },  // 7.5pt
    },
    // characterSpacing in twentieth-of-a-point (1pt = 20)
    letterSpacing: {
        subtitle: 40,           // 2pt
        section_heading: 30,    // 1.5pt
        sidebar_heading: 20,    // 1pt
    },
    // paragraph spacing in DXA (1pt = 20 DXA)
    spacing: {
        section_mb: 360,        // 18pt
        subtitle_mb: 400,       // 20pt
        h2_mb: 200,             // 10pt
        h2_pb: 100,             // 5pt (as border gap)
        exp_mb: 280,            // 14pt
        meta_mb: 80,            // 4pt
        sidebar_section_mb: 320,// 16pt
        sidebar_h3_mb: 120,     // 6pt
        contact_mb: 100,        // 5pt
        skill_py: 60,           // 3pt
        ref_mb: 160,            // 8pt
    },
    // line spacing: multiplier × 240 (Word base)
    lineSpacing: {
        summary: 384,           // 1.6 × 240
        desc: 360,              // 1.5 × 240
        sidebar: 336,           // 1.4 × 240
    },
    colors: {
        sidebar_bg: '1e4d91',
        accent: '4aaa48',
        dark: '1a1a2e',
        gray: '4a4a5a',
        white: 'FFFFFF',
    }
};
