import test from 'node:test'
import assert from 'node:assert/strict'
import { typescriptModule } from './load-typescript.mjs'

const { countLabel, t, message, withRenderLanguage, languageFromPath } = await import(typescriptModule(new URL('../src/i18n/translate.ts', import.meta.url)))
const { pagePath } = await import(typescriptModule(new URL('../src/types/navigation.ts', import.meta.url)))

test('language prefix selects Russian only for its own path segment', () => {
  for (const path of ['/ru', '/ru/', '/ru/services']) assert.equal(languageFromPath(path), 'ru')
  for (const path of ['/', '/services', '/rules', '/russia']) assert.equal(languageFromPath(path), 'en')
  assert.equal(pagePath('home', 'ru'), '/ru')
  assert.equal(pagePath('services', 'ru'), '/ru/services')
  assert.equal(pagePath('home', 'en'), '/')
})

test('Russian rendering translates copy, whitespace and parameters; English is restored', () => {
  assert.equal(t('Home'), 'Home')
  withRenderLanguage('ru', () => {
    assert.equal(t('Home'), 'Главная')
    assert.equal(t(' Contact '), ' Контакты ')
    assert.equal(message('Stop {0} · Location', 2), 'Остановка 2 · Место')
    assert.equal(message('Child {0}: {1} {2}', 1, 6, t('months')), 'Ребёнок 1: 6 месяцев')
    assert.equal(t('Hotel Example, 12 Canal Street'), 'Hotel Example, 12 Canal Street')
    assert.equal(t('client@example.com'), 'client@example.com')
    assert.equal(t(3), 3)
    assert.equal(t('75 min'), '75 мин')
    assert.equal(t('21 hours'), '21 час')
    assert.equal(countLabel(0, 'suitcase'), '0 чемоданов')
    assert.equal(countLabel(2, 'passenger'), '2 пассажира')
    assert.equal(countLabel(21, 'question'), '21 вопрос')
    assert.equal(countLabel(3, 'years'), '3 года')
    assert.equal(countLabel(1, 'months'), '1 месяц')
    assert.equal(withRenderLanguage('en', () => t('Home')), 'Home')
    assert.equal(t('Home'), 'Главная')
  })
  assert.equal(t('Home'), 'Home')
})


test('Russian browser keeps business booking details in the established English format', async () => {
  const model = await import(typescriptModule(new URL('../src/components/bookingModel.ts', import.meta.url)))
  const draft = { ...model.newJourney(), pickup: { text: 'Hotel Example', metadata: null }, destination: { text: 'Treviso Airport', metadata: null }, dateTime: '2030-06-02T10:00' }
  const passengers = model.newPassengers()
  passengers.childSeatsEnabled = true
  passengers.childAges = [{ value: '3', unit: 'years' }]
  const contact = model.newContact()
  const expected = withRenderLanguage('en', () => model.bookingDetails('transfer', draft, passengers, contact))
  const previous = globalThis.window
  globalThis.window = { location: { pathname: '/ru' } }
  try {
    assert.equal(t('Home'), 'Главная')
    assert.match(model.passengerReview(passengers).find(row => row.label === 'Child seats').value, /3 года/)
    assert.equal(model.bookingDetails('transfer', draft, passengers, contact), expected)
    assert.equal(t('Home'), 'Главная')
  } finally {
    if (previous === undefined) delete globalThis.window
    else globalThis.window = previous
  }
})
