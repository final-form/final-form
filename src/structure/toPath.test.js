import toPath from './toPath'

describe('structure.toPath', () => {
  it('should return empty array when key is empty', () => {
    expect(toPath(undefined)).toEqual([])
    expect(toPath(null)).toEqual([])
    expect(toPath('')).toEqual([])
  })

  it('should throw an error if key is not a string', () => {
    const pattern = /expects a string/
    expect(() => toPath(0)).toThrow(pattern)
    expect(() => toPath(7)).toThrow(pattern)
    expect(() => toPath(4.2)).toThrow(pattern)
    expect(() => toPath(false)).toThrow(pattern)
    expect(() => toPath(true)).toThrow(pattern)
    expect(() => toPath(new Date())).toThrow(pattern)
    expect(() => toPath(['not', 'a', 'string'])).toThrow(pattern)
    expect(() => toPath({ an: 'object' })).toThrow(pattern)
  })

  it('should split on dots', () => {
    expect(toPath('jack.daniels')).toEqual(['jack', 'daniels'])
    expect(toPath('jack.and.jill.went.up.the.hill')).toEqual([
      'jack',
      'and',
      'jill',
      'went',
      'up',
      'the',
      'hill'
    ])
  })

  it('should split on brackets', () => {
    expect(toPath('foo[1].bar')).toEqual(['foo', '1', 'bar'])
    expect(toPath('foo[1].bar[4]')).toEqual(['foo', '1', 'bar', '4'])
    expect(toPath('foo[1][2][3].bar[4].cow')).toEqual([
      'foo',
      '1',
      '2',
      '3',
      'bar',
      '4',
      'cow'
    ])
  })
})
