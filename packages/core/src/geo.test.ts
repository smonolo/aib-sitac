import {
  lineBearingDegrees,
  lineMidpoint,
  ringCentroid,
  translateGeometry,
} from './geo'

describe('translateGeometry', () => {
  test('shifts point', () => {
    expect(
      translateGeometry({ type: 'Point', coordinates: [9, 45] }, 0.1, -0.2)
    ).toEqual({ type: 'Point', coordinates: [9.1, 44.8] })
  })

  test('shifts line', () => {
    expect(
      translateGeometry(
        {
          type: 'LineString',
          coordinates: [
            [1, 2],
            [3, 4],
          ],
        },
        1,
        1
      )
    ).toEqual({
      type: 'LineString',
      coordinates: [
        [2, 3],
        [4, 5],
      ],
    })
  })

  test('shifts polygon and keeps ring closed', () => {
    const moved = translateGeometry(
      {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 0],
          ],
        ],
      },
      2,
      3
    )
    expect(moved).toEqual({
      type: 'Polygon',
      coordinates: [
        [
          [2, 3],
          [3, 3],
          [3, 4],
          [2, 3],
        ],
      ],
    })
  })
})

describe('lineBearingDegrees', () => {
  test('north', () => {
    const deg = lineBearingDegrees([9, 45], [9, 46])
    expect(deg < 1 || deg > 359).toBeTruthy()
  })

  test('east', () => {
    const deg = lineBearingDegrees([9, 45], [10, 45])
    expect(Math.abs(deg - 90) < 1).toBeTruthy()
  })

  test('south', () => {
    const deg = lineBearingDegrees([9, 46], [9, 45])
    expect(Math.abs(deg - 180) < 1).toBeTruthy()
  })

  test('west', () => {
    const deg = lineBearingDegrees([10, 45], [9, 45])
    expect(Math.abs(deg - 270) < 1).toBeTruthy()
  })
})

describe('lineMidpoint', () => {
  test('empty returns origin', () => {
    expect(lineMidpoint([])).toEqual([0, 0])
  })

  test('single vertex', () => {
    expect(lineMidpoint([[3, 4]])).toEqual([3, 4])
  })

  test('odd vertex count', () => {
    expect(
      lineMidpoint([
        [0, 0],
        [1, 1],
        [2, 2],
      ])
    ).toEqual([1, 1])
  })

  test('even vertex count averages mid segment', () => {
    expect(
      lineMidpoint([
        [0, 0],
        [2, 2],
      ])
    ).toEqual([1, 1])
  })
})

describe('ringCentroid', () => {
  test('empty returns origin', () => {
    expect(ringCentroid([])).toEqual([0, 0])
  })

  test('single vertex', () => {
    expect(ringCentroid([[5, 6]])).toEqual([5, 6])
  })

  test('averages vertices and ignores closing duplicate', () => {
    expect(
      ringCentroid([
        [0, 0],
        [2, 0],
        [2, 2],
        [0, 2],
        [0, 0],
      ])
    ).toEqual([1, 1])
  })

  test('open ring does not drop last vertex', () => {
    expect(
      ringCentroid([
        [0, 0],
        [4, 0],
        [0, 4],
      ])
    ).toEqual([4 / 3, 4 / 3])
  })
})
