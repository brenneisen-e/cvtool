import JSZip from 'jszip';
import type { CVData, UploadedFile } from '../types';

/**
 * Deloitte CV Template Generator
 *
 * Ersetzt Platzhalter und Beispieltexte in den Deloitte-Vorlagen mit echten CV-Daten.
 */

// ============================================================================
// DELOITTE DOCX TEMPLATE MAPPING
// ============================================================================

interface DocxReplacements {
  pattern: string | RegExp;
  getValue: (cvData: CVData) => string;
}

function getDocxReplacements(cvData: CVData): DocxReplacements[] {
  const fullName = cvData.personalInfo.name || 'Vorname Nachname';

  return [
    // Name
    { pattern: /\(Vorname, Nachname\)/gi, getValue: () => fullName },
    { pattern: /Vorname, Nachname/gi, getValue: () => fullName },
    { pattern: 'Name', getValue: () => fullName },

    // Position/Level
    { pattern: /\(Level\)/gi, getValue: () => cvData.personalInfo.title || 'Consultant' },

    // Nationalität
    { pattern: /\(….\)/g, getValue: () => cvData.personalInfo.location?.split(',')[1]?.trim() || 'Deutsch' },

    // Ausbildung
    {
      pattern: /\(Höchster erzielter Abschluss, Vertiefungsfächer, Name der Universität – zusätzliche Angaben zur Ausbildung können am Ende des Dokuments angeführt werden\)/gi,
      getValue: () => {
        const edu = cvData.education[0];
        if (edu) {
          return `${edu.degree}, ${edu.field}, ${edu.institution}`;
        }
        return '';
      }
    },
    {
      pattern: /Höchster erzielter Abschluss, Vertiefungsfächer/gi,
      getValue: () => {
        const edu = cvData.education[0];
        return edu ? `${edu.degree}, ${edu.field}` : '';
      }
    },
    {
      pattern: /Name der Universität/gi,
      getValue: () => cvData.education[0]?.institution || ''
    },

    // Profil
    {
      pattern: /\(Maximal 15 Zeilen:.*?Berufserfahrung\)/gis,
      getValue: () => cvData.summary || ''
    },
    {
      pattern: /Gegenwärtige Spezialisierung.*?Berufserfahrung/gis,
      getValue: () => cvData.summary || ''
    },

    // Software/Tools
    {
      pattern: /\(Oracle, PeopleSoft, CRM Lösungen.*?etc\.\)/gis,
      getValue: () => {
        const techSkills = cvData.skills.find(s =>
          s.category.toLowerCase().includes('software') ||
          s.category.toLowerCase().includes('technolog')
        );
        return techSkills?.skills.join(', ') || '';
      }
    },
    {
      pattern: /\(MS Access, Windows NT, Lotus Notes.*?etc\.\)/gis,
      getValue: () => {
        const tools = cvData.skills.find(s => s.category.toLowerCase().includes('tool'));
        return tools?.skills.join(', ') || '';
      }
    },

    // Zertifikate
    {
      pattern: /\(Agile, Scrum, Salesforce…*?\)/gi,
      getValue: () => cvData.certifications.join(', ')
    },

    // Sprachen - Formatierung
    {
      pattern: /Muttersprache/g,
      getValue: () => {
        const native = cvData.languages.find(l =>
          l.level.toLowerCase().includes('mutter') || l.level.toLowerCase().includes('native')
        );
        return native ? `${native.language} (Muttersprache)` : 'Muttersprache';
      }
    },

    // Datum-Platzhalter
    { pattern: /Mmm JJ – heute/g, getValue: () => {
        const exp = cvData.experience[0];
        return exp ? `${exp.startDate} – heute` : '';
      }
    },
    { pattern: /Mmm JJ – Mmm JJ/g, getValue: () => {
        const exp = cvData.experience[1];
        return exp ? `${exp.startDate} – ${exp.endDate || 'heute'}` : '';
      }
    },

    // Projekt-Details
    {
      pattern: /\(Name oder nähere Beschreibung des Kunden \+ Industrie \+ Ort \+ Art des Projekts\)/gi,
      getValue: () => {
        const proj = cvData.projects[0];
        return proj ? `${proj.client || proj.name}` : '';
      }
    },
    {
      pattern: /\(Rolle\)/gi,
      getValue: () => cvData.projects[0]?.role || ''
    },
    {
      pattern: /\(Tätigkeit,.*?Ergebnis\)/gis,
      getValue: () => cvData.projects[0]?.description || ''
    },
  ];
}

/**
 * Generiert DOCX aus Deloitte-Template
 */
export async function generateDocxFromTemplate(
  templateFile: UploadedFile,
  cvData: CVData
): Promise<Blob> {
  if (!templateFile.file) {
    throw new Error('Template-Datei nicht gefunden');
  }

  const arrayBuffer = await templateFile.file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // document.xml bearbeiten
  const docFile = zip.file('word/document.xml');
  if (!docFile) {
    throw new Error('Ungültiges DOCX-Format');
  }

  let content = await docFile.async('text');
  const replacements = getDocxReplacements(cvData);

  for (const { pattern, getValue } of replacements) {
    const value = getValue(cvData);
    if (typeof pattern === 'string') {
      content = content.split(pattern).join(escapeXml(value));
    } else {
      content = content.replace(pattern, escapeXml(value));
    }
  }

  zip.file('word/document.xml', content);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

// ============================================================================
// DELOITTE PPTX TEMPLATE MAPPING
// ============================================================================

interface PptxReplacements {
  search: string | RegExp;
  replace: (cvData: CVData) => string;
}

function getPptxReplacements(cvData: CVData): PptxReplacements[] {
  const fullName = cvData.personalInfo.name || 'Vorname Nachname';

  // Skills formatieren
  const businessSkills = cvData.skills.find(s =>
    s.category.toLowerCase().includes('business') || s.category.toLowerCase().includes('fach')
  )?.skills || [];

  const techSkills = cvData.skills.find(s =>
    s.category.toLowerCase().includes('tech') || s.category.toLowerCase().includes('software')
  )?.skills || [];

  // Industrien aus Projekten
  const industries = [...new Set(cvData.projects
    .filter(p => p.client)
    .map(p => p.client!.split(/[,;]/)[0].trim())
  )].slice(0, 3);

  // Kunden formatieren
  const clients = cvData.projects
    .filter(p => p.client)
    .map(p => p.client!)
    .slice(0, 4)
    .join(', ');

  return [
    // Name
    { search: 'First Name Last Name', replace: () => fullName },
    { search: 'FirstName LastName', replace: () => fullName },

    // Level/Position
    { search: /Level(?=[\s,|])/g, replace: () => cvData.personalInfo.title || 'Consultant' },

    // Standort
    { search: 'Germany, Office Location', replace: () => cvData.personalInfo.location || 'Deutschland' },
    { search: 'Deutschland, Office Location', replace: () => cvData.personalInfo.location || 'Deutschland' },

    // Profil/Summary - Englisch
    {
      search: /Max has a professional experience.*?Resume text runs here\./gs,
      replace: () => cvData.summary || ''
    },
    // Profil/Summary - Deutsch
    {
      search: /Max verfügt über.*?Text läuft hier\./gs,
      replace: () => cvData.summary || ''
    },

    // Dummy-Texte ersetzen
    {
      search: /This is dummy text.*?populated with real text\./g,
      replace: () => ''
    },
    {
      search: /Text läuft hier.*?gefüllt wird\./g,
      replace: () => ''
    },
    {
      search: /Resume text runs here.*?populated with real text\./g,
      replace: () => ''
    },

    // Education
    {
      search: "Master's degree",
      replace: () => cvData.education[0]?.degree || "Master's degree"
    },
    {
      search: 'Master-Abschluss',
      replace: () => cvData.education[0]?.degree || 'Master-Abschluss'
    },
    {
      search: 'Computer Science',
      replace: () => cvData.education[0]?.field || 'Computer Science'
    },
    {
      search: 'Informatik',
      replace: () => cvData.education[0]?.field || 'Informatik'
    },
    {
      search: 'Example University',
      replace: () => cvData.education[0]?.institution || 'Universität'
    },
    {
      search: 'Beispiel Universität',
      replace: () => cvData.education[0]?.institution || 'Universität'
    },
    {
      search: 'Example City',
      replace: () => cvData.personalInfo.location?.split(',')[0] || 'Stadt'
    },
    {
      search: 'Beispiel Stadt',
      replace: () => cvData.personalInfo.location?.split(',')[0] || 'Stadt'
    },

    // Sprachen
    { search: 'English C1', replace: () => cvData.languages[0] ? `${cvData.languages[0].language} ${cvData.languages[0].level}` : 'English C1' },
    { search: 'French B1', replace: () => cvData.languages[1] ? `${cvData.languages[1].language} ${cvData.languages[1].level}` : '' },
    { search: 'German C2', replace: () => cvData.languages[2] ? `${cvData.languages[2].language} ${cvData.languages[2].level}` : '' },
    { search: 'Polish A2', replace: () => cvData.languages[3] ? `${cvData.languages[3].language} ${cvData.languages[3].level}` : '' },
    { search: 'Deutsch C2', replace: () => cvData.languages[0] ? `${cvData.languages[0].language} ${cvData.languages[0].level}` : 'Deutsch C2' },
    { search: 'Englisch C1', replace: () => cvData.languages[1] ? `${cvData.languages[1].language} ${cvData.languages[1].level}` : '' },
    { search: 'Französisch B1', replace: () => cvData.languages[2] ? `${cvData.languages[2].language} ${cvData.languages[2].level}` : '' },
    { search: 'Polnisch A2', replace: () => cvData.languages[3] ? `${cvData.languages[3].language} ${cvData.languages[3].level}` : '' },

    // Zertifikate
    { search: 'SAP Certified Associate Project Manager', replace: () => cvData.certifications[0] || 'SAP Certified' },
    { search: 'Certified Management Accountant', replace: () => cvData.certifications[1] || '' },
    { search: 'Scrum Master', replace: () => cvData.certifications[2] || '' },

    // Business Skills - Beispiele durch echte ersetzen
    { search: 'Rewards Optimization', replace: () => businessSkills[0] || 'Business Consulting' },
    { search: 'Secure Application Development', replace: () => businessSkills[1] || '' },
    { search: 'Blockchain Platform', replace: () => businessSkills[2] || '' },
    { search: 'Investment Management', replace: () => businessSkills[3] || '' },
    { search: 'Rewards Optimierung', replace: () => businessSkills[0] || 'Business Consulting' },
    { search: 'Sichere Anwendungsentwicklung', replace: () => businessSkills[1] || '' },
    { search: 'Blockchain Plattform', replace: () => businessSkills[2] || '' },

    // Technology Skills
    { search: 'Data Warehouse Integrations', replace: () => techSkills[0] || 'Data Analysis' },
    { search: 'Temenos: CRM', replace: () => techSkills[1] || '' },
    { search: 'SAP S/4HANA Cloud – Finance', replace: () => techSkills[2] || '' },
    { search: 'Agile 101', replace: () => techSkills[3] || '' },
    { search: 'Microsoft C#', replace: () => techSkills[4] || '' },

    // Industrien
    { search: 'Industrial Machinery and Components', replace: () => industries[0] || 'Industrie' },
    { search: 'Automotive', replace: () => industries[1] || 'Automotive' },
    { search: 'Health Care Providers', replace: () => industries[2] || 'Healthcare' },
    { search: 'Industrie-Maschinen und Komponenten', replace: () => industries[0] || 'Industrie' },
    { search: 'Automobilindustrie', replace: () => industries[1] || 'Automotive' },
    { search: 'Gesundheitssektor', replace: () => industries[2] || 'Healthcare' },

    // Projekt-Industrien
    { search: 'Industry: Automotive', replace: () => cvData.projects[0] ? `Industry: ${cvData.projects[0].client || 'Projekt'}` : '' },
    { search: 'Industry: Finance', replace: () => cvData.projects[1] ? `Industry: ${cvData.projects[1].client || 'Projekt'}` : '' },
    { search: 'Industry: Life Science', replace: () => cvData.projects[2] ? `Industry: ${cvData.projects[2].client || 'Projekt'}` : '' },
    { search: 'Industrie: Automobilindustrie', replace: () => cvData.projects[0] ? `Industrie: ${cvData.projects[0].client || 'Projekt'}` : '' },
    { search: 'Industrie: Finanzsektor', replace: () => cvData.projects[1] ? `Industrie: ${cvData.projects[1].client || 'Projekt'}` : '' },
    { search: 'Industrie: Naturwissenschaft', replace: () => cvData.projects[2] ? `Industrie: ${cvData.projects[2].client || 'Projekt'}` : '' },

    // Technologien in Projekten
    { search: 'Technology: Technology Skill A, Tool B, Method C', replace: () => {
      const proj = cvData.projects[0];
      return proj?.technologies.length ? `Technology: ${proj.technologies.join(', ')}` : '';
    }},
    { search: 'Technologie: Technologiekompetenzen A, Tool B, Methode C', replace: () => {
      const proj = cvData.projects[0];
      return proj?.technologies.length ? `Technologie: ${proj.technologies.join(', ')}` : '';
    }},

    // Kunden
    { search: 'Client AG, Client Solutions GmbH, Example Client SE, Client Ltd.', replace: () => clients || 'Diverse Kunden' },
    { search: 'Kunde AG, Kunde Solutions GmbH, Beispiel Kunde SE, Kunde Ltd.', replace: () => clients || 'Diverse Kunden' },
  ];
}

/**
 * Generiert PPTX aus Deloitte-Template
 */
export async function generatePptxFromTemplate(
  templateFile: UploadedFile,
  cvData: CVData
): Promise<Blob> {
  if (!templateFile.file) {
    throw new Error('Template-Datei nicht gefunden');
  }

  const arrayBuffer = await templateFile.file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const replacements = getPptxReplacements(cvData);

  // Alle Slide-XMLs bearbeiten
  const slideFiles = Object.keys(zip.files).filter(
    name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
  );

  for (const fileName of slideFiles) {
    const file = zip.file(fileName);
    if (file) {
      let content = await file.async('text');

      for (const { search, replace } of replacements) {
        const value = replace(cvData);
        const escapedValue = escapeXml(value);

        if (typeof search === 'string') {
          // Bei Strings: Auch fragmentierte XML-Tags berücksichtigen
          content = replaceFragmentedText(content, search, escapedValue);
        } else {
          content = content.replace(search, escapedValue);
        }
      }

      zip.file(fileName, content);
    }
  }

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
}

/**
 * Ersetzt Text der über mehrere XML-Tags fragmentiert sein könnte
 */
function replaceFragmentedText(content: string, search: string, replace: string): string {
  // Erst direkter Ersatz
  let result = content.split(search).join(replace);

  // Dann Ersatz mit möglichen XML-Tags dazwischen
  // PowerPoint fragmentiert Text manchmal: "First" "</a:t><a:t>" "Name"
  const chars = search.split('');
  let pattern = '';
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    pattern += char;
    if (i < chars.length - 1) {
      pattern += '(?:</a:t></a:r><a:r[^>]*><a:t>|</a:t><a:t>)?';
    }
  }

  try {
    const regex = new RegExp(pattern, 'gi');
    result = result.replace(regex, replace);
  } catch {
    // Regex zu komplex, überspringe fragmentierte Suche
  }

  return result;
}

/**
 * Escaped XML-Sonderzeichen
 */
function escapeXml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Lädt die Template-Datei aus den hochgeladenen Dateien
 */
export function getTemplateFile(
  files: UploadedFile[],
  type: 'template-docx' | 'template-pptx'
): UploadedFile | undefined {
  return files.find((f) => f.type === type);
}

/**
 * Generiert DOCX mit Template oder Fallback
 */
export async function generateDocx(
  cvData: CVData,
  files?: UploadedFile[]
): Promise<Blob> {
  if (files) {
    const template = getTemplateFile(files, 'template-docx');
    if (template?.file) {
      try {
        console.log('Verwende DOCX-Template:', template.name);
        return await generateDocxFromTemplate(template, cvData);
      } catch (error) {
        console.warn('Template-Generierung fehlgeschlagen, verwende Fallback:', error);
      }
    }
  }
  return generateDocxFallback(cvData);
}

/**
 * Generiert PPTX mit Template oder Fallback
 */
export async function generatePptx(
  cvData: CVData,
  files?: UploadedFile[]
): Promise<Blob> {
  if (files) {
    const template = getTemplateFile(files, 'template-pptx');
    if (template?.file) {
      try {
        console.log('Verwende PPTX-Template:', template.name);
        return await generatePptxFromTemplate(template, cvData);
      } catch (error) {
        console.warn('Template-Generierung fehlgeschlagen, verwende Fallback:', error);
      }
    }
  }
  return generatePptxFallback(cvData);
}

// ============================================================================
// FALLBACK-IMPLEMENTIERUNGEN
// ============================================================================

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

interface StyleConfig {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  headerFontSize: number;
  bodyFontSize: number;
}

const defaultStyle: StyleConfig = {
  primaryColor: '86BC25', // Deloitte Green
  secondaryColor: '333333',
  fontFamily: 'Arial',
  headerFontSize: 28,
  bodyFontSize: 11,
};

async function generateDocxFallback(cvData: CVData): Promise<Blob> {
  const config = defaultStyle;

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
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
          createContactParagraph(cvData.personalInfo, config),
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
          ...(cvData.experience.length > 0
            ? [
                createSectionHeader('Berufserfahrung', config),
                ...cvData.experience.flatMap((exp) => createExperienceEntry(exp, config)),
              ]
            : []),
          ...(cvData.projects.length > 0
            ? [
                createSectionHeader('Projekterfahrung', config),
                ...cvData.projects.flatMap((proj) => createProjectEntry(proj, config)),
              ]
            : []),
          ...(cvData.education.length > 0
            ? [
                createSectionHeader('Ausbildung', config),
                ...cvData.education.flatMap((edu) => createEducationEntry(edu, config)),
              ]
            : []),
          ...(cvData.skills.length > 0
            ? [createSectionHeader('Kenntnisse', config), createSkillsTable(cvData.skills, config)]
            : []),
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

function createContactParagraph(personalInfo: CVData['personalInfo'], config: StyleConfig): Paragraph {
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

function createExperienceEntry(exp: CVData['experience'][0], config: StyleConfig): Paragraph[] {
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

function createProjectEntry(proj: CVData['projects'][0], config: StyleConfig): Paragraph[] {
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

function createEducationEntry(edu: CVData['education'][0], config: StyleConfig): Paragraph[] {
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

async function generatePptxFallback(cvData: CVData): Promise<Blob> {
  const config = defaultStyle;
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

  // Experience Slide
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
      yPos += 0.5;

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
