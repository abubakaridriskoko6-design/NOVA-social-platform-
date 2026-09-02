export type ModerationDecision = 'ALLOW' | 'REVIEW' | 'REMOVE';

export type ModerationRequest = {
  type: 'post' | 'message' | 'comment';
  text: string;
  userId: string;
};

const prohibitedPatterns = [
  /porn/i,
  /pornographic/i,
  /nude/i,
  /naked/i,
  /sexually explicit/i,
  /adult content/i,
  /sexual solicitation/i,
  /explicit sexual/i,
  /sexual harassment/i,
  /sexually explicit image/i,
  /sexual exploitation/i,
  /sex video/i,
  /xxx/i,
  /camgirl/i,
  /escort/i,
];

export function reviewContentForSafety({ text }: ModerationRequest): ModerationDecision {
  const normalized = String(text ?? '').trim();

  if (!normalized) {
    return 'ALLOW';
  }

  if (prohibitedPatterns.some((pattern) => pattern.test(normalized))) {
    return 'REMOVE';
  }

  if (/(\bsex\b|\bsexual\b|\bexplicit\b)/i.test(normalized) && normalized.length > 250) {
    return 'REVIEW';
  }

  return 'ALLOW';
}
