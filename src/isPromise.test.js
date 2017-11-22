import isPromise from './isPromise'

var promise = { then: () => {} }

describe('calling isPromise', () => {
  it('should return true with a promise', () => {
    expect(isPromise(promise)).toBe(true)
  })
  it('returns false with null', () => {
    expect(isPromise(null)).toBe(false)
  })
  it('returns false with undefined', () => {
    expect(isPromise(undefined)).toBe(false)
  })
  it('returns false with a number', () => {
    expect(isPromise(0)).toBe(false)
    expect(isPromise(-42)).toBe(false)
    expect(isPromise(42)).toBe(false)
  })
  it('returns false with a string', () => {
    expect(isPromise('')).toBe(false)
    expect(isPromise('then')).toBe(false)
  })
  it('returns false with a boolean', () => {
    expect(isPromise(false)).toBe(false)
    expect(isPromise(true)).toBe(false)
  })
  it('returns false with an object', () => {
    expect(isPromise({})).toBe(false)
    expect(isPromise({ then: true })).toBe(false)
  })
  it('returns false with an array', () => {
    expect(isPromise([])).toBe(false)
    expect(isPromise([true])).toBe(false)
  })
})
