import createForm from './FinalForm'

const onSubmitMock = (values, callback) => {}

describe('FinalForm.mutators', () => {
  it('should allow mutators to mutate state', () => {
    const clear = jest.fn(([name], state, { changeValue }) => {
      changeValue(state, name, () => undefined)
    })
    const upper = jest.fn(([name], state, { changeValue }) => {
      changeValue(state, name, value => value && value.toUpperCase())
    })

    const form = createForm({
      onSubmit: onSubmitMock,
      mutators: { clear, upper }
    })
    expect(form.mutators).toBeDefined()
    expect(form.mutators.clear).toBeDefined()
    expect(typeof form.mutators.clear).toBe('function')
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
  })

  it('should allow changeValue to modify a non-registered field', () => {
    const upper = jest.fn(([name], state, { changeValue }) => {
      changeValue(state, name, value => value && value.toUpperCase())
    })

    const form = createForm({
      onSubmit: onSubmitMock,
      mutators: { upper }
    })
    const formListener = jest.fn()
    form.subscribe(formListener, { values: true })
    form.registerField('foo', () => {}, { value: true })

    expect(formListener).toHaveBeenCalledTimes(1)
    expect(formListener.mock.calls[0][0].values).toEqual({})

    form.change('foo', 'bar')

    expect(formListener).toHaveBeenCalledTimes(2)
    expect(formListener.mock.calls[1][0].values).toEqual({ foo: 'bar' })

    form.mutators.upper('nonexistent.field')

    expect(formListener).toHaveBeenCalledTimes(3)
    expect(formListener.mock.calls[2][0].values).toEqual({
      foo: 'bar',
      nonexistant: undefined
    })
    expect(Object.keys(formListener.mock.calls[2][0].values)).toEqual([
      'foo',
      'nonexistent'
    ])
  })
})
