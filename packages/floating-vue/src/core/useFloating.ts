import { computePosition } from '@floating-ui/dom'
import {
  type CSSProperties,
  type MaybeRefOrGetter,
  type Ref,
  computed,
  shallowRef,
  toValue,
  watch,
  watchEffect,
  watchSyncEffect,
} from 'vue'

import type {
  ComputePositionConfig,
  FloatingElement,
  MiddlewareData,
  ReferenceType,
  UseFloatingCofnig,
  UseFloatingOptions,
  UseFloatingReturn,
} from './types.ts'
import { roundByDPR } from './utils/roundByDPR.ts'
import { getDPR } from './utils/getDPR.ts'

/**
 * Computes the `x` and `y` coordinates that will place the floating element next to a reference element when it is given a certain CSS positioning strategy.
 * @param $reference The reference template ref.
 * @param $floating The floating template ref.
 * @param open The open state of the floating element.
 * @param config The floating configuration.
 * @param options The floating options.
 * @see https://floating-ui.com/docs/vue
 */
export function useFloating<RT extends ReferenceType = ReferenceType>(
  $reference: Ref<RT>,
  $floating: Ref<FloatingElement>,
  open?: MaybeRefOrGetter<boolean>,
  config: MaybeRefOrGetter<UseFloatingCofnig> = {},
  options: MaybeRefOrGetter<UseFloatingOptions> = {},
): UseFloatingReturn {
  const configValue = toValue(config)
  let optionsValue = toValue(options)

  const transform = shallowRef(optionsValue.transform ?? true)
  let whileElementsMounted = optionsValue.whileElementsMounted

  const x = shallowRef(0)
  const y = shallowRef(0)
  const strategy = shallowRef(configValue.strategy ?? 'absolute')
  const placement = shallowRef(configValue.placement ?? 'bottom')
  const middlewareData = shallowRef<MiddlewareData>({})
  const isPositioned = shallowRef(false)

  const floatingStyles = computed<CSSProperties>(() => {
    const initialStyles = {
      position: strategy.value,
      left: 0,
      top: 0,
    }

    const floatingEl = $floating.value
    if (!floatingEl)
      return initialStyles

    const xVal = roundByDPR(floatingEl, x.value)
    const yVal = roundByDPR(floatingEl, y.value)

    if (transform.value ?? true) {
      return {
        ...initialStyles,
        transform: `translate(${xVal}px, ${yVal}px)`,
        ...(getDPR(floatingEl) >= 1.5 && { willChange: 'transform' }),
      }
    }

    return {
      position: strategy.value,
      left: `${xVal}px`,
      top: `${yVal}px`,
    }
  })

  watchEffect(() => {
    optionsValue = toValue(options)
    transform.value = optionsValue.transform ?? true
    whileElementsMounted = optionsValue.whileElementsMounted
  })

  watch(config, () => {
    update()
  })

  function update() {
    const referenceEl = $reference.value
    const floatingEl = $floating.value
    if (!referenceEl || !floatingEl)
      return

    const config: ComputePositionConfig = {
      placement: configValue.placement,
      strategy: configValue.strategy,
      middleware: configValue.middleware,
    }

    if (configValue.platform)
      config.platform = configValue.platform

    computePosition(referenceEl, floatingEl, config).then(
      (data) => {
        x.value = data.x
        y.value = data.y
        strategy.value = data.strategy
        placement.value = data.placement
        middlewareData.value = data.middlewareData
        isPositioned.value = true
      },
    )
  }

  watchSyncEffect(() => {
    if (!toValue(open))
      isPositioned.value = false
  })

  watchSyncEffect((onCleanup) => {
    const referenceEl = $reference.value
    const floatingEl = $floating.value

    if (!referenceEl || !floatingEl)
      return

    if (!whileElementsMounted) {
      update()
      return
    }

    onCleanup(whileElementsMounted(referenceEl, floatingEl, update))
  })

  return {
    x,
    y,
    strategy,
    placement,
    middlewareData,
    isPositioned,
    floatingStyles,
    update,
  }
}
