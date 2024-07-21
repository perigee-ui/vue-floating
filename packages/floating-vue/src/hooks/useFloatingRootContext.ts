import { type Ref, computed, shallowRef } from 'vue'
import type { ContextData, FloatingRootContext, OpenChangeReason, ReferenceElement } from '../types'
import { createPubSub } from '../utils/createPubSub.ts'
import { useId } from './useId.ts'

export interface UseFloatingRootContextOptions {
  open?: Ref<boolean>
  onOpenChange?: (
    open: boolean,
    event?: Event,
    reason?: OpenChangeReason,
  ) => void
  elements?: {
    reference?: Ref<Element | undefined>
    floating?: Ref<HTMLElement | undefined>
  }
}

export function useFloatingRootContext(options: UseFloatingRootContextOptions): FloatingRootContext {
  const {
    open = shallowRef(false),
    onOpenChange: onOpenChangeProp,
    elements: elementsProp = {},
  } = options

  const {
    reference: referenceProp = shallowRef(undefined),
    floating: floatingProp = shallowRef(undefined),
  } = elementsProp

  const floatingId = useId()
  const dataRef = <ContextData>({})
  const events = createPubSub()
  // const nested = useFloatingParentNodeId() != null;
  const nested = false

  const positionReference = shallowRef<ReferenceElement | undefined>(referenceProp.value)

  const refs = {
    setPositionReference(node: ReferenceElement | undefined) {
      positionReference.value = node
    },
  }

  function onOpenChange(open: boolean, event?: Event, reason?: OpenChangeReason) {
    dataRef.openEvent = open ? event : undefined
    events.emit('openchange', { open, event, reason, nested })
    onOpenChangeProp?.(open, event, reason)
  }

  const elements = {
    reference: computed(() => positionReference.value || referenceProp.value || undefined),
    floating: floatingProp,
    domReference: referenceProp,
  }

  return {
    dataRef,
    open,
    onOpenChange,
    elements,
    events,
    floatingId,
    refs,
  }
}
