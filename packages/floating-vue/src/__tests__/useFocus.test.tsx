import { afterEach, beforeEach, vi } from 'vitest'

beforeEach(() => {
  vi.useFakeTimers()

  customElements.define(
    'render-root',
    class RenderRoot extends HTMLElement {
      constructor() {
        super()
        this.attachShadow({ mode: 'open' }).appendChild(
          document.createElement('div'),
        )
      }
    },
  )
})

afterEach(() => {
  vi.useRealTimers()
})
