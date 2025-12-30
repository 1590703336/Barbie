import { create } from 'zustand'
import { createAuthSlice } from './slices/authSlice'
import { createSubscriptionSlice } from './slices/subscriptionSlice'
import { createAnalyticsSlice } from './slices/analyticsSlice'

const useStore = create((set, get) => ({
  ...createAuthSlice(set, get),
  ...createSubscriptionSlice(set, get),
  ...createAnalyticsSlice(set, get),
}))

export default useStore

