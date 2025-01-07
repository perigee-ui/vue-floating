import type { UseHoverProps } from '../../src/hooks/useHover'
import { cleanup, fireEvent, render, screen } from '@testing-library/vue'

import { describe, expect, it, vi } from 'vitest'
import { defineComponent, type PropType, ref } from 'vue'
import { useFloating, useHover, useInteractions } from '../../src/index.ts'
import { act } from '../core/__tests__/utils.ts'

vi.useFakeTimers()

const App = defineComponent({
  props: {
    showReference: {
      type: Boolean,
      default: true,
    },
    hoverProps: {
      type: Object as PropType<UseHoverProps>,
      default: undefined,
    },
  },
  setup(props) {
    const open = ref(false)
    const { refs, context } = useFloating({
      open,
      onOpenChange(value) {
        open.value = value
      },
    })
    const { getReferenceProps, getFloatingProps } = useInteractions([
      useHover(context, props.hoverProps),
    ])

    return () => (
      <>
        {props.showReference && (
          <button ref={(el: any) => refs.setReference(el)} {...getReferenceProps()} />
        )}
        {open.value && <div role="tooltip" ref={(el: any) => refs.setFloating(el)} {...getFloatingProps()} />}
      </>
    )
  },
})

it('opens on mouseenter', async () => {
  render(<App />)

  await fireEvent.mouseEnter(screen.getByRole('button'))

  expect(screen.queryByRole('tooltip')).toBeInTheDocument()
  cleanup()
})

it('closes on mouseleave', async () => {
  render(<App />)

  await fireEvent.mouseEnter(screen.getByRole('button'))
  await fireEvent.mouseLeave(screen.getByRole('button'))
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

  cleanup()
})

describe('delay', () => {
  it('symmetric number', async () => {
    render(App, {
      props: {
        hoverProps: {
          delay: 1000,
        },
      },
    })

    await fireEvent.mouseEnter(screen.getByRole('button'))

    await vi.advanceTimersByTime(999)
    await act()

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await vi.advanceTimersByTime(1)
    await act()

    expect(screen.queryByRole('tooltip')).toBeInTheDocument()

    cleanup()
  })

  it('open', async () => {
    render(App, {
      props: {
        hoverProps: {
          delay: {
            open: 500,
          },
        },
      },
    })

    await fireEvent.mouseEnter(screen.getByRole('button'))

    await vi.advanceTimersByTime(499)
    await act()

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await vi.advanceTimersByTime(1)
    await act()

    expect(screen.queryByRole('tooltip')).toBeInTheDocument()

    cleanup()
  })

  it('close', async () => {
    render(App, {
      props: {
        hoverProps: {
          delay: {
            close: 500,
          },
        },
      },
    })

    await fireEvent.mouseEnter(screen.getByRole('button'))
    await fireEvent.mouseLeave(screen.getByRole('button'))

    await vi.advanceTimersByTime(499)
    await act()

    expect(screen.queryByRole('tooltip')).toBeInTheDocument()

    await vi.advanceTimersByTime(1)
    await act()

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    cleanup()
  })

  it('open with close 0', async () => {
    render(App, {
      props: {
        hoverProps: {
          delay: {
            open: 500,
          },
        },
      },
    })

    await fireEvent.mouseEnter(screen.getByRole('button'))

    await vi.advanceTimersByTime(499)
    await act()

    await fireEvent.mouseLeave(screen.getByRole('button'))

    await vi.advanceTimersByTime(1)
    await act()

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    cleanup()
  })

  it('restMs + nullish open delay should respect restMs', async () => {
    render(App, {
      props: {
        hoverProps: {
          delay: {
            close: 100,
          },
          restMs: 100,
        },
      },
    })

    await fireEvent.mouseEnter(screen.getByRole('button'))

    await vi.advanceTimersByTime(99)
    await act()

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    cleanup()
  })
})

it('restMs', async () => {
  render(App, {
    props: {
      hoverProps: {
        restMs: 100,
      },
    },
  })

  const button = screen.getByRole('button')

  const originalDispatchEvent = button.dispatchEvent
  const spy = vi.spyOn(button, 'dispatchEvent').mockImplementation((event) => {
    Object.defineProperty(event, 'movementX', { value: 10 })
    Object.defineProperty(event, 'movementY', { value: 10 })
    return originalDispatchEvent.call(button, event)
  })

  fireEvent.mouseMove(button)

  await fireEvent.mouseMove(screen.getByRole('button'))

  await vi.advanceTimersByTime(99)
  await act()

  await fireEvent.mouseMove(screen.getByRole('button'))

  await vi.advanceTimersByTime(1)
  await act()

  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

  fireEvent.mouseMove(button)

  await vi.advanceTimersByTime(100)
  await act()

  expect(screen.queryByRole('tooltip')).toBeInTheDocument()

  spy.mockRestore()
  cleanup()
})

// TODO: test touch input, testing-library and jsdom errors
it.todo('restMs is always 0 for touch input', async () => {
  render(App, {
    props: {
      hoverProps: {
        restMs: 100,
      },
    },
  })
  await act()

  await fireEvent.pointerDown(screen.getByRole('button'), { pointerType: 'touch' })
  await act()
  await fireEvent.mouseMove(screen.getByRole('button'))
  await act()

  expect(screen.queryByRole('tooltip')).toBeInTheDocument()

  cleanup()
})

it.todo('restMs does not cause floating element to open if mouseOnly is true', async () => {
  render(App, {
    props: {
      hoverProps: {
        restMs: 100,
        mouseOnly: true,
      },
    },
  })
  await act()

  await fireEvent.pointerDown(screen.getByRole('button'), { pointerType: 'touch' })
  await act()
  await fireEvent.mouseMove(screen.getByRole('button'))
  await act()

  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

  cleanup()
})

it('restMs does not reset timer for minor mouse movement', async () => {
  render(
    <App hoverProps={{
      restMs: 100,
    }}
    />,
  )

  const button = screen.getByRole('button')

  const originalDispatchEvent = button.dispatchEvent
  const spy = vi.spyOn(button, 'dispatchEvent').mockImplementation((event) => {
    Object.defineProperty(event, 'movementX', { value: 1 })
    Object.defineProperty(event, 'movementY', { value: 0 })
    return originalDispatchEvent.call(button, event)
  })

  fireEvent.mouseMove(button)

  await act()
  vi.advanceTimersByTime(99)
  await act()
  // await act(async () => {
  // })

  await fireEvent.mouseMove(button)
  await act()

  vi.advanceTimersByTime(1)
  await act()
  // await act(async () => {
  // })

  expect(screen.queryByRole('tooltip')).toBeInTheDocument()

  spy.mockRestore()
  cleanup()
})

it('mouseleave on the floating element closes it (mouse)', async () => {
  render(<App />)
  await act()

  await fireEvent.mouseEnter(screen.getByRole('button'))
  await act()

  await fireEvent(
    screen.getByRole('button'),
    new MouseEvent('mouseleave', {
      relatedTarget: screen.getByRole('tooltip'),
    }),
  )
  await act()

  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

  cleanup()
})

it('does not show after delay if domReference changes', async () => {
  const { rerender } = render(App, {
    props: {
      hoverProps: {
        delay: 1000,
      },
    },
  })
  await act()

  await fireEvent.mouseEnter(screen.getByRole('button'))
  await act()

  await vi.advanceTimersByTime(1)
  await act()

  await rerender({
    showReference: false,
  })

  await vi.advanceTimersByTime(999)
  await act()

  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

  cleanup()
})

it('reason string', async () => {
  const App = defineComponent({
    setup() {
      const open = ref(false)
      const { refs, context } = useFloating({
        open,
        onOpenChange(value, _, reason) {
          open.value = value
          expect(reason).toBe('hover')
        },
      })
      const hover = useHover(context)
      const { getReferenceProps, getFloatingProps } = useInteractions([hover])

      return () => (
        <>
          <button ref={(el: any) => refs.setReference(el)} {...getReferenceProps()} />
          {open.value && <div role="tooltip" ref={(el: any) => refs.setFloating(el)} {...getFloatingProps()} />}
        </>
      )
    },
  })

  render(<App />)
  await act()
  const button = screen.getByRole('button')
  await fireEvent.mouseEnter(button)
  await act()
  await fireEvent.mouseLeave(button)
  await act()

  cleanup()
})
