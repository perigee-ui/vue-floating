import { nextTick } from 'vue'

export async function tick(times: number) {
  while (times--) {
    await nextTick()
  }
}

// in order to test transitions, we need to use
// await rAF() after firing transition events.
export async function act() {
  return new Promise((res) => {
    requestAnimationFrame(async () => {
      res(null)
    })
  })
}
