import { type PropType, defineComponent, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/vue'
import { useClick, useFloating, useHover, useInteractions } from '../index.ts'
import type { UseClickProps } from '../hooks/useClick.ts'
import { act } from '../core/__tests__/utils.ts'

const App = defineComponent({
  name: 'App',
  props: {
    button: {
      type: Boolean,
      default: true,
    },
    typeable: {
      type: Boolean,
      default: false,
    },
    initialOpen: {
      type: Boolean,
      default: false,
    },
    clickProps: {
      type: Object as PropType<UseClickProps>,
      default: undefined,
    },
  },
  setup(props) {
    const open = ref(props.initialOpen)
    const { refs, context } = useFloating({
      open,
      onOpenChange: value => (open.value = value),
    })
    const { getReferenceProps, getFloatingProps } = useInteractions([
      useClick(context, props.clickProps),
    ])

    const Tag = props.typeable ? 'input' : props.button ? 'button' : 'div'

    return () => (
      <>
        <Tag
          {...getReferenceProps({ ref: refs.setReference })}
          data-testid="reference"
        />
        {open.value && (
          <div role="tooltip" {...getFloatingProps({ ref: refs.setFloating })} />
        )}
      </>
    )
  },
})

describe('default', () => {
  it('changes `open` state to `true` after click', async () => {
    render(<App />)
    await act()

    const button = screen.getByRole('button')

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await await fireEvent.click(button)
    await act()

    expect(screen.queryByRole('tooltip')).toBeInTheDocument()

    cleanup()
  })

  it('changes `open` state to `false` after two clicks', async () => {
    render(<App />)
    await act()

    const button = screen.getByRole('button')

    await fireEvent.click(button)
    await act()

    await fireEvent.click(button)
    await act()

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    cleanup()
  })
})

describe('mousedown `event` prop', () => {
  it('changes `open` state to `true` after click', async () => {
    render(<App clickProps={{ event: 'mousedown' }} />)
    await act()
    const button = screen.getByRole('button')

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await fireEvent.click(button)
    await act()

    expect(screen.queryByRole('tooltip')).toBeInTheDocument()

    cleanup()
  })

  it('changes `open` state to `false` after two clicks', async () => {
    render(<App clickProps={{ event: 'mousedown' }} />)
    const button = screen.getByRole('button')
    await act()

    await fireEvent.click(button)
    await act()

    await fireEvent.click(button)
    await act()

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    cleanup()
  })
})

describe('`toggle` prop', () => {
  it('changes `open` state to `true` after click', async () => {
    render(<App clickProps={{ toggle: false }} />)
    await act()
    const button = screen.getByRole('button')

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await fireEvent.click(button)
    await act()

    expect(screen.queryByRole('tooltip')).toBeInTheDocument()

    cleanup()
  })

  it('`open` state remains `true` after two clicks', async () => {
    render(<App clickProps={{ toggle: false }} />)
    await act()
    const button = screen.getByRole('button')

    await fireEvent.click(button)
    await act()
    await fireEvent.click(button)
    await act()

    expect(screen.queryByRole('tooltip')).toBeInTheDocument()

    cleanup()
  })

  it('`open` state remains `true` after two clicks with `mousedown`', async () => {
    render(<App clickProps={{ toggle: false, event: 'mousedown' }} />)
    await act()
    const button = screen.getByRole('button')

    await fireEvent.click(button)
    await act()
    await fireEvent.click(button)
    await act()

    expect(screen.queryByRole('tooltip')).toBeInTheDocument()

    cleanup()
  })

  it('`open` state becomes `false` after clicking when initially open', async () => {
    render(<App initialOpen={true} />)
    await act()
    const button = screen.getByRole('button')

    await fireEvent.click(button)
    await act()

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    cleanup()
  })
})

describe('non-buttons', () => {
  it('adds Enter keydown', async () => {
    render(<App button={false} />)
    await act()

    const button = screen.getByTestId('reference')
    await fireEvent.keyDown(button, { key: 'Enter' })
    await act()

    expect(screen.queryByRole('tooltip')).toBeInTheDocument()
    cleanup()
  })

  it('adds Space keyup', async () => {
    render(<App button={false} />)
    await act()

    const button = screen.getByTestId('reference')
    await fireEvent.keyDown(button, { key: ' ' })
    await act()
    await fireEvent.keyUp(button, { key: ' ' })
    await act()

    expect(screen.queryByRole('tooltip')).toBeInTheDocument()
    cleanup()
  })

  it('typeable reference does not receive space key handler', async () => {
    render(<App typeable={true} />)
    await act()

    const button = screen.getByTestId('reference')
    await fireEvent.keyDown(button, { key: ' ' })
    await act()
    await fireEvent.keyUp(button, { key: ' ' })
    await act()

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    cleanup()
  })

  it('typeable reference does receive Enter key handler', async () => {
    render(<App typeable={true} />)
    await act()

    const button = screen.getByTestId('reference')
    await fireEvent.keyDown(button, { key: 'Enter' })
    await act()

    expect(screen.queryByRole('tooltip')).toBeInTheDocument()
    cleanup()
  })
})

it('ignores Space keydown on another element then keyup on the button', async () => {
  render(<App />)
  await act()

  const button = screen.getByRole('button')
  await fireEvent.keyDown(document.body, { key: ' ' })
  await act()
  await fireEvent.keyUp(button, { key: ' ' })
  await act()

  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  cleanup()
})

it('with useHover does not close on mouseleave after click', async () => {
  const App = defineComponent({
    setup() {
      const open = ref(false)
      const { refs, context } = useFloating({
        open,
        onOpenChange: value => (open.value = value),
      })
      const { getReferenceProps, getFloatingProps } = useInteractions([
        useClick(context),
        useHover(context),
      ])

      return () => (
        <>
          <button
            {...getReferenceProps({ ref: refs.setReference })}
            data-testid="reference"
          />
          {open.value && (
            <div role="tooltip" {...getFloatingProps({ ref: refs.setFloating })} />
          )}
        </>
      )
    },
  })

  render(<App />)
  await act()

  const button = screen.getByTestId('reference')
  fireEvent.mouseEnter(button)
  await act()
  fireEvent.click(button)
  await act()
  fireEvent.mouseLeave(button)
  await act()

  expect(screen.queryByRole('tooltip')).toBeInTheDocument()
  cleanup()
})

it('reason string', async () => {
  const App = defineComponent({
    setup() {
      const open = ref(false)
      const { refs, context } = useFloating({
        open,
        onOpenChange(isOpen, _, reason) {
          open.value = isOpen
          expect(reason).toBe('click')
        },
      })
      const { getReferenceProps, getFloatingProps } = useInteractions([
        useClick(context),
      ])

      return () => (
        <>
          <button
            {...getReferenceProps({ ref: refs.setReference })}
            data-testid="reference"
          />
          {open.value && (
            <div role="tooltip" {...getFloatingProps({ ref: refs.setFloating })} />
          )}
        </>
      )
    },
  })

  render(<App />)
  await act()
  const button = screen.getByRole('button')
  fireEvent.click(button)
  await act()
  fireEvent.click(button)
  await act()
  cleanup()
})
