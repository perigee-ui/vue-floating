import { shallowRef, watch } from 'vue'
import { useFloatingListContet } from './FloatingList.ts'

export interface UseListItemProps {
  label?: string | undefined
}

// : {
// ref: (node: HTMLElement | null) => void
// index: number
// }

/**
 * Used to register a list item and its index (DOM position) in the
 * `FloatingList`.
 * @see https://floating-ui.com/docs/FloatingList#uselistitem
 */
export function useListItem(props: UseListItemProps = {}) {
  const { label } = props

  const { register, unregister, map, elementsRef, labelsRef } = useFloatingListContet('useListItem')

  const index = shallowRef<number>()

  const componentRef = shallowRef<HTMLElement | undefined>()

  const ref = (node: HTMLElement | undefined) => {
    componentRef.value = node

    const indexVal = index.value
    if (indexVal != null) {
      elementsRef.current[indexVal] = node
      if (labelsRef?.current) {
        const isLabelDefined = label != null
        labelsRef.current[indexVal] = isLabelDefined ? label : node?.textContent ?? undefined
      }
    }
  }

  watch(componentRef, (node, __, onCleanup) => {
    if (node) {
      register(node)

      onCleanup(() => {
        unregister(node)
      })
    }
  })

  watch(map, () => {
    const node = componentRef?.value

    const _index = node ? map.value.get(node) : undefined
    if (_index != null)
      index.value = _index
  })

  return {
    ref,
    index() {
      return index.value == null ? -1 : index.value
    },
  } as const
}
