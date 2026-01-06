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

interface Env {
  ANTHROPIC_API_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // Get API key from header (client) or environment variable (server secret)
  const apiKey = context.request.headers.get('X-API-Key') || context.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'API-Schlüssel fehlt. Bitte konfigurieren Sie ANTHROPIC_API_KEY als Secret.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = (await context.request.json()) as RequestBody;
    const { documents, answers, additionalInfo } = body;

    const documentContents = documents
      .map((doc) => `=== ${doc.name} (${doc.type}) ===\n${doc.content}`)
      .join('\n\n');

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
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Ungültiger API-Schlüssel' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
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
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate:', error);
    return new Response(
      JSON.stringify({ error: 'Interner Serverfehler' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
