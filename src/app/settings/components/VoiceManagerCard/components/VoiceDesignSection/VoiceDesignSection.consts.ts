// OmniVoice voice-design attribute vocabulary.
// Reference: https://github.com/k2-fsa/OmniVoice/blob/master/docs/voice-design.md

export type AttributeKey = 'gender' | 'age' | 'pitch' | 'accent' | 'style'

export interface AttributeOption {
  value: string
  label: string
}

export const GENDER_OPTIONS: ReadonlyArray<AttributeOption> = [
  { value: '', label: 'Any' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
]

export const AGE_OPTIONS: ReadonlyArray<AttributeOption> = [
  { value: '', label: 'Any' },
  { value: 'child', label: 'Child' },
  { value: 'teenager', label: 'Teenager' },
  { value: 'young adult', label: 'Young adult' },
  { value: 'middle-aged', label: 'Middle-aged' },
  { value: 'elderly', label: 'Elderly' },
]

// Pitch values must include the word "pitch" — the model rejects bare
// adjectives like "moderate" and only accepts the dimensioned forms.
export const PITCH_OPTIONS: ReadonlyArray<AttributeOption> = [
  { value: '', label: 'Any' },
  { value: 'very low pitch', label: 'Very low' },
  { value: 'low pitch', label: 'Low' },
  { value: 'moderate pitch', label: 'Moderate' },
  { value: 'high pitch', label: 'High' },
  { value: 'very high pitch', label: 'Very high' },
]

export const ACCENT_OPTIONS: ReadonlyArray<AttributeOption> = [
  { value: '', label: 'Any' },
  { value: 'american accent', label: 'American' },
  { value: 'british accent', label: 'British' },
  { value: 'australian accent', label: 'Australian' },
  { value: 'canadian accent', label: 'Canadian' },
  { value: 'indian accent', label: 'Indian' },
  { value: 'chinese accent', label: 'Chinese' },
  { value: 'korean accent', label: 'Korean' },
  { value: 'japanese accent', label: 'Japanese' },
  { value: 'portuguese accent', label: 'Portuguese' },
  { value: 'russian accent', label: 'Russian' },
]

export const STYLE_OPTIONS: ReadonlyArray<AttributeOption> = [
  { value: '', label: 'Any' },
  { value: 'whisper', label: 'Whisper' },
]

export const ATTRIBUTE_OPTIONS: Record<AttributeKey, ReadonlyArray<AttributeOption>> = {
  gender: GENDER_OPTIONS,
  age: AGE_OPTIONS,
  pitch: PITCH_OPTIONS,
  accent: ACCENT_OPTIONS,
  style: STYLE_OPTIONS,
}

export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  gender: 'Gender',
  age: 'Age',
  pitch: 'Pitch',
  accent: 'Accent',
  style: 'Style',
}

export type AttributeValues = Record<AttributeKey, string>

export const EMPTY_ATTRIBUTES: AttributeValues = {
  gender: '',
  age: '',
  pitch: '',
  accent: '',
  style: '',
}

export const ATTRIBUTE_ORDER: ReadonlyArray<AttributeKey> = [
  'gender',
  'age',
  'pitch',
  'accent',
  'style',
]

export interface DesignPreset {
  id: string
  label: string
  attrs: AttributeValues
}

// One-tap warm starts above the Characteristics dropdowns. Each preset fills
// all five attributes; the user can still tweak individual dropdowns after.
export const DESIGN_PRESETS: ReadonlyArray<DesignPreset> = [
  {
    id: 'calm-narrator',
    label: 'Calm narrator',
    attrs: {
      gender: 'female',
      age: 'middle-aged',
      pitch: 'moderate pitch',
      accent: 'british accent',
      style: '',
    },
  },
  {
    id: 'gruff-detective',
    label: 'Gruff detective',
    attrs: {
      gender: 'male',
      age: 'middle-aged',
      pitch: 'low pitch',
      accent: 'american accent',
      style: '',
    },
  },
  {
    id: 'cheerful-young',
    label: 'Cheerful young',
    attrs: {
      gender: 'female',
      age: 'young adult',
      pitch: 'high pitch',
      accent: 'american accent',
      style: '',
    },
  },
  {
    id: 'storyteller-elder',
    label: 'Storyteller elder',
    attrs: {
      gender: 'male',
      age: 'elderly',
      pitch: 'low pitch',
      accent: 'british accent',
      style: '',
    },
  },
]
