import { createContext } from '@perigee-ui/floating-vue/vue'
import type { Ref } from 'vue'

export const [provideSelectContext, useSelectContext] = createContext<{
  getItemProps: (paylaod?: any) => Record<string, any>
  activeIndex: Ref<number | undefined>
}>('FloatingListContext')
