export function dispatch (name, detail = null) {
  const event = new CustomEvent(`beebrowse:${name}`, clone({ detail }))
  document.dispatchEvent(event)
}

function clone (object) {
  if (Object.hasOwn(globalThis, 'cloneInto')) {
    return globalThis.cloneInto(object, document.defaultView)
  } else {
    return object
  }
}
