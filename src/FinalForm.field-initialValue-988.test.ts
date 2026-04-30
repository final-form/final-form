import createForm from './FinalForm'

describe('FinalForm.field-initialValue (issue #988)', () => {
  it('should update form initialValues when field initialValue prop changes', () => {
    const form = createForm({ onSubmit: () => {} })
    const spy = jest.fn()
    const last = () => spy.mock.calls.at(-1)[0]
    form.subscribe(spy, { initialValues: true, values: true, dirty: true })
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].initialValues).toBeUndefined()
    expect(spy.mock.calls[0][0].values).toEqual({})
    expect(spy.mock.calls[0][0].dirty).toBe(false)

    // Register field with initialValue="A"
    const unsubscribe = form.registerField(
      'myField',
      () => {},
      {},
      { initialValue: 'A' }
    )

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].initialValues).toEqual({ myField: 'A' })
    expect(spy.mock.calls[1][0].values).toEqual({ myField: 'A' })
    expect(spy.mock.calls[1][0].dirty).toBe(false)

    // User changes value to "B"
    form.change('myField', 'B')

    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[2][0].initialValues).toEqual({ myField: 'A' })
    expect(spy.mock.calls[2][0].values).toEqual({ myField: 'B' })
    expect(spy.mock.calls[2][0].dirty).toBe(true)

    // Field re-registers with new initialValue="B" (simulating prop change after submit)
    unsubscribe()
    form.registerField(
      'myField',
      () => {},
      {},
      { initialValue: 'B' }
    )

    // BUG FIX: initialValues should now be updated to "B"
    // and dirty should be false since value matches new initialValue
    expect(last().initialValues).toEqual({ myField: 'B' })
    expect(last().values).toEqual({ myField: 'B' })
    expect(last().dirty).toBe(false)
  })

  it('should not overwrite user value when field initialValue prop changes', () => {
    const form = createForm({ onSubmit: () => {} })
    const spy = jest.fn()
    const last = () => spy.mock.calls.at(-1)[0]
    form.subscribe(spy, { initialValues: true, values: true, dirty: true })

    // Register field with initialValue="A"
    const unsubscribe = form.registerField(
      'myField',
      () => {},
      {},
      { initialValue: 'A' }
    )

    expect(last().values).toEqual({ myField: 'A' })

    // User changes value to "C" (different from both old and new initialValue)
    form.change('myField', 'C')

    expect(last().values).toEqual({ myField: 'C' })
    expect(last().dirty).toBe(true)

    // Field re-registers with new initialValue="B"
    unsubscribe()
    form.registerField(
      'myField',
      () => {},
      {},
      { initialValue: 'B' }
    )

    // Should update initialValues to "B" but NOT overwrite user's value "C"
    expect(last().initialValues).toEqual({ myField: 'B' })
    expect(last().values).toEqual({ myField: 'C' }) // User value preserved!
    expect(last().dirty).toBe(true) // Still dirty since C !== B
  })

  it('should handle radio button scenario from issue #988', () => {
    const form = createForm({ onSubmit: () => {} })
    const spy = jest.fn()
    const last = () => spy.mock.calls.at(-1)[0]
    form.subscribe(spy, { initialValues: true, values: true, dirty: true })

    // Register radio button field with initialValue="A"
    const unsubscribe = form.registerField(
      'section-one.radio-button',
      () => {},
      {},
      { initialValue: 'A' }
    )

    expect(last().values).toEqual({
      'section-one': { 'radio-button': 'A' }
    })
    expect(last().dirty).toBe(false)

    // User selects "B"
    form.change('section-one.radio-button', 'B')

    expect(last().values).toEqual({
      'section-one': { 'radio-button': 'B' }
    })
    expect(last().dirty).toBe(true)

    // After successful submit, field re-registers with initialValue="B"
    unsubscribe()
    form.registerField(
      'section-one.radio-button',
      () => {},
      {},
      { initialValue: 'B' }
    )

    // Form should no longer be dirty
    expect(last().initialValues).toEqual({
      'section-one': { 'radio-button': 'B' }
    })
    expect(last().values).toEqual({
      'section-one': { 'radio-button': 'B' }
    })
    expect(last().dirty).toBe(false) // ← THE FIX!
  })
})
