export type Language = 'en' | 'ru'
let russian: Record<string, string> = {}
let russianPromise: Promise<void> | undefined
// English visits do not download the Russian dictionary. Load before rendering RU.
export function loadLanguage(language: Language): Promise<void> {
  if (language !== 'ru') return Promise.resolve()
  if (!russianPromise) russianPromise = import('./ru').then(module => { russian = module.russian }).catch(error => { russianPromise = undefined; throw error })
  return russianPromise
}
let renderLanguage: Language | undefined
export const languageFromPath = (path: string): Language => /^\/ru(?:\/|$)/.test(path) ? 'ru' : 'en'
export const getLanguage = (): Language => renderLanguage ?? (typeof window === 'undefined' ? 'en' : languageFromPath(window.location.pathname))
export const getLocale = () => getLanguage() === 'ru' ? 'ru-RU' : 'en-GB'

// Scope synchronous rendering/formatting, then restore the previous language.
export function withRenderLanguage<T>(language: Language, render: () => T): T {
  const previous = renderLanguage
  renderLanguage = language
  try { return render() } finally { renderLanguage = previous }
}

export function t<T>(value: T): T {
  if (getLanguage() !== 'ru' || typeof value !== 'string') return value
  const normalized = value.replace(/\s+/g, ' ').trim()
  const duration = normalized.match(/^(\d+) (hours?|min)$/)
  const translated = russian[normalized] ?? (duration ? `${duration[1]} ${duration[2] === 'min' ? 'мин' : ({ one: 'час', few: 'часа', many: 'часов', other: 'часа', zero: 'часов', two: 'часа' } as const)[new Intl.PluralRules('ru').select(Number(duration[1]))]}` : undefined)
  return (translated === undefined ? value : `${/^\s/.test(value) ? ' ' : ''}${translated}${/\s$/.test(value) ? ' ' : ''}`) as T
}

export function message(key: string, ...values: (string | number)[]) {
  return t(key).replace(/\{(\d+)\}/g, (_, index: string) => String(values[Number(index)]))
}

const itemNames = {
  suitcase: ['suitcase', 'suitcases', 'чемодан', 'чемодана', 'чемоданов'],
  cabinBag: ['cabin bag', 'cabin bags', 'место ручной клади', 'места ручной клади', 'мест ручной клади'],
  passenger: ['passenger', 'passengers', 'пассажир', 'пассажира', 'пассажиров'],
  bag: ['bag', 'bags', 'место багажа', 'места багажа', 'мест багажа'],
  years: ['year', 'years', 'год', 'года', 'лет'],
  months: ['month', 'months', 'месяц', 'месяца', 'месяцев'],
  question: ['question', 'questions', 'вопрос', 'вопроса', 'вопросов'],
} as const
export function countLabel(count: number | string, item: keyof typeof itemNames) {
  const names = itemNames[item]
  const rule = new Intl.PluralRules('ru').select(Number(count))
  return `${count} ${getLanguage() === 'ru' ? names[rule === 'one' ? 2 : rule === 'few' ? 3 : 4] : names[Number(count) === 1 ? 0 : 1]}`
}
