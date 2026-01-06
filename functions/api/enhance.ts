interface Env {
  ANTHROPIC_API_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as {
      type: 'experience' | 'project';
      description: string;
      keywords: string[];
      position?: string;
      company?: string;
      role?: string;
      industry?: string;
    };

    const apiKey = context.request.headers.get('X-API-Key') || context.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API Key erforderlich' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { type, description, keywords, position, company, role, industry } = body;

    let prompt = '';
    if (type === 'experience') {
      prompt = `Du bist ein Experte für Deloitte-Consulting-CVs. Formuliere die folgende Berufserfahrung professionell und prägnant für einen Deloitte One-Pager CV.

Position: ${position || 'Consultant'}
Unternehmen: ${company || 'Deloitte'}
Stichworte: ${keywords.join(', ')}

Ursprüngliche Beschreibung:
${description || 'Keine Beschreibung vorhanden'}

Anforderungen:
- Maximal 3-4 Sätze
- Aktive Formulierungen verwenden
- Quantifizierbare Ergebnisse wenn möglich
- Consulting-typische Sprache (z.B. "Strategische Beratung", "Prozessoptimierung", "Digitale Transformation")
- Auf Englisch für internationale CVs

Gib NUR die optimierte Beschreibung zurück, ohne Einleitung oder Kommentare.`;
    } else {
      prompt = `Du bist ein Experte für Deloitte-Consulting-CVs. Formuliere die folgende Projekterfahrung professionell und prägnant für einen Deloitte One-Pager CV.

Projekt: ${role || 'Berater'}
Industrie: ${industry || 'Financial Services'}
Stichworte: ${keywords.join(', ')}

Ursprüngliche Beschreibung:
${description || 'Keine Beschreibung vorhanden'}

Anforderungen:
- Folge dem Schema: Tätigkeit, methodischer Ansatz und erzieltes Ergebnis
- Maximal 4-5 Sätze
- Aktive Formulierungen verwenden
- Quantifizierbare Ergebnisse wenn möglich
- Consulting-typische Sprache
- Auf Englisch für internationale CVs

Gib NUR die optimierte Beschreibung zurück, ohne Einleitung oder Kommentare.`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
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
      console.error('Anthropic API error:', error);
      return new Response(
        JSON.stringify({ error: 'API-Fehler bei der Textgenerierung' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
    };

    const enhancedText = data.content[0]?.text || description;

    return new Response(
      JSON.stringify({ enhanced: enhancedText }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Enhance error:', error);
    return new Response(
      JSON.stringify({ error: 'Interner Serverfehler' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
