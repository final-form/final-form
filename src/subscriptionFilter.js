// @flow
export default function<T: { [string]: any }>(
  dest: T,
  src: T,
  previous: ?T,
  subscription: { [string]: boolean },
  keys: string[]
): boolean {
  let different = false
  keys.forEach(key => {
    if (subscription[key]) {
      dest[key] = src[key]
      if (!previous || src[key] !== previous[key]) {
        different = true
      }
    }
  })
  return different
}
