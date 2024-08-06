import { type MaybeRefOrGetter, computed, shallowRef, watchEffect } from 'vue'
import { isElement } from '@floating-ui/utils/dom'
import { type ReferenceType, useFloating as usePosition } from '../core/index.ts'
import type {
  ExtendedElements,
  ExtendedRefs,
  FloatingContext,
  NarrowedElement,
  UseFloatingCofnig,
  UseFloatingOptions,
  UseFloatingReturn,
} from '../types.ts'
import { useRef } from '../vue/index.ts'
import { useFloatingRootContext } from './useFloatingRootContext.ts'

/**
 * Computes the `x` and `y` coordinates that will place the floating element next to a reference element when it is given a certain CSS positioning strategy.
 * @param options The floating options.
 * @param config The floating configuration.
 */
export function useFloating<RT extends ReferenceType = ReferenceType>(
  options: UseFloatingOptions,
  config: MaybeRefOrGetter<UseFloatingCofnig> = {},
): UseFloatingReturn<RT> {
  const { nodeId } = options

  const rootContext = options.rootContext || useFloatingRootContext(options)
  const computedElements = rootContext.elements

  const _domReference = shallowRef<NarrowedElement<RT>>()
  const positionReference = shallowRef<ReferenceType>()

  const domReferenceRef = useRef<NarrowedElement<RT>>()
  const domReference = shallowRef<NarrowedElement<RT>>()

  watchEffect(() => {
    const ret = (computedElements?.reference.value || _domReference.value) as NarrowedElement<RT>
    if (ret)
      domReferenceRef.current = ret
    domReference.value = ret
  })

  const position = usePosition(
    {
      ...options,
      elements: {
        reference: computed(() => positionReference.value || computedElements.reference.value),
        floating: computedElements.floating,
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
    // Store the positionReference in state if the DOM reference is specified externally via the
    // `elements.reference` option. This ensures that it won't be overridden on future renders.
    // positionReference.value = computedPositionReference
    position.refs.setReference(computedPositionReference)
  }

  function setReference(node: RT | undefined) {
    if (isElement(node) || node == null) {
      domReferenceRef.current = (node || undefined) as NarrowedElement<RT> | undefined
      _domReference.value = (node || undefined) as NarrowedElement<RT> | undefined
    }

    // Backwards-compatibility for passing a virtual element to `reference`
    // after it has set the DOM reference.
    if (
      isElement(position.refs.reference.current) || position.refs.reference.current == null
      // Don't allow setpositionReference.valueting virtual elements using the old technique back to
      // `null` to support `positionReference` + an unstable `reference`
      // callback ref.
      || (node != null && !isElement(node))
    ) {
      position.refs.setReference(node)
    }
  }

  const refs: ExtendedRefs<RT> = {
    ...position.refs,
    setReference,
    setPositionReference,
    domReference: domReferenceRef,
  }

  const elements: ExtendedElements<RT> = {
    ...position.elements,
    domReference,
  }

  const context: FloatingContext<RT> = {
    ...position,
    ...rootContext,
    refs,
    elements,
    nodeId,
  }

  watchEffect(() => {
    rootContext.dataRef.floatingContext = context as unknown as FloatingContext

    // const node = tree?.nodesRef.current.find((node) => node.id === nodeId);
    // if (node) {
    //   node.context = context;
    // }
  }, {
    flush: 'sync',
  })

  return {
    ...position,
    context,
    refs,
    elements,
  }
}
