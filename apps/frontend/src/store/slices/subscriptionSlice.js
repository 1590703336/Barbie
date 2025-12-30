export const createSubscriptionSlice = (set) => ({
  plans: [],
  activePlan: null,
  setPlans: (plans) => set({ plans }),
  setActivePlan: (plan) => set({ activePlan: plan }),
})

