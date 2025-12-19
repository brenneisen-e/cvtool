import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  TableCell,
  TableRow,
  Table,
  WidthType,
  BorderStyle,
  Packer,
} from 'docx';
import PptxGenJS from 'pptxgenjs';
import type { CVData } from '../types';

interface StyleConfig {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  headerFontSize: number;
  bodyFontSize: number;
}

const defaultStyle: StyleConfig = {
  primaryColor: '0066CC',
  secondaryColor: '333333',
  fontFamily: 'Calibri',
  headerFontSize: 28,
  bodyFontSize: 11,
};

export async function generateDocx(
  cvData: CVData,
  style: Partial<StyleConfig> = {}
): Promise<Blob> {
  const config = { ...defaultStyle, ...style };

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header with name and title
          new Paragraph({
            children: [
              new TextRun({
                text: cvData.personalInfo.name,
                bold: true,
                size: config.headerFontSize * 2,
                font: config.fontFamily,
                color: config.primaryColor,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: cvData.personalInfo.title,
                size: config.bodyFontSize * 2 + 4,
                font: config.fontFamily,
                color: config.secondaryColor,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),

          // Contact info
          createContactParagraph(cvData.personalInfo, config),

          // Summary
          ...(cvData.summary
            ? [
                createSectionHeader('Profil', config),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cvData.summary,
                      size: config.bodyFontSize * 2,
                      font: config.fontFamily,
                    }),
                  ],
                  spacing: { after: 200 },
                }),
              ]
            : []),

          // Experience
          ...(cvData.experience.length > 0
            ? [
                createSectionHeader('Berufserfahrung', config),
                ...cvData.experience.flatMap((exp) => createExperienceEntry(exp, config)),
              ]
            : []),

          // Projects
          ...(cvData.projects.length > 0
            ? [
                createSectionHeader('Projekterfahrung', config),
                ...cvData.projects.flatMap((proj) => createProjectEntry(proj, config)),
              ]
            : []),

          // Education
          ...(cvData.education.length > 0
            ? [
                createSectionHeader('Ausbildung', config),
                ...cvData.education.flatMap((edu) => createEducationEntry(edu, config)),
              ]
            : []),

          // Skills
          ...(cvData.skills.length > 0
            ? [createSectionHeader('Kenntnisse', config), createSkillsTable(cvData.skills, config)]
            : []),

          // Languages
          ...(cvData.languages.length > 0
            ? [
                createSectionHeader('Sprachen', config),
                ...cvData.languages.map(
                  (lang) =>
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `${lang.language}: `,
                          bold: true,
                          size: config.bodyFontSize * 2,
                          font: config.fontFamily,
                        }),
                        new TextRun({
                          text: lang.level,
                          size: config.bodyFontSize * 2,
                          font: config.fontFamily,
                        }),
                      ],
                      spacing: { after: 100 },
                    })
                ),
              ]
            : []),

          // Certifications
          ...(cvData.certifications.length > 0
            ? [
                createSectionHeader('Zertifikate', config),
                ...cvData.certifications.map(
                  (cert) =>
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `• ${cert}`,
                          size: config.bodyFontSize * 2,
                          font: config.fontFamily,
                        }),
                      ],
                      spacing: { after: 50 },
                    })
                ),
              ]
            : []),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

function createSectionHeader(title: string, config: StyleConfig): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        size: (config.bodyFontSize + 3) * 2,
        font: config.fontFamily,
        color: config.primaryColor,
      }),
    ],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    border: {
      bottom: {
        color: config.primaryColor,
        size: 6,
        style: BorderStyle.SINGLE,
        space: 1,
      },
    },
  });
}

function createContactParagraph(
  personalInfo: CVData['personalInfo'],
  config: StyleConfig
): Paragraph {
  const parts: string[] = [];
  if (personalInfo.email) parts.push(personalInfo.email);
  if (personalInfo.phone) parts.push(personalInfo.phone);
  if (personalInfo.location) parts.push(personalInfo.location);
  if (personalInfo.linkedin) parts.push(personalInfo.linkedin);

  return new Paragraph({
    children: [
      new TextRun({
        text: parts.join(' | '),
        size: config.bodyFontSize * 2,
        font: config.fontFamily,
        color: config.secondaryColor,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
  });
}

function createExperienceEntry(
  exp: CVData['experience'][0],
  config: StyleConfig
): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: exp.position,
          bold: true,
          size: config.bodyFontSize * 2 + 2,
          font: config.fontFamily,
        }),
        new TextRun({
          text: ` | ${exp.company}`,
          size: config.bodyFontSize * 2 + 2,
          font: config.fontFamily,
        }),
      ],
      spacing: { before: 150 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${exp.startDate} - ${exp.current ? 'heute' : exp.endDate}`,
          italics: true,
          size: config.bodyFontSize * 2,
          font: config.fontFamily,
          color: '666666',
        }),
      ],
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: exp.description,
          size: config.bodyFontSize * 2,
          font: config.fontFamily,
        }),
      ],
      spacing: { after: 50 },
    }),
  ];

  exp.achievements.forEach((achievement) => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `• ${achievement}`,
            size: config.bodyFontSize * 2,
            font: config.fontFamily,
          }),
        ],
        spacing: { after: 30 },
      })
    );
  });

  return paragraphs;
}

function createProjectEntry(
  proj: CVData['projects'][0],
  config: StyleConfig
): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: proj.name,
          bold: true,
          size: config.bodyFontSize * 2 + 2,
          font: config.fontFamily,
        }),
        proj.client
          ? new TextRun({
              text: ` | ${proj.client}`,
              size: config.bodyFontSize * 2 + 2,
              font: config.fontFamily,
            })
          : new TextRun({ text: '' }),
      ],
      spacing: { before: 150 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${proj.role} | ${proj.duration}`,
          italics: true,
          size: config.bodyFontSize * 2,
          font: config.fontFamily,
          color: '666666',
        }),
      ],
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: proj.description,
          size: config.bodyFontSize * 2,
          font: config.fontFamily,
        }),
      ],
      spacing: { after: 50 },
    }),
  ];

  if (proj.technologies.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Technologien: ',
            bold: true,
            size: config.bodyFontSize * 2,
            font: config.fontFamily,
          }),
          new TextRun({
            text: proj.technologies.join(', '),
            size: config.bodyFontSize * 2,
            font: config.fontFamily,
          }),
        ],
        spacing: { after: 100 },
      })
    );
  }

  return paragraphs;
}

function createEducationEntry(
  edu: CVData['education'][0],
  config: StyleConfig
): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: `${edu.degree} - ${edu.field}`,
          bold: true,
          size: config.bodyFontSize * 2 + 2,
          font: config.fontFamily,
        }),
      ],
      spacing: { before: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: edu.institution,
          size: config.bodyFontSize * 2,
          font: config.fontFamily,
        }),
        new TextRun({
          text: ` | ${edu.startDate} - ${edu.endDate}`,
          italics: true,
          size: config.bodyFontSize * 2,
          font: config.fontFamily,
          color: '666666',
        }),
      ],
      spacing: { after: 100 },
    }),
  ];
}

function createSkillsTable(skills: CVData['skills'], config: StyleConfig): Table {
  const rows = skills.map(
    (category) =>
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: category.category,
                    bold: true,
                    size: config.bodyFontSize * 2,
                    font: config.fontFamily,
                  }),
                ],
              }),
            ],
            width: { size: 25, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: category.skills.join(', '),
                    size: config.bodyFontSize * 2,
                    font: config.fontFamily,
                  }),
                ],
              }),
            ],
            width: { size: 75, type: WidthType.PERCENTAGE },
          }),
        ],
      })
  );

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

export async function generatePptx(
  cvData: CVData,
  style: Partial<StyleConfig> = {}
): Promise<Blob> {
  const config = { ...defaultStyle, ...style };
  const pptx = new PptxGenJS();

  pptx.author = cvData.personalInfo.name;
  pptx.title = `CV - ${cvData.personalInfo.name}`;
  pptx.subject = 'Lebenslauf';

  // Title Slide
  const titleSlide = pptx.addSlide();
  titleSlide.addText(cvData.personalInfo.name, {
    x: 0.5,
    y: 2,
    w: 9,
    h: 1,
    fontSize: 44,
    bold: true,
    color: config.primaryColor,
    align: 'center',
  });
  titleSlide.addText(cvData.personalInfo.title, {
    x: 0.5,
    y: 3,
    w: 9,
    h: 0.5,
    fontSize: 24,
    color: config.secondaryColor,
    align: 'center',
  });

  // Contact info
  const contactParts: string[] = [];
  if (cvData.personalInfo.email) contactParts.push(cvData.personalInfo.email);
  if (cvData.personalInfo.phone) contactParts.push(cvData.personalInfo.phone);
  if (cvData.personalInfo.location) contactParts.push(cvData.personalInfo.location);

  titleSlide.addText(contactParts.join(' | '), {
    x: 0.5,
    y: 4,
    w: 9,
    h: 0.3,
    fontSize: 12,
    color: '666666',
    align: 'center',
  });

  // Profile Slide
  if (cvData.summary) {
    const profileSlide = pptx.addSlide();
    addSlideHeader(profileSlide, 'Profil', config);
    profileSlide.addText(cvData.summary, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 4,
      fontSize: 14,
      color: config.secondaryColor,
      valign: 'top',
    });
  }

  // Experience Slides
  if (cvData.experience.length > 0) {
    const expSlide = pptx.addSlide();
    addSlideHeader(expSlide, 'Berufserfahrung', config);

    let yPos = 1.5;
    cvData.experience.slice(0, 3).forEach((exp) => {
      expSlide.addText(`${exp.position} | ${exp.company}`, {
        x: 0.5,
        y: yPos,
        w: 9,
        h: 0.4,
        fontSize: 16,
        bold: true,
        color: config.primaryColor,
      });
      yPos += 0.4;

      expSlide.addText(`${exp.startDate} - ${exp.current ? 'heute' : exp.endDate}`, {
        x: 0.5,
        y: yPos,
        w: 9,
        h: 0.3,
        fontSize: 11,
        italic: true,
        color: '666666',
      });
      yPos += 0.3;

      if (exp.achievements.length > 0) {
        const bulletPoints = exp.achievements
          .slice(0, 2)
          .map((a) => ({ text: a, options: { bullet: true } }));
        expSlide.addText(bulletPoints, {
          x: 0.7,
          y: yPos,
          w: 8.5,
          h: 0.8,
          fontSize: 11,
          color: config.secondaryColor,
        });
        yPos += 0.9;
      }

      yPos += 0.2;
    });
  }

  // Projects Slide
  if (cvData.projects.length > 0) {
    const projSlide = pptx.addSlide();
    addSlideHeader(projSlide, 'Projekterfahrung', config);

    let yPos = 1.5;
    cvData.projects.slice(0, 3).forEach((proj) => {
      projSlide.addText(`${proj.name}${proj.client ? ` | ${proj.client}` : ''}`, {
        x: 0.5,
        y: yPos,
        w: 9,
        h: 0.4,
        fontSize: 16,
        bold: true,
        color: config.primaryColor,
      });
      yPos += 0.4;

      projSlide.addText(`${proj.role} | ${proj.duration}`, {
        x: 0.5,
        y: yPos,
        w: 9,
        h: 0.3,
        fontSize: 11,
        italic: true,
        color: '666666',
      });
      yPos += 0.4;

      projSlide.addText(proj.description.slice(0, 200) + '...', {
        x: 0.5,
        y: yPos,
        w: 9,
        h: 0.6,
        fontSize: 11,
        color: config.secondaryColor,
      });
      yPos += 0.8;
    });
  }

  // Skills Slide
  if (cvData.skills.length > 0) {
    const skillsSlide = pptx.addSlide();
    addSlideHeader(skillsSlide, 'Kenntnisse & Fähigkeiten', config);

    const tableData: PptxGenJS.TableRow[] = cvData.skills.map((category) => [
      { text: category.category, options: { bold: true, fontSize: 12 } },
      { text: category.skills.join(', '), options: { fontSize: 11 } },
    ]);

    skillsSlide.addTable(tableData, {
      x: 0.5,
      y: 1.5,
      w: 9,
      colW: [2.5, 6.5],
      border: { color: 'CCCCCC' },
      fontFace: config.fontFamily,
    });
  }

  // Education Slide
  if (cvData.education.length > 0 || cvData.certifications.length > 0) {
    const eduSlide = pptx.addSlide();
    addSlideHeader(eduSlide, 'Ausbildung & Zertifikate', config);

    let yPos = 1.5;

    cvData.education.forEach((edu) => {
      eduSlide.addText(`${edu.degree} - ${edu.field}`, {
        x: 0.5,
        y: yPos,
        w: 9,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: config.primaryColor,
      });
      yPos += 0.4;

      eduSlide.addText(`${edu.institution} | ${edu.startDate} - ${edu.endDate}`, {
        x: 0.5,
        y: yPos,
        w: 9,
        h: 0.3,
        fontSize: 11,
        color: config.secondaryColor,
      });
      yPos += 0.5;
    });

    if (cvData.certifications.length > 0) {
      yPos += 0.3;
      eduSlide.addText('Zertifikate:', {
        x: 0.5,
        y: yPos,
        w: 9,
        h: 0.3,
        fontSize: 14,
        bold: true,
        color: config.primaryColor,
      });
      yPos += 0.4;

      const certBullets = cvData.certifications.map((cert) => ({
        text: cert,
        options: { bullet: true },
      }));
      eduSlide.addText(certBullets, {
        x: 0.7,
        y: yPos,
        w: 8.5,
        h: 2,
        fontSize: 11,
        color: config.secondaryColor,
      });
    }
  }

  return (await pptx.write({ outputType: 'blob' })) as Blob;
}

function addSlideHeader(slide: PptxGenJS.Slide, title: string, config: StyleConfig) {
  slide.addText(title, {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: config.primaryColor,
  });

  slide.addShape('rect', {
    x: 0.5,
    y: 1.1,
    w: 9,
    h: 0.05,
    fill: { color: config.primaryColor },
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
