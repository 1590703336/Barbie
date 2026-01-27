import { create } from 'zustand'
import { createAuthSlice } from './slices/authSlice'
import { createSubscriptionSlice } from './slices/subscriptionSlice'
import { createAnalyticsSlice } from './slices/analyticsSlice'
import { createThemeSlice } from './slices/themeSlice'
import { createUiSlice } from './slices/uiSlice'
import { createAdminAuthSlice } from './slices/adminAuthSlice'

const useStore = create((set, get) => ({
  ...createAuthSlice(set, get),
  ...createSubscriptionSlice(set, get),
  ...createAnalyticsSlice(set, get),
  ...createThemeSlice(set, get),
  ...createUiSlice(set, get),
  ...createAdminAuthSlice(set, get),
}))

export default useStore

