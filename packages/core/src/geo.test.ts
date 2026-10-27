import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { lineBearingDegrees, lineMidpoint, ringCentroid } from './geo'

describe('lineBearingDegrees', () => {
  test('north', () => {
    const deg = lineBearingDegrees([9, 45], [9, 46])
    assert.ok(deg < 1 || deg > 359)
  })

  test('east', () => {
    const deg = lineBearingDegrees([9, 45], [10, 45])
    assert.ok(Math.abs(deg - 90) < 1)
  })

  test('south', () => {
    const deg = lineBearingDegrees([9, 46], [9, 45])
    assert.ok(Math.abs(deg - 180) < 1)
  })

  test('west', () => {
    const deg = lineBearingDegrees([10, 45], [9, 45])
    assert.ok(Math.abs(deg - 270) < 1)
  })
})

describe('lineMidpoint', () => {
  test('empty returns origin', () => {
    assert.deepEqual(lineMidpoint([]), [0, 0])
  })

  test('single vertex', () => {
    assert.deepEqual(lineMidpoint([[3, 4]]), [3, 4])
  })

  test('odd vertex count', () => {
    assert.deepEqual(
      lineMidpoint([
        [0, 0],
        [1, 1],
        [2, 2],
      ]),
      [1, 1]
    )
  })

  test('even vertex count averages mid segment', () => {
    assert.deepEqual(
      lineMidpoint([
        [0, 0],
        [2, 2],
      ]),
      [1, 1]
    )
  })
})

describe('ringCentroid', () => {
  test('empty returns origin', () => {
    assert.deepEqual(ringCentroid([]), [0, 0])
  })

  test('single vertex', () => {
    assert.deepEqual(ringCentroid([[5, 6]]), [5, 6])
  })

  test('averages vertices and ignores closing duplicate', () => {
    assert.deepEqual(
      ringCentroid([
        [0, 0],
        [2, 0],
        [2, 2],
        [0, 2],
        [0, 0],
      ]),
      [1, 1]
    )
  })

  test('open ring does not drop last vertex', () => {
    assert.deepEqual(
      ringCentroid([
        [0, 0],
        [4, 0],
        [0, 4],
      ]),
      [4 / 3, 4 / 3]
    )
  })
})
