/** Erster Buchstabe im lokalen E-Mail-Teil (a–z), Kleinbuchstabe — „isim“ vor @. */
function getNameFirstLetterFromEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase()
  const local = trimmed.split('@')[0] ?? ''
  const firstLetterMatch = local.match(/[a-z]/i)
  if (firstLetterMatch) return firstLetterMatch[0].toLowerCase()
  if (local.length > 0) return local[0].toLowerCase()
  return null
}

/**
 * Passwort: genau 13 Zeichen — erster Buchstabe = erster Buchstabe des Namens in der E-Mail (local part),
 * dann genau 11 Ziffern, dann genau „*“.
 */
export function isPasswordValidForEmail(email: string, password: string): boolean {
  const expectedFirst = getNameFirstLetterFromEmail(email)
  if (!expectedFirst || !/^[a-z]$/.test(expectedFirst)) return false

  if (password.length !== 13) return false
  if (password[0].toLowerCase() !== expectedFirst) return false

  const middle = password.slice(1, 12)
  if (!/^\d{11}$/.test(middle)) return false

  if (password[12] !== '*') return false

  return true
}
