export function seededShuffle<T>(array: T[], seed: string): T[] {
  const shuffled = [...array]
  let currentIndex = shuffled.length
  let temporaryValue, randomIndex

  let seedValue = 0
  for (let i = 0; i < seed.length; i++) {
    seedValue += seed.charCodeAt(i)
  }

  const random = () => {
    seedValue = (seedValue * 9301 + 49297) % 233280
    return seedValue / 233280
  }

  while (0 !== currentIndex) {
    randomIndex = Math.floor(random() * currentIndex)
    currentIndex -= 1

    temporaryValue = shuffled[currentIndex]
    shuffled[currentIndex] = shuffled[randomIndex]
    shuffled[randomIndex] = temporaryValue
  }

  return shuffled
}