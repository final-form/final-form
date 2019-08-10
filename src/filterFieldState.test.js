import filterFieldState from './filterFieldState'

describe('filterFieldState', () => {
  const name = 'foo'
  const state = {
    active: true,
    data: { someValue: 42 },
    dirty: false,
    error: 'dog',
    initial: 'initialValue',
    invalid: false,
    name,
    pristine: true,
    touched: true,
    valid: true,
    value: 'cat',
    visited: true
  }

  const testValue = (key, state, newValue) => {
    it(`should not notify when ${key} doesn't change`, () => {
      const result = filterFieldState(state, state, { [key]: true })
      expect(result).toBeUndefined()
    })

    it(`should notify when ${key} changes`, () => {
      const result = filterFieldState({ ...state, [key]: newValue }, state, {
        [key]: true
      })
      expect(result).toEqual({
        [key]: newValue,
        name
      })
    })

    it(`should notify when ${key} doesn't change, but is forced`, () => {
      const result = filterFieldState(state, state, { [key]: true }, true)
      expect(result).toEqual({
        [key]: state[key],
        name
      })
    })
  }

  const testShapeValueNotify = ({
    key,
    state,
    newValue,
    subscriptionValue,
    shouldNotify = true
  }) => {
    it(`should ${shouldNotify ? '' : 'not'} notify when ${key} changes`, () => {
      const result = filterFieldState({ ...state, [key]: newValue }, state, {
        [key]: subscriptionValue
      })
      if (shouldNotify) {
        expect(result).toEqual({
          [key]: newValue,
          name
        })
      } else {
        expect(result).toBeUndefined()
      }
    })

    it(`should notify when ${key} doesn't change, but is forced`, () => {
      const result = filterFieldState(
        state,
        state,
        { [key]: subscriptionValue },
        true
      )
      expect(result).toEqual({
        [key]: state[key],
        name
      })
    })
  }

  describe('filterFieldState.active', () => {
    testValue('active', state, !state.active)
  })

  describe('filterFieldState.data', () => {
    testValue('data', state, { someValue: 43 })
  })

  describe('filterFieldState.dirty', () => {
    testValue('dirty', state, !state.dirty)
  })

  describe('filterFieldState.error', () => {
    testValue('error', state, 'rabbit')
  })

  describe('filterFieldState.initial', () => {
    testValue('initial', state, 'foobar')
  })

  describe('filterFieldState.invalid', () => {
    testValue('invalid', state, !state.invalid)
  })

  describe('filterFieldState.pristine', () => {
    testValue('pristine', state, !state.pristine)
  })

  describe('filterFieldState.touched', () => {
    testValue('touched', state, !state.touched)
  })

  describe('filterFieldState.valid', () => {
    testValue('valid', state, !state.valid)
  })

  describe('filterFieldState.value', () => {
    testValue('value', state, 'whatever')
  })

  describe('filterFieldState.visited', () => {
    testValue('visited', state, !state.visited)
  })

  describe('filterFieldState.value - shape value', () => {
    const currentKey = 'value'
    const currentValue = {
      keyA: false,
      keyB: { foo: false, bar: false },
      keyC: undefined
    }
    const nextValueA = {
      ...currentValue,
      keyA: true
    }
    const nextValueB = {
      ...currentValue,
      keyB: { foo: true, bar: false }
    }
    const nextValueC = {
      ...currentValue,
      keyC: null
    }
    const subscriptionValueA = {
      keyA: true
    }
    const subscriptionValueB = {
      keyB: true
    }
    const subscriptionValueC = {
      keyC: true
    }
    const subscriptionValueFoo = {
      keyB: { foo: true }
    }
    const subscriptionValueBar = {
      keyB: { bar: true }
    }
    const subscriptionValueAll = {
      keyA: true,
      keyB: true,
      keyC: true
    }
    const subscriptionValueWild = {
      wildKey: {
        whoAmI: true
      }
    }
    describe('primitive value changes when subscription contains the key', () => {
      testShapeValueNotify({
        key: currentKey,
        state: {
          ...state,
          value: currentValue
        },
        newValue: nextValueA,
        subscriptionValue: subscriptionValueA,
        shouldNotify: true
      })
      testShapeValueNotify({
        key: currentKey,
        state: {
          ...state,
          value: currentValue
        },
        newValue: nextValueA,
        subscriptionValue: subscriptionValueAll,
        shouldNotify: true
      })
    })
    describe('primitive value does not change when subscription contains the key', () => {
      testShapeValueNotify({
        key: currentKey,
        state: {
          ...state,
          value: currentValue
        },
        newValue: currentValue,
        subscriptionValue: subscriptionValueA,
        shouldNotify: false
      })
    })
    describe('primitive value changes when subscription does not contain the key', () => {
      testShapeValueNotify({
        key: currentKey,
        state: {
          ...state,
          value: currentValue
        },
        newValue: nextValueA,
        subscriptionValue: subscriptionValueB,
        shouldNotify: false
      })
    })
    describe('object type value changes when subscription contains the key', () => {
      testShapeValueNotify({
        key: currentKey,
        state: {
          ...state,
          value: currentValue
        },
        newValue: nextValueB,
        subscriptionValue: subscriptionValueB,
        shouldNotify: true
      })
      testShapeValueNotify({
        key: currentKey,
        state: {
          ...state,
          value: currentValue
        },
        newValue: nextValueB,
        subscriptionValue: subscriptionValueAll,
        shouldNotify: true
      })
    })
    describe('object type value does not change when subscription contains the key', () => {
      testShapeValueNotify({
        key: currentKey,
        state: {
          ...state,
          value: currentValue
        },
        newValue: nextValueA,
        subscriptionValue: subscriptionValueB,
        shouldNotify: false
      })
    })
    describe('object type value changes when subscription does not contain the key', () => {
      testShapeValueNotify({
        key: currentKey,
        state: {
          ...state,
          value: currentValue
        },
        newValue: nextValueB,
        subscriptionValue: subscriptionValueA,
        shouldNotify: false
      })
    })
    describe('object type value partial changes when subscription contains the nested key', () => {
      testShapeValueNotify({
        key: currentKey,
        state: {
          ...state,
          value: currentValue
        },
        newValue: nextValueB,
        subscriptionValue: subscriptionValueFoo,
        shouldNotify: true
      })
    })
    describe('object type value partial changes when subscription does not contain the nested key', () => {
      testShapeValueNotify({
        key: currentKey,
        state: {
          ...state,
          value: currentValue
        },
        newValue: nextValueB,
        subscriptionValue: subscriptionValueBar,
        shouldNotify: false
      })
    })
    describe('undefined value changes to null value when subscription contains the key', () => {
      testShapeValueNotify({
        key: currentKey,
        state: {
          ...state,
          value: currentValue
        },
        newValue: nextValueC,
        subscriptionValue: subscriptionValueC,
        shouldNotify: true
      })
    })
    describe('subscription contains a irrelative key', () => {
      testShapeValueNotify({
        key: currentKey,
        state: {
          ...state,
          value: currentValue
        },
        newValue: nextValueB,
        subscriptionValue: subscriptionValueWild,
        shouldNotify: false
      })
    })
  })
})
