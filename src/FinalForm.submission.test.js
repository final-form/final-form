import createForm from './FinalForm'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

describe('FinalForm.submission', () => {
  it('should not submit if form has validation errors', () => {
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
    const password = jest.fn()
    form.registerField('username', username, { error: true })
    form.registerField('password', password, { touched: true })
    expect(username).toHaveBeenCalledTimes(1)
    expect(username.mock.calls[0][0].error).toBe('Required')
    expect(password).toHaveBeenCalledTimes(1)
    expect(password.mock.calls[0][0].touched).toBe(false)

    const { change } = username.mock.calls[0][0]

    expect(onSubmit).not.toHaveBeenCalled()
    form.submit()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(password).toHaveBeenCalledTimes(2)
    expect(password.mock.calls[1][0].touched).toBe(true)

    change('erikras')

    // form is valid now, so submit should work
    expect(onSubmit).not.toHaveBeenCalled()
    form.submit()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toBeDefined()
    expect(onSubmit.mock.calls[0][0].username).toBe('erikras')
  })

  it('should not submit if form has validation errors, even on non-registered fields', () => {
    const onSubmit = jest.fn()
    const form = createForm({
      onSubmit,
      validate: values => {
        const errors = {}
        if (!values.username) {
          errors.username = 'Required'
        }
        if (!values.password) {
          errors.password = 'Required'
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
  })

  it('should call onSubmit when form.submit() is called', () => {
    const onSubmit = jest.fn()
    const form = createForm({ onSubmit })
    form.registerField('foo', () => {})
    form.registerField('foo2', () => {})

    form.change('foo', 'bar')
    form.change('foo2', 'baz')

    expect(onSubmit).not.toHaveBeenCalled()
    form.submit()
    expect(onSubmit.mock.calls[0][0]).toEqual({ foo: 'bar', foo2: 'baz' })
  })

  it('should support synchronous submission with errors', () => {
    const onSubmit = jest.fn(values => {
      const errors = {}
      if (values.foo === 'bar') {
        errors.foo = 'Sorry, "bar" is an illegal value'
      }
      return errors
    })
    const form = createForm({ onSubmit })
    const spy = jest.fn()
    expect(spy).not.toHaveBeenCalled()
    form.subscribe(spy, {
      valid: true,
      submitSucceeded: true,
      submitFailed: true
    })
    form.registerField('foo', () => {})
    form.registerField('foo2', () => {})

    expect(spy).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith({
      valid: true,
      submitSucceeded: false,
      submitFailed: false
    })

    form.change('foo', 'bar')
    form.change('foo2', 'baz')

    expect(spy).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()

    form.submit()

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toEqual({ foo: 'bar', foo2: 'baz' })

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy).toHaveBeenCalledWith({
      valid: false,
      submitSucceeded: false,
      submitFailed: true
    })

    form.change('foo', 'notbar')
    form.submit()

    expect(onSubmit).toHaveBeenCalledTimes(2)
    expect(onSubmit.mock.calls[0][0]).toEqual({ foo: 'bar', foo2: 'baz' })

    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy).toHaveBeenCalledWith({
      valid: true,
      submitSucceeded: true,
      submitFailed: false
    })
  })

  it('should support synchronous submission with errors via callback', () => {
    const onSubmit = jest.fn((values, callback) => {
      const errors = {}
      if (values.foo === 'bar') {
        errors.foo = 'Sorry, "bar" is an illegal value'
      }
      callback(errors)
    })
    const form = createForm({ onSubmit })
    const spy = jest.fn()
    expect(spy).not.toHaveBeenCalled()
    form.subscribe(spy, {
      valid: true,
      submitSucceeded: true,
      submitFailed: true
    })
    form.registerField('foo', () => {})
    form.registerField('foo2', () => {})

    expect(spy).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith({
      valid: true,
      submitSucceeded: false,
      submitFailed: false
    })

    form.change('foo', 'bar')
    form.change('foo2', 'baz')

    expect(spy).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()

    form.submit()

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toEqual({ foo: 'bar', foo2: 'baz' })

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy).toHaveBeenCalledWith({
      valid: false,
      submitSucceeded: false,
      submitFailed: true
    })

    form.change('foo', 'notbar')
    form.submit()

    expect(onSubmit).toHaveBeenCalledTimes(2)
    expect(onSubmit.mock.calls[0][0]).toEqual({ foo: 'bar', foo2: 'baz' })

    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy).toHaveBeenCalledWith({
      valid: true,
      submitSucceeded: true,
      submitFailed: false
    })
  })

  it('should support asynchronous submission with errors via callback', async () => {
    const onSubmit = jest.fn((values, callback) => {
      setTimeout(() => {
        const errors = {}
        if (values.foo === 'bar') {
          errors.foo = 'Sorry, "bar" is an illegal value'
        }
        callback(errors)
      }, 2) // no need to wait too long!
    })
    const form = createForm({ onSubmit })
    const spy = jest.fn()
    expect(spy).not.toHaveBeenCalled()
    form.subscribe(spy, {
      valid: true,
      submitSucceeded: true,
      submitFailed: true
    })
    form.registerField('foo', () => {})
    form.registerField('foo2', () => {})

    expect(spy).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith({
      valid: true,
      submitSucceeded: false,
      submitFailed: false
    })

    form.change('foo', 'bar')
    form.change('foo2', 'baz')

    expect(spy).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()

    await form.submit()

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toEqual({ foo: 'bar', foo2: 'baz' })

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy).toHaveBeenCalledWith({
      valid: false,
      submitSucceeded: false,
      submitFailed: true
    })

    form.change('foo', 'notbar')
    const promise = form.submit()

    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy).toHaveBeenCalledWith({
      valid: true,
      submitSucceeded: false,
      submitFailed: false
    })

    await promise

    expect(onSubmit).toHaveBeenCalledTimes(2)
    expect(onSubmit.mock.calls[0][0]).toEqual({ foo: 'bar', foo2: 'baz' })

    expect(spy).toHaveBeenCalledTimes(4)
    expect(spy).toHaveBeenCalledWith({
      valid: true,
      submitSucceeded: true,
      submitFailed: false
    })
  })

  it('should support asynchronous submission with errors via promise', async () => {
    const onSubmit = jest.fn(async values => {
      await sleep(2) // no need to wait too long!
      const errors = {}
      if (values.foo === 'bar') {
        errors.foo = 'Sorry, "bar" is an illegal value'
      }
      return errors
    })
    const form = createForm({ onSubmit })
    const spy = jest.fn()
    expect(spy).not.toHaveBeenCalled()
    form.subscribe(spy, {
      valid: true,
      submitSucceeded: true,
      submitFailed: true
    })
    form.registerField('foo', () => {})
    form.registerField('foo2', () => {})

    expect(spy).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith({
      valid: true,
      submitSucceeded: false,
      submitFailed: false
    })

    form.change('foo', 'bar')
    form.change('foo2', 'baz')

    expect(spy).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()

    await form.submit()

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toEqual({ foo: 'bar', foo2: 'baz' })

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy).toHaveBeenCalledWith({
      valid: false,
      submitSucceeded: false,
      submitFailed: true
    })

    form.change('foo', 'notbar')
    const promise = form.submit()

    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy).toHaveBeenCalledWith({
      valid: true,
      submitSucceeded: false,
      submitFailed: false
    })

    expect(onSubmit).toHaveBeenCalledTimes(2)
    expect(onSubmit.mock.calls[0][0]).toEqual({ foo: 'bar', foo2: 'baz' })

    await promise

    expect(spy).toHaveBeenCalledTimes(4)
    expect(spy).toHaveBeenCalledWith({
      valid: true,
      submitSucceeded: true,
      submitFailed: false
    })
  })
})
