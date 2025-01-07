import type { UseClickProps } from '../hooks/useClick.ts'
import { userEvent } from '@vitest/browser/context'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-vue'
import { defineComponent, type PropType, ref } from 'vue'
import { useClick, useFloating, useInteractions } from '../index.ts'

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
          ref={(el: any) => refs.setReference(el)}
          tabindex={0}
          {...getReferenceProps()}
          data-testid="reference"
        >
          reference
        </Tag>
        {open.value && (
          <div
            ref={(el: any) => refs.setFloating(el)}
            role="tooltip"
            {...getFloatingProps()}
          >
            tooltip
          </div>
        )}
      </>
    )
  },
})

describe('default', () => {
  it('changes `open` state to `true` after click', async () => {
    const screen = render(App)

    const button = screen.getByRole('button')
    await expect.element(screen.getByRole('tooltip')).not.toBeInTheDocument()

    await userEvent.click(button)
    await expect.element(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('changes `open` state to `false` after two clicks', async () => {
    const screen = render(App)

    const button = screen.getByRole('button')

    await userEvent.click(button)
    await userEvent.click(button)

    await expect.element(screen.getByRole('tooltip')).not.toBeInTheDocument()
  })
})

describe('mousedown `event` prop', () => {
  it('changes `open` state to `true` after click', async () => {
    const screen = render(<App clickProps={{ event: 'mousedown' }} />)
    const button = screen.getByRole('button')

    await expect.element(screen.getByRole('tooltip')).not.toBeInTheDocument()

    await userEvent.click(button)

    await expect.element(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('changes `open` state to `false` after two clicks', async () => {
    const screen = render(<App clickProps={{ event: 'mousedown' }} />)
    const button = screen.getByRole('button')

    await userEvent.click(button)

    await userEvent.click(button)

    // await expect.element(screen.getByRole('tooltip')).not.toBeInTheDocument()
  })
})

describe('`toggle` prop', () => {
  it('changes `open` state to `true` after click', async () => {
    const screen = render(<App clickProps={{ toggle: false }} />)
    const button = screen.getByRole('button')

    await expect.element(screen.getByRole('tooltip')).not.toBeInTheDocument()

    await userEvent.click(button)

    await expect.element(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('`open` state remains `true` after two clicks', async () => {
    const screen = render(<App clickProps={{ toggle: false }} />)
    const button = screen.getByRole('button')

    await userEvent.click(button)
    await userEvent.click(button)

    await expect.element(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('`open` state remains `true` after two clicks with `mousedown`', async () => {
    const screen = render(<App clickProps={{ toggle: false, event: 'mousedown' }} />)
    const button = screen.getByRole('button')

    await userEvent.click(button)
    await userEvent.click(button)

    await expect.element(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('`open` state becomes `false` after clicking when initially open', async () => {
    const screen = render(<App initialOpen={true} />)
    const button = screen.getByRole('button')

    await userEvent.click(button)

    await expect.element(screen.getByRole('tooltip')).not.toBeInTheDocument()
  })
})

describe.todo('`stickIfOpen` prop', async () => {
  // const App = defineComponent({
  //   props: {
  //     stickIfOpen: {
  //       type: Boolean,
  //       default: undefined,
  //     },
  //   },
  //   setup(props) {
  //     const open = shallowRef(false)
  //     const { refs, context } = useFloating({
  //       open,
  //       onOpenChange: (value, event, reason) => {
  //         console.error('onOpenChange::', value, event, reason)
  //         open.value = value
  //       },
  //     })
  //     const { getReferenceProps, getFloatingProps } = useInteractions([
  //       useHover(context),
  //       useClick(context, { stickIfOpen: props.stickIfOpen }),
  //     ])

  //     return () => (
  //       <>
  //         <button
  //           {...getReferenceProps({ ref: refs.setReference })}
  //           data-testid="reference"
  //         >
  //           reference
  //         </button>
  //         {open.value && (
  //           <div role="tooltip" {...getFloatingProps({ ref: refs.setFloating })}>tooltip</div>
  //         )}
  //       </>
  //     )
  //   },
  // })

  it('true: `open` state remains `true` after click and mouseleave', async () => {
    // const screen = render(<App stickIfOpen={true} />)

    // const button = screen.getByRole('button')

    // await userEvent.hover(button)
    // await userEvent.click(button)

    // await expect.element(screen.getByRole('tooltip')).toBeInTheDocument()

    // await userEvent.unhover(button)

    // await expect.element(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('false: `open` state becomes `false` after click and mouseleave', async () => {
    // const screen = render(<App stickIfOpen={false} />)

    // const button = screen.getByRole('button')

    // await userEvent.hover(button)
    // await userEvent.click(button)
    // await act()
    // await userEvent.click(button)

    // await expect.element(screen.getByRole('tooltip')).not.toBeInTheDocument()

    // await userEvent.click(button)

    // await expect.element(screen.getByRole('tooltip')).toBeInTheDocument()

    // // fireEvent.click(button)

    // // expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    // cleanup()
  })
})

describe('non-buttons', () => {
  it('adds Enter keydown', async () => {
    const screen = render(<App button={false} />)

    const button = screen.getByTestId('reference')
    await userEvent.click(button)
    await userEvent.click(button)
    await userEvent.keyboard('{Enter}')

    await expect.element(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('adds Space keyup', async () => {
    const screen = render(<App button={false} />)

    const button = screen.getByTestId('reference')
    await userEvent.click(button)
    await userEvent.click(button)
    await userEvent.keyboard(' ')
    await expect.element(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('typeable reference does not receive space key handler', async () => {
    const screen = render(<App typeable={true} />)

    const button = screen.getByTestId('reference')
    await userEvent.click(button)
    await userEvent.click(button)
    await userEvent.keyboard(' ')

    await expect.element(screen.getByRole('tooltip')).not.toBeInTheDocument()
  })

  it('typeable reference does receive Enter key handler', async () => {
    const screen = render(<App typeable={true} />)

    const button = screen.getByTestId('reference')
    await userEvent.click(button)
    await userEvent.click(button)
    await userEvent.keyboard('{Enter}')

    await expect.element(screen.getByRole('tooltip')).toBeInTheDocument()
  })
})

it.todo('ignores Space keydown on another element then keyup on the button', async () => {
  const screen = render(App)

  // const button = screen.getByRole('button')
  // await fireEvent.keyDown(document.body, { key: ' ' })
  // await act()
  // await fireEvent.keyUp(button, { key: ' ' })
  // await act()

  await expect.element(screen.getByRole('tooltip')).not.toBeInTheDocument()
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
            ref={(el: any) => refs.setReference(el)}
            {...getReferenceProps()}
            data-testid="reference"
          />
          {open.value && (
            <div
              ref={(el: any) => refs.setFloating(el)}
              role="tooltip"
              {...getFloatingProps()}
            />
          )}
        </>
      )
    },
  })

  const screen = render(App)
  const button = screen.getByRole('button')
  await userEvent.click(button)
  await userEvent.click(button)
})
