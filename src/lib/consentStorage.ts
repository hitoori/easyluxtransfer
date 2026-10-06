export const consentStorageKey = 'easylux-consent-v1'
export const consentMaxAge = 180 * 24 * 60 * 60 * 1000
export type StoredConsent = { version: 1 | 2; maps: boolean; analytics: boolean; savedAt: number }

/** Invalid or expired browser data must never enable an optional service. */
export function readStoredConsent(storage: Pick<Storage, 'getItem'>, now = Date.now()): StoredConsent | null {
  try {
    const data = JSON.parse(storage.getItem(consentStorageKey) ?? 'null')
    const valid = (data?.version === 1 || data?.version === 2) && typeof data.maps === 'boolean'
      && (data.version === 1 || typeof data.analytics === 'boolean')
      && typeof data.savedAt === 'number' && data.savedAt <= now && now - data.savedAt < consentMaxAge
    // A previous Maps-only choice never grants permission for the new analytics service.
    return valid ? { version: data.version, maps: data.maps, analytics: data.version === 2 && data.analytics, savedAt: data.savedAt } : null
  } catch { return null }
}
