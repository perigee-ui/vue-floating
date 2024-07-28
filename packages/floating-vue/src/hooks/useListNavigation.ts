import type { Dimensions } from '@floating-ui/utils'
import { type Ref, computed, shallowRef, toValue, watchEffect } from 'vue'
import type { ElementProps, FloatingRootContext } from '../types'
import { enqueueFocus } from '../utils/enqueueFocus.ts'
import { activeElement, contains, getDocument, isMac, isSafari } from '../utils.ts'
import { ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT, ARROW_UP, getMaxIndex, getMinIndex, isIndexOutOfBounds } from '../utils/composite.ts'

let isPreventScrollSupported = false

export interface UseListNavigationProps {
  /**
   * A ref that holds an array of list items.
   * @default empty list
   */
  listRef: Array<HTMLElement | undefined>
  /**
   * The index of the currently active (focused or highlighted) item, which may
   * or may not be selected.
   * @default undefined
   */
  activeIndex: Ref<number | undefined>
  /**
   * A callback that is called when the user navigates to a new active item,
   * passed in a new `activeIndex`.
   */
  onNavigate?: (activeIndex: number | undefined) => void
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: boolean
  /**
   * The currently selected item index, which may or may not be active.
   * @default undefined
   */
  selectedIndex?: Ref<number | undefined>
  /**
   * Whether to focus the item upon opening the floating element. 'auto' infers
   * what to do based on the input type (keyboard vs. pointer), while a boolean
   * value will force the value.
   * @default 'auto'
   */
  focusItemOnOpen?: boolean | 'auto'
  /**
   * Whether hovering an item synchronizes the focus.
   * @default true
   */
  focusItemOnHover?: boolean
  /**
   * Whether pressing an arrow key on the navigation’s main axis opens the
   * floating element.
   * @default true
   */
  openOnArrowKeyDown?: boolean
  /**
   * By default elements with either a `disabled` or `aria-disabled` attribute
   * are skipped in the list navigation — however, this requires the items to
   * be rendered.
   * This prop allows you to manually specify indices which should be disabled,
   * overriding the default logic.
   * For Windows-style select menus, where the menu does not open when
   * navigating via arrow keys, specify an empty array.
   * @default undefined
   */
  disabledIndices?: Array<number>
  /**
   * Determines whether focus can escape the list, such that nothing is selected
   * after navigating beyond the boundary of the list. In some
   * autocomplete/combobox components, this may be desired, as screen
   * readers will return to the input.
   * `loop` must be `true`.
   * @default false
   */
  allowEscape?: boolean
  /**
   * Determines whether focus should loop around when navigating past the first
   * or last item.
   * @default false
   */
  loop?: boolean
  /**
   * If the list is nested within another one (e.g. a nested submenu), the
   * navigation semantics change.
   * @default false
   */
  nested?: boolean
  /**
   * Whether the direction of the floating element’s navigation is in RTL
   * layout.
   * @default false
   */
  rtl?: boolean
  /**
   * Whether the focus is virtual (using `aria-activedescendant`).
   * Use this if you need focus to remain on the reference element
   * (such as an input), but allow arrow keys to navigate list items.
   * This is common in autocomplete listbox components.
   * Your virtually-focused list items must have a unique `id` set on them.
   * If you’re using a component role with the `useRole()` Hook, then an `id` is
   * generated automatically.
   * @default false
   */
  virtual?: boolean
  /**
   * The orientation in which navigation occurs.
   * @default 'vertical'
   */
  orientation?: 'vertical' | 'horizontal' | 'both'
  /**
   * Specifies how many columns the list has (i.e., it’s a grid). Use an
   * orientation of 'horizontal' (e.g. for an emoji picker/date picker, where
   * pressing ArrowRight or ArrowLeft can change rows), or 'both' (where the
   * current row cannot be escaped with ArrowRight or ArrowLeft, only ArrowUp
   * and ArrowDown).
   * @default 1
   */
  cols?: number
  /**
   * Whether to scroll the active item into view when navigating. The default
   * value uses nearest options.
   */
  scrollItemIntoView?: boolean | ScrollIntoViewOptions
  /**
   * When using virtual focus management, this holds a ref to the
   * virtually-focused item. This allows nested virtual navigation to be
   * enabled, and lets you know when a nested element is virtually focused from
   * the root reference handling the events. Requires `FloatingTree` to be
   * setup.
   */
  virtualItemRef?: HTMLElement | undefined
  /**
   * Only for `cols > 1`, specify sizes for grid items.
   * `{ width: 2, height: 2 }` means an item is 2 columns wide and 2 rows tall.
   */
  itemSizes?: Dimensions[]
  /**
   * Only relevant for `cols > 1` and items with different sizes, specify if
   * the grid is dense (as defined in the CSS spec for `grid-auto-flow`).
   * @default false
   */
  dense?: boolean
}

/**
 * Adds arrow key-based navigation of a list of items, either using real DOM
 * focus or virtual focus.
 * @see https://floating-ui.com/docs/useListNavigation
 */
export function useListNavigation(
  context: FloatingRootContext,
  props: UseListNavigationProps,
): () => ElementProps | undefined {
  const { open, onOpenChange, elements } = context
  const {
    activeIndex,
    onNavigate,
    selectedIndex = null,
    allowEscape = false,
    loop = false,
    nested = false,
    rtl = false,
    virtual = false,
    focusItemOnOpen = 'auto',
    focusItemOnHover = true,
    openOnArrowKeyDown = true,
    disabledIndices = undefined,
    orientation = 'vertical',
    cols = 1,
    scrollItemIntoView = true,
    itemSizes,
    dense = false,
  } = props

  let _virtualItemRef = props.virtualItemRef

  const enabled = computed(() => toValue(props.enabled ?? true))

  if (__DEV__) {
    if (allowEscape) {
      if (!loop) {
        console.warn('`useListNavigation` looping must be enabled to allow escaping.')
      }

      if (!virtual) {
        console.warn('`useListNavigation` must be virtual to allow escaping.')
      }
    }

    if (orientation === 'vertical' && cols > 1) {
      console.warn(
        'In grid list navigation mode (`cols` > 1), the `orientation` should',
        'be either "horizontal" or "both".',
      )
    }
  }

  // const parentId = useFloatingParentNodeId();
  // const tree = useFloatingTree();

  const parentId = null
  const tree = null

  const focusItemOnOpenRef = focusItemOnOpen
  let indexRef = selectedIndex?.value ?? -1
  let keyRef = <undefined | string>undefined
  const isPointerModalityRef = true
  const previousMountedRef = !!elements.floating
  const previousOpenRef = open
  let forceSyncFocus = false
  let forceScrollIntoViewRef = false

  const activeId = shallowRef<string | undefined>()
  const virtualId = shallowRef<string | undefined>()

  function focusItem(
    listRef: Array<HTMLElement | undefined>,
    indexRef: number,
    forceScrollIntoView = false,
  ) {
    function runFocus(item: HTMLElement) {
      if (virtual) {
        activeId.value = item.id
        // TODO: Emit virtual focus event
        // tree?.events.emit('virtualfocus', item)
        if (_virtualItemRef) {
          _virtualItemRef = item
        }
      }
      else {
        enqueueFocus(item, {
          preventScroll: true,
          // Mac Safari does not move the virtual cursor unless the focus call
          // is sync. However, for the very first focus call, we need to wait
          // for the position to be ready in order to prevent unwanted
          // scrolling. This means the virtual cursor will not move to the first
          // item when first opening the floating element, but will on
          // subsequent calls. `preventScroll` is supported in modern Safari,
          // so we can use that instead.
          // iOS Safari must be async or the first item will not be focused.
          sync:
              isMac() && isSafari()
                ? isPreventScrollSupported || forceSyncFocus
                : false,
        })
      }
    }

    const initialItem = listRef[indexRef]

    if (initialItem) {
      runFocus(initialItem)
    }

    requestAnimationFrame(() => {
      const waitedItem = listRef[indexRef] || initialItem

      if (!waitedItem)
        return

      if (!initialItem) {
        runFocus(waitedItem)
      }

      const scrollIntoViewOptions = scrollItemIntoView
      const shouldScrollIntoView = scrollIntoViewOptions && (forceScrollIntoView || !isPointerModalityRef)

      if (shouldScrollIntoView) {
        // JSDOM doesn't support `.scrollIntoView()` but it's widely supported
        // by all browsers.
        waitedItem.scrollIntoView?.(
          typeof scrollIntoViewOptions === 'boolean'
            ? { block: 'nearest', inline: 'nearest' }
            : scrollIntoViewOptions,
        )
      }
    })
  }

  if (window !== undefined) {
    document.createElement('div').focus({
      get preventScroll() {
        isPreventScrollSupported = true
        return false
      },
    })
  }

  // Sync `selectedIndex` to be the `activeIndex` upon opening the floating
  // element. Also, reset `activeIndex` upon closing the floating element.
  watchEffect(() => {
    if (!enabled.value)
      return

    if (open.value && elements.floating.value) {
      if (focusItemOnOpenRef && selectedIndex?.value != null) {
        // Regardless of the pointer modality, we want to ensure the selected
        // item comes into view when the floating element is opened.
        forceScrollIntoViewRef = true
        indexRef = selectedIndex.value
        onNavigate?.(selectedIndex.value)
      }
    }
    else if (previousMountedRef) {
      // Since the user can specify `onNavigate` conditionally
      // (onNavigate: open ? setActiveIndex : setSelectedIndex),
      // we store and call the previous function.
      indexRef = -1
      onNavigate?.(undefined)
    }
  })

  // Sync `activeIndex` to be the focused item while the floating element is
  // open.
  watchEffect(() => {
    if (!enabled.value)
      return

    if (open.value && elements.floating.value) {
      if (activeIndex.value == null) {
        forceSyncFocus = false

        if (props.selectedIndex != null) {
          return
        }

        // Reset while the floating element was open (e.g. the list changed).
        if (previousMountedRef) {
          indexRef = -1
          focusItem(props.listRef, indexRef)
        }

        // Initial sync.
        if (
          (!previousOpenRef || !previousMountedRef)
          && focusItemOnOpenRef
          && (keyRef != null
          || (focusItemOnOpenRef === true && keyRef == null))
        ) {
          let runs = 0
          const waitForListPopulated = () => {
            if (props.listRef[0] == null) {
              // Avoid letting the browser paint if possible on the first try,
              // otherwise use rAF. Don't try more than twice, since something
              // is wrong otherwise.
              if (runs < 2) {
                const scheduler = runs ? requestAnimationFrame : queueMicrotask
                scheduler(waitForListPopulated)
              }
              runs++
            }
            else {
              indexRef
                = keyRef == null
                || isMainOrientationToEndKey(keyRef, orientation, rtl)
                || nested
                  ? getMinIndex(props.listRef, props.disabledIndices)
                  : getMaxIndex(props.listRef, props.disabledIndices)
              keyRef = undefined
              onNavigate?.(indexRef)
            }
          }

          waitForListPopulated()
        }
      }
      else if (!isIndexOutOfBounds(props.listRef, activeIndex.value)) {
        indexRef = activeIndex.value
        focusItem(props.listRef, indexRef, forceScrollIntoViewRef)
        forceScrollIntoViewRef = false
      }
    }
  })

  // Ensure the parent floating element has focus when a nested child closes
  // to allow arrow key navigation to work after the pointer leaves the child.
  watchEffect(() => {
    if (
      !enabled.value
      || elements.floating.value
      || !tree
      || virtual
      || !previousMountedRef
    ) {
      return
    }

    // TODO: tree
    const nodes = (tree as any).nodesRef
    const parent = nodes.find((node: any) => node.id === parentId)?.context?.elements
      .floating
    const activeEl = activeElement(getDocument(elements.floating.value))
    const treeContainsActiveEl = nodes.some(
      (node: any) => node.context && contains(node.context.elements.floating, activeEl),
    )

    if (parent && !treeContainsActiveEl && isPointerModalityRef) {
      parent.focus({ preventScroll: true })
    }
  })

  watchEffect((onCleanup) => {
    if (!enabled.value)
      return
    if (!tree)
      return
    if (!virtual)
      return
    if (parentId)
      return

    function handleVirtualFocus(item: HTMLElement) {
      virtualId.value = item.id

      if (_virtualItemRef) {
        _virtualItemRef = item
      }
    }

    // TODO: tree
    (tree as any).events.on('virtualfocus', handleVirtualFocus)
    onCleanup(() => {
      (tree as any).events.off('virtualfocus', handleVirtualFocus)
    })
  })
}

function doSwitch(
  orientation: UseListNavigationProps['orientation'],
  vertical: boolean,
  horizontal: boolean,
) {
  switch (orientation) {
    case 'vertical':
      return vertical
    case 'horizontal':
      return horizontal
    default:
      return vertical || horizontal
  }
}

function isMainOrientationKey(
  key: string,
  orientation: UseListNavigationProps['orientation'],
) {
  const vertical = key === ARROW_UP || key === ARROW_DOWN
  const horizontal = key === ARROW_LEFT || key === ARROW_RIGHT
  return doSwitch(orientation, vertical, horizontal)
}

function isMainOrientationToEndKey(
  key: string,
  orientation: UseListNavigationProps['orientation'],
  rtl: boolean,
) {
  const vertical = key === ARROW_DOWN
  const horizontal = rtl ? key === ARROW_LEFT : key === ARROW_RIGHT
  return (
    doSwitch(orientation, vertical, horizontal)
    || key === 'Enter'
    || key === ' '
    || key === ''
  )
}

function isCrossOrientationOpenKey(
  key: string,
  orientation: UseListNavigationProps['orientation'],
  rtl: boolean,
) {
  const vertical = rtl ? key === ARROW_LEFT : key === ARROW_RIGHT
  const horizontal = key === ARROW_DOWN
  return doSwitch(orientation, vertical, horizontal)
}

function isCrossOrientationCloseKey(
  key: string,
  orientation: UseListNavigationProps['orientation'],
  rtl: boolean,
) {
  const vertical = rtl ? key === ARROW_RIGHT : key === ARROW_LEFT
  const horizontal = key === ARROW_UP
  return doSwitch(orientation, vertical, horizontal)
}
