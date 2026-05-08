export async function encryptWithAgePassphrase(plaintext: string, passphrase: string) {
  if (passphrase.trim().length < 12) {
    throw new Error('Use a passphrase with at least 12 characters.')
  }

  const [age, sodiumModule] = await Promise.all([
    import('age-encryption'),
    import('libsodium-wrappers-sumo'),
  ])
  const sodium = sodiumModule.default
  await sodium.ready

  const encrypter = new age.Encrypter()
  encrypter.setScryptWorkFactor(15)
  encrypter.setPassphrase(passphrase)
  const ciphertext = await encrypter.encrypt(plaintext)
  const armored = age.armor.encode(ciphertext)
  const checksum = sodium.crypto_generichash(32, plaintext, null, 'hex')

  return { armored, checksum }
}

export async function generateAgeRecipientPair() {
  const age = await import('age-encryption')
  const identity = await age.generateIdentity()
  const recipient = await age.identityToRecipient(identity)
  return { identity, recipient }
}
