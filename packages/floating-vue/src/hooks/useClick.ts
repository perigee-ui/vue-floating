import type { ElementProps, FloatingRootContext } from '../types'
import { isHTMLElement } from '@floating-ui/utils/dom'
import { type MaybeRefOrGetter, toValue } from 'vue'
import { isMouseLikePointerType, isTypeableElement } from '../utils.ts'

export interface UseClickProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: MaybeRefOrGetter<boolean>
  /**
   * The type of event to use to determine a “click” with mouse input.
   * Keyboard clicks work as normal.
   * @default 'click'
   */
  event?: 'click' | 'mousedown'
  /**
   * Whether to toggle the open state with repeated clicks.
   * @default true
   */
  toggle?: boolean
  /**
   * Whether to ignore the logic for mouse input (for example, if `useHover()`
   * is also being used).
   * @default false
   */
  ignoreMouse?: boolean
  /**
   * Whether to add keyboard handlers (Enter and Space key functionality) for
   * non-button elements (to open/close the floating element via keyboard
   * “click”).
   * @default true
   */
  keyboardHandlers?: boolean
  /**
   * If already open from another event such as the `useHover()` Hook,
   * determines whether to keep the floating element open when clicking the
   * reference element for the first time.
   * @default true
   */
  stickIfOpen?: boolean
}

function isButtonTarget(event: KeyboardEvent) {
  return isHTMLElement(event.target) && event.target.tagName === 'BUTTON'
}

const isSpaceIgnored = isTypeableElement

export function useClick(
  context: FloatingRootContext,
  props: UseClickProps = {},
): () => ElementProps | undefined {
  const {
    open,
    onOpenChange,
    dataRef,
    elements: { domReference },
  } = context

  const {
    enabled = true,
    event: eventOption = 'click',
    toggle = true,
    ignoreMouse = false,
    keyboardHandlers = true,
    stickIfOpen = true,
  } = props

  let pointerTypeRef: 'mouse' | 'pen' | 'touch' | undefined
  let didKeyDownRef = false
  let _key_open: boolean

  const referenceProps: ElementProps['reference'] = {
    onPointerdown(event) {
      pointerTypeRef = event.pointerType as 'mouse' | 'pen' | 'touch'
    },
    onMousedown(event) {
      if (eventOption === 'click')
        return

      const pointerType = pointerTypeRef

      // Ignore all buttons except for the "main" button.
      // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
      if (event.button !== 0)
        return

      if (isMouseLikePointerType(pointerType, true) && ignoreMouse)
        return

      if (toValue(open) && toggle && (dataRef.openEvent && stickIfOpen ? dataRef.openEvent.type === 'mousedown' : true)) {
        onOpenChange(false, event, 'click')
      }
      else {
        // Prevent stealing focus from the floating element
        event.preventDefault()
        onOpenChange(true, event, 'click')
      }
    },
    onClick(event) {
      const pointerType = pointerTypeRef

      if (eventOption === 'mousedown' && pointerTypeRef) {
        pointerTypeRef = undefined
        return
      }

      if (isMouseLikePointerType(pointerType, true) && ignoreMouse)
        return

      if (toValue(open) && toggle && (dataRef.openEvent && stickIfOpen ? dataRef.openEvent.type === 'click' : true))
        onOpenChange(false, event, 'click')
      else
        onOpenChange(true, event, 'click')
    },
    onKeydown(event) {
      pointerTypeRef = undefined

      if (event.defaultPrevented || !keyboardHandlers || isButtonTarget(event))
        return

      if (event.key === ' ' && !isSpaceIgnored(domReference.value)) {
        // Prevent scrolling
        event.preventDefault()
        didKeyDownRef = true
      }

      if (event.key !== 'Enter')
        return

      _key_open = toValue(open)
      if (_key_open && toggle)
        onOpenChange(false, event, 'click')
      else
        onOpenChange(true, event, 'click')
    },
    onKeyup(event) {
      if (event.defaultPrevented || !keyboardHandlers || isButtonTarget(event) || isSpaceIgnored(domReference.value))
        return

      if (event.key !== ' ' || !didKeyDownRef)
        return

      didKeyDownRef = false

      if (_key_open && toggle)
        onOpenChange(false, event, 'click')
      else
        onOpenChange(true, event, 'click')
    },
  }

  return () => toValue(enabled) ? { reference: referenceProps } : undefined
}
