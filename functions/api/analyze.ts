interface DocumentData {
  name: string;
  type: string;
  content: string;
  extractedData?: unknown;
}

interface RequestBody {
  documents: DocumentData[];
}

export const onRequestPost: PagesFunction = async (context) => {
  // Get API key from header (sent by client)
  const apiKey = context.request.headers.get('X-API-Key');

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'API-Schlüssel fehlt. Bitte geben Sie Ihren Anthropic API Key ein.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = (await context.request.json()) as RequestBody;
    const { documents } = body;

    const documentContents = documents
      .map((doc) => `=== ${doc.name} (${doc.type}) ===\n${doc.content}`)
      .join('\n\n');

    const prompt = `Du bist ein erfahrener HR-Berater und CV-Experte, spezialisiert auf die Consulting-Branche.
Du analysierst Lebensläufe und Vorlagen, um optimierte CVs zu erstellen.

Analysiere die folgenden Dokumente:

${documentContents}

Basierend auf dieser Analyse, generiere eine Liste von Interview-Fragen, die helfen werden, den CV zu optimieren.
Fokussiere dich auf:
1. Lücken im Lebenslauf (gaps)
2. Fehlende Details zu Projekten (projects)
3. Skills die im Beispiel-CV vorkommen aber nicht im eigenen (skills)
4. Quantifizierbare Erfolge (achievements)
5. Soft Skills und Führungserfahrung (softskills)
6. Allgemeine Verbesserungen (general)

Antworte im folgenden JSON-Format:
{
  "questions": [
    {
      "id": "eindeutige-id",
      "question": "Die Frage auf Deutsch",
      "category": "gaps|projects|skills|achievements|softskills|general"
    }
  ],
  "cvStructure": {
    "summary": "Erste Einschätzung des Profils",
    "skillsToHighlight": ["skill1", "skill2"]
  }
}

Generiere 8-12 relevante Fragen. Sei freundlich und professionell.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
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
        JSON.stringify({ error: 'KI-Analyse fehlgeschlagen' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json() as {
      content: Array<{ type: string; text?: string }>;
    };
    const textContent = result.content.find((c) => c.type === 'text');
    const analysisText = textContent?.text || '';

    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: 'Ungültiges Antwortformat' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const analysis = JSON.parse(jsonMatch[0]);

    const questions = analysis.questions.map((q: { id: string; question: string; category: string }) => ({
      ...q,
      answered: false,
    }));

    return new Response(
      JSON.stringify({ questions, cvStructure: analysis.cvStructure }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze:', error);
    return new Response(
      JSON.stringify({ error: 'Interner Serverfehler' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
