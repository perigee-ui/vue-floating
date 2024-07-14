import { isFunction } from '@vue/shared'
import type { ElementProps } from '../types'

type Props = () => ElementProps | void

function mergeProps(
  userProps: Record<string, any> | undefined,
  propsList: Array<Props>,
  elementKey: 'reference' | 'floating' | 'item',
): Record<string, unknown> {
  const map = new Map<string, Array<(...args: unknown[]) => void>>()

  return {
    ...(elementKey === 'floating' && { tabIndex: -1 }),
    ...userProps,
    ...propsList
      .map((getVal) => {
        const value = getVal()
        return value ? value[elementKey] : undefined
      })

      .concat(userProps)
      .reduce((acc: Record<string, unknown>, props) => {
        if (!props) {
          return acc
        }

        Object.entries(props).forEach(([key, value]) => {
          if (key.indexOf('on') === 0) {
            if (!map.has(key)) {
              map.set(key, [])
            }

            if (isFunction(value)) {
              map.get(key)?.push(value)

              acc[key] = (...args: unknown[]) =>
                map
                  .get(key)
                  ?.map(fn => fn(...args))
                  .find(val => val !== undefined)
            }
          }
          else {
            acc[key] = value
          }
        })

        return acc
      }, {}),
  }
}

/**
 * Объединяет массив реквизитов интерактивных хуков в геттеры реквизитов, что позволяет
 * функции обработчика событий должны быть составлены вместе без перезаписи одной
 * другой.
 * @see https://floating-ui.com/docs/react#interaction-hooks
 */
export function useInteractions(propsList: Array<Props> = []) {
  // Зависимости представляют собой динамический массив, поэтому мы не можем использовать линтер
  // предложение добавить его в массив deps.

  function getReferenceProps(userProps: Record<string, any> | undefined = {}) {
    return mergeProps(userProps, propsList, 'reference')
  }

  function getFloatingProps(userProps: Record<string, any> | undefined = {}) {
    return mergeProps(userProps, propsList, 'floating')
  }

  function getItemProps(userProps: Record<string, any> = {}) {
    return mergeProps(userProps, propsList, 'item')
  }
  // Детально проверяйте изменения `item`, потому что метод получения `getItemProps`
  // должен быть как можно более стабильным с точки зрения ссылок, поскольку
  // он может быть передан в качестве реквизита многим компонентам.
  // Поэтому все значения ключей `item` должны быть запомнены.
  // propsList.map((key) => key?.item)

  return { getReferenceProps, getFloatingProps, getItemProps }
}
