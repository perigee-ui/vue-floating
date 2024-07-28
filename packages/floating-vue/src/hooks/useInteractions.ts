import type { ElAttrs, ElementProps } from '../types'

const ACTIVE_KEY = 'active'
const SELECTED_KEY = 'selected'

export interface ExtendedUserProps {
  [ACTIVE_KEY]?: boolean
  [SELECTED_KEY]?: boolean
}

type Props = () => ElementProps | void

const EXCLUDE_ITEM_KEYS = new Set([ACTIVE_KEY, SELECTED_KEY])

function mergeProps(
  userProps: Record<string, any> | undefined,
  propsList: Array<Props>,
  elementKey: 'reference' | 'floating' | 'item',
): Record<string, unknown> {
  const map = new Map<string, Array<(...args: unknown[]) => void>>()
  const isItem = elementKey === 'item'

  let domUserProps = userProps
  if (isItem && userProps) {
    const { [ACTIVE_KEY]: _, [SELECTED_KEY]: __, ...validProps } = userProps
    domUserProps = validProps
  }

  const mergedProps: Record<string, unknown> = {
    ...(elementKey === 'floating' && { tabIndex: -1 }),
    ...domUserProps,
  }

  const mergedPropsList = propsList
    .map((getVal) => {
      const value = getVal()
      const propsOrGetProps = value ? value[elementKey] : null

      if (typeof propsOrGetProps === 'function')
        return userProps ? propsOrGetProps(userProps) : null

      return propsOrGetProps
    }).concat(userProps)

  for (const props of mergedPropsList) {
    if (!props)
      continue

    for (const [key, value] of Object.entries(props)) {
      if (isItem && EXCLUDE_ITEM_KEYS.has(key))
        continue

      if (key.startsWith('on')) {
        if (typeof value !== 'function')
          continue

        if (!map.has(key))
          map.set(key, [])

        map.get(key)?.push(value)

        mergedProps[key] = (...args: unknown[]) => {
          let ret: unknown
          const fns = map.get(key)

          if (!fns)
            return undefined

          for (const fn of fns) {
            const result = fn(...args)

            if (ret === undefined && result !== undefined)
              ret = result
          }

          return ret
        }
      }
      else {
        mergedProps[key] = value
      }
    }
  }

  return mergedProps
}

/**
 * Merges an array of interaction hooks' props into prop getters, allowing
 * event handler functions to be composed together without overwriting one
 * another.
 * @see https://floating-ui.com/docs/useInteractions
 */
export function useInteractions(propsList: Array<Props> = []) {
  function getReferenceProps(userProps: ElAttrs = {}) {
    return mergeProps(userProps, propsList, 'reference')
  }

  function getFloatingProps(userProps: ElAttrs = {}) {
    return mergeProps(userProps, propsList, 'floating')
  }

  function getItemProps(userProps: ElAttrs = {}) {
    return mergeProps(userProps, propsList, 'item')
  }

  return { getReferenceProps, getFloatingProps, getItemProps }
}
