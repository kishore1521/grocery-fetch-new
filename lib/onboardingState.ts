// Shared mutable state across onboarding steps.
// Simple module-level object — no Zustand needed for a 3-step linear flow.

export const onboardingData = {
  language: 'en',
  zipCode: '',
  selectedStores: [] as string[],
  loyaltyShoprite: false,
  loyaltyStopAndShop: false,
}

export const resetOnboardingData = () => {
  onboardingData.language = 'en'
  onboardingData.zipCode = ''
  onboardingData.selectedStores = []
  onboardingData.loyaltyShoprite = false
  onboardingData.loyaltyStopAndShop = false
}
