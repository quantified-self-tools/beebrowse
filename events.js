import { clone } from './util'

export function dispatch (name, detail = null) {
  const event = new CustomEvent(`beebrowse:${name}`, clone({ detail }))
  document.dispatchEvent(event)
}
