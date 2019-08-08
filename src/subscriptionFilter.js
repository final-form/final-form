// @flow
import shallowEqual from './shallowEqual'
export default function<T: { [string]: any }>(
  dest: T,
  src: T,
  previous: ?T,
  subscription: { [string]: boolean },
  keys: string[],
  shallowEqualKeys: string[]
): boolean {
  let different = false
  keys.forEach(key => {
    if (subscription[key]) {
      dest[key] = src[key]
      if (!previous) {
        different = true
      } else if (
        ~shallowEqualKeys.indexOf(key) &&
        !shallowEqual(src[key], previous[key])
      ) {
        different = true
      } else if (
        ~['values', 'value'].indexOf(key) &&
        'object' === typeof subscription[key]
      ) {
        different = checkDiffByShape(src[key], previous[key], subscription[key])
      } else if (src[key] !== previous[key]) {
        different = true
      }
    }
  })
  return different
}

function checkDiffByShape(a, b, shape) {
  if (!a || !b) {
    return a !== b
  }
  let different = false
  Object.keys(shape).forEach(k => {
    if (different) {
      return
    }
    if ('object' === typeof shape[k]) {
      different = different || checkDiffByShape(a[k], b[k], shape[k])
    } else {
      different = different || !shallowEqual(a[k], b[k])
    }
  })
  return different
}
