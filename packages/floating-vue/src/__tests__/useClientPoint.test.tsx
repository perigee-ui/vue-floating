import type { Coords } from '../core/index.ts'
import { cleanup, fireEvent, render, screen } from '@testing-library/vue'
import { expect, it } from 'vitest'
import { defineComponent, onMounted, type PropType, ref, watchEffect } from 'vue'

import { useClientPoint, useFloating, useInteractions } from '../../src/index.ts'
import { act } from '../core/__tests__/utils.ts'

function expectLocation({ x, y }: Coords) {
  expect(Number(screen.getByTestId('x')?.textContent)).toBe(x)
  expect(Number(screen.getByTestId('y')?.textContent)).toBe(y)
  expect(Number(screen.getByTestId('width')?.textContent)).toBe(0)
  expect(Number(screen.getByTestId('height')?.textContent)).toBe(0)
}

const App = defineComponent({
  name: 'App',
  props: {
    enabled: {
      type: Boolean,
      default: true,
    },
    point: {
      type: Object,
      default: () => ({}),
    },
    axis: {
      type: String as PropType<'both' | 'x' | 'y'>,
      default: 'both',
    },
  },
  setup(props) {
    const isOpen = ref(false)
    const { refs, elements, context } = useFloating({
      open: isOpen,
      onOpenChange: value => (isOpen.value = value),
    })
    const clientPoint = useClientPoint(context, {
      enabled: () => props.enabled,
      x: props.point.x ? () => props.point.x : undefined,
      y: props.point.y ? () => props.point.y : undefined,
      axis: props.axis,
    })
    const { getReferenceProps, getFloatingProps } = useInteractions([clientPoint])

    const rect = ref({ x: 0, y: 0, width: 0, height: 0 })

    onMounted(() => {
      rect.value = elements.reference.value?.getBoundingClientRect() || rect.value
    })

    watchEffect(() => {
      rect.value = elements.reference.value?.getBoundingClientRect() || rect.value
    })

    watchEffect((onClean) => {
      elements.domReference.value?.addEventListener('mousemove', update)
      onClean(() => {
        elements.domReference.value?.removeEventListener('mousemove', update)
      })
    })

    async function update() {
      const r = elements.reference.value?.getBoundingClientRect() as DOMRect
      rect.value = r
    }

    return () => (
      <>
        <div
          data-testid="reference"
          ref={(el: any) => refs.setReference(el)}
          {...getReferenceProps()}
        >
          Reference
        </div>
        {isOpen.value && (
          <div
            data-testid="floating"
            ref={(el: any) => refs.setFloating(el)}
            {...getFloatingProps()}
          >
            Floating
          </div>
        )}
        <button onClick={() => (isOpen.value = !isOpen.value)}>button</button>
        <span foo-testid="x">{props.point?.x}</span>
        <span foo-testid="y">{props.point?.y}</span>
        <span data-testid="x">{rect.value.x}</span>
        <span data-testid="y">{rect.value.y}</span>
        <span data-testid="width">{rect.value.width}</span>
        <span data-testid="height">{rect.value.height}</span>
      </>
    )
  },
})

it('renders at explicit client point and can be updated', async () => {
  const { rerender } = render(App, {
    props: {
      point: { x: 0, y: 0 },
    },
  })
  await act()

  await fireEvent.click(screen.getByRole('button'))
  await act()

  expectLocation({ x: 0, y: 0 })

  await rerender({
    point: { x: 1000, y: 1000 },
  })
  await act()

  expectLocation({ x: 1000, y: 1000 })

  cleanup()
})

it.only('renders at mouse event coords', async () => {
  render(<App />)

  await act()

  await fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  )
  await act()

  expectLocation({ x: 500, y: 500 })

  await fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 1000,
      clientY: 1000,
    }),
  )
  await act()

  expectLocation({ x: 1000, y: 1000 })

  // Window listener isn't registered unless the floating element is open.
  await fireEvent(
    window,
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 700,
      clientY: 700,
    }),
  )
  await act()

  expectLocation({ x: 1000, y: 1000 })

  await fireEvent.click(screen.getByRole('button'))
  await act()

  await fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 700,
      clientY: 700,
    }),
  )
  await act()

  expectLocation({ x: 700, y: 700 })

  await fireEvent(
    document.body,
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 0,
      clientY: 0,
    }),
  )
  await act()

  expectLocation({ x: 0, y: 0 })
  cleanup()
})

it('ignores mouse events when explicit coords are specified', async () => {
  render(<App point={{ x: 0, y: 0 }} />)
  await act()

  await fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  )
  await act()

  expectLocation({ x: 0, y: 0 })
  cleanup()
})

it('cleans up window listener when closing or disabling', async () => {
  const { rerender } = render(App)
  await act()

  await fireEvent.click(screen.getByRole('button'))
  await act()

  await fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  )
  await act()

  await fireEvent.click(screen.getByRole('button'))
  await act()

  await fireEvent(
    document.body,
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 0,
      clientY: 0,
    }),
  )
  await act()

  expectLocation({ x: 500, y: 500 })

  await fireEvent.click(screen.getByRole('button'))
  await act()

  await fireEvent(
    document.body,
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  )
  await act()

  expectLocation({ x: 500, y: 500 })

  await rerender({
    enabled: false,
  })
  await act()

  await fireEvent(
    document.body,
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 0,
      clientY: 0,
    }),
  )
  await act()

  expectLocation({ x: 500, y: 500 })
  cleanup()
})

it('axis x', async () => {
  render(<App axis="x" />)
  await act()

  fireEvent.click(screen.getByRole('button'))
  await act()

  await fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  )
  await act()

  expectLocation({ x: 500, y: 0 })
  cleanup()
})

it('axis y', async () => {
  render(<App axis="y" />)
  await act()

  await fireEvent.click(screen.getByRole('button'))
  await act()

  await fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  )
  await act()

  expectLocation({ x: 0, y: 500 })
  cleanup()
})

it('removes window listener when cursor lands on floating element', async () => {
  render(<App />)
  await act()

  await fireEvent.click(screen.getByRole('button'))
  await act()

  await fireEvent(
    screen.getByTestId('reference'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  )
  await act()

  await fireEvent(
    screen.getByTestId('floating'),
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 500,
      clientY: 500,
    }),
  )
  await act()

  await fireEvent(
    document.body,
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 0,
      clientY: 0,
    }),
  )
  await act()

  expectLocation({ x: 500, y: 500 })
  cleanup()
})
