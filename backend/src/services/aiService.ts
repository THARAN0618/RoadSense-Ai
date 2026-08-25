export interface AIAnalysisResult {
  detected: boolean;
  severityScore: number; // 0-100
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidenceScore: number; // 0.0 - 1.0
  reason: string;
  isFallbackAnalysis: boolean;
}

export async function analyzePotholeImage(
  imageUrl: string,
  title?: string,
  description?: string
): Promise<AIAnalysisResult> {
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  const apiUrl = process.env.AI_PROVIDER_URL;

  // A) AI_PROVIDER mode if API key and URL configured
  if (apiKey && apiUrl) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ imageUrl, title, description }),
      });

      if (response.ok) {
        const data = await response.json();
        if (typeof data.severityScore === 'number') {
          const score = Math.max(0, Math.min(100, data.severityScore));
          return {
            detected: Boolean(data.detected ?? true),
            severityScore: score,
            severity: getSeverityFromScore(score),
            confidenceScore: Math.max(0, Math.min(1.0, data.confidence ?? 0.9)),
            reason: data.reason || 'Computer vision model detected pothole depression.',
            isFallbackAnalysis: false,
          };
        }
      }
    } catch (err) {
      console.warn('AI Provider request failed, switching to deterministic fallback analysis:', err);
    }
  }

  // B) FALLBACK mode: Deterministic rule-based analysis based on metadata
  return calculateFallbackAnalysis(title || '', description || '');
}

function calculateFallbackAnalysis(title: string, description: string): AIAnalysisResult {
  const combinedText = `${title} ${description}`.toLowerCase();
  
  let score = 35; // Default moderate base score

  // Deterministic keyword weighting
  if (/critical|deep crater|highway|trench|dangerous|collapsed|axle|wheel rim|tire blowout/i.test(combinedText)) {
    score += 45;
  } else if (/large|heavy rain|bus bay|fissure|swerving|severe/i.test(combinedText)) {
    score += 30;
  } else if (/medium|moderate|bump|shallow depth/i.test(combinedText)) {
    score += 15;
  } else if (/small|minor|surface crack|nascent|nascent crack/i.test(combinedText)) {
    score -= 10;
  }

  // Length/detail indicator adjustment
  if (combinedText.length > 80) {
    score += 5;
  }

  score = Math.max(10, Math.min(95, score));
  const severity = getSeverityFromScore(score);

  return {
    detected: true,
    severityScore: score,
    severity,
    confidenceScore: 0.82,
    reason: `AI-assisted fallback analysis: Assessed based on report structural severity cues (${severity} score: ${score}/100).`,
    isFallbackAnalysis: true,
  };
}

export function getSeverityFromScore(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score >= 76) return 'CRITICAL';
  if (score >= 51) return 'HIGH';
  if (score >= 26) return 'MEDIUM';
  return 'LOW';
}
