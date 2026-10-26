import assert from 'node:assert/strict'
import { test } from 'node:test'
import { copy, t } from './i18n'

test('IT and EN catalogs expose the same keys', () => {
  const itKeys = Object.keys(copy.it).sort()
  const enKeys = Object.keys(copy.en).sort()
  assert.deepEqual(itKeys, enKeys)
})

test('t returns locale catalog', () => {
  assert.equal(t('it').brand, 'AIB SITAC')
  assert.equal(t('en').brand, 'AIB SITAC')
  assert.notEqual(t('it').tagline, t('en').tagline)
})

test('required operator strings exist', () => {
  for (const locale of ['it', 'en'] as const) {
    const c = t(locale)
    assert.ok(c.createCta)
    assert.ok(c.palette)
    assert.ok(c.timeline)
    assert.ok(c.estimated)
    assert.match(c.unofficial, /unofficial|non ufficiale/i)
    assert.match(c.unofficial, /Protezione Civile/)
  }
})
