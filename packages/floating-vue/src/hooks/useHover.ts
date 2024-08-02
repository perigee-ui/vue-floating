import { type MaybeRefOrGetter, type UnwrapRef, computed, toValue, watchEffect } from 'vue'
import { isElement } from '@floating-ui/utils/dom'
import { contains, getDocument, isMouseLikePointerType } from '../utils.ts'
import type { ElementProps, FloatingContext, OpenChangeReason } from '../types'
import { createAttribute } from '../utils/createAttribute.ts'

export interface HandleCloseFn {
  (
    context: {
      x: UnwrapRef<FloatingContext['x']>
      y: UnwrapRef<FloatingContext['y']>
      placement: UnwrapRef<FloatingContext['placement']>
      elements: {
        domReference: UnwrapRef<FloatingContext['elements']['domReference']>
        floating: UnwrapRef<FloatingContext['elements']['floating']>
      }
      onClose: () => void
      // tree?: FloatsingTreeType | null
      leave?: boolean
    },
  ): (event: MouseEvent) => void
  __options: {
    blockPointerEvents: boolean
  }
}

export interface UseHoverProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: MaybeRefOrGetter<boolean>
  /**
   * Instead of closing the floating element when the cursor leaves its
   * reference, we can leave it open until a certain condition is satisfied,
   * e.g. to let them traverse into the floating element.
   * @default undefined
   */
  handleClose?: HandleCloseFn | undefined
  /**
   * Waits until the user’s cursor is at “rest” over the reference element
   * before changing the `open` state.
   * @default 0
   */
  restMs?: number
  /**
   * Waits for the specified time when the event listener runs before changing
   * the `open` state.
   * @default 0
   */
  delay?: number
  | { open?: number | (() => number), close?: number | (() => number) }
  | (() => { open?: number, close?: number } | number)
  /**
   * Whether the logic only runs for mouse input, ignoring touch input.
   * Note: due to a bug with Linux Chrome, "pen" inputs are considered "mouse".
   * @default false
   */
  mouseOnly?: boolean
  /**
   * Whether moving the cursor over the floating element will open it, without a
   * regular hover event required.
   * @default true
   */
  move?: boolean
}

const safePolygonIdentifier = createAttribute('safe-polygon')

export function useHover(context: FloatingContext, props: UseHoverProps = {}): () => ElementProps | undefined {
  const {
    open,
    dataRef,
    onOpenChange,
    events,
    elements,
  } = context
  const {
    delay = 0,
    handleClose = undefined,
    mouseOnly = false,
    restMs = 0,
    move = true,
  } = props

  const enabled = computed(() => toValue(props.enabled ?? true))

  // const tree: any = undefined

  let pointerTypeRef: string | undefined
  let timeoutRef = -1
  let handlerRef: ((event: MouseEvent) => void) | undefined
  let restTimeoutRef = -1
  let blockMouseMoveRef = true
  let performedPointerEventsMutationRef = false
  let unbindMousemoveRef = () => { }

  function isHoverOpen() {
    const type = dataRef.openEvent?.type
    return type?.includes('mouse') && type !== 'mousedown'
  }

  // When closing before opening, clear the delay timeouts to cancel it
  // from showing.
  watchEffect((onCleanup) => {
    if (!open.value)
      return

    function onOpenChange({ open }: { open: boolean }) {
      if (!open) {
        clearTimeout(timeoutRef)
        clearTimeout(restTimeoutRef)
        blockMouseMoveRef = true
      }
    }

    events.on('openchange', onOpenChange)

    onCleanup(() => {
      events.off('openchange', onOpenChange)
    })
  })

  watchEffect((onCleanup) => {
    if (!enabled.value)
      return
    if (!handleClose)
      return
    if (!open.value)
      return

    function onLeave(event: MouseEvent) {
      if (isHoverOpen()) {
        onOpenChange(false, event, 'hover')
      }
    }

    const html = getDocument(elements.floating.value).documentElement
    html.addEventListener('mouseleave', onLeave)

    onCleanup(() => {
      html.removeEventListener('mouseleave', onLeave)
    })
  })

  function closeWithDelay(event: Event, runElseBranch = true, reason: OpenChangeReason = 'hover') {
    const closeDelay = toValue(getDelay(delay, 'close', pointerTypeRef))
    if (closeDelay && !handlerRef) {
      clearTimeout(timeoutRef)
      timeoutRef = window.setTimeout(
        () => onOpenChange(false, event, reason),
        closeDelay,
      )
    }
    else if (runElseBranch) {
      clearTimeout(timeoutRef)
      onOpenChange(false, event, reason)
    }
  }

  function cleanupMousemoveHandler() {
    unbindMousemoveRef()
    handlerRef = undefined
  }

  function clearPointerEvents() {
    if (!performedPointerEventsMutationRef)
      return

    const body = getDocument(elements.floating.value).body
    body.style.pointerEvents = ''
    body.removeAttribute(safePolygonIdentifier)
    performedPointerEventsMutationRef = false
  }

  // Registering the mouse events on the reference directly to bypass React's
  // delegation system. If the cursor was on a disabled element and then entered
  // the reference (no gap), `mouseenter` doesn't fire in the delegation system.
  watchEffect((onCleanup) => {
    if (!enabled.value)
      return

    const openVal = open.value

    if (!isElement(elements.domReference.value))
      return

    function isClickLikeOpenEvent() {
      return dataRef.openEvent
        ? ['click', 'mousedown'].includes(dataRef.openEvent.type)
        : false
    }

    function onMouseenter(event: MouseEvent) {
      clearTimeout(timeoutRef)
      blockMouseMoveRef = false

      if ((mouseOnly && !isMouseLikePointerType(pointerTypeRef)) || (restMs > 0 && !toValue(getDelay(props.delay, 'open'))))
        return

      const openDelay = toValue(getDelay(props.delay, 'open', pointerTypeRef))

      if (openDelay) {
        timeoutRef = window.setTimeout(() => {
          if (!openVal) {
            onOpenChange(true, event, 'hover')
          }
        }, openDelay)
      }
      else {
        onOpenChange(true, event, 'hover')
      }
    }

    function onMouseleave(event: MouseEvent) {
      if (isClickLikeOpenEvent())
        return

      unbindMousemoveRef()

      const doc = getDocument(elements.floating.value)
      clearTimeout(restTimeoutRef)

      if (handleClose && dataRef.floatingContext) {
        // Prevent clearing `onScrollMouseLeave` timeout.
        if (!openVal) {
          clearTimeout(timeoutRef)
        }

        handlerRef = handleClose({
          // tree,
          x: event.clientX,
          y: event.clientY,
          placement: dataRef.floatingContext.placement.value,
          elements: {
            domReference: elements.domReference.value,
            floating: elements.floating.value,
          },
          onClose() {
            clearPointerEvents()
            cleanupMousemoveHandler()
            closeWithDelay(event, true, 'safe-polygon')
          },
        })

        const handler = handlerRef

        doc.addEventListener('mousemove', handler)
        unbindMousemoveRef = () => {
          doc.removeEventListener('mousemove', handler)
        }

        return
      }

      // Allow interactivity without `safePolygon` on touch devices. With a
      // pointer, a short close delay is an alternative, so it should work
      // consistently.
      const shouldClose = pointerTypeRef === 'touch'
        ? !contains(elements.floating.value, event.relatedTarget as Element | null)
        : true
      if (shouldClose) {
        closeWithDelay(event)
      }
    }

    // Ensure the floating element closes after scrolling even if the pointer
    // did not move.
    // https://github.com/floating-ui/floating-ui/discussions/1692
    function onScrollMouseleave(event: MouseEvent) {
      if (isClickLikeOpenEvent())
        return

      if (!dataRef.floatingContext)
        return

      handleClose?.({
        // tree,
        x: event.clientX,
        y: event.clientY,
        placement: dataRef.floatingContext.placement.value,
        elements: {
          domReference: elements.domReference.value,
          floating: elements.floating.value,
        },
        onClose() {
          clearPointerEvents()
          cleanupMousemoveHandler()
          closeWithDelay(event)
        },
      })(event)
    }

    const ref = elements.domReference.value as unknown as HTMLElement
    if (openVal)
      ref.addEventListener('mouseleave', onScrollMouseleave)
    elements.floating.value?.addEventListener('mouseleave', onScrollMouseleave)
    if (move)
      ref.addEventListener('mousemove', onMouseenter, { once: true })
    ref.addEventListener('mouseenter', onMouseenter)
    ref.addEventListener('mouseleave', onMouseleave)

    onCleanup(() => {
      if (openVal)
        ref.removeEventListener('mouseleave', onScrollMouseleave)
      elements.floating.value?.removeEventListener('mouseleave', onScrollMouseleave)
      if (move)
        ref.removeEventListener('mousemove', onMouseenter)
      ref.removeEventListener('mouseenter', onMouseenter)
      ref.removeEventListener('mouseleave', onMouseleave)
    })
  })

  // Block pointer-events of every element other than the reference and floating
  // while the floating element is open and has a `handleClose` handler. Also
  // handles nested floating elements.
  // https://github.com/floating-ui/floating-ui/issues/1722
  watchEffect((onCleanup) => {
    if (!enabled.value)
      return

    if (!open.value || !handleClose?.__options.blockPointerEvents || !isHoverOpen())
      return
    const floatingEl = elements.floating.value
    const body = getDocument(floatingEl).body
    body.setAttribute(safePolygonIdentifier, '')
    body.style.pointerEvents = 'none'
    performedPointerEventsMutationRef = true

    if (!isElement(elements.domReference.value) || !floatingEl)
      return

    const ref = elements.domReference.value as unknown as HTMLElement | SVGSVGElement

    // const parentFloating = tree?.nodesRef.current.find(
    //   (node) => node.id === parentId,
    // )?.context?.elements.floating;

    // if (parentFloating) {
    //   parentFloating.style.pointerEvents = '';
    // }

    ref.style.pointerEvents = 'auto'
    floatingEl.style.pointerEvents = 'auto'

    onCleanup(() => {
      ref.style.pointerEvents = ''
      floatingEl.style.pointerEvents = ''
    })
  })

  watchEffect(() => {
    if (!open.value) {
      pointerTypeRef = undefined
      cleanupMousemoveHandler()
      clearPointerEvents()
    }
  })

  watchEffect((onCleanup) => {
    // eslint-disable-next-line ts/no-unused-expressions
    enabled.value ? elements.domReference.value : undefined

    onCleanup(() => {
      cleanupMousemoveHandler()
      clearTimeout(timeoutRef)
      clearTimeout(restTimeoutRef)
      clearPointerEvents()
    })
  })

  function setPointerRef(event: PointerEvent) {
    pointerTypeRef = event.pointerType
  }

  const referenceProps: ElementProps['reference'] = {
    onPointerdown: setPointerRef,
    onPointerenter: setPointerRef,
    onMousemove(event) {
      function handleMouseMove() {
        if (!blockMouseMoveRef && !open.value) {
          onOpenChange(true, event, 'hover')
        }
      }

      if (mouseOnly && !isMouseLikePointerType(pointerTypeRef))
        return

      if (open.value || restMs === 0)
        return

      clearTimeout(restTimeoutRef)

      if (pointerTypeRef === 'touch')
        handleMouseMove()
      else
        restTimeoutRef = window.setTimeout(handleMouseMove, restMs)
    },
  }

  const floatingProps: ElementProps['floating'] = {
    onMouseenter() {
      clearTimeout(timeoutRef)
    },
    onMouseleave(event) {
      closeWithDelay(event, false)
    },
  }

  return () => enabled.value ? { reference: referenceProps, floating: floatingProps } : undefined
}

export function getDelay(
  value: UseHoverProps['delay'],
  prop: 'open' | 'close',
  pointerType?: PointerEvent['pointerType'],
) {
  if (pointerType && !isMouseLikePointerType(pointerType))
    return 0

  if (typeof value === 'function') {
    return getDelay(value(), prop, pointerType)
  }

  if (typeof value === 'number')
    return value

  return value?.[prop]
}
