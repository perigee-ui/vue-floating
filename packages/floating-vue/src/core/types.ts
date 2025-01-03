import type {
  ComputePositionConfig,
  ComputePositionReturn,
  VirtualElement,
} from '@floating-ui/dom'

import type { CSSProperties, MaybeRefOrGetter, Ref } from 'vue'
import type { MutableRefObject } from '../vue/index.ts'

export type { ArrowOptions } from './arrow'
export type {
  AlignedPlacement,
  Alignment,
  AutoPlacementOptions,
  AutoUpdateOptions,
  Axis,
  Boundary,
  ClientRectObject,
  ComputePositionConfig,
  ComputePositionReturn,
  Coords,
  Derivable,
  DetectOverflowOptions,
  Dimensions,
  ElementContext,
  ElementRects,
  Elements,
  FlipOptions,
  FloatingElement,
  HideOptions,
  InlineOptions,
  Length,
  Middleware,
  MiddlewareArguments,
  MiddlewareData,
  MiddlewareReturn,
  MiddlewareState,
  NodeScroll,
  OffsetOptions,
  Padding,
  Placement,
  Platform,
  Rect,
  ReferenceElement,
  RootBoundary,
  ShiftOptions,
  Side,
  SideObject,
  SizeOptions,
  Strategy,
  VirtualElement,
} from '@floating-ui/dom'

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {}

type ToRef<T> = {
  [P in keyof T]: Ref<T[P]>;
}

export type UseFloatingData = Prettify<ComputePositionReturn & { isPositioned: boolean }>

export type ReferenceType = Element | VirtualElement

export type UseFloatingReturn<RT extends ReferenceType> = Prettify<ToRef<UseFloatingData> & {
  /**
   * Update the position of the floating element, re-rendering the component
   * if required.
   */
  update: () => void
  /**
   * Pre-configured positioning styles to apply to the floating element.
   */
  floatingStyles: Ref<CSSProperties>
  /**
   * Object containing the reference and floating refs and reactive setters.
   */
  refs: {
    /**
     * A React ref to the reference element.
     */
    reference: MutableRefObject<ReferenceType | undefined>
    /**
     * A React ref to the floating element.
     */
    floating: MutableRefObject<HTMLElement | undefined>
    /**
     * A callback to set the reference element (reactive).
     */
    setReference: (node: RT | undefined) => void
    /**
     * A callback to set the floating element (reactive).
     */
    setFloating: (node: HTMLElement | undefined) => void
  }
  /**
   * Object containing the reference and floating elements.
   */
  elements: {
    reference: Ref<ReferenceType | undefined>
    floating: Ref<HTMLElement | undefined>
  }
}>

export type UseFloatingCofnig = ComputePositionConfig

export type UseFloatingOptions<RT extends ReferenceType = ReferenceType> = Prettify<{
  /**
   * The `open` state of the floating element to synchronize with the
   * `isPositioned` value.
   * @default false
   */
  open?: MaybeRefOrGetter<boolean>
  /**
   * A callback invoked when both the reference and floating elements are
   * mounted, and cleaned up when either is unmounted. This is useful for
   * setting up event listeners (e.g. pass `autoUpdate`).
   */
  whileElementsMounted?: (
    reference: RT,
    floating: HTMLElement,
    update: () => void,
  ) => () => void
  /**
   * Object containing the reference and floating elements.
   */
  elements?: {
    reference?: MaybeRefOrGetter<RT | undefined>
    floating?: Ref<HTMLElement | undefined>
  }
  /**
   * Whether to use `transform` for positioning instead of `top` and `left`
   * (layout) in the `floatingStyles` object.
   * @default false
   */
  transform?: boolean

  config?: MaybeRefOrGetter<UseFloatingCofnig>
}>
