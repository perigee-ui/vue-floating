import { shallowRef } from 'vue'
import { isElement } from '@floating-ui/utils/dom'
import { useFloating as usePosition } from '../core/index.ts'
import type {
  ContextData,
  FloatingContext,
  NarrowedElement,
  OpenChangeReason,
  ReferenceType,
  UseFloatingCofnig,
  UseFloatingOptions,
  UseFloatingReturn,
} from '../types.ts'
import { createPubSub } from '../utils/createPubSub.ts'

/**
 * Computes the `x` and `y` coordinates that will place the floating element next to a reference element when it is given a certain CSS positioning strategy.
 * @param options The floating options.
 * @param config The floating configuration.
 */
export function useFloating<RT extends ReferenceType = ReferenceType>(
  options: UseFloatingOptions,
  config: UseFloatingCofnig = {},
): UseFloatingReturn<RT> {
  const {
    elements: {
      floating,
    },
    // nodeId,
  } = options

  //   const internalRootContext = useFloatingRootContext({
  //     ...options,
  //     elements: {
  //       reference: null,
  //       floating: null,
  //       ...options.elements,
  //     },
  //   });

  // TODO: Add
  const domReference = shallowRef<NarrowedElement<RT>>()
  const positionReference = shallowRef<ReferenceType>()

  // () => positionReference.value ? positionReference.value : reference.value,
  const position = usePosition(
    {
      ...options,
      elements: {
        reference: positionReference,
        floating,
      },
    },
    config,
  )

  function setPositionReference(node: ReferenceType | undefined) {
    const computedPositionReference = isElement(node)
      ? {
          getBoundingClientRect: () => node.getBoundingClientRect(),
          contextElement: node,
        }
      : node
    // TODO:
    // Store the positionReference in state if the DOM reference is specified externally via the
    // `elements.reference` option. This ensures that it won't be overridden on future renders.
    positionReference.value = computedPositionReference
  }

  function setReference(node: RT | undefined) {
    if (isElement(node) || !node)
      domReference.value = (node || undefined) as NarrowedElement<RT> | undefined

    // Backwards-compatibility for passing a virtual element to `reference`
    // after it has set the DOM reference.
    if (
      isElement(positionReference.value)
      || !positionReference.value
      // Don't allow setting virtual elements using the old technique back to
      // `null` to support `positionReference` + an unstable `reference`
      // callback ref.
      || (node != null && !isElement(node))
    ) {
      positionReference.value = node
    }
  }

  const data: ContextData = {}
  const events = createPubSub()

  const onOpenChange = (open: boolean, event?: Event, reason?: OpenChangeReason) => {
    data.openEvent = open ? event : undefined
    events.emit('openchange', {
      open,
      event,
      reason,
    //   nested,
    })
    options.onOpenChange?.(open, event, reason)
  }

  const context: FloatingContext<RT> = {
    ...position,
    open: options.open ?? shallowRef(false),
    onOpenChange,
    events,
    elements: {
      reference: positionReference,
      floating,
      domReference,
    },
    data,
  }

  return {
    ...position,
    context,
    refs: {
      setPositionReference,
      setReference,
    },
  }
}
