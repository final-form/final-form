import createForm from './FinalForm'

const onSubmitMock = (values, callback) => {}

describe('Field.subscribing', () => {
  const prepareFieldSubscribers = (
    formSubscription,
    fieldSubscriptions,
    fieldConfig = {},
    config = {}
  ) => {
    const form = createForm({ onSubmit: onSubmitMock, ...config })
    const formSpy = jest.fn()
    form.subscribe(formSpy, formSubscription)
    expect(formSpy).toHaveBeenCalled()
    expect(formSpy).toHaveBeenCalledTimes(1)
    expect(formSpy.mock.calls[0][0].values).toBeUndefined()

    return {
      ...Object.keys(fieldSubscriptions).reduce((result, name) => {
        const spy = jest.fn()
        form.registerField(
          name,
          spy,
          fieldSubscriptions[name],
          fieldConfig[name]
        )
        expect(spy).toHaveBeenCalled()
        expect(spy).toHaveBeenCalledTimes(1)
        const { blur, change, focus } = spy.mock.calls[0][0]
        result[name] = { blur, change, focus, spy }
        return result
      }, {}),
      form,
      formSpy
    }
  }

  it('should provide a list of registered fields', () => {
    const form = createForm({ onSubmit: onSubmitMock })
    form.registerField('foo', () => {}, {})
    form.registerField('bar', () => {}, {})
    form.registerField('baz', () => {}, {})
    expect(form.getRegisteredFields()).toEqual(['foo', 'bar', 'baz'])
  })

  it('should provide a access to field state', () => {
    const form = createForm({ onSubmit: onSubmitMock })
    form.registerField('foo', () => {}, {})
    form.registerField('bar', () => {}, {})
    form.registerField('baz', () => {}, {})
    expect(form.getFieldState('foo')).toBeDefined()
    expect(form.getFieldState('foo').name).toBe('foo')
    expect(form.getFieldState('notafield')).toBeUndefined()
  })

  it('should allow subscribing to active', () => {
    const { foo: { blur, focus, spy } } = prepareFieldSubscribers(
      {},
      {
        foo: { active: true }
      }
    )

    // should initialize to not active
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].active).toBe(false)

    blur()

    // blur does nothing, still inactive
    expect(spy).toHaveBeenCalledTimes(1)

    focus()

    // field is now active
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].active).toBe(true)

    focus()

    // another focus changes nothing
    expect(spy).toHaveBeenCalledTimes(2)

    blur()

    // field is now inactive
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].active).toBe(false)
  })

  it('should allow subscribing to dirty', () => {
    const { foo: { change, spy } } = prepareFieldSubscribers(
      {},
      {
        foo: { dirty: true }
      }
    )

    // should initialize to not be dirty
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].dirty).toBe(false)

    change('bar')

    // field is now dirty
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].dirty).toBe(true)

    change('baz')

    // field is still dirty, no change
    expect(spy).toHaveBeenCalledTimes(2)

    change(undefined)

    // field is now pristine again
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].dirty).toBe(false)
  })

  it('should allow subscribing to error with whole-record validation', () => {
    const { foo: { change, spy } } = prepareFieldSubscribers(
      {},
      {
        foo: { error: true }
      },
      {},
      {
        validate: values => {
          const errors = {}
          if (!values.foo) {
            errors.foo = 'Required'
          }
          return errors
        }
      }
    )

    // should initialize with error
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].error).toBe('Required')

    change('bar')

    // field is now valid: no error
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].error).toBeUndefined()

    change('baz')

    // still valid, no change
    expect(spy).toHaveBeenCalledTimes(2)

    change(undefined)

    // invalid again: have error
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].error).toBe('Required')
  })

  it('should allow subscribing to error with field-level validation', () => {
    const { foo: { change, spy } } = prepareFieldSubscribers(
      {},
      {
        foo: { error: true }
      },
      {
        foo: { getValidator: () => value => (value ? undefined : 'Required') }
      }
    )

    // should initialize with error
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].error).toBe('Required')

    change('bar')

    // field is now valid: no error
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].error).toBeUndefined()

    change('baz')

    // still valid, no change
    expect(spy).toHaveBeenCalledTimes(2)

    change(undefined)

    // invalid again: have error
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].error).toBe('Required')
  })

  it('should allow subscribing to initial', () => {
    const { form, foo: { spy } } = prepareFieldSubscribers(
      {},
      {
        foo: { initial: true }
      },
      {},
      {
        initialValues: {
          foo: 'bar'
        }
      }
    )

    // should initialize with initial value
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].initial).toBe('bar')

    form.reset()

    // same initial value, duh
    expect(spy).toHaveBeenCalledTimes(1)

    form.initialize({ foo: 'baz' })

    // new initial value
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].initial).toBe('baz')
  })

  it('should allow reseting even if never initialized', () => {
    const { form, foo: { spy } } = prepareFieldSubscribers(
      {},
      {
        foo: { initial: true }
      },
      {},
      {}
    )

    // should initialize with initial value
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].initial).toBeUndefined()

    form.reset()

    // same initial value, duh
    expect(spy).toHaveBeenCalledTimes(1)

    form.initialize({ foo: 'baz' })

    // new initial value
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].initial).toBe('baz')
  })

  it('should allow subscribing to invalid with whole-record validation', () => {
    const { foo: { change, spy } } = prepareFieldSubscribers(
      {},
      {
        foo: { invalid: true }
      },
      {},
      {
        validate: values => {
          const errors = {}
          if (!values.foo) {
            errors.foo = 'Required'
          }
          return errors
        }
      }
    )

    // should initialize as invalid
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].invalid).toBe(true)

    change('bar')

    // field is now valid
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].invalid).toBe(false)

    change('baz')

    // still valid, no change
    expect(spy).toHaveBeenCalledTimes(2)

    change(undefined)

    // invalid again
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].invalid).toBe(true)
  })

  it('should allow subscribing to invalid with field-level validation', () => {
    const { foo: { change, spy } } = prepareFieldSubscribers(
      {},
      {
        foo: { invalid: true }
      },
      {
        foo: { getValidator: () => value => (value ? undefined : 'Required') }
      }
    )

    // should initialize as invalid
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].invalid).toBe(true)

    change('bar')

    // field is now valid
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].invalid).toBe(false)

    change('baz')

    // still valid, no change
    expect(spy).toHaveBeenCalledTimes(2)

    change(undefined)

    // invalid again
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].invalid).toBe(true)
  })

  it('should allow subscribing to length', () => {
    const { foo: { change, spy } } = prepareFieldSubscribers(
      {},
      {
        foo: { length: true }
      }
    )

    // should initialize to be pristine
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].length).toBeUndefined()

    change(['bar', 'baz'])

    // field is now dirty
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].length).toBe(2)

    change(['baz'])

    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].length).toBe(1)
  })

  it('should allow subscribing to pristine', () => {
    const { foo: { change, spy } } = prepareFieldSubscribers(
      {},
      {
        foo: { pristine: true }
      }
    )

    // should initialize to be pristine
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].pristine).toBe(true)

    change('bar')

    // field is now dirty
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].pristine).toBe(false)

    change('baz')

    // field is still dirty, no change
    expect(spy).toHaveBeenCalledTimes(2)

    change(undefined)

    // field is now pristine again
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].pristine).toBe(true)
  })

  it('should allow subscribing to touched', () => {
    const { foo: { blur, focus, spy } } = prepareFieldSubscribers(
      {},
      {
        foo: { touched: true }
      }
    )

    // should initialize to not touched
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].touched).toBe(false)

    focus()

    // field is visited, but not yet touched
    expect(spy).toHaveBeenCalledTimes(1)

    blur()

    // field is now touched
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].touched).toBe(true)

    // no amount of focusing and bluring will change the touched flag
    focus()
    blur()
    focus()
    blur()
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('should allow field to be marked touched even if it was not active', () => {
    const { foo: { blur, spy } } = prepareFieldSubscribers(
      {},
      {
        foo: { touched: true }
      }
    )

    // should initialize to not touched
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].touched).toBe(false)

    blur()

    // field is now touched
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].touched).toBe(true)
  })

  it('should allow subscribing to valid with whole-record validation', () => {
    const { foo: { change, spy } } = prepareFieldSubscribers(
      {},
      {
        foo: { valid: true }
      },
      {},
      {
        validate: values => {
          const errors = {}
          if (!values.foo) {
            errors.foo = 'Required'
          }
          return errors
        }
      }
    )

    // should initialize as invalid
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].valid).toBe(false)

    change('bar')

    // field is now valid
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].valid).toBe(true)

    change('baz')

    // still valid, no change
    expect(spy).toHaveBeenCalledTimes(2)

    change(undefined)

    // invalid again
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].valid).toBe(false)
  })

  it('should allow subscribing to valid with field-level validation', () => {
    const { foo: { change, spy } } = prepareFieldSubscribers(
      {},
      {
        foo: { valid: true }
      },
      {
        foo: { getValidator: () => value => (value ? undefined : 'Required') }
      }
    )

    // should initialize as invalid
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].valid).toBe(false)

    change('bar')

    // field is now valid
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].valid).toBe(true)

    change('baz')

    // still valid, no change
    expect(spy).toHaveBeenCalledTimes(2)

    change(undefined)

    // invalid again
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].valid).toBe(false)
  })

  it('should allow subscribing to value', () => {
    const { foo: { change, spy } } = prepareFieldSubscribers(
      {},
      {
        foo: { value: true }
      }
    )

    // should initialize with undefined value
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].value).toBeUndefined()

    change('bar')

    // field has new value
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].value).toBe('bar')

    change('bar')

    // value didn't change
    expect(spy).toHaveBeenCalledTimes(2)

    change('baz')

    // value changed again
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].value).toBe('baz')
  })

  it('should allow subscribing to visited', () => {
    const { foo: { blur, focus, spy } } = prepareFieldSubscribers(
      {},
      {
        foo: { visited: true }
      }
    )

    // should initialize to not visited
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].visited).toBe(false)

    focus()

    // field is visited
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].visited).toBe(true)

    // no amount of focusing and bluring will change the touched flag
    blur()
    focus()
    blur()
    focus()
    blur()
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('should calculate dirty/pristine based on passed isEqual predicate', () => {
    const form = createForm({
      onSubmit: onSubmitMock,
      initialValues: { foo: 'bar' }
    })
    const spy = jest.fn()
    form.subscribe(spy, { dirty: true, pristine: true })
    const field = jest.fn()
    form.registerField(
      'foo',
      field,
      { dirty: true, pristine: true },
      {
        isEqual: (a, b) => (a && a.toUpperCase()) === (b && b.toUpperCase())
      }
    )

    // should initialize to not be dirty
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].pristine).toBe(true)
    expect(spy.mock.calls[0][0].dirty).toBe(false)
    expect(field).toHaveBeenCalledTimes(1)
    expect(field.mock.calls[0][0].pristine).toBe(true)
    expect(field.mock.calls[0][0].dirty).toBe(false)

    // change value
    form.change('foo', 'bark')

    // dirty now
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].pristine).toBe(false)
    expect(spy.mock.calls[1][0].dirty).toBe(true)
    expect(field).toHaveBeenCalledTimes(2)
    expect(field.mock.calls[1][0].pristine).toBe(false)
    expect(field.mock.calls[1][0].dirty).toBe(true)

    // change value, but equals with our fn
    form.change('foo', 'BAR')

    // dirty now
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].pristine).toBe(true)
    expect(spy.mock.calls[2][0].dirty).toBe(false)
    expect(field).toHaveBeenCalledTimes(3)
    expect(field.mock.calls[2][0].pristine).toBe(true)
    expect(field.mock.calls[2][0].dirty).toBe(false)
  })
})
