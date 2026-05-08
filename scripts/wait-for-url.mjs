const url = process.argv[2]
const deadline = Date.now() + 15000

while (Date.now() < deadline) {
  try {
    const response = await fetch(url)
    if (response.ok) process.exit(0)
  } catch {
    // Retry until the static server is ready.
  }
  await new Promise((resolve) => setTimeout(resolve, 250))
}

console.error(`Timed out waiting for ${url}`)
process.exit(1)
