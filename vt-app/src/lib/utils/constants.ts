export const APP_NAME = 'Virtual Tutor'
export const APP_VERSION = '7.0.0'

export const ROUTES = {
  home: '/',
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
  },
  wizard: '/wizard',
  classroom: '/classroom',
  textbooks: '/textbooks',
} as const

export const GRADE_LEVELS = [
  { value: '9', label: 'Class 9' },
  { value: '10', label: 'Class 10' },
  { value: '11', label: 'Class 11' },
  { value: '12', label: 'Class 12' },
] as const

export const SUBJECTS = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'biology', label: 'Biology' },
] as const

export const LEARNING_STYLES = [
  { value: 'visual', label: 'Visual Learner' },
  { value: 'auditory', label: 'Auditory Learner' },
  { value: 'kinesthetic', label: 'Kinesthetic Learner' },
  { value: 'reading', label: 'Reading/Writing Learner' },
] as const