import { describe, expect, it, vi } from 'vitest'
import { defineComponent, shallowRef, watchEffect } from 'vue'
import { cleanup, fireEvent, render, screen } from '@testing-library/vue'

import {
  arrow,
  flip,
  hide,
  limitShift,
  offset,
  shift,
  size,
  useFloating,
} from '../index.ts'
import { act } from './utils.ts'

it('middleware is always fresh and does not cause an infinite loop', async () => {
  const InlineMiddleware = defineComponent({
    setup() {
      const arrowRef = shallowRef<Element>()
      const { refs } = useFloating({}, {
        placement: 'right',
        middleware: [
          offset(),
          offset(10),
          offset(() => 5),
          offset(() => ({ crossAxis: 10 })),
          offset({ crossAxis: 10, mainAxis: 10 }),

          flip({ fallbackPlacements: ['top', 'bottom'] }),

          shift(),
          shift({ crossAxis: true }),
          shift({ boundary: document.createElement('div') }),
          shift({ boundary: [document.createElement('div')] }),
          shift({ limiter: limitShift() }),
          shift({ limiter: limitShift({ offset: 10 }) }),
          shift({ limiter: limitShift({ offset: { crossAxis: 10 } }) }),
          shift({ limiter: limitShift({ offset: () => 5 }) }),
          shift({ limiter: limitShift({ offset: () => ({ crossAxis: 10 }) }) }),

          arrow({ element: arrowRef }),

          hide(),

          size({
            apply({ availableHeight, elements }) {
              Object.assign(elements.floating.style, {
                maxHeight: `${availableHeight}px`,
              })
            },
          }),
        ],
      })

      return () => (
        <>
          <div ref={(el: any) => refs.setReference(el)} />
          <div ref={(el: any) => refs.setFloating(el)} />
        </>
      )
    },
  })

  const StateMiddleware = defineComponent({
    setup() {
      const arrowRef = shallowRef<Element>()
      const middleware = shallowRef([
        offset(),
        offset(10),
        offset(() => 5),
        offset(() => ({ crossAxis: 10 })),
        offset({ crossAxis: 10, mainAxis: 10 }),

        // should also test `autoPlacement.allowedPlacements`
        // can't have both `flip` and `autoPlacement` in the same middleware
        // array, or multiple `flip`s
        flip({ fallbackPlacements: ['top', 'bottom'] }),

        shift(),
        shift({ crossAxis: true }),
        shift({ boundary: document.createElement('div') }),
        shift({ boundary: [document.createElement('div')] }),
        shift({ limiter: limitShift() }),
        shift({ limiter: limitShift({ offset: 10 }) }),
        shift({ limiter: limitShift({ offset: { crossAxis: 10 } }) }),
        shift({ limiter: limitShift({ offset: () => 5 }) }),
        shift({ limiter: limitShift({ offset: () => ({ crossAxis: 10 }) }) }),

        arrow({ element: arrowRef }),

        hide(),

        size({
          apply({ availableHeight, elements }) {
            Object.assign(elements.floating.style, {
              maxHeight: `${availableHeight}px`,
            })
          },
        }),
      ])

      const setMiddleware = (value: typeof middleware['value']) => {
        middleware.value = value
      }
      const { x, y, refs } = useFloating({
      }, () => ({
        placement: 'right',
        middleware: middleware.value,
      }))

      return () => (
        <>
          <div ref={(el: any) => refs.setReference(el)} />
          <div ref={(el: any) => refs.setFloating(el)} />
          <button
            data-testid="step1"
            onClick={() => middleware.value = [offset(13)]}
          />
          <button
            data-testid="step2"
            onClick={() => middleware.value = [offset(() => 5)]}
          />
          <button data-testid="step3" onClick={() => setMiddleware([])} />
          <button data-testid="step4" onClick={() => setMiddleware([flip()])} />
          <div data-testid="x">{x.value}</div>
          <div data-testid="y">{y.value}</div>
        </>
      )
    },
  })

  render(<InlineMiddleware />)

  const { getByTestId } = render(<StateMiddleware />)
  await act()

  fireEvent.click(getByTestId('step1'))

  await act()

  expect(getByTestId('x').textContent).toBe('13')

  fireEvent.click(getByTestId('step2'))

  await act()

  expect(getByTestId('x').textContent).toBe('5')

  // No `expect` as this test will fail if a render loop occurs
  fireEvent.click(getByTestId('step3'))
  fireEvent.click(getByTestId('step4'))

  await act()
  cleanup()
})

describe('whileElementsMounted', () => {
  it('is called a single time when both elements mount', async () => {
    const spy = vi.fn()

    const App = defineComponent({
      setup() {
        const { refs } = useFloating({
          whileElementsMounted: () => {
            spy()
            return () => {}
          },
        })
        return () => (
          <>
            <button ref={(el: any) => refs.setReference(el)} />
            <div ref={(el: any) => refs.setFloating(el)} />
          </>
        )
      },
    })

    render(<App />)
    await act()
    expect(spy).toHaveBeenCalledTimes(1)
    await act()

    cleanup()
  })

  it('is called a single time after floating mounts conditionally', async () => {
    const spy = vi.fn()

    const App = defineComponent({
      setup() {
        const open = shallowRef(false)
        const { refs } = useFloating({
          whileElementsMounted: () => {
            spy()
            return () => {}
          },
        })
        return () => (
          <>
            <button ref={(el: any) => refs.setReference(el)} onClick={() => open.value = true} />
            {open.value && <div ref={(el: any) => refs.setFloating(el)} />}
          </>
        )
      },
    })

    render(<App />)
    await act()
    expect(spy).toHaveBeenCalledTimes(0)
    await act()
    fireEvent.click(screen.getByRole('button'))
    await act()
    expect(spy).toHaveBeenCalledTimes(1)

    cleanup()
  })

  it('is called a single time after reference mounts conditionally', async () => {
    const spy = vi.fn()

    const App = defineComponent({
      setup() {
        const open = shallowRef(false)
        const { refs } = useFloating({
          whileElementsMounted: () => {
            spy()
            return () => {}
          },
        })
        return () => (
          <>
            {open.value && <button ref={(el: any) => refs.setReference(el)} />}
            <div role="tooltip" ref={(el: any) => refs.setFloating(el)} onClick={() => open.value = true} />
          </>
        )
      },
    })

    render(<App />)
    await act()
    expect(spy).toHaveBeenCalledTimes(0)
    await act()
    fireEvent.click(screen.getByRole('tooltip'))
    await act()
    expect(spy).toHaveBeenCalledTimes(1)

    cleanup()
  })

  it('is called a single time both elements mount conditionally', async () => {
    const spy = vi.fn()

    const App = defineComponent({
      setup() {
        const open = shallowRef(false)
        const { refs } = useFloating({
          whileElementsMounted: () => {
            spy()
            return () => {}
          },
        })

        watchEffect(() => {
          open.value = true
        })

        return () => (
          <>
            {open.value && <button ref={(el: any) => refs.setReference(el)} />}
            {open.value && <div role="tooltip" ref={(el: any) => refs.setFloating(el)} />}
          </>
        )
      },
    })

    render(<App />)
    await act()
    expect(spy).toHaveBeenCalledTimes(1)

    cleanup()
  })

  it('calls the cleanup function', async () => {
    const cleanupSpy = vi.fn()
    const spy = vi.fn(() => cleanupSpy)

    const App = defineComponent({
      setup() {
        const open = shallowRef(true)
        const { refs } = useFloating({
          whileElementsMounted: spy,
        })

        watchEffect(() => {
          open.value = false
        }, {
          flush: 'post',
        })

        return () => (
          <>
            {open.value && <button ref={(el: any) => refs.setReference(el)} />}
            {open.value && <div role="tooltip" ref={(el: any) => refs.setFloating(el)} />}
          </>
        )
      },
    })

    render(<App />)
    await act()
    expect(cleanupSpy).toHaveBeenCalledTimes(1)
    await act()

    // Does not get called again post-cleanup
    expect(spy).toHaveBeenCalledTimes(1)

    cleanup()
  })
})

it('unstable callback refs', async () => {
  const App = defineComponent({
    setup() {
      const { refs } = useFloating()

      return () => (
        <>
          <div ref={(el: any) => refs.setReference(el)} />
          <div ref={(el: any) => refs.setFloating(el)} />
        </>
      )
    },
  })

  render(<App />)

  await act()

  cleanup()
})

it('isPositioned', async () => {
  const spy = vi.fn()

  const App = defineComponent({
    setup() {
      const open = shallowRef(false)
      const { refs, isPositioned } = useFloating({
        open,
      })

      watchEffect(() => {
        spy(isPositioned.value)
      })

      return () => (
        <>
          <button ref={(el: any) => refs.setReference(el)} onClick={() => open.value = !open.value} />
          {open.value && <div ref={(el: any) => refs.setFloating(el)} />}
        </>
      )
    },
  })

  const { getByRole } = render(<App />)
  await act()

  fireEvent.click(getByRole('button'))

  expect(spy.mock.calls[0]?.[0]).toBe(false)

  await act()

  expect(spy.mock.calls[1]?.[0]).toBe(true)

  fireEvent.click(getByRole('button'))

  await act()
  expect(spy.mock.calls[2]?.[0]).toBe(false)

  fireEvent.click(getByRole('button'))
  await act()

  expect(spy.mock.calls[3]?.[0]).toBe(true)

  fireEvent.click(getByRole('button'))
  await act()
  expect(spy.mock.calls[4]?.[0]).toBe(false)
  cleanup()
})

it('external elements sync', async () => {
  const App = defineComponent({
    setup() {
      const reference = shallowRef<Element>()
      const floating = shallowRef<HTMLElement>()

      const { x, y, refs } = useFloating()

      watchEffect(() => {
        refs.setReference(reference.value)
        refs.setFloating(floating.value)
      })

      return () => (
        <>
          <button ref={(el: any) => reference.value = el} />
          <div ref={(el: any) => floating.value = el} />
          <div data-testid="value">{`${x.value},${y.value}`}</div>
        </>
      )
    },
  })

  const { getByTestId } = render(<App />)

  await act()

  expect(getByTestId('value').textContent).toBe('0,0')
  cleanup()
})

it('external reference element sync', async () => {
  const App = defineComponent({
    setup() {
      const reference = shallowRef<HTMLElement>()

      const { x, y, refs } = useFloating({
        elements: {
          reference,
        },
      })

      return () => (
        <>
          <div data-testid="reference" ref={(el: any) => reference.value = el} />
          <div ref={(el: any) => refs.setFloating(el)} />
          <div data-testid="value">{`${x.value},${y.value}`}</div>
        </>
      )
    },
  })

  const { getByTestId } = render(<App />)
  const mockBoundingClientRect = vi.fn(() => ({
    x: 0,
    y: 0,
    width: 50,
    height: 50,
    top: 0,
    right: 50,
    bottom: 50,
    left: 0,
    toJSON: () => {},
  }))
  const reference = getByTestId('reference')
  reference.getBoundingClientRect = mockBoundingClientRect

  await act()

  expect(getByTestId('value').textContent).toBe('25,50')
  cleanup()
})

it('external floating element sync', async () => {
  const App = defineComponent({
    setup() {
      const floating = shallowRef<HTMLElement>()

      const { x, y, refs } = useFloating({
        elements: {
          floating,
        },
      })

      return () => (
        <>
          <div data-testid="reference" ref={(el: any) => refs.setReference(el)} />
          <div ref={(el: any) => floating.value = el} />
          <div data-testid="value">{`${x.value},${y.value}`}</div>
        </>
      )
    },
  })

  const { getByTestId } = render(<App />)
  const mockBoundingClientRect = vi.fn(() => ({
    x: 0,
    y: 0,
    width: 50,
    height: 50,
    top: 0,
    right: 50,
    bottom: 50,
    left: 0,
    toJSON: () => {},
  }))
  const reference = getByTestId('reference')
  reference.getBoundingClientRect = mockBoundingClientRect

  await act()

  expect(getByTestId('value').textContent).toBe('25,50')
  cleanup()
})

it('external elements sync :2', async () => {
  const App = defineComponent({
    setup() {
      const reference = shallowRef<Element>()
      const floating = shallowRef<HTMLElement>()

      const { x, y } = useFloating({
        elements: {
          reference,
          floating,
        },
      })

      return () => (
        <>
          <div data-testid="reference" ref={(el: any) => reference.value = el} />
          <div ref={(el: any) => floating.value = el} />
          <div data-testid="value">{`${x.value},${y.value}`}</div>
        </>
      )
    },
  })

  const { getByTestId } = render(<App />)
  const mockBoundingClientRect = vi.fn(() => ({
    x: 0,
    y: 0,
    width: 50,
    height: 50,
    top: 0,
    right: 50,
    bottom: 50,
    left: 0,
    toJSON: () => {},
  }))
  const reference = getByTestId('reference')
  reference.getBoundingClientRect = mockBoundingClientRect

  await act()

  expect(getByTestId('value').textContent).toBe('25,50')
  cleanup()
})

it('external elements sync update', async () => {
  const App = defineComponent({
    setup() {
      const reference = shallowRef<Element>()
      const floating = shallowRef<HTMLElement>()

      const { x, y } = useFloating({
        elements: {
          reference,
          floating,
        },
      })

      return () => (
        <>
          <div data-testid="reference" ref={(el: any) => reference.value = el} />
          <div ref={(el: any) => floating.value = el} />
          <div data-testid="value">{`${x.value},${y.value}`}</div>
        </>
      )
    },
  })

  const { getByTestId } = render(<App />)
  await act()

  expect(getByTestId('value').textContent).toBe('0,0')
  cleanup()
})

it('floatingStyles no transform', async () => {
  const App = defineComponent({
    setup() {
      const { refs, floatingStyles } = useFloating({
        transform: false,
      })

      return () => (
        <>
          <div data-testid="reference" ref={(el: any) => refs.setReference(el)} />
          <div
            data-testid="floating"
            ref={(el: any) => refs.setFloating(el)}
            style={floatingStyles.value}
          />
        </>
      )
    },
  })

  const { getByTestId } = render(<App />)

  const mockBoundingClientRect = vi.fn(() => ({
    x: 0,
    y: 0,
    width: 50,
    height: 50,
    top: 0,
    right: 50,
    bottom: 50,
    left: 0,
    toJSON: () => {},
  }))
  const reference = getByTestId('reference')
  reference.getBoundingClientRect = mockBoundingClientRect

  expect(getByTestId('floating').style.position).toBe('absolute')
  expect(getByTestId('floating').style.top).toBe('0px')
  expect(getByTestId('floating').style.left).toBe('0px')

  await act()

  expect(getByTestId('floating').style.position).toBe('absolute')
  expect(getByTestId('floating').style.top).toBe('50px')
  expect(getByTestId('floating').style.left).toBe('25px')
  cleanup()
})
