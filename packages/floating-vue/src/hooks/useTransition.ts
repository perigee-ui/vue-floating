import { type CSSProperties, type MaybeRefOrGetter, type Ref, computed, shallowRef, toValue, watch, watchEffect } from 'vue'
import type { FloatingContext, Placement, Side } from '../types.ts'
import type { ReferenceType } from '../core/types.ts'

export interface UseTransitionStatusProps {
  /**
   * The duration of the transition in milliseconds, or an object containing
   * `open` and `close` keys for different durations.
   */
  duration?: number | (() => number) | { open?: number | (() => number), close?: number | (() => number) }
}

export type TransitionStatus = 'unmounted' | 'initial' | 'open' | 'close'

/**
 * Provides a status string to apply CSS transitions to a floating element,
 * correctly handling placement-aware transitions.
 * @see https://floating-ui.com/docs/useTransition#usetransitionstatus
 */
export function useTransitionStatus<RT extends ReferenceType = ReferenceType>(
  context: FloatingContext<RT>,
  props: UseTransitionStatusProps = {},
): {
    isMounted: Ref<boolean>
    status: Ref<TransitionStatus>
  } {
  const {
    open,
    elements: { floating },
  } = context
  const { duration = 250 } = props

  const isNumberDuration = typeof duration === 'number'
  const isFunctionDuration = typeof duration === 'function'
  const closeDuration = (isNumberDuration || isFunctionDuration ? duration : duration.close) || 0

  const status = shallowRef<TransitionStatus>('unmounted')
  const isMounted = useDelayUnmount(open, closeDuration)

  watch([isMounted, status], ([mounted, currentStatus]) => {
    if (!mounted && currentStatus === 'close') {
      status.value = 'unmounted'
    }
  })

  watchEffect(async (onCleanup) => {
    if (!floating.value)
      return
    if (toValue(open)) {
      status.value = 'initial'

      const frame = requestAnimationFrame(() => {
        status.value = 'open'
      })

      onCleanup(() => {
        cancelAnimationFrame(frame)
      })
    }
    else {
      status.value = 'close'
    }
  })

  return {
    isMounted,
    status,
  }
}

type CSSStylesProperty =
  | CSSProperties
  | ((params: { side: Side, placement: Placement }) => CSSProperties)

export interface UseTransitionStylesProps extends UseTransitionStatusProps {
  /**
   * The styles to apply when the floating element is initially mounted.
   */
  initial?: CSSStylesProperty
  /**
   * The styles to apply when the floating element is transitioning to the
   * `open` state.
   */
  open?: CSSStylesProperty
  /**
   * The styles to apply when the floating element is transitioning to the
   * `close` state.
   */
  close?: CSSStylesProperty
  /**
   * The styles to apply to all states.
   */
  common?: CSSStylesProperty
}

/**
 * Provides styles to apply CSS transitions to a floating element, correctly
 * handling placement-aware transitions. Wrapper around `useTransitionStatus`.
 * @see https://floating-ui.com/docs/useTransition#usetransitionstyles
 */
export function useTransitionStyles<RT extends ReferenceType = ReferenceType>(
  context: FloatingContext<RT>,
  props: UseTransitionStylesProps = {},
): {
    isMounted: Ref<boolean>
    styles: Ref<CSSProperties>
  } {
  const {
    duration = 250,
  } = props
  const initial = () => props.initial ?? { opacity: 0 }

  const placement = context.placement
  const fnArgs = computed(() => ({ side: context.placement.value.split('-')[0] as Side, placement: placement.value }))
  const isNumberDuration = typeof duration === 'number'
  const isFunctionDuration = typeof duration === 'function'
  const openDuration = (isNumberDuration || isFunctionDuration ? duration : duration.open) || 0
  const closeDuration = (isNumberDuration || isFunctionDuration ? duration : duration.close) || 0

  const styles = shallowRef<CSSProperties>(({
    ...execWithArgsOrReturn(props.common, fnArgs.value),
    ...execWithArgsOrReturn(initial(), fnArgs.value),
  }))

  const { isMounted, status } = useTransitionStatus(context, { duration })

  watchEffect(() => {
    const initialStyles = execWithArgsOrReturn(initial(), fnArgs.value)
    const closeStyles = execWithArgsOrReturn(props.close, fnArgs.value)
    const commonStyles = execWithArgsOrReturn(props.common, fnArgs.value)
    const openStyles
      = execWithArgsOrReturn(props.open, fnArgs.value)
      || Object.keys(initialStyles).reduce((acc: Record<string, ''>, key) => {
        acc[key] = ''
        return acc
      }, {})

    if (status.value === 'initial') {
      styles.value = {
        transitionProperty: styles.value.transitionProperty,
        ...commonStyles,
        ...initialStyles,
      }
    }

    if (status.value === 'open') {
      styles.value = {
        transitionProperty: Object.keys(openStyles)
          .map(camelCaseToKebabCase)
          .join(','),
        transitionDuration: `${toValue(openDuration)}ms`,
        ...commonStyles,
        ...openStyles,
      }
    }

    if (status.value === 'close') {
      const _styles = closeStyles || initialStyles
      styles.value = {
        transitionProperty: Object.keys(_styles)
          .map(camelCaseToKebabCase)
          .join(','),
        transitionDuration: `${toValue(closeDuration)}ms`,
        ...commonStyles,
        ..._styles,
      }
    }
  })

  return {
    isMounted,
    styles,
  }
}

// Converts a JS style key like `backgroundColor` to a CSS transition-property
// like `background-color`.
function camelCaseToKebabCase(str: string): string {
  return str.replace(
    /[A-Z]+(?![a-z])|[A-Z]/g,
    ($, ofs) => (ofs ? '-' : '') + $.toLowerCase(),
  )
}

function execWithArgsOrReturn<Value extends object | undefined, SidePlacement>(
  valueOrFn: Value | ((args: SidePlacement) => Value),
  args: SidePlacement,
): Value {
  return typeof valueOrFn === 'function' ? valueOrFn(args) : valueOrFn
}

function useDelayUnmount(open: MaybeRefOrGetter<boolean>, durationMs: number | (() => number)): Ref<boolean> {
  const isMounted = shallowRef(toValue(open))

  watchEffect((onCleanup) => {
    if (!toValue(open) && isMounted.value) {
      const timeout = setTimeout(() => {
        isMounted.value = false
      }, toValue(durationMs))

      onCleanup(() => {
        clearTimeout(timeout)
      })
    }
    else if (toValue(open) && !isMounted.value) {
      isMounted.value = true
    }
  })

  return isMounted
}
