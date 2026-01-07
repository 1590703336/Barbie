import { create } from 'zustand'
import { createAuthSlice } from './slices/authSlice'
import { createSubscriptionSlice } from './slices/subscriptionSlice'
import { createAnalyticsSlice } from './slices/analyticsSlice'
import { createThemeSlice } from './slices/themeSlice'

const useStore = create((set, get) => ({
  ...createAuthSlice(set, get),
  ...createSubscriptionSlice(set, get),
  ...createAnalyticsSlice(set, get),
  ...createThemeSlice(set, get),
}))

export default useStore

