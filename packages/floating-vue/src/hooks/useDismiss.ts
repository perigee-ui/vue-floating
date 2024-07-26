import { computed, toValue, watchEffect } from 'vue'
import {
  getComputedStyle,
  getParentNode,
  isElement,
  isHTMLElement,
  isLastTraversableNode,
} from '@floating-ui/utils/dom'
import { getOverflowAncestors } from '../core/index.ts'
import type { ElementProps, FloatingRootContext } from '../types.ts'
import {
  contains,
  getDocument,
  getTarget,
  isEventTargetWithin,
  isRootElement,
} from '../utils.ts'
import { createAttribute } from '../utils/createAttribute.ts'

const bubbleHandlerKeys = {
  pointerdown: 'onPointerdown',
  mousedown: 'onMousedown',
  click: 'onClick',
} as const

const captureHandlerKeys = {
  pointerdown: 'onPointerdownCapture',
  mousedown: 'onMousedownCapture',
  click: 'onClickCapture',
} as const

export interface UseDismissProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: boolean
  /**
   * Whether to dismiss the floating element upon pressing the `esc` key.
   * @default true
   */
  escapeKey?: boolean
  /**
   * Whether to dismiss the floating element upon pressing the reference
   * element. You likely want to ensure the `move` option in the `useHover()`
   * Hook has been disabled when this is in use.
   * @default false
   */
  referencePress?: boolean
  /**
   * The type of event to use to determine a “press”.
   * - `pointerdown` is eager on both mouse + touch input.
   * - `mousedown` is eager on mouse input, but lazy on touch input.
   * - `click` is lazy on both mouse + touch input.
   * @default 'pointerdown'
   */
  referencePressEvent?: 'pointerdown' | 'mousedown' | 'click'
  /**
   * Whether to dismiss the floating element upon pressing outside of the
   * floating element.
   * If you have another element, like a toast, that is rendered outside the
   * floating element’s React tree and don’t want the floating element to close
   * when pressing it, you can guard the check like so:
   * ```jsx
   * useDismiss(context, {
   *   outsidePress: (event) => !event.target.closest('.toast'),
   * });
   * ```
   * @default true
   */
  outsidePress?: boolean | ((event: MouseEvent) => boolean)
  /**
   * The type of event to use to determine an outside “press”.
   * - `pointerdown` is eager on both mouse + touch input.
   * - `mousedown` is eager on mouse input, but lazy on touch input.
   * - `click` is lazy on both mouse + touch input.
   * @default 'pointerdown'
   */
  outsidePressEvent?: 'pointerdown' | 'mousedown' | 'click'
  /**
   * Whether to dismiss the floating element upon scrolling an overflow
   * ancestor.
   * @default false
   */
  ancestorScroll?: boolean
  /**
   * Determines whether event listeners bubble upwards through a tree of
   * floating elements.
   */
  bubbles?: boolean | { escapeKey?: boolean, outsidePress?: boolean }
  /**
   * Determines whether to use capture phase event listeners.
   */
  capture?: boolean | { escapeKey?: boolean, outsidePress?: boolean }
}

/**
 * Closes the floating element when a dismissal is requested — by default, when
 * the user presses the `escape` key or outside of the floating element.
 * @see https://floating-ui.com/docs/useDismiss
 */
export function useDismiss(
  context: FloatingRootContext,
  props: UseDismissProps = {},
) {
  const { open, onOpenChange, elements, dataRef } = context

  const {
    escapeKey = true,
    outsidePress = true,
    outsidePressEvent = 'pointerdown',
    referencePress = false,
    referencePressEvent = 'pointerdown',
    ancestorScroll = false,
    bubbles,
    capture,
  } = props

  const enabled = computed(() => toValue(props.enabled ?? true))

  // const tree = useFloatingTree();
  // const tree = null

  let insideReactTreeRef = false
  let endedOrStartedInsideRef = false

  const { escapeKey: escapeKeyBubbles, outsidePress: outsidePressBubbles } = normalizeProp(bubbles)
  const { escapeKey: escapeKeyCapture, outsidePress: outsidePressCapture } = normalizeProp(capture)

  function closeOnEscapeKeydown(event: KeyboardEvent) {
    if (!open.value || !enabled.value || !escapeKey || event.key !== 'Escape')
      return

    // const nodeId = dataRef.floatingContext?.nodeId

    // const children = tree ? getChildren(tree.nodesRef.current, nodeId) : []
    // const children: any[] = []

    if (!escapeKeyBubbles) {
      event.stopPropagation()

      // if (children.length > 0) {
      //   let shouldDismiss = true

      //   children.forEach((child) => {
      //     if (
      //       child.context?.open
      //       && !child.context.dataRef.current.__escapeKeyBubbles
      //     ) {
      //       shouldDismiss = false
      //     }
      //   })

      //   if (!shouldDismiss) {
      //     return
      //   }
      // }
    }

    onOpenChange(
      false,
      event,
      'escape-key',
    )
  }

  function closeOnEscapeKeydownCapture(event: KeyboardEvent) {
    const callback = () => {
      closeOnEscapeKeydown(event)
      getTarget(event)?.removeEventListener('keydown', callback)
    }
    getTarget(event)?.addEventListener('keydown', callback)
  }

  function closeOnPressOutside(event: MouseEvent) {
    // Given developers can stop the propagation of the synthetic event,
    // we can only be confident with a positive value.
    const insideReactTree = insideReactTreeRef
    insideReactTreeRef = false

    // When click outside is lazy (`click` event), handle dragging.
    // Don't close if:
    // - The click started inside the floating element.
    // - The click ended inside the floating element.
    const endedOrStartedInside = endedOrStartedInsideRef
    endedOrStartedInsideRef = false

    if (outsidePressEvent === 'click' && endedOrStartedInside)
      return

    if (insideReactTree)
      return

    if (typeof outsidePress === 'function' && !outsidePress(event))
      return

    const target = getTarget(event)
    const inertSelector = `[${createAttribute('inert')}]`
    const markers = getDocument(elements.floating.value).querySelectorAll(
      inertSelector,
    )

    let targetRootAncestor = isElement(target) ? target : null
    while (targetRootAncestor && !isLastTraversableNode(targetRootAncestor)) {
      const nextParent = getParentNode(targetRootAncestor)
      if (isLastTraversableNode(nextParent) || !isElement(nextParent)) {
        break
      }

      targetRootAncestor = nextParent
    }

    // Check if the click occurred on a third-party element injected after the
    // floating element rendered.
    if (
      markers.length
      && isElement(target)
      && !isRootElement(target)
      // Clicked on a direct ancestor (e.g. FloatingOverlay).
      && !contains(target, elements.floating.value)
      // If the target root element contains none of the markers, then the
      // element was injected after the floating element rendered.
      && Array.from(markers).every(
        marker => !contains(targetRootAncestor, marker),
      )
    ) {
      return
    }

    // Check if the click occurred on the scrollbar
    if (isHTMLElement(target) && elements.floating.value) {
      // In Firefox, `target.scrollWidth > target.clientWidth` for inline
      // elements.
      const canScrollX
        = target.clientWidth > 0 && target.scrollWidth > target.clientWidth
      const canScrollY
        = target.clientHeight > 0 && target.scrollHeight > target.clientHeight

      let xCond = canScrollY && event.offsetX > target.clientWidth

      // In some browsers it is possible to change the <body> (or window)
      // scrollbar to the left side, but is very rare and is difficult to
      // check for. Plus, for modal dialogs with backdrops, it is more
      // important that the backdrop is checked but not so much the window.
      if (canScrollY) {
        const isRTL = getComputedStyle(target).direction === 'rtl'

        if (isRTL) {
          xCond = event.offsetX <= target.offsetWidth - target.clientWidth
        }
      }

      if (xCond || (canScrollX && event.offsetY > target.clientHeight)) {
        return
      }
    }

    // const nodeId = dataRef.floatingContext?.nodeId;

    // const targetIsInsideChildren =
    //   tree &&
    //   getChildren(tree.nodesRef.current, nodeId).some((node) =>
    //     isEventTargetWithin(event, node.context?.elements.floating),
    //   );
    const targetIsInsideChildren = undefined

    if (
      isEventTargetWithin(event, elements.floating.value)
      || isEventTargetWithin(event, elements.domReference.value)
      || targetIsInsideChildren
    ) {
      return
    }

    // const children = tree ? getChildren(tree.nodesRef.current, nodeId) : [];
    // if (children.length > 0) {
    //   let shouldDismiss = true;

    //   children.forEach((child) => {
    //     if (
    //       child.context?.open &&
    //       !child.context.dataRef.current.__outsidePressBubbles
    //     ) {
    //       shouldDismiss = false;
    //       return;
    //     }
    //   });

    //   if (!shouldDismiss) {
    //     return;
    //   }
    // }

    onOpenChange(false, event, 'outside-press')
  }

  function closeOnPressoutsideCapture(event: MouseEvent) {
    const callback = () => {
      closeOnPressOutside(event)
      getTarget(event)?.removeEventListener(outsidePressEvent, callback)
    }
    getTarget(event)?.addEventListener(outsidePressEvent, callback)
  }

  watchEffect((onCleanup) => {
    if (!open.value || !enabled.value) {
      return
    }

    dataRef.__escapeKeyBubbles = escapeKeyBubbles
    dataRef.__outsidePressBubbles = outsidePressBubbles

    function onScroll(event: Event) {
      onOpenChange(false, event, 'ancestor-scroll')
    }

    const doc = getDocument(elements.floating.value)
    if (escapeKey) {
      doc.addEventListener(
        'keydown',
        escapeKeyCapture ? closeOnEscapeKeydownCapture : closeOnEscapeKeydown,
        escapeKeyCapture,
      )
    }
    if (outsidePress) {
      doc.addEventListener(
        outsidePressEvent,
        outsidePressCapture ? closeOnPressoutsideCapture : closeOnPressOutside,
        outsidePressCapture,
      )
    }

    let ancestors: (Element | Window | VisualViewport)[] = []

    if (ancestorScroll) {
      if (isElement(elements.domReference)) {
        ancestors = getOverflowAncestors(elements.domReference)
      }

      if (isElement(elements.floating)) {
        ancestors = ancestors.concat(getOverflowAncestors(elements.floating))
      }

      if (
        !isElement(elements.reference.value)
        && elements.reference.value
        && elements.reference.value.contextElement
      ) {
        ancestors = ancestors.concat(
          getOverflowAncestors(elements.reference.value.contextElement),
        )
      }
    }

    // Ignore the visual viewport for scrolling dismissal (allow pinch-zoom)
    ancestors = ancestors.filter(
      ancestor => ancestor !== doc.defaultView?.visualViewport,
    )

    ancestors.forEach((ancestor) => {
      ancestor.addEventListener('scroll', onScroll, { passive: true })
    })

    onCleanup(() => {
      if (escapeKey) {
        doc.removeEventListener(
          'keydown',
          escapeKeyCapture ? closeOnEscapeKeydownCapture : closeOnEscapeKeydown,
          escapeKeyCapture,
        )
      }

      if (outsidePress) {
        doc.removeEventListener(
          outsidePressEvent,
          outsidePressCapture ? closeOnPressoutsideCapture : closeOnPressOutside,
          outsidePressCapture,
        )
      }

      ancestors.forEach((ancestor) => {
        ancestor.removeEventListener('scroll', onScroll)
      })
    })
  })

  // TODO::ad
  // watch(
  //   [outsidePress, outsidePressEvent],
  //   () => {
  //     insideReactTreeRef = false
  //   },
  //   { immediate: true },
  // )

  const referenceProps: ElementProps['reference'] = {
    onKeyDown: closeOnEscapeKeydown,
    [bubbleHandlerKeys[referencePressEvent]]: (event: Event) => {
      if (referencePress)
        onOpenChange(false, event, 'reference-press')
    },
  }

  const floatingProps: ElementProps['floating'] = {
    onKeyDown: closeOnEscapeKeydown,
    onMouseDown() {
      endedOrStartedInsideRef = true
    },
    onMouseUp() {
      endedOrStartedInsideRef = true
    },
    [captureHandlerKeys[outsidePressEvent]]: () => {
      insideReactTreeRef = true
    },
  }

  return () => enabled.value ? { reference: referenceProps, floating: floatingProps } : undefined
}

export function normalizeProp(normalizable?: boolean | { escapeKey?: boolean, outsidePress?: boolean }) {
  return {
    escapeKey:
      typeof normalizable === 'boolean'
        ? normalizable
        : normalizable?.escapeKey ?? false,
    outsidePress:
      typeof normalizable === 'boolean'
        ? normalizable
        : normalizable?.outsidePress ?? true,
  }
}
