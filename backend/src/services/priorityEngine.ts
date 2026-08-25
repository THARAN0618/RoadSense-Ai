export interface PriorityCalculationResult {
  priorityScore: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  priorityExplanation: string;
}

export function calculatePriority(
  severityScore: number,
  confidenceScore: number,
  address: string = '',
  createdAt: Date = new Date(),
  verificationStatus: string = 'PENDING'
): PriorityCalculationResult {
  // 1. Location Impact Score (0-100) based on critical thoroughfare keywords
  let locationImpactScore = 50; // Default baseline urban road
  const addrLower = address.toLowerCase();
  if (/highway|freeway|exit|expressway|interstate/i.test(addrLower)) {
    locationImpactScore = 90;
  } else if (/market|main|avenue|broadway|boulevard|transit|bus|school|hospital/i.test(addrLower)) {
    locationImpactScore = 75;
  } else if (/lane|drive|court|way|alley|residential/i.test(addrLower)) {
    locationImpactScore = 35;
  }

  // 2. Report Age Score (0-100)
  const hoursOld = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  let ageScore = 15;
  if (hoursOld > 168) { // 7+ days
    ageScore = 100;
  } else if (hoursOld > 96) { // 4+ days
    ageScore = 80;
  } else if (hoursOld > 48) { // 2+ days
    ageScore = 55;
  } else if (hoursOld > 24) { // 1+ day
    ageScore = 35;
  }

  // Verification status multiplier (+5 score bonus if verified by authority)
  const verificationBonus = verificationStatus === 'VERIFIED' ? 5 : 0;

  // 3. Formula: priorityScore = (severityScore * 0.55) + (confidenceScore * 100 * 0.20) + (locationImpact * 0.15) + (ageScore * 0.10)
  const rawScore =
    (severityScore * 0.55) +
    (confidenceScore * 100 * 0.20) +
    (locationImpactScore * 0.15) +
    (ageScore * 0.10) +
    verificationBonus;

  const priorityScore = Math.max(0, Math.min(100, Math.round(rawScore)));
  const priority = getPriorityLevelFromScore(priorityScore);

  // 4. Generate Explainable Text
  const daysOldText = hoursOld >= 24 ? `${Math.floor(hoursOld / 24)} day(s)` : `${Math.round(hoursOld)} hour(s)`;
  const priorityExplanation = `${priority} priority (Score: ${priorityScore}/100) determined by Severity (${severityScore}/100 x 55%), AI Confidence (${Math.round(confidenceScore * 100)}% x 20%), Location Impact (${locationImpactScore}/100 x 15%), and unresolved age (${daysOldText} x 10%).`;

  return {
    priorityScore,
    priority,
    priorityExplanation,
  };
}

export function getPriorityLevelFromScore(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score >= 76) return 'CRITICAL';
  if (score >= 56) return 'HIGH';
  if (score >= 31) return 'MEDIUM';
  return 'LOW';
}
