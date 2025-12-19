# CV Optimizer

Ein KI-gestütztes Web-Tool zur Optimierung von Lebensläufen, speziell für die Consulting-Branche.

## Features

- **Dokument-Upload**: Unterstützung für DOCX, PPTX und PDF Dateien
- **KI-Interview**: Intelligente Fragen basierend auf Dokumentenanalyse
- **CV-Generierung**: Automatische Erstellung in DOCX und PPTX Format
- **ATS-Optimierung**: Lebensläufe für Bewerbermanagementsysteme optimiert
- **Offline-Speicherung**: Fortschritt wird im Browser gespeichert

## Technologie-Stack

- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: Cloudflare Pages Functions
- **KI**: Anthropic Claude API
- **Dokumentverarbeitung**: mammoth.js, docx, pptxgenjs

## Installation

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Für Produktion bauen
npm run build
```

## Konfiguration

### Anthropic API Key

Für die KI-Funktionalität wird ein Anthropic API Key benötigt:

```bash
# Lokal in .env.local
echo "ANTHROPIC_API_KEY=your-key-here" > .env.local

# Für Cloudflare Pages
wrangler secret put ANTHROPIC_API_KEY
```

### Demo-Modus

Standardmäßig läuft die Anwendung im Demo-Modus ohne API-Aufrufe.
Um den echten API-Modus zu aktivieren, setzen Sie in `src/App.tsx`:

```typescript
const USE_MOCK_API = false;
```

## Deployment

### Cloudflare Pages

1. Repository mit GitHub verbinden
2. Build-Befehl: `npm run build`
3. Output-Verzeichnis: `dist`
4. Environment Variable `ANTHROPIC_API_KEY` in den Settings hinzufügen

### Manuelles Deployment

```bash
npm run build
wrangler pages deploy dist
```

## Projektstruktur

```
cv-optimizer/
├── src/
│   ├── components/          # React Komponenten
│   │   ├── FileUploader.tsx # Datei-Upload mit Drag & Drop
│   │   ├── InterviewChat.tsx# KI-Chat Interface
│   │   ├── CVPreview.tsx    # CV Vorschau und Download
│   │   └── StepWizard.tsx   # Schritt-Navigation
│   ├── lib/
│   │   ├── api.ts           # API Client
│   │   ├── documentParser.ts# Dokument-Parsing
│   │   ├── documentGenerator.ts # DOCX/PPTX Erstellung
│   │   └── storage.ts       # IndexedDB Speicherung
│   ├── types/               # TypeScript Typen
│   └── App.tsx              # Hauptkomponente
├── functions/
│   └── api/                 # Cloudflare Workers API
│       ├── analyze.ts       # Dokumentenanalyse
│       └── generate.ts      # CV-Generierung
├── wrangler.toml            # Cloudflare Konfiguration
└── package.json
```

## Verwendung

1. **Dokumente hochladen**
   - DOCX-Vorlage (Firmen-CI)
   - Optional: PPTX-Vorlage
   - Beispiel-CV als Referenz
   - Eigener aktueller Lebenslauf

2. **Interview durchführen**
   - Fragen beantworten oder überspringen
   - Die KI analysiert Lücken und Verbesserungspotential

3. **CV generieren**
   - Vorschau des optimierten CVs
   - Download als DOCX oder PPTX

## Lizenz

MIT
