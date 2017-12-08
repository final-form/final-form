// @flow
import toPath from './toPath'
import type { GetIn } from '../types'

const getIn: GetIn = (state: Object, complexKey: string): any => {
  // Intentionally using iteration rather than recursion
  const path = toPath(complexKey)
  let current: any = state
  for (let key of path) {
    if (
      current === undefined ||
      current === null ||
      typeof current !== 'object' ||
      (Array.isArray(current) && isNaN(key))
    ) {
      return undefined
    }
    current = current[key]
  }
  return current
}

export default getIn
