import { type Ref, shallowReactive, shallowRef, watchEffect } from 'vue'
import { createContext } from '../../utils/createContext.ts'
import type { FloatingRootContext } from '../../types'
import { getDelay } from '../../hooks/useHover.ts'

// eslint-disable-next-line antfu/top-level-function
const NOOP = () => {}

type Delay = number | Partial<{ open: number, close: number }>

interface GroupState {
  delay: Delay
  initialDelay: Delay
  timeoutMs: number
}

export interface GroupContext {
  currentId: Ref<any>
  state: GroupState
  isInstantPhase: Ref<boolean>
  setCurrentId: (id: string | number) => void
  setState: (state: Partial<GroupState>) => void
}

export const [provideFloatingDelayGroupContext, useFloatingDelayGroupContext] = createContext<GroupContext>('FloatingDelayGroup')

export interface FloatingDelayGroupProps {
  /**
   * The delay to use for the group.
   */
  delay: Delay
  /**
   * An optional explicit timeout to use for the group, which represents when
   * grouping logic will no longer be active after the close delay completes.
   * This is useful if you want grouping to “last” longer than the close delay,
   * for example if there is no close delay at all.
   */
  timeoutMs?: number
}

export function useFloatingDelayGroup(props: FloatingDelayGroupProps) {
  const { delay, timeoutMs = 0 } = props

  const state = shallowReactive({
    delay,
    initialDelay: props.delay,
    timeoutMs: timeoutMs ?? 0,
  })
  const currentId = shallowRef<any>(undefined)
  const isInstantPhase = shallowRef(false)

  let initialCurrentIdRef = currentId.value

  function setCurrentId(newCurrentId: any) {
    currentId.value = newCurrentId
  }

  watchEffect(() => {
    if (currentId.value) {
      if (initialCurrentIdRef == null) {
        initialCurrentIdRef = currentId.value
      }
      else if (!isInstantPhase.value) {
        isInstantPhase.value = true
      }
    }
    else {
      if (isInstantPhase.value) {
        isInstantPhase.value = false
      }
      initialCurrentIdRef = undefined
    }
  })

  function setState(newState: Partial<GroupState>) {
    Object.assign(state, newState)
  }

  provideFloatingDelayGroupContext({
    state,
    currentId,
    isInstantPhase,
    setCurrentId,
    setState,
  })
}

export interface UseGroupOptions {
  id?: any
}

/**
 * Enables grouping when called inside a component that's a child of a
 * `FloatingDelayGroup`.
 * @see https://floating-ui.com/docs/FloatingDelayGroup
 */
export function useDelayGroup(
  context: FloatingRootContext,
  options: UseGroupOptions = {},
): GroupContext {
  const { open, onOpenChange, floatingId } = context
  const { id: optionId } = options
  const id = optionId ?? floatingId

  const groupContext = useFloatingDelayGroupContext('useDelayGroup')
  const { state, currentId, setCurrentId, setState } = groupContext

  watchEffect(() => {
    if (!currentId.value)
      return

    setState({
      delay: {
        open: 1,
        close: getDelay(state.initialDelay, 'close'),
      },
    })

    if (currentId.value !== id) {
      onOpenChange(false)
    }
  })

  watchEffect((onCleanup) => {
    function unset() {
      onOpenChange(false)
      currentId.value = undefined
      setState({ delay: state.initialDelay })
    }

    if (!currentId.value)
      return

    if (!open.value && currentId.value === id) {
      if (state.timeoutMs) {
        const timeout = window.setTimeout(unset, state.timeoutMs)
        onCleanup(() => {
          clearTimeout(timeout)
        })
      }

      unset()
    }
  })

  watchEffect(() => {
    if (setCurrentId === NOOP || !open.value)
      return
    setCurrentId(id)
  })

  return groupContext
}