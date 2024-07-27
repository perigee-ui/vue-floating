import '@testing-library/jest-dom/vitest'
import { expect, vi } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

vi.spyOn(window, 'requestAnimationFrame').mockImplementation(
  (callback: FrameRequestCallback): number => {
    callback(0)
    return 0
  },
)
