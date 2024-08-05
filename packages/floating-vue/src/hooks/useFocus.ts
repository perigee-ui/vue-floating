import { getWindow, isElement, isHTMLElement } from '@floating-ui/utils/dom'
import { type MaybeRefOrGetter, onScopeDispose, toValue, watchEffect } from 'vue'
import {
  activeElement,
  contains,
  getDocument,
  getTarget,
  isMac,
  isSafari,
  isTypeableElement,
  isVirtualPointerEvent,
} from '../utils.ts'

import type {
  ElementProps,
  FloatingRootContext,
  OpenChangeReason,
} from '../types'
import { createAttribute } from '../utils/createAttribute.ts'

export interface UseFocusProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: MaybeRefOrGetter<boolean>
  /**
   * Whether the open state only changes if the focus event is considered
   * visible (`:focus-visible` CSS selector).
   * @default true
   */
  visibleOnly?: boolean
}

/**
 * Opens the floating element while the reference element has focus, like CSS
 * `:focus`.
 * @see https://floating-ui.com/docs/useFocus
 */
export function useFocus(
  context: FloatingRootContext,
  props: UseFocusProps = {},
): () => ElementProps | undefined {
  const { open, onOpenChange, events, dataRef, elements } = context
  const { enabled = true, visibleOnly = true } = props

  let blockFocusRef = false
  let timeoutRef: number
  let keyboardModalityRef = true

  watchEffect((onCleanup) => {
    if (!toValue(enabled))
      return

    const win = getWindow(elements.domReference.value)

    // If the reference was focused and the user left the tab/window, and the
    // floating element was not open, the focus should be blocked when they
    // return to the tab/window.
    function onBlur() {
      if (
        !toValue(open)
        && isHTMLElement(elements.domReference.value)
        && elements.domReference.value
        === activeElement(getDocument(elements.domReference.value))
      ) {
        blockFocusRef = true
      }
    }

    function onKeyDown() {
      keyboardModalityRef = true
    }

    win.addEventListener('blur', onBlur)
    win.addEventListener('keydown', onKeyDown, true)

    onCleanup(() => {
      win.removeEventListener('blur', onBlur)
      win.removeEventListener('keydown', onKeyDown, true)
    })
  })

  watchEffect((onCleanup) => {
    if (!toValue(enabled))
      return

    function onOpenChange({ reason }: { reason: OpenChangeReason }) {
      if (reason === 'reference-press' || reason === 'escape-key')
        blockFocusRef = true
    }

    events.on('openchange', onOpenChange)

    onCleanup(() => {
      events.off('openchange', onOpenChange)
    })
  })

  onScopeDispose(() => {
    clearTimeout(timeoutRef)
  })

  const referenceProps: ElementProps['reference'] = {
    onPointerdown(event) {
      if (isVirtualPointerEvent(event))
        return
      keyboardModalityRef = false
    },
    onMouseleave() {
      blockFocusRef = false
    },
    onFocus(event) {
      if (blockFocusRef)
        return

      const target = getTarget(event)

      if (visibleOnly && isElement(target)) {
        try {
          // Mac Safari unreliably matches `:focus-visible` on the reference
          // if focus was outside the page initially - use the fallback
          // instead.
          if (isSafari() && isMac())
            throw new Error('isMac')
          if (!target.matches(':focus-visible'))
            return
        }
        catch {
          // Old browsers will throw an error when using `:focus-visible`.
          if (!keyboardModalityRef && !isTypeableElement(target))
            return
        }
      }

      onOpenChange(true, event, 'focus')
    },
    onBlur(event) {
      blockFocusRef = false
      const relatedTarget = event.relatedTarget
      const nativeEvent = event

      // Hit the non-modal focus management portal guard. Focus will be
      // moved into the floating element immediately after.
      const movedToFocusGuard = isElement(relatedTarget)
        && relatedTarget.hasAttribute(createAttribute('focus-guard'))
        && relatedTarget.getAttribute('data-type') === 'outside'

      // Wait for the window blur listener to fire.
      timeoutRef = window.setTimeout(() => {
        const activeEl = activeElement(elements.domReference.value ? elements.domReference.value.ownerDocument : document)

        // Focus left the page, keep it open.
        if (!relatedTarget && activeEl === elements.domReference.value)
          return

        // When focusing the reference element (e.g. regular click), then
        // clicking into the floating element, prevent it from hiding.
        // Note: it must be focusable, e.g. `tabindex="-1"`.
        // We can not rely on relatedTarget to point to the correct element
        // as it will only point to the shadow host of the newly focused element
        // and not the element that actually has received focus if it is located
        // inside a shadow root.
        if (
          contains(dataRef.floatingContext?.refs.floating.current, activeEl)
          || contains(elements.domReference.value, activeEl)
          || movedToFocusGuard
        ) {
          return
        }

        onOpenChange(false, nativeEvent, 'focus')
      })
    },
  }

  return () => toValue(enabled) ? { reference: referenceProps } : undefined
}
