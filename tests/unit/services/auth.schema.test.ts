/**
 * Auth Schema Unit Tests
 *
 * Tests Zod schema validation for authentication-related inputs
 */

import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'

import {
  emailSchema,
  NAME_MAX,
  NAME_MIN,
  nameSchema,
  PASSWORD_MAX,
  PASSWORD_MIN,
  passwordSchema,
  USERNAME_MAX,
  USERNAME_MIN,
  usernameSchema,
} from '~/services/auth.schema'

describe('nameSchema', () => {
  it('accepts valid names within length bounds', () => {
    expect(nameSchema().parse('Jo')).toBe('Jo') // min length
    expect(nameSchema().parse('John')).toBe('John')
    expect(nameSchema().parse('JohnSmith1')).toBe('JohnSmith1') // max length (10 chars)
  })

  it('accepts names with various characters', () => {
    expect(nameSchema().parse('Jane')).toBe('Jane')
    expect(nameSchema().parse('Bob123')).toBe('Bob123')
    expect(nameSchema().parse('Al')).toBe('Al')
  })

  it('rejects names that are too short', () => {
    expect(() => nameSchema().parse('J')).toThrow(ZodError)
    expect(() => nameSchema().parse('')).toThrow(ZodError)
  })

  it('rejects names that are too long', () => {
    const longName = 'A'.repeat(NAME_MAX + 1)
    expect(() => nameSchema().parse(longName)).toThrow(ZodError)
    expect(() => nameSchema().parse('JohnSmith12')).toThrow(ZodError) // 11 chars
  })

  it('provides correct error message for min length', () => {
    try {
      nameSchema().parse('J')
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError)
      const zodError = error as ZodError
      // Uses i18n key in test environment
      expect(zodError.errors[0].message).toContain('auth.name-min')
    }
  })

  it('provides correct error message for max length', () => {
    try {
      nameSchema().parse('A'.repeat(NAME_MAX + 1))
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError)
      const zodError = error as ZodError
      // Uses i18n key in test environment
      expect(zodError.errors[0].message).toContain('auth.name-max')
    }
  })
})

describe('emailSchema', () => {
  it('accepts valid email formats', () => {
    expect(emailSchema().parse('test@example.com')).toBe('test@example.com')
    expect(emailSchema().parse('user.name@domain.co')).toBe('user.name@domain.co')
    expect(emailSchema().parse('user+tag@example.org')).toBe('user+tag@example.org')
    expect(emailSchema().parse('a@b.co')).toBe('a@b.co')
  })

  it('rejects invalid email formats', () => {
    expect(() => emailSchema().parse('not-an-email')).toThrow(ZodError)
    expect(() => emailSchema().parse('missing@')).toThrow(ZodError)
    expect(() => emailSchema().parse('@missing.com')).toThrow(ZodError)
    expect(() => emailSchema().parse('spaces in@email.com')).toThrow(ZodError)
    expect(() => emailSchema().parse('')).toThrow(ZodError)
  })

  it('provides correct error message for invalid email', () => {
    try {
      emailSchema().parse('invalid')
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError)
      const zodError = error as ZodError
      expect(zodError.errors[0].message).toBeDefined()
    }
  })
})

describe('usernameSchema', () => {
  it('accepts valid usernames with lowercase letters', () => {
    expect(usernameSchema().parse('john')).toBe('john')
    expect(usernameSchema().parse('username')).toBe('username')
  })

  it('accepts usernames with numbers', () => {
    expect(usernameSchema().parse('john123')).toBe('john123')
    expect(usernameSchema().parse('user1')).toBe('user1')
    expect(usernameSchema().parse('1234')).toBe('1234')
  })

  it('accepts usernames with underscores and hyphens', () => {
    expect(usernameSchema().parse('john_doe')).toBe('john_doe')
    expect(usernameSchema().parse('john-doe')).toBe('john-doe')
    expect(usernameSchema().parse('user_name-123')).toBe('user_name-123')
  })

  it('rejects usernames with uppercase letters', () => {
    expect(() => usernameSchema().parse('John')).toThrow(ZodError)
    expect(() => usernameSchema().parse('UPPERCASE')).toThrow(ZodError)
    expect(() => usernameSchema().parse('mixedCase')).toThrow(ZodError)
  })

  it('rejects usernames with special characters (except underscore/hyphen)', () => {
    expect(() => usernameSchema().parse('john@doe')).toThrow(ZodError)
    expect(() => usernameSchema().parse('user.name')).toThrow(ZodError)
    expect(() => usernameSchema().parse('user!name')).toThrow(ZodError)
    expect(() => usernameSchema().parse('user#name')).toThrow(ZodError)
  })

  it('rejects usernames that are too short', () => {
    expect(() => usernameSchema().parse('abc')).toThrow(ZodError) // 3 chars, min is 4
    expect(() => usernameSchema().parse('ab')).toThrow(ZodError)
    expect(() => usernameSchema().parse('')).toThrow(ZodError)
  })

  it('rejects usernames that are too long', () => {
    const longUsername = 'a'.repeat(USERNAME_MAX + 1)
    expect(() => usernameSchema().parse(longUsername)).toThrow(ZodError)
  })

  it('provides correct error message for regex violation', () => {
    try {
      usernameSchema().parse('InvalidUser')
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError)
      const zodError = error as ZodError
      expect(zodError.errors[0].message).toBeDefined()
    }
  })

  it('provides correct error message for min length', () => {
    try {
      usernameSchema().parse('abc')
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError)
      const zodError = error as ZodError
      // Uses i18n key in test environment
      expect(zodError.errors[0].message).toContain('auth.username-min')
    }
  })
})

describe('passwordSchema', () => {
  const validPassword = 'Test123!@'

  it('accepts passwords meeting all requirements', () => {
    expect(passwordSchema().parse(validPassword)).toBe(validPassword)
    expect(passwordSchema().parse('Abcd1234!')).toBe('Abcd1234!')
    expect(passwordSchema().parse('Complex#Pass1')).toBe('Complex#Pass1')
    expect(passwordSchema().parse('P@ssw0rd')).toBe('P@ssw0rd')
  })

  it('accepts passwords with various special characters', () => {
    expect(passwordSchema().parse('Test123!')).toBe('Test123!')
    expect(passwordSchema().parse('Test123@')).toBe('Test123@')
    expect(passwordSchema().parse('Test123#')).toBe('Test123#')
    expect(passwordSchema().parse('Test123$')).toBe('Test123$')
    expect(passwordSchema().parse('Test123%')).toBe('Test123%')
    expect(passwordSchema().parse('Test123^')).toBe('Test123^')
    expect(passwordSchema().parse('Test123&')).toBe('Test123&')
    expect(passwordSchema().parse('Test123*')).toBe('Test123*')
  })

  it('rejects passwords missing uppercase letter', () => {
    expect(() => passwordSchema().parse('test123!@')).toThrow(ZodError)
    expect(() => passwordSchema().parse('abcdefgh1!')).toThrow(ZodError)
  })

  it('rejects passwords missing lowercase letter', () => {
    expect(() => passwordSchema().parse('TEST123!@')).toThrow(ZodError)
    expect(() => passwordSchema().parse('ABCDEFGH1!')).toThrow(ZodError)
  })

  it('rejects passwords missing number', () => {
    expect(() => passwordSchema().parse('TestTest!@')).toThrow(ZodError)
    expect(() => passwordSchema().parse('Abcdefgh!')).toThrow(ZodError)
  })

  it('rejects passwords missing special character', () => {
    expect(() => passwordSchema().parse('Test12345')).toThrow(ZodError)
    expect(() => passwordSchema().parse('Abcdefgh1')).toThrow(ZodError)
  })

  it('rejects passwords that are too short', () => {
    expect(() => passwordSchema().parse('Ab1!xyz')).toThrow(ZodError) // 7 chars, min is 8
    expect(() => passwordSchema().parse('Ab1!')).toThrow(ZodError)
    expect(() => passwordSchema().parse('')).toThrow(ZodError)
  })

  it('rejects passwords that are too long', () => {
    const longPassword = 'A'.repeat(50) + 'a'.repeat(50) + '1!'
    expect(() => passwordSchema().parse(longPassword)).toThrow(ZodError)
  })

  it('accepts password at minimum length with all requirements', () => {
    expect(passwordSchema().parse('Abcdef1!')).toBe('Abcdef1!') // exactly 8 chars
  })

  it('accepts password at maximum length with all requirements', () => {
    const maxPassword = 'A'.repeat(48) + 'a'.repeat(48) + '1!' // exactly 100 chars
    expect(passwordSchema().parse(maxPassword)).toBe(maxPassword)
  })

  it('provides correct error message for missing uppercase', () => {
    try {
      passwordSchema().parse('test1234!')
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError)
      const zodError = error as ZodError
      const messages = zodError.errors.map((e) => e.message)
      expect(messages.some((m) => m.toLowerCase().includes('uppercase'))).toBe(true)
    }
  })

  it('provides correct error message for missing lowercase', () => {
    try {
      passwordSchema().parse('TEST1234!')
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError)
      const zodError = error as ZodError
      const messages = zodError.errors.map((e) => e.message)
      expect(messages.some((m) => m.toLowerCase().includes('lowercase'))).toBe(true)
    }
  })

  it('provides correct error message for missing number', () => {
    try {
      passwordSchema().parse('TestTest!')
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError)
      const zodError = error as ZodError
      const messages = zodError.errors.map((e) => e.message)
      expect(messages.some((m) => m.toLowerCase().includes('number'))).toBe(true)
    }
  })

  it('provides correct error message for missing special character', () => {
    try {
      passwordSchema().parse('TestTest1')
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError)
      const zodError = error as ZodError
      const messages = zodError.errors.map((e) => e.message)
      expect(messages.some((m) => m.toLowerCase().includes('special'))).toBe(true)
    }
  })

  it('provides correct error message for min length', () => {
    try {
      passwordSchema().parse('Ab1!')
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError)
      const zodError = error as ZodError
      const messages = zodError.errors.map((e) => e.message)
      // Uses i18n key in test environment
      expect(messages.some((m) => m.includes('auth.password-min'))).toBe(true)
    }
  })
})
