// tslint:disable no-console

import { Config, createForm } from './index'

const onSubmit: Config['onSubmit'] = (values, callback) => {}

let form = createForm({ onSubmit })

console.log(form.getState().initialValues as { [key: string]: any })
console.log(form.getState().values as { [key: string]: any })

const initialValues: Config['initialValues'] = {
  a: 'a',
  b: true,
  c: 1
}

form = createForm({ onSubmit, initialValues })

console.log(form.getState().pristine as boolean)
console.log(form.getState().dirty as boolean)
