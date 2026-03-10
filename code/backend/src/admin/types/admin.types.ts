export enum ContentTarget {
  CORE = 'core',
  KIDS = 'kids',
}

export enum JobStatus {
  DRAFT = 'draft',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  PUBLISHED = 'published',
  FAILED = 'failed',
}

export enum JobStep {
  VALIDATING_INPUT = 'validating_input',
  RESOLVING_REFERENCE_VIDEO = 'resolving_reference_video',
  GENERATING_SCRIPT = 'generating_script',
  CLEANING_NARRATION = 'cleaning_narration',
  GENERATING_TTS = 'generating_tts',
  GENERATING_LIPSYNC = 'generating_lipsync',
  CREATING_GENERATED_VIDEO = 'creating_generated_video',
  PUBLISHING_TO_FEED = 'publishing_to_feed',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum Language {
  TR = 'tr',
  EN = 'en',
}

export enum Tone {
  FORMAL = 'formal',
  FRIENDLY = 'friendly',
  ENERGETIC = 'energetic',
}

export enum ReferenceVideoStatus {
  READY = 'ready',
  PROCESSING = 'processing',
  FAILED = 'failed',
}

export enum GeneratedVideoStatus {
  ACTIVE = 'active',
  HIDDEN = 'hidden',
  ARCHIVED = 'archived',
}

export const STEP_PROGRESS: Record<string, number> = {
  [JobStep.VALIDATING_INPUT]: 5,
  [JobStep.RESOLVING_REFERENCE_VIDEO]: 10,
  [JobStep.GENERATING_SCRIPT]: 25,
  [JobStep.CLEANING_NARRATION]: 35,
  [JobStep.GENERATING_TTS]: 50,
  [JobStep.GENERATING_LIPSYNC]: 80,
  [JobStep.CREATING_GENERATED_VIDEO]: 90,
  [JobStep.PUBLISHING_TO_FEED]: 95,
  [JobStep.COMPLETED]: 100,
};
