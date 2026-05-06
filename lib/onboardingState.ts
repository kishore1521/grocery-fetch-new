// Shared mutable state across onboarding steps.
// Simple module-level object — no Zustand needed for a 3-step linear flow.

export const onboardingData = {
  zipCode: '',
  selectedStores: [] as string[],
  loyaltyShoprite: false,
  loyaltyStopAndShop: false,
}

export const resetOnboardingData = () => {
  onboardingData.zipCode = ''
  onboardingData.selectedStores = []
  onboardingData.loyaltyShoprite = false
  onboardingData.loyaltyStopAndShop = false
}
