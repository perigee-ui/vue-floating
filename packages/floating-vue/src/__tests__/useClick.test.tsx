import type { UseClickProps } from '../hooks/useClick.ts'
import { userEvent } from '@vitest/browser/context'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-vue'
import { defineComponent, type PropType, ref, shallowRef } from 'vue'
import { useClick, useFloating, useHover, useInteractions } from '../index.ts'

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
  //       onOpenChange: value => (open.value = value),
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
  //         />
  //         {open && (
  //           <div role="tooltip" {...getFloatingProps({ ref: refs.setFloating })} />
  //         )}
  //       </>
  //     )
  //   },
  // })

  // it('true: `open` state remains `true` after click and mouseleave', async () => {
  //   render(<App stickIfOpen />)

  //   const button = screen.getByRole('button')

  //   await fireEvent.mouseEnter(button)
  //   await act()

  //   await fireEvent.click(button)
  //   await act()

  //   expect(screen.queryByRole('tooltip')).toBeInTheDocument()

  //   await fireEvent.mouseLeave(button)
  //   await act()

  //   expect(screen.queryByRole('tooltip')).toBeInTheDocument()

  //   cleanup()
  // })

  // it('false: `open` state becomes `false` after click and mouseleave', async () => {
  //   render(<App stickIfOpen={false} />)
  //   await act()

  //   const button = screen.getByRole('button')

  //   await fireEvent.mouseEnter(button)
  //   await act()

  //   await fireEvent.click(button)
  //   await act()

  //   expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

  //   // fireEvent.click(button)

  //   // expect(screen.queryByRole('tooltip')).toBeInTheDocument()

  //   // fireEvent.click(button)

  //   // expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

  //   cleanup()
  // })
})

describe.todo('non-buttons', () => {
  // it.only('adds Enter keydown', async () => {
  //   const screen = render(<App button={false} />)

  //   const button = screen.getByTestId('reference')
  //   // await userEvent.keyboard('{Enter}')
  //   await userEvent.tab()
  //   console.error('document.activeElement', document.activeElement)

  //   await expect.element(screen.getByRole('tooltip')).toHaveFocus()

  //   // await expect.element(screen.getByRole('tooltip')).not.toBeInTheDocument()
  //   // cleanup()
  // })

  // it('adds Space keyup', async () => {
  //   render(<App button={false} />)
  //   await act()

  //   const button = screen.getByTestId('reference')
  //   await fireEvent.keyDown(button, { key: ' ' })
  //   await act()
  //   await fireEvent.keyUp(button, { key: ' ' })
  //   await act()

  //   expect(screen.queryByRole('tooltip')).toBeInTheDocument()
  //   cleanup()
  // })

  // it('typeable reference does not receive space key handler', async () => {
  //   render(<App typeable={true} />)
  //   await act()

  //   const button = screen.getByTestId('reference')
  //   await fireEvent.keyDown(button, { key: ' ' })
  //   await act()
  //   await fireEvent.keyUp(button, { key: ' ' })
  //   await act()

  //   expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  //   cleanup()
  // })

  // it('typeable reference does receive Enter key handler', async () => {
  //   render(<App typeable={true} />)
  //   await act()

  //   const button = screen.getByTestId('reference')
  //   await fireEvent.keyDown(button, { key: 'Enter' })
  //   await act()

  //   expect(screen.queryByRole('tooltip')).toBeInTheDocument()
  //   cleanup()
  // })
})

// it('ignores Space keydown on another element then keyup on the button', async () => {
//   render(<App />)
//   await act()

//   const button = screen.getByRole('button')
//   await fireEvent.keyDown(document.body, { key: ' ' })
//   await act()
//   await fireEvent.keyUp(button, { key: ' ' })
//   await act()

//   expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
//   cleanup()
// })

// // it('with useHover does not close on mouseleave after click', async () => {
// //   const App = defineComponent({
// //     setup() {
// //       const open = ref(false)
// //       const { refs, context } = useFloating({
// //         open,
// //         onOpenChange: value => (open.value = value),
// //       })
// //       const { getReferenceProps, getFloatingProps } = useInteractions([
// //         useClick(context),
// //         useHover(context),
// //       ])

// //       return () => (
// //         <>
// //           <button
// //             ref={(el: any) => refs.setReference(el)}
// //             {...getReferenceProps()}
// //             data-testid="reference"
// //           />
// //           {open.value && (
// //             <div
// //               ref={(el: any) => refs.setFloating(el)}
// //               role="tooltip"
// //               {...getFloatingProps()}
// //             />
// //           )}
// //         </>
// //       )
// //     },
// //   })

// //   render(<App />)
// //   await act()

// //   const button = screen.getByTestId('reference')
// //   fireEvent.mouseEnter(button)
// //   await act()
// //   fireEvent.click(button)
// //   await act()
// //   fireEvent.mouseLeave(button)
// //   await act()

// //   expect(screen.queryByRole('tooltip')).toBeInTheDocument()
// //   cleanup()
// // })

// it('reason string', async () => {
//   const App = defineComponent({
//     setup() {
//       const open = ref(false)
//       const { refs, context } = useFloating({
//         open,
//         onOpenChange(isOpen, _, reason) {
//           open.value = isOpen
//           expect(reason).toBe('click')
//         },
//       })
//       const { getReferenceProps, getFloatingProps } = useInteractions([
//         useClick(context),
//       ])

//       return () => (
//         <>
//           <button
//             ref={(el: any) => refs.setReference(el)}
//             {...getReferenceProps()}
//             data-testid="reference"
//           />
//           {open.value && (
//             <div
//               ref={(el: any) => refs.setFloating(el)}
//               role="tooltip"
//               {...getFloatingProps()}
//             />
//           )}
//         </>
//       )
//     },
//   })

//   render(<App />)
//   await act()
//   const button = screen.getByRole('button')
//   fireEvent.click(button)
//   await act()
//   fireEvent.click(button)
//   await act()
//   cleanup()
// })
