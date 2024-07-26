import { isHTMLElement } from '@floating-ui/utils/dom'
import { type MaybeRefOrGetter, computed, toValue } from 'vue'
import { isMouseLikePointerType, isTypeableElement } from '../utils.ts'
import type { ElementProps, FloatingRootContext } from '../types'

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
   * When `useHover()` and `useClick()` are used together, clicking the
   * reference element after hovering it will keep the floating element open
   * even once the cursor leaves. This may be not be desirable in some cases.
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
}

export function useClick(
  context: FloatingRootContext,
  props: UseClickProps = {},
) {
  const {
    open,
    onOpenChange,
    dataRef,
    elements: { domReference },
  } = context

  const {
    event: eventOption = 'click',
    toggle = true,
    ignoreMouse = false,
    keyboardHandlers = true,
  } = props

  const enabled = computed(() => toValue(props.enabled ?? true))

  let pointerTypeRef: 'mouse' | 'pen' | 'touch' | undefined
  let didKeyDownRef = false

  const referenceProps: ElementProps['reference'] = {
    onPointerdown(event: PointerEvent) {
      pointerTypeRef = event.pointerType as 'mouse' | 'pen' | 'touch'
    },
    onMousedown(event: MouseEvent) {
      const pointerType = pointerTypeRef

      // Ignore all buttons except for the "main" button.
      // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
      if (event.button !== 0)
        return
      if (eventOption === 'click')
        return
      if (isMouseLikePointerType(pointerType, true) && ignoreMouse)
        return

      if (
        open
        && toggle
        && (dataRef.openEvent
          ? dataRef.openEvent.type === 'mousedown'
          : true)
      ) {
        onOpenChange(false, event, 'click')
      }
      else {
        // Prevent stealing focus from the floating element
        event.preventDefault()
        onOpenChange(true, event, 'click')
      }
    },
    onClick(event: Event) {
      const pointerType = pointerTypeRef

      if (eventOption === 'mousedown' && pointerTypeRef) {
        pointerTypeRef = undefined
        return
      }

      if (isMouseLikePointerType(pointerType, true) && ignoreMouse)
        return

      if (
        open
        && toggle
        && (dataRef.openEvent
          ? dataRef.openEvent.type === 'click'
          : true)
      ) {
        onOpenChange(false, event, 'click')
      }
      else {
        onOpenChange(true, event, 'click')
      }
    },
    onKeydown(event: KeyboardEvent) {
      pointerTypeRef = undefined

      if (
        event.defaultPrevented
        || !keyboardHandlers
        || isButtonTarget(event)
      ) {
        return
      }

      if (event.key === ' ' && !isSpaceIgnored(domReference.value)) {
        // Prevent scrolling
        event.preventDefault()
        didKeyDownRef = true
      }

      if (event.key === 'Enter') {
        if (open && toggle) {
          onOpenChange(false, event, 'click')
        }
        else {
          onOpenChange(true, event, 'click')
        }
      }
    },
    onKeyup(event: KeyboardEvent) {
      if (
        event.defaultPrevented
        || !keyboardHandlers
        || isButtonTarget(event)
        || isSpaceIgnored(domReference.value)
      ) {
        return
      }

      if (event.key === ' ' && didKeyDownRef) {
        didKeyDownRef = false
        if (open && toggle) {
          onOpenChange(false, event, 'click')
        }
        else {
          onOpenChange(true, event, 'click')
        }
      }
    },
  }

  return () => enabled.value ? referenceProps : undefined
}

function isButtonTarget(event: KeyboardEvent) {
  return isHTMLElement(event.target) && event.target.tagName === 'BUTTON'
}

function isSpaceIgnored(element: Element | null | undefined) {
  return isTypeableElement(element)
}
