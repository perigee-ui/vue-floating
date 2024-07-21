let count = 0

function genId() {
  return `floating-ui-${Math.random().toString(36).slice(2, 6)}${count++}`
}

export const useId = genId
