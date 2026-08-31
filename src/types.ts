export type ReflectionMode = 'pfa-debrief' | 'compassion-fatigue' | 'moral-distress' | 'grounding-anchor';

export type SanctuaryTheme = 
  | 'emerald'
  | 'amethyst'
  | 'amber'
  | 'ocean'
  | 'rose'
  | 'midnight';

export interface ThemeConfig {
  id: SanctuaryTheme;
  name: string;
  subtitle: string;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  accentHover: string;
  accentText: string;
  glowColor: string;
  badgeClass: string;
  buttonClass: string;
  bgGradient: string;
  surfaceBg: string;
  headerBg: string;
  cardBg: string;
  icon: string;
}

export type SoundscapeType = '432hz' | 'theta' | 'ocean' | 'rain' | 'off';

export interface SphereOfControlResult {
  inControl: string[];
  outOfControl: string[];
  reframeInsight: string;
}

export type CaregiverRole = 
  | 'healthcare'
  | 'humanitarian'
  | 'first-responder'
  | 'social-worker'
  | 'family-caregiver'
  | 'crisis-volunteer';

export type IncidentSeverity =
  | 'routine'
  | 'moderate-stress'
  | 'critical-incident'
  | 'moral-injury';

export type SomaticArea =
  | 'chest-tightness'
  | 'headache'
  | 'jaw-clenching'
  | 'shallow-breathing'
  | 'gut-tension'
  | 'fatigue-exhaustion'
  | 'calm';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface JournalMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string; // ISO string
  modelUsed?: string;
  isSanitized?: boolean;
}

export interface JournalSession {
  id: string;
  userId: string;
  title: string;
  mode: ReflectionMode;
  role: CaregiverRole;
  severity: IncidentSeverity;
  stressLevel: number; // 1-10
  somaticAreas: SomaticArea[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  summary?: string;
  summaryModelUsed?: string;
  entryCount: number;
  previewText?: string;
}

export interface ConverseResponse {
  text: string;
  modelUsed: string;
  timestamp: string;
}

export interface SummarizeResponse {
  summary: string;
  modelUsed: string;
  timestamp: string;
}

export interface AnonymizeResponse {
  sanitizedText: string;
  modelUsed: string;
  timestamp: string;
}

export interface CrisisHotline {
  id: string;
  name: string;
  phone?: string;
  text?: string;
  web?: string;
  description: string;
  badge: string;
  country: string;
}
