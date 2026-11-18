export type SafetyCategory =
  | 'none'
  | 'crisis'
  | 'red_flag'
  | 'medication'
  | 'off_topic'
  | 'prompt_injection';

export interface GuardrailContext {
  motherName: string;
  babyName: string;
  weeksPostpartum: number;
}

export interface GuardrailEvaluation {
  blocked: boolean;
  safety: SafetyCategory;
  reply?: string;
  reason?: string;
}

/**
 * 1. Maternal & Infant Crisis / Self-Harm / Postpartum Psychosis Pattern
 */
const CRISIS_PATTERN =
  /\b(suicid\w*|kill\s+myself|end\s+my\s+life|hurt\s+myself|harm\s+myself|self[- ]?harm|cut\s+myself|overdose|don'?t\s+want\s+to\s+(live|be\s+here|wake\s+up)|better\s+off\s+without\s+me|want\s+to\s+die|wish\s+i\s+(was|were)\s+dead|hurt\s+(the\s+|my\s+)?baby|harm\s+(the\s+|my\s+)?baby|shake\s+(the\s+|my\s+)?baby|shaking\s+(the\s+|my\s+)?baby|throw\s+(the\s+|my\s+)?baby|voices?\s+telling\s+me|hallucinat\w*)\b/i;

/**
 * 2. Maternal & Newborn Urgent Medical Red Flags
 */
const MATERNAL_RED_FLAG_PATTERN =
  /\b(heavy\s+bleed\w*|soaking\s+(a\s+|one\s+|through\s+)?pad|hemorrhag\w*|golf\s*ball|large\s+clots?|blood\s+clots?|severe\s+headache|vision\s+(change|loss|problem)s?|blurr?y\s+vision|seeing\s+spots|preeclampsia|eclampsia|calf\s+(pain|swelling|redness)|chest\s+pain|short(ness)?\s+of\s+breath|can'?t\s+breathe|trouble\s+breathing|seizure|convuls\w*|foul[- ]?smelling\s+(discharge|lochia)|incision\s+(pus|oozing|opening|red\s+streaks))\b/i;

const INFANT_RED_FLAG_PATTERN =
  /\b(fever|100\.4|38\s*°?\s*c|blue\s+(lips|skin|face|tongue)|cyanosis|turning\s+blue|letharg\w*|won'?t\s+wake|hard\s+to\s+wake|unresponsive|limp|flaccid|sunken\s+(soft\s+spot|fontanelle)|bulging\s+(soft\s+spot|fontanelle)|projectile\s+vomit\w*|green\s+(vomit|bile)|blood\s+in\s+(stool|diaper|poop|vomit)|choking|stopped\s+breathing|apnea|nostrils?\s+flaring|rib\s+retractions?|grunting\s+when\s+breathing|no\s+wet\s+diapers?)\b/i;

/**
 * 3. Prompt Injection / Jailbreak / System Override Pattern
 */
const PROMPT_INJECTION_PATTERN =
  /(\bignore\s+(all\s+|any\s+)?(previous|prior|above|system)\s+(instructions?|prompts?|rules?|guidelines?)|\bdisregard\s+(all\s+|previous\s+|system\s+)?(instructions?|rules?|prompts?)|\breveal\s+(your\s+)?(system\s+prompt|hidden\s+instructions|developer\s+message)|\brepeat\s+(the\s+)?(text|words|instructions)\s+above|\byou\s+are\s+now\s+(dan|unrestricted|jailbroken|a\s+real\s+doctor)|\bact\s+as\s+an?\s+unrestricted|\bbypass\s+(your\s+)?(safety|guardrails?|filters?|restrictions?)|\bsystem\s*:\s*override|<\/?system>|<script\b|javascript:)/i;

/**
 * 4. Medication Dosing, Prescription Changes & Dangerous Infant Ingestion Pattern
 */
const MEDICATION_DOSAGE_PATTERN =
  /(\bhow\s+(much|many\s+(ml|mg|drops?|teaspoons?|doses?))\s+(of\s+)?(tylenol|acetaminophen|ibuprofen|motrin|advil|benadryl|diphenhydramine|simethicone|antibiotic|medicine|medication)\b|\b(tylenol|acetaminophen|ibuprofen|motrin|benadryl)\s+(dosage|dose|chart|amount)\b|\bcan\s+i\s+(stop\s+taking|quit\s+taking|double\s+my\s+dose\s+of)\s+(my\s+)?(zoloft|sertraline|lexapro|fluoxetine|prozac|antidepressant|blood\s+pressure\s+med\w*|antibiotic|prescription)\b|\bprescribe\s+me\b|\bwhat\s+antibiotic\s+should\s+i\s+take\b)/i;

const UNSAFE_INFANT_INGESTION_PATTERN =
  /\b(give\s+(my\s+|the\s+)?(newborn|baby|infant)\s+(honey|water|cow'?s?\s+milk|aspirin|whiskey|alcohol|tea|herbal\s+tea)|honey\s+(for|to|on)\s+(a\s+|my\s+)?(newborn|baby|infant|pacifier)|can\s+(newborns?|babies|my\s+baby)\s+(have|drink|eat)\s+(honey|plain\s+water|aspirin))\b/i;

/**
 * 5. Off-Topic / Out-of-Scope Pattern
 */
const OFF_TOPIC_PATTERN =
  /(\b(write|debug|compile|refactor)\s+(a\s+)?(python|javascript|typescript|java|c\+\+|sql|html|css|react|code|script|function|program|algorithm)\b|\b(bitcoin|ethereum|crypto(currency)?|stock\s+market|forex|options\s+trading|sports\s+betting|parlay)\b|\b(who\s+won\s+the\s+(super\s+bowl|world\s+cup|election)|vote\s+for\s+(president|senator|congress)|political\s+party)\b|\b(solve\s+this\s+(calculus|algebra|differential|math)\s+problem|write\s+an?\s+essay\s+about\s+(world\s+war|shakespeare|napoleon))\b)/i;

/**
 * Sanitizes user input text to strip control characters and normalize excessive whitespace.
 */
export function sanitizeUserText(input: string, maxLength = 2000): string {
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Deterministic pre-LLM guardrails check. Runs before any external model call or fallback synthesis.
 */
export function evaluateInputGuardrails(
  rawMessage: string,
  ctx: GuardrailContext
): GuardrailEvaluation {
  const message = sanitizeUserText(rawMessage);

  // 1. Prompt injection & jailbreak protection
  if (PROMPT_INJECTION_PATTERN.test(message)) {
    return {
      blocked: true,
      safety: 'prompt_injection',
      reason: 'Prompt override or system extraction attempt blocked.',
      reply: `I'm **Sanctuary**, your dedicated fourth-trimester companion inside Materna. For your safety, I follow strict clinical-support boundaries and cannot modify my safety rules or act outside my role.\n\nI'm here whenever you'd like to talk about **${ctx.babyName}'s sleep, feeding, milestones, or your own postpartum recovery**, ${ctx.motherName}.`,
    };
  }

  // 2. Maternal & infant mental health / safety crisis
  if (CRISIS_PATTERN.test(message)) {
    return {
      blocked: true,
      safety: 'crisis',
      reason: 'Acute mental health or infant safety crisis detected.',
      reply: `${ctx.motherName}, I'm really glad you told me, and I'm so sorry it feels this heavy right now. You deserve immediate, compassionate support.\n\n- **If you feel you might hurt yourself or ${ctx.babyName}:** Put ${ctx.babyName} safely on their back in the crib, step into another room, and call **911** or local emergency services immediately.\n- **24/7 Suicide & Crisis Lifeline:** Call or text **988** (free, confidential, US & Canada).\n- **National Maternal Mental Health Hotline:** Call or text **1-833-943-5746** (24/7 voice & text in English and Spanish).\n\nPlease wake or call a partner, family member, or trusted person right now and ask them to come be with you. You are not alone in this.`,
    };
  }

  // 3. Urgent maternal or newborn medical red flags
  const isMaternalRedFlag = MATERNAL_RED_FLAG_PATTERN.test(message);
  const isInfantRedFlag = INFANT_RED_FLAG_PATTERN.test(message);

  if (isMaternalRedFlag || isInfantRedFlag) {
    return {
      blocked: true,
      safety: 'red_flag',
      reason: 'Urgent clinical red-flag symptom detected.',
      reply: `⚠️ **Urgent Medical Caution, ${ctx.motherName}:** The symptoms you mentioned require prompt medical evaluation rather than AI guidance.\n\n- **For ${ctx.babyName}:** A rectal fever of **100.4°F (38°C) or higher** (especially in infants under 3 months), breathing difficulty, blue-tinted lips/skin, extreme lethargy, projectile vomiting, or lack of wet diapers needs **immediate pediatric or emergency room evaluation**.\n- **For You:** Soaking more than one pad per hour, passing clots larger than a golf ball, fever over **100.4°F (38°C)**, severe headache or vision changes, chest pain, trouble breathing, or calf pain/swelling requires **immediate contact with your OB/GYN, midwife, or Labor & Delivery triage**.\n\nIf symptoms are severe or rapidly worsening, please call **911** or go to the nearest emergency department now.`,
    };
  }

  // 4. Dangerous infant ingestion & medication dosing guardrails
  if (UNSAFE_INFANT_INGESTION_PATTERN.test(message)) {
    return {
      blocked: true,
      safety: 'medication',
      reason: 'Unsafe infant ingestion query intercepted.',
      reply: `⚠️ **Important Infant Safety Guardrail, ${ctx.motherName}:**\n\n- **No honey under 12 months:** Never give honey (even a tiny taste or on a pacifier) to a baby under 1 year old due to the risk of **infant botulism**, a serious neurological illness.\n- **No plain water or cow's milk for young infants:** Under 6 months, ${ctx.babyName} gets all needed hydration from breast milk or properly mixed infant formula; plain water can cause dangerous electrolyte dilution (**hyponatremia**).\n- **No aspirin:** Never give aspirin or products containing salicylates to infants due to **Reye's syndrome**.\n\nPlease check with ${ctx.babyName}'s pediatrician before introducing any liquids, supplements, or remedies beyond breast milk or formula.`,
    };
  }

  if (MEDICATION_DOSAGE_PATTERN.test(message)) {
    return {
      blocked: true,
      safety: 'medication',
      reason: 'Medication dosing or prescription adjustment request intercepted.',
      reply: `For **${ctx.babyName}'s and your safety**, I cannot calculate medication dosages, recommend over-the-counter drugs for infants, or advise starting or stopping prescription medications.\n\n- **Infant medications (like acetaminophen or ibuprofen):** Infant dosing is strictly **weight-based** and concentration-dependent, and ibuprofen is generally not used under 6 months. Always confirm the exact **mL dose** with your pediatrician or pharmacist.\n- **Maternal prescriptions:** Never stop or adjust antidepressants, blood pressure medications, or antibiotics without speaking directly to your prescribing OB/GYN or midwife.\n\nIf you'd like, I can share **gentle non-medication comfort measures** (such as paced burping, skin-to-skin calming, or cool compresses) while you reach out to your care team.`,
    };
  }

  // 5. Domain scope / off-topic filtering
  if (OFF_TOPIC_PATTERN.test(message)) {
    return {
      blocked: true,
      safety: 'off_topic',
      reason: 'Out-of-scope topic blocked.',
      reply: `I'm **Sanctuary**, designed specifically to support you through the fourth trimester and ${ctx.babyName}'s first year—so I'm not able to help with coding, finance, politics, or general non-parenting topics.\n\nWhenever you're ready, I'd love to help with **${ctx.babyName}'s wake windows, feeding rhythms, developmental milestones, or your own postpartum healing and wellbeing**, ${ctx.motherName}.`,
    };
  }

  return {
    blocked: false,
    safety: 'none',
  };
}

/**
 * Post-generation output guardrail: validates and sanitizes LLM output before returning to the user.
 */
export function validateAndSanitizeModelOutput(
  rawOutput: string,
  ctx: GuardrailContext
): { content: string; safety: SafetyCategory } {
  let cleaned = rawOutput.trim();

  // 1. Prevent system prompt leakage
  if (
    /You are "Sanctuary", a warm, calm postpartum companion/i.test(cleaned) ||
    /Safety rules \(always follow\):/i.test(cleaned) ||
    /Context about this user \(from her app logs\):/i.test(cleaned)
  ) {
    return {
      safety: 'prompt_injection',
      content: `I'm right here with you, ${ctx.motherName}. How can I support you with ${ctx.babyName}'s sleep, feeding, milestones, or your postpartum recovery today?`,
    };
  }

  // 2. Intercept accidental specific medication dosing or definitive diagnostic claims in LLM output
  if (
    /\b(give\s+(your\s+baby\s+|him\s+|her\s+)?\d+(\.\d+)?\s*(ml|mg)\s+of\s+(tylenol|acetaminophen|ibuprofen|motrin|benadryl)|i\s+diagnose\s+you\s+with)\b/i.test(
      cleaned
    )
  ) {
    return {
      safety: 'medication',
      content: `For ${ctx.babyName}'s and your safety, I can't provide specific medication dosages or medical diagnoses. Infant medication dosing is strictly weight-based—please call your pediatrician's nurse line or pharmacist to confirm the safe dose for ${ctx.babyName}.`,
    };
  }

  // 3. Normalize markdown headings into bold lines so the chat bubble renderer stays clean
  cleaned = cleaned.replace(/^#{1,6}\s+(.+)$/gm, '**$1**');

  // 4. Cap output length to prevent walls of text during 3-AM check-ins
  if (cleaned.length > 1400) {
    cleaned = `${cleaned.slice(0, 1397).trimEnd()}...`;
  }

  return {
    content: cleaned,
    safety: 'none',
  };
}
