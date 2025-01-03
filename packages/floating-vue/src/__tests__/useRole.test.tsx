import type { UseRoleProps } from '../../src/hooks/useRole.ts'

import { cleanup, fireEvent, render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { defineComponent, type PropType, ref } from 'vue'

import {
  useClick,
  useFloating,
  useId,
  useInteractions,
  useRole,
} from '../../src/index.ts'
import { act } from '../core/__tests__/utils.ts'

const App = defineComponent({
  props: {
    initiallyOpen: {
      type: Boolean,
      default: false,
    },
    roleProps: {
      type: Object as PropType<UseRoleProps>,
      default: undefined,
    },
  },
  setup(props) {
    const open = ref(props.initiallyOpen)
    const { refs, context } = useFloating({
      open,
      onOpenChange(value) {
        open.value = value
      },
    })
    const { getReferenceProps, getFloatingProps } = useInteractions([
      useRole(context, props.roleProps),
    ])

    return () => (
      <>

        <button
          ref={(el: any) => refs.setReference(el)}
          {...getReferenceProps({
            onClick() {
              open.value = !open.value
            },
          })}
        />

        {open.value && (
          <div
            ref={(el: any) => refs.setFloating(el)}
            {...getFloatingProps()}
          />
        )}
      </>
    )
  },
})

const AppWithExternalRef = defineComponent({
  props: {
    initiallyOpen: {
      type: Boolean,
      default: false,
    },
    roleProps: {
      type: Object as PropType<UseRoleProps>,
      default: undefined,
    },
  },
  setup(props) {
    const open = ref(props.initiallyOpen)
    const nodeId = useId()
    const { refs, context } = useFloating({
      nodeId,
      open,
      onOpenChange(value) {
        open.value = value
      },
    })
    // External ref can use it's own set of interactions hooks, but share context
    const { getFloatingProps } = useInteractions([useRole(context, props.roleProps)])
    const { getReferenceProps } = useInteractions([useRole(context, props.roleProps)])

    return () => (
      <>

        <button
          ref={(el: any) => refs.setReference(el)}
          {...getReferenceProps({
            onClick() {
              open.value = !open.value
            },
          })}
        />

        {open.value && (
          <div
            ref={(el: any) => refs.setFloating(el)}
            {...getFloatingProps()}
          />
        )}
      </>
    )
  },
})

describe('tooltip', () => {
  it('has correct role', async () => {
    render(App, {
      props: {
        initiallyOpen: true,
        roleProps: {
          role: 'tooltip',
        },
      },
    })
    await act()
    expect(screen.queryByRole('tooltip')).toBeInTheDocument()
    cleanup()
  })

  it('sets correct aria attributes based on the open state', async () => {
    render(App, {
      props: {
        roleProps: {
          role: 'tooltip',
        },
      },
    })
    const button = screen.getByRole('button')
    await fireEvent.click(button)
    expect(button.hasAttribute('aria-describedby')).toBe(true)
    await fireEvent.click(button)
    expect(button.hasAttribute('aria-describedby')).toBe(false)
    cleanup()
  })
})

describe('label', () => {
  it('sets correct aria attributes based on the open state', async () => {
    const { container } = render(App, {
      props: {
        initiallyOpen: true,
        roleProps: {
          role: 'label',
        },
      },
    })
    await act()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(container.querySelector('[aria-labelledby]')).toBeInTheDocument()
    cleanup()
  })
})

describe('dialog', () => {
  it('sets correct aria attributes based on the open state', async () => {
    render(App, {
      props: {
        roleProps: {
          role: 'dialog',
        },
      },
    })

    const button = screen.getByRole('button')

    expect(button.getAttribute('aria-haspopup')).toBe('dialog')
    expect(button.getAttribute('aria-expanded')).toBe('false')

    await fireEvent.click(button)

    expect(screen.queryByRole('dialog')).toBeInTheDocument()
    expect(button.getAttribute('aria-controls')).toBe(
      screen.getByRole('dialog').getAttribute('id'),
    )
    expect(button.hasAttribute('aria-describedby')).toBe(false)
    expect(button.getAttribute('aria-expanded')).toBe('true')

    await fireEvent.click(button)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(button.hasAttribute('aria-controls')).toBe(false)
    expect(button.hasAttribute('aria-describedby')).toBe(false)
    expect(button.getAttribute('aria-expanded')).toBe('false')

    cleanup()
  })

  it('sets correct aria attributes with external ref, multiple useRole calls', async () => {
    render(AppWithExternalRef, {
      props: {
        roleProps: {
          role: 'dialog',
        },
      },
    })

    const button = screen.getByRole('button')

    expect(button.getAttribute('aria-haspopup')).toBe('dialog')
    expect(button.getAttribute('aria-expanded')).toBe('false')

    await fireEvent.click(button)

    expect(screen.queryByRole('dialog')).toBeInTheDocument()
    expect(button.getAttribute('aria-controls')).toBe(
      screen.getByRole('dialog').getAttribute('id'),
    )
    expect(button.hasAttribute('aria-describedby')).toBe(false)
    expect(button.getAttribute('aria-expanded')).toBe('true')

    await fireEvent.click(button)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(button.hasAttribute('aria-controls')).toBe(false)
    expect(button.hasAttribute('aria-describedby')).toBe(false)
    expect(button.getAttribute('aria-expanded')).toBe('false')

    cleanup()
  })
})

describe('menu', () => {
  it('sets correct aria attributes based on the open state', async () => {
    render(App, {
      props: {
        roleProps: {
          role: 'menu',
        },
      },
    })

    const button = screen.getByRole('button')

    expect(button.getAttribute('aria-haspopup')).toBe('menu')
    expect(button.getAttribute('aria-expanded')).toBe('false')

    await fireEvent.click(button)

    expect(screen.queryByRole('menu')).toBeInTheDocument()
    expect(button.getAttribute('id')).toBe(
      screen.getByRole('menu').getAttribute('aria-labelledby'),
    )
    expect(button.getAttribute('aria-controls')).toBe(
      screen.getByRole('menu').getAttribute('id'),
    )
    expect(button.hasAttribute('aria-describedby')).toBe(false)
    expect(button.getAttribute('aria-expanded')).toBe('true')

    await fireEvent.click(button)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(button.hasAttribute('aria-controls')).toBe(false)
    expect(button.hasAttribute('aria-describedby')).toBe(false)
    expect(button.getAttribute('aria-expanded')).toBe('false')

    cleanup()
  })
})

describe('listbox', () => {
  it('sets correct aria attributes based on the open state', async () => {
    render(App, {
      props: {
        roleProps: {
          role: 'listbox',
        },
      },
    })

    const button = screen.getByRole('combobox')

    expect(button.getAttribute('aria-haspopup')).toBe('listbox')
    expect(button.getAttribute('aria-expanded')).toBe('false')

    await fireEvent.click(button)

    expect(screen.queryByRole('listbox')).toBeInTheDocument()
    expect(button.getAttribute('aria-controls')).toBe(
      screen.getByRole('listbox').getAttribute('id'),
    )
    expect(button.hasAttribute('aria-describedby')).toBe(false)
    expect(button.getAttribute('aria-expanded')).toBe('true')

    await fireEvent.click(button)

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(button.hasAttribute('aria-controls')).toBe(false)
    expect(button.hasAttribute('aria-describedby')).toBe(false)
    expect(button.getAttribute('aria-expanded')).toBe('false')

    cleanup()
  })
})

describe('select', () => {
  it('sets correct aria attributes based on the open state', async () => {
    const Select = defineComponent({
      setup() {
        const isOpen = ref(false)
        const { refs, context } = useFloating({
          open: isOpen,
          onOpenChange(value) {
            isOpen.value = value
          },
        })
        const { getReferenceProps, getFloatingProps, getItemProps }
        = useInteractions([
          useClick(context),
          useRole(context, { role: 'select' }),
        ])
        return () => (
          <>
            <button ref={(el: any) => refs.setReference(el)} {...getReferenceProps()} />
            {isOpen.value && (
              <div ref={(el: any) => refs.setFloating(el)} {...getFloatingProps()}>
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    data-testid={`item-${i}`}
                    {...getItemProps({ active: i === 2, selected: i === 2 })}
                  />
                ))}
              </div>
            )}
          </>
        )
      },
    })

    render(Select)

    const button = screen.getByRole('combobox')

    expect(button.getAttribute('aria-haspopup')).toBe('listbox')
    expect(button.getAttribute('aria-expanded')).toBe('false')

    await fireEvent.click(button)

    expect(screen.queryByRole('listbox')).toBeInTheDocument()
    expect(button.getAttribute('aria-controls')).toBe(
      screen.getByRole('listbox').getAttribute('id'),
    )
    expect(button.hasAttribute('aria-describedby')).toBe(false)
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(button.getAttribute('aria-autocomplete')).toBe('none')
    expect(screen.getByTestId('item-1').getAttribute('aria-selected')).toBe(
      'false',
    )
    expect(screen.getByTestId('item-2').getAttribute('aria-selected')).toBe(
      'true',
    )

    await fireEvent.click(button)

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(button.hasAttribute('aria-controls')).toBe(false)
    expect(button.hasAttribute('aria-describedby')).toBe(false)
    expect(button.getAttribute('aria-expanded')).toBe('false')

    cleanup()
  })
})

describe('combobox', () => {
  it('sets correct aria attributes based on the open state', async () => {
    const Select = defineComponent({
      setup() {
        const isOpen = ref(false)
        const { refs, context } = useFloating({
          open: isOpen,
          onOpenChange(value) {
            isOpen.value = value
          },
        })
        const { getReferenceProps, getFloatingProps, getItemProps }
        = useInteractions([
          useClick(context),
          useRole(context, { role: 'combobox' }),
        ])
        return () => (
          <>
            <input ref={(el: any) => refs.setReference(el)} {...getReferenceProps()} />
            {isOpen.value && (
              <div ref={(el: any) => refs.setFloating(el)} {...getFloatingProps()}>
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    data-testid={`item-${i}`}
                    {...getItemProps({ active: i === 2, selected: i === 2 })}
                  />
                ))}
              </div>
            )}
          </>
        )
      },
    })

    render(Select)

    const button = screen.getByRole('combobox')

    expect(button.getAttribute('aria-haspopup')).toBe('listbox')
    expect(button.getAttribute('aria-expanded')).toBe('false')

    await fireEvent.click(button)

    expect(screen.queryByRole('listbox')).toBeInTheDocument()
    expect(button.getAttribute('aria-controls')).toBe(
      screen.getByRole('listbox').getAttribute('id'),
    )
    expect(button.hasAttribute('aria-describedby')).toBe(false)
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(button.getAttribute('aria-autocomplete')).toBe('list')
    expect(screen.getByTestId('item-1').getAttribute('aria-selected')).toBe(
      null,
    )
    expect(screen.getByTestId('item-2').getAttribute('aria-selected')).toBe(
      'true',
    )

    await fireEvent.click(button)

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(button.hasAttribute('aria-controls')).toBe(false)
    expect(button.hasAttribute('aria-describedby')).toBe(false)
    expect(button.getAttribute('aria-expanded')).toBe('false')

    cleanup()
  })
})
