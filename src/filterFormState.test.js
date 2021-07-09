import filterFormState from './filterFormState'

describe('filterFormState', () => {
  const state = {
    active: 'foo',
    dirty: false,
    error: 'some error',
    invalid: false,
    initialValues: { dog: 'cat' },
    pristine: true,
    submitting: false,
    submitFailed: false,
    submitSucceeded: false,
    submitError: 'some submit error',
    touched: { foo: true, bar: false },
    valid: true,
    validating: false,
    values: { foo: 'bar' },
    visited: { foo: true, bar: false }
  }

  const testValue = (key, state, newValue) => {
    it(`should not notify when ${key} doesn't change`, () => {
      const result = filterFormState(state, state, { [key]: true })
      expect(result).toBeUndefined()
    })

    it(`should notify when ${key} changes`, () => {
      const result = filterFormState({ ...state, [key]: newValue }, state, {
        [key]: true
      })
      expect(result).toEqual({
        [key]: newValue
      })
    })

    it(`should notify when ${key} doesn't change, but is forced`, () => {
      const result = filterFormState(state, state, { [key]: true }, true)
      expect(result).toEqual({
        [key]: state[key]
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
      const result = filterFormState({ ...state, [key]: newValue }, state, {
        [key]: subscriptionValue
      })
      if (shouldNotify) {
        expect(result).toEqual({
          [key]: newValue
        })
      } else {
        expect(result).toBeUndefined()
      }
    })

    it(`should notify when ${key} doesn't change, but is forced`, () => {
      const result = filterFormState(state, state, { [key]: newValue }, true)
      expect(result).toEqual({
        [key]: state[key]
      })
    })
  }

  describe('filterFormState.active', () => {
    testValue('active', state, !state.active)
  })

  describe('filterFormState.dirty', () => {
    testValue('dirty', state, !state.dirty)
  })

  describe('filterFormState.error', () => {
    testValue('error', state, 'rabbit')
  })

  describe('filterFormState.initialValues', () => {
    testValue('initialValues', state, { dog: 'fido' })
  })

  describe('filterFormState.invalid', () => {
    testValue('invalid', state, !state.invalid)
  })

  describe('filterFormState.pristine', () => {
    testValue('pristine', state, !state.pristine)
  })

  describe('filterFormState.submitting', () => {
    testValue('submitting', state, !state.submitting)
  })

  describe('filterFormState.submitFailed', () => {
    testValue('submitFailed', state, !state.submitFailed)
  })

  describe('filterFormState.submitSucceeded', () => {
    testValue('submitSucceeded', state, !state.submitSucceeded)
  })

  describe('filterFormState.submitError', () => {
    testValue('submitError', state, !state.submitError)
  })

  describe('filterFormState.touched', () => {
    testValue('touched', state, { foo: true, bar: true })
  })

  describe('filterFormState.valid', () => {
    testValue('valid', state, !state.valid)
  })

  describe('filterFormState.validating', () => {
    testValue('validating', state, !state.validating)
  })

  describe('filterFormState.values', () => {
    testValue('values', state, { foo: 'baz' })
  })

  describe('filterFormState.visited', () => {
    testValue('visited', state, { foo: true, bar: true })
  })

  describe('filterFormState.values - shape value', () => {
    const currentKey = 'values'
    const currentValues = {
      keyA: false,
      keyB: { foo: false, bar: false },
      keyC: undefined
    }
    const nextValuesA = {
      ...currentValues,
      keyA: true
    }
    const nextValuesB = {
      ...currentValues,
      keyB: { foo: true, bar: false }
    }
    const nextValuesC = {
      ...currentValues,
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
          values: currentValues
        },
        newValue: nextValuesA,
        subscriptionValue: subscriptionValueA,
        shouldNotify: true
      })
      testShapeValueNotify({
        key: currentKey,
        state: {
          ...state,
          values: currentValues
        },
        newValue: nextValuesA,
        subscriptionValue: subscriptionValueAll,
        shouldNotify: true
      })
    })
    describe('primitive value does not change when subscription contains the key', () => {
      testShapeValueNotify({
        key: currentKey,
        state: {
          ...state,
          values: currentValues
        },
        newValue: currentValues,
        subscriptionValue: subscriptionValueA,
        shouldNotify: false
      })
    })
    describe('primitive value changes when subscription does not contain the key', () => {
      testShapeValueNotify({
        key: currentKey,
        state: {
          ...state,
          values: currentValues
        },
        newValue: nextValuesA,
        subscriptionValue: subscriptionValueB,
        shouldNotify: false
      })
    })
    describe('object type value changes when subscription contains the key', () => {
      testShapeValueNotify({
        key: currentKey,
        state: {
          ...state,
          values: currentValues
        },
        newValue: nextValuesB,
        subscriptionValue: subscriptionValueB,
        shouldNotify: true
      })
      testShapeValueNotify({
        key: currentKey,
        state: {
          ...state,
          values: currentValues
        },
        newValue: nextValuesB,
        subscriptionValue: subscriptionValueAll,
        shouldNotify: true
      })
    })
    describe('object type value does not change when subscription contains the key', () => {
      testShapeValueNotify({
        key: currentKey,
        state: {
          ...state,
          values: currentValues
        },
        newValue: nextValuesA,
        subscriptionValue: subscriptionValueB,
        shouldNotify: false
      })
    })
    describe('object type value changes when subscription does not contain the key', () => {
      testShapeValueNotify({
        key: currentKey,
        state: {
          ...state,
          values: currentValues
        },
        newValue: nextValuesB,
        subscriptionValue: subscriptionValueA,
        shouldNotify: false
      })
    })
    describe('object type value partial changes when subscription contains the nested key', () => {
      testShapeValueNotify({
        key: currentKey,
        state: {
          ...state,
          values: currentValues
        },
        newValue: nextValuesB,
        subscriptionValue: subscriptionValueFoo,
        shouldNotify: true
      })
    })
    describe('object type value partial changes when subscription does not contain the nested key', () => {
      testShapeValueNotify({
        key: currentKey,
        state: {
          ...state,
          values: currentValues
        },
        newValue: nextValuesB,
        subscriptionValue: subscriptionValueBar,
        shouldNotify: false
      })
    })
    describe('undefined value changes to null value when subscription contains the key', () => {
      testShapeValueNotify({
        key: currentKey,
        state: {
          ...state,
          values: currentValues
        },
        newValue: nextValuesC,
        subscriptionValue: subscriptionValueC,
        shouldNotify: true
      })
    })
    describe('subscription contains a irrelative key', () => {
      testShapeValueNotify({
        key: currentKey,
        state: {
          ...state,
          values: currentValues
        },
        newValue: nextValuesB,
        subscriptionValue: subscriptionValueWild,
        shouldNotify: false
      })
    })
  })
})
