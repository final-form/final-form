// @flow
const keysCache: {[string]: string[]} = {}
const keysRegex = /[.[\]]+/;

const toPath = (key: string): string[] => {
  if (key === null || key === undefined || !key.length) {
    return []
  }
  if (typeof key !== 'string') {
    throw new Error('toPath() expects a string')
  }
  if(keysCache[key] == null) {
    keysCache[key] = key.split(keysRegex).filter(Boolean)
  }
  return keysCache[key];
}

export default toPath
