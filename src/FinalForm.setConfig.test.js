import createForm from './FinalForm'

const onSubmitMock = (values, callback) => {}

describe('FinalForm.setConfig', () => {
  it('should update debug callback on setConfig("debug", fn)', () => {
    const debug = jest.fn()
    const form = createForm({ onSubmit: onSubmitMock })

    form.registerField('foo', () => {})
    expect(debug).toHaveBeenCalledTimes(0)

    form.change('foo', 'bar')

    expect(debug).toHaveBeenCalledTimes(0)

    form.setConfig('debug', debug)

    form.change('foo', 'bing')

    expect(debug).toHaveBeenCalledTimes(1)
  })

  it('should initialize the form on setConfig("initialValues", values)', () => {
    const form = createForm({
      onSubmit: onSubmitMock,
      initialValues: {
        foo: 'bar'
      }
    })
    const spy = jest.fn()
    form.registerField('foo', spy, { initial: true, value: true })

    // should initialize with initial value
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].initial).toBe('bar')

    form.reset()

    // same initial value, duh
    expect(spy).toHaveBeenCalledTimes(1)

    spy.mock.calls[0][0].change('baz')

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].initial).toBe('bar')
    expect(spy.mock.calls[1][0].value).toBe('baz')

    form.setConfig('initialValues', { foo: 'bax' })

    // new initial value, and dirty value overwritten
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].initial).toBe('bax')
    expect(spy.mock.calls[2][0].value).toBe('bax')
  })

  it('should update mutators on setConfig("mutators", mutators)', () => {
    const clear = jest.fn(([name], state, { changeValue }) => {
      changeValue(state, name, () => undefined)
    })
    const upper = jest.fn(([name], state, { changeValue }) => {
      changeValue(state, name, value => value && value.toUpperCase())
    })

    const form = createForm({
      onSubmit: onSubmitMock,
      mutators: { clear }
    })
    expect(form.mutators).toBeDefined()
    expect(form.mutators.clear).toBeDefined()
    expect(typeof form.mutators.clear).toBe('function')
    expect(typeof form.mutators.upper).toBe('undefined')

    form.setConfig('mutators', { clear, upper })

    expect(form.mutators.upper).toBeDefined()
    expect(typeof form.mutators.upper).toBe('function')

    const formListener = jest.fn()
    form.subscribe(formListener, { values: true })
    form.registerField('foo', () => {}, { value: true })

    expect(formListener).toHaveBeenCalledTimes(1)
    expect(formListener.mock.calls[0][0].values).toEqual({})

    form.change('foo', 'bar')

    expect(formListener).toHaveBeenCalledTimes(2)
    expect(formListener.mock.calls[1][0].values.foo).toBe('bar')

    form.mutators.upper('foo')

    expect(formListener).toHaveBeenCalledTimes(3)
    expect(formListener.mock.calls[2][0].values.foo).toBe('BAR')

    form.mutators.clear('foo')

    expect(formListener).toHaveBeenCalledTimes(4)
    expect(formListener.mock.calls[3][0].values.foo).toBeUndefined()

    form.setConfig('mutators', { upper })
    expect(typeof form.mutators.clear).toBe('undefined')

    form.setConfig('mutators', undefined)
    expect(typeof form.mutators.clear).toBe('undefined')
    expect(typeof form.mutators.upper).toBe('undefined')
  })

  it('should replace onSubmit on setConfig("onSubmit", fn)', () => {
    const onSubmit = jest.fn()
    const form = createForm({ onSubmit })
    form.registerField('foo', () => {})
    form.registerField('foo2', () => {})

    form.change('foo', 'bar')
    form.change('foo2', 'baz')

    const onSubmitReplacement = jest.fn()
    form.setConfig('onSubmit', onSubmitReplacement)
    expect(onSubmit).not.toHaveBeenCalled()
    expect(onSubmitReplacement).not.toHaveBeenCalled()
    form.submit()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(onSubmitReplacement.mock.calls[0][0]).toEqual({
      foo: 'bar',
      foo2: 'baz'
    })
  })

  it('should update validate on setConfig("validate", fn)', () => {
    const onSubmit = jest.fn()
    const form = createForm({
      onSubmit,
      validate: values => {
        const errors = {}
        if (!values.username) {
          errors.username = 'Required'
        }
        return errors
      }
    })
    const username = jest.fn()
    form.registerField('username', username, { error: true })
    expect(username).toHaveBeenCalledTimes(1)
    expect(username.mock.calls[0][0].error).toBe('Required')

    expect(onSubmit).not.toHaveBeenCalled()
    form.submit()
    expect(onSubmit).not.toHaveBeenCalled()

    form.setConfig('validate', () => ({}))

    // username is no longer required
    expect(username).toHaveBeenCalledTimes(2)
    expect(username.mock.calls[1][0].error).toBe(undefined)

    // form is valid now, so submit should work
    expect(onSubmit).not.toHaveBeenCalled()
    form.submit()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0].username).toBe(undefined)
  })

  it('should replace validateOnBlur on setConfig("validateOnBlur", value)', () => {
    const validate = jest.fn(values => {
      const errors = {}
      if (!values.foo) {
        errors.foo = 'Required'
      }
      return errors
    })
    const form = createForm({
      onSubmit: onSubmitMock,
      validate,
      validateOnBlur: false
    })

    expect(validate).toHaveBeenCalledTimes(1)

    const spy = jest.fn()
    form.registerField('foo', spy, { error: true })

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].error).toBe('Required')
    expect(validate).toHaveBeenCalledTimes(2)

    form.setConfig('validateOnBlur', true)

    form.focus('foo')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(validate).toHaveBeenCalledTimes(2) // not called on focus
    form.change('foo', 'typing')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(validate).toHaveBeenCalledTimes(2)
    form.blur('foo')
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].error).toBeUndefined()
    expect(validate).toHaveBeenCalledTimes(3) // called on blur

    form.setConfig('validateOnBlur', false)

    form.focus('foo')
    expect(spy).toHaveBeenCalledTimes(2)
    expect(validate).toHaveBeenCalledTimes(3) // not called on focus
    form.change('foo', 'typing something else')
    expect(spy).toHaveBeenCalledTimes(2)
    expect(validate).toHaveBeenCalledTimes(4) // called on change because we set validateOnBlur=false
    form.blur('foo')
    expect(spy).toHaveBeenCalledTimes(2)
    expect(validate).toHaveBeenCalledTimes(4) // not called on blur
  })

  it('should throw on unknown names', () => {
    const form = createForm({
      onSubmit: onSubmitMock
    })
    expect(() => {
      form.setConfig('whatever', false)
    }).toThrowError('Unrecognised option whatever')
  })

  it('should respect keepDirtyOnReinitialize on reinitalize', () => {
    const form = createForm({
      onSubmit: onSubmitMock,
      keepDirtyOnReinitialize: true,
      initialValues: {
        foo: 'bar'
      }
    })
    const spy = jest.fn()
    form.registerField('foo', spy, { initial: true, value: true })

    // should initialize with initial value
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].initial).toBe('bar')
    expect(spy.mock.calls[0][0].value).toBe('bar')

    form.reset()

    // same initial value, duh
    expect(spy).toHaveBeenCalledTimes(1)

    spy.mock.calls[0][0].change('baz')

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].initial).toBe('bar')
    expect(spy.mock.calls[1][0].value).toBe('baz')

    form.setConfig('initialValues', { foo: 'bax' })

    // new initial value, but same old dirty value
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].initial).toBe('bax')
    expect(spy.mock.calls[2][0].value).toBe('baz')
  })

  it('should respect keepDirtyOnReinitialize on reinitalize, even if no initial values', () => {
    const form = createForm({
      onSubmit: onSubmitMock,
      keepDirtyOnReinitialize: true
    })
    const spy = jest.fn()
    form.registerField('foo', spy, { initial: true, value: true })

    // should initialize with initial value
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].initial).toBeUndefined()
    expect(spy.mock.calls[0][0].value).toBeUndefined()

    spy.mock.calls[0][0].change('baz')

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].initial).toBeUndefined()
    expect(spy.mock.calls[1][0].value).toBe('baz')

    form.setConfig('initialValues', { foo: 'bax' })

    // new initial value, but same old dirty value
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].initial).toBe('bax')
    expect(spy.mock.calls[2][0].value).toBe('baz')
  })

  it('should update keepDirtyOnReinitialize on setConfig("keepDirtyOnReinitialize", value)', () => {
    const form = createForm({
      onSubmit: onSubmitMock,
      initialValues: {
        foo: 'bar'
      }
    })
    const spy = jest.fn()
    form.registerField('foo', spy, { initial: true, value: true })

    // should initialize with initial value
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].initial).toBe('bar')
    expect(spy.mock.calls[0][0].value).toBe('bar')

    form.reset()

    // same initial value, duh
    expect(spy).toHaveBeenCalledTimes(1)

    spy.mock.calls[0][0].change('baz')

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].initial).toBe('bar')
    expect(spy.mock.calls[1][0].value).toBe('baz')

    form.setConfig('initialValues', { foo: 'bax' })

    // new initial value, and value overwritten
    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].initial).toBe('bax')
    expect(spy.mock.calls[2][0].value).toBe('bax')

    // flip flag
    form.setConfig('keepDirtyOnReinitialize', true)

    // no update
    expect(spy).toHaveBeenCalledTimes(3)

    spy.mock.calls[0][0].change('dog')

    expect(spy).toHaveBeenCalledTimes(4)
    expect(spy.mock.calls[3][0].initial).toBe('bax')
    expect(spy.mock.calls[3][0].value).toBe('dog')

    form.setConfig('initialValues', { foo: 'cat' })

    // new initial value, but same old dirty value
    expect(spy).toHaveBeenCalledTimes(5)
    expect(spy.mock.calls[4][0].initial).toBe('cat')
    expect(spy.mock.calls[4][0].value).toBe('dog')
  })

  it('should update destroyOnUnregister on setConfig("destroyOnUnregister", value)', () => {
    const form = createForm({ onSubmit: onSubmitMock })

    const spy = jest.fn()
    form.subscribe(spy, { values: true })
    const foo = jest.fn()
    const foz = jest.fn()
    const unregisterFoo = form.registerField('foo', foo, { value: true })
    const unregisterFoz = form.registerField('foz', foz, { value: true })

    // should initialize with initial value
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].values).toEqual({})
    expect(foo).toHaveBeenCalledTimes(1)
    expect(foo.mock.calls[0][0].value).toBeUndefined()
    expect(foz).toHaveBeenCalledTimes(1)
    expect(foz.mock.calls[0][0].value).toBeUndefined()

    form.change('foo', 'bar')

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].values).toEqual({ foo: 'bar' })
    expect(foo).toHaveBeenCalledTimes(2)
    expect(foo.mock.calls[1][0].value).toBe('bar')
    expect(foz).toHaveBeenCalledTimes(1)

    form.change('foz', 'baz')

    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].values).toEqual({ foo: 'bar', foz: 'baz' })
    expect(foo).toHaveBeenCalledTimes(2)
    expect(foz).toHaveBeenCalledTimes(2)
    expect(foz.mock.calls[1][0].value).toBe('baz')

    unregisterFoo()

    // No one notified
    expect(spy).toHaveBeenCalledTimes(3)
    expect(foo).toHaveBeenCalledTimes(2)
    expect(foz).toHaveBeenCalledTimes(2)

    form.setConfig('destroyOnUnregister', true)

    unregisterFoz()

    // foz deleted
    expect(spy).toHaveBeenCalledTimes(4)
    expect(spy.mock.calls[3][0].values).toEqual({ foo: 'bar' })
    expect(foo).toHaveBeenCalledTimes(2)
    expect(foz).toHaveBeenCalledTimes(2) // but field not notified
  })
})
