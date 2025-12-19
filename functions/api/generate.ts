interface Env {
  ANTHROPIC_API_KEY: string;
}

interface DocumentData {
  name: string;
  type: string;
  content: string;
}

interface Answer {
  question: string;
  answer: string;
  category: string;
}

interface RequestBody {
  documents: DocumentData[];
  answers: Answer[];
  additionalInfo?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { ANTHROPIC_API_KEY } = context.env;

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'API-Schlüssel nicht konfiguriert' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = (await context.request.json()) as RequestBody;
    const { documents, answers, additionalInfo } = body;

    // Prepare document contents
    const documentContents = documents
      .map((doc) => `=== ${doc.name} (${doc.type}) ===\n${doc.content}`)
      .join('\n\n');

    // Prepare interview answers
    const interviewAnswers = answers
      .map((a) => `Frage: ${a.question}\nAntwort: ${a.answer}`)
      .join('\n\n');

    const prompt = `Du bist ein erfahrener HR-Berater und CV-Experte, spezialisiert auf die Consulting-Branche.
Erstelle einen optimierten, ATS-freundlichen Lebenslauf basierend auf den folgenden Informationen.

ORIGINALDOKUMENTE:
${documentContents}

INTERVIEW-ANTWORTEN:
${interviewAnswers}

${additionalInfo ? `ZUSÄTZLICHE INFORMATIONEN:\n${additionalInfo}` : ''}

Erstelle einen vollständigen, professionellen CV im folgenden JSON-Format.
Der CV sollte:
- ATS-optimiert sein (klare Struktur, relevante Keywords)
- Die Consulting-Branche berücksichtigen (Projekterfahrung, Methoden)
- Quantifizierbare Erfolge hervorheben
- Professionell und modern klingen
- Alle relevanten Informationen aus den Dokumenten und Antworten integrieren

JSON-FORMAT:
{
  "personalInfo": {
    "name": "Vollständiger Name",
    "title": "Aktuelle Position/Titel",
    "email": "email@example.com",
    "phone": "+49 123 456789",
    "location": "Stadt, Land",
    "linkedin": "linkedin.com/in/username"
  },
  "summary": "Professionelle Zusammenfassung in 2-3 Sätzen",
  "experience": [
    {
      "company": "Firmenname",
      "position": "Position",
      "startDate": "YYYY",
      "endDate": "YYYY oder null wenn aktuell",
      "current": true/false,
      "description": "Beschreibung der Rolle",
      "achievements": ["Erfolg 1", "Erfolg 2"],
      "technologies": ["Tech 1", "Tech 2"]
    }
  ],
  "education": [
    {
      "institution": "Universität/Hochschule",
      "degree": "Abschluss",
      "field": "Studiengang",
      "startDate": "YYYY",
      "endDate": "YYYY",
      "grade": "Note (optional)"
    }
  ],
  "skills": [
    {
      "category": "Kategoriename",
      "skills": ["Skill 1", "Skill 2"]
    }
  ],
  "certifications": ["Zertifikat 1", "Zertifikat 2"],
  "languages": [
    {
      "language": "Sprache",
      "level": "Niveau"
    }
  ],
  "projects": [
    {
      "name": "Projektname",
      "client": "Kundenname (optional)",
      "role": "Rolle im Projekt",
      "duration": "Zeitraum",
      "description": "Projektbeschreibung",
      "technologies": ["Tech 1"],
      "achievements": ["Erfolg 1"]
    }
  ]
}

Antworte NUR mit dem JSON, ohne zusätzliche Erklärungen.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Claude API error:', error);
      return new Response(
        JSON.stringify({ error: 'CV-Generierung fehlgeschlagen' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json() as {
      content: Array<{ type: string; text?: string }>;
    };
    const textContent = result.content.find((c) => c.type === 'text');
    const cvText = textContent?.text || '';

    // Extract JSON from response
    const jsonMatch = cvText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: 'Ungültiges CV-Format' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cvData = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({ cvData }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate:', error);
    return new Response(
      JSON.stringify({ error: 'Interner Serverfehler' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
