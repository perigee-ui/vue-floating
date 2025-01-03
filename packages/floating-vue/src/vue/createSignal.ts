import { hasChanged, type IfAny } from '@vue/shared'
import { customRef, type Ref } from 'vue'

type Signal<T> = Ref<T> & { rawValue: T }

export function createSignal<T>(
  value: T,
): Ref extends T
  ? T extends Ref
    ? IfAny<T, Signal<T>, T>
    : Signal<T>
  : Signal<T>
export function createSignal<T = any>(): Signal<T | undefined>
export function createSignal(initialValue?: unknown) {
  let value = initialValue

  const proxy = customRef((track, trigger) => {
    return {
      get() {
        track()
        return value
      },
      set(newValue) {
        if (hasChanged(value, newValue)) {
          value = newValue
          trigger()
        }
      },
    }
  })

  Object.defineProperty(proxy, 'rawValue', {
    get: () => value,
    enumerable: true,
    configurable: true,
  })

  return proxy
}
