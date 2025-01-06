import type { ElementProps, FloatingRootContext } from '../types.ts'
import type { MutableRefObject } from '../vue/index.ts'
import { type MaybeRefOrGetter, type Ref, toValue, watchEffect } from 'vue'
import { stopEvent } from '../utils.ts'

export interface UseTypeaheadProps {
  /**
   * A ref which contains an array of strings whose indices match the HTML
   * elements of the list.
   * @default empty list
   */
  listRef: MutableRefObject<Array<string | undefined>>
  /**
   * The index of the active (focused or highlighted) item in the list.
   * @default undefined
   */
  activeIndex?: Ref<number | undefined>
  /**
   * Callback invoked with the matching index if found as the user types.
   */
  onMatch?: (index: number) => void
  /**
   * Callback invoked with the typing state as the user types.
   */
  onTypingChange?: (isTyping: boolean) => void
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: MaybeRefOrGetter<boolean>
  /**
   * A function that returns the matching string from the list.
   * @default lowercase-finder
   */
  findMatch?: | undefined | ((list: Array<string | undefined>, typedString: string,) => string | undefined | undefined)
  /**
   * The number of milliseconds to wait before resetting the typed string.
   * @default 750
   */
  resetMs?: number
  /**
   * An array of keys to ignore when typing.
   * @default []
   */
  ignoreKeys?: Array<string>
  /**
   * The index of the selected item in the list, if available.
   * @default undefined
   */
  selectedIndex?: Ref<number | undefined>
}

/**
 * Provides a matching callback that can be used to focus an item as the user
 * types, often used in tandem with `useListNavigation()`.
 * @see https://floating-ui.com/docs/useTypeahead
 */
export function useTypeahead(
  context: FloatingRootContext,
  props: UseTypeaheadProps,
): () => ElementProps | undefined {
  const { open, dataRef } = context
  const {
    enabled = true,
    activeIndex,
    onMatch,
    onTypingChange,
    findMatch = undefined,
    resetMs = 750,
    ignoreKeys = [],
    selectedIndex = undefined,
  } = props

  let timeoutIdRef: ReturnType<typeof setTimeout> | undefined
  let stringRef = ''
  let prevIndexRef: number | undefined = selectedIndex?.value ?? activeIndex?.value ?? -1
  let matchIndexRef: number | undefined

  watchEffect(() => {
    if (toValue(open)) {
      clearTimeout(timeoutIdRef)
      matchIndexRef = undefined
      stringRef = ''
    }
  })

  watchEffect(() => {
    // Sync arrow key navigation but not typeahead navigation.
    if (toValue(open) && stringRef === '')
      prevIndexRef = selectedIndex?.value ?? activeIndex?.value ?? -1
  })

  function setTypingChange(value: boolean) {
    if (value) {
      if (!dataRef.typing) {
        dataRef.typing = value
        onTypingChange?.(value)
      }
    }
    else {
      if (dataRef.typing) {
        dataRef.typing = value
        onTypingChange?.(value)
      }
    }
  }

  function onKeydown(event: KeyboardEvent) {
    function getMatchingIndex(list: Array<string | undefined>, orderedList: Array<string | undefined>, string: string) {
      const str = findMatch
        ? findMatch(orderedList, string)
        : orderedList.find(text => text?.toLocaleLowerCase().indexOf(string.toLocaleLowerCase()) === 0)

      return str ? list.indexOf(str) : -1
    }

    const listContent = props.listRef.current

    if (stringRef.length > 0 && stringRef[0] !== ' ') {
      if (getMatchingIndex(listContent, listContent, stringRef) === -1) {
        setTypingChange(false)
      }
      else if (event.key === ' ') {
        stopEvent(event)
      }
    }

    if (
      listContent == null
      || ignoreKeys.includes(event.key)
      // Character key.
      || event.key.length !== 1
      // Modifier key.
      || event.ctrlKey
      || event.metaKey
      || event.altKey
    ) {
      return
    }

    if (open && event.key !== ' ') {
      stopEvent(event)
      setTypingChange(true)
    }

    // Bail out if the list contains a word like "llama" or "aaron". TODO:
    // allow it in this case, too.
    const allowRapidSuccessionOfFirstLetter = listContent.every(text =>
      text ? text[0]?.toLocaleLowerCase() !== text[1]?.toLocaleLowerCase() : true,
    )

    // Allows the user to cycle through items that start with the same letter
    // in rapid succession.
    if (allowRapidSuccessionOfFirstLetter && stringRef === event.key) {
      stringRef = ''
      prevIndexRef = matchIndexRef
    }

    stringRef += event.key
    clearTimeout(timeoutIdRef)
    timeoutIdRef = setTimeout(() => {
      stringRef = ''
      prevIndexRef = matchIndexRef
      setTypingChange(false)
    }, resetMs)

    const prevIndex = prevIndexRef

    const index = getMatchingIndex(
      listContent,
      [
        ...listContent.slice((prevIndex || 0) + 1),
        ...listContent.slice(0, (prevIndex || 0) + 1),
      ],
      stringRef,
    )

    if (index !== -1) {
      onMatch?.(index)
      matchIndexRef = index
    }
    else if (event.key !== ' ') {
      stringRef = ''
      setTypingChange(false)
    }
  }

  const reference: ElementProps['reference'] = {
    onKeydown,
  }

  const floating: ElementProps['floating'] = {
    onKeydown,
    onKeyup(event) {
      if (event.key === ' ') {
        setTypingChange(false)
      }
    },
  }

  return () => toValue(enabled) ? { reference, floating } : undefined
}
