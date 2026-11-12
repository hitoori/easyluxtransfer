export const consentStorageKey = 'easylux-consent-v1'
export const consentMaxAge = 180 * 24 * 60 * 60 * 1000
export type StoredConsent = { version: 1 | 2 | 3 | 4; maps: boolean; analytics: boolean; advertising: boolean; savedAt: number }

/** Invalid or expired browser data must never enable an optional service. */
export function readStoredConsent(storage: Pick<Storage, 'getItem'>, now = Date.now()): StoredConsent | null {
  try {
    const data = JSON.parse(storage.getItem(consentStorageKey) ?? 'null')
    const valid = [1, 2, 3, 4].includes(data?.version) && typeof data.maps === 'boolean'
      && (data.version === 1 || typeof data.analytics === 'boolean')
      && (data.version < 3 || typeof data.advertising === 'boolean')
      && typeof data.savedAt === 'number' && data.savedAt <= now && now - data.savedAt < consentMaxAge
    // Existing choices never grant permission for a newly introduced purpose.
    return valid ? { version: data.version, maps: data.maps, analytics: data.version >= 2 && data.analytics, advertising: data.version >= 3 && data.advertising, savedAt: data.savedAt } : null
  } catch { return null }
}
