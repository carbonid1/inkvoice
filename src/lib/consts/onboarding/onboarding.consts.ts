export const ONBOARDING_QUERY_PARAM = 'onboarding'

export const ONBOARDING_PREGEN_VALUE = 'pregen'

export const buildPregenOnboardingHref = (bookId: string): string =>
  `/book/${bookId}?${ONBOARDING_QUERY_PARAM}=${ONBOARDING_PREGEN_VALUE}`
