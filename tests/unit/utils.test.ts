/**
 * Utility Functions Unit Tests
 *
 * Tests pure utility functions from libs/utils.ts
 */

import { describe, expect, it } from 'vitest'

import {
  cn,
  cx,
  keysToCamelCase,
  objectKeysTyped,
  tryCatchAsync,
  tryCatchSync,
} from '~/libs/utils'

describe('cx (className merge)', () => {
  it('merges class names', () => {
    expect(cx('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cx('foo', false && 'bar', 'baz')).toBe('foo baz')
    expect(cx('foo', true && 'bar', 'baz')).toBe('foo bar baz')
  })

  it('handles arrays', () => {
    expect(cx(['foo', 'bar'])).toBe('foo bar')
  })

  it('merges tailwind classes correctly', () => {
    // Later classes should override earlier ones
    expect(cx('p-4', 'p-2')).toBe('p-2')
    expect(cx('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles undefined and null', () => {
    expect(cx('foo', undefined, null, 'bar')).toBe('foo bar')
  })

  it('handles empty strings', () => {
    expect(cx('foo', '', 'bar')).toBe('foo bar')
  })
})

describe('cn (alias for cx)', () => {
  it('works the same as cx', () => {
    expect(cn('foo', 'bar')).toBe(cx('foo', 'bar'))
    expect(cn('p-4', 'p-2')).toBe(cx('p-4', 'p-2'))
  })
})

describe('objectKeysTyped', () => {
  it('returns typed array of object keys', () => {
    const obj = { name: 'test', age: 25, active: true }
    const keys = objectKeysTyped(obj)

    expect(keys).toContain('name')
    expect(keys).toContain('age')
    expect(keys).toContain('active')
    expect(keys.length).toBe(3)
  })

  it('works with empty objects', () => {
    const keys = objectKeysTyped({})
    expect(keys).toEqual([])
  })
})

describe('keysToCamelCase', () => {
  it('converts snake_case keys to camelCase', () => {
    const input = {
      first_name: 'John',
      last_name: 'Doe',
      created_at: '2024-01-01',
    }

    const result = keysToCamelCase(input)

    expect(result).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      createdAt: '2024-01-01',
    })
  })

  it('handles already camelCase keys', () => {
    const input = {
      firstName: 'John',
      lastName: 'Doe',
    }

    const result = keysToCamelCase(input)

    expect(result).toEqual({
      firstName: 'John',
      lastName: 'Doe',
    })
  })

  it('handles mixed case keys', () => {
    const input = {
      user_name: 'john',
      userEmail: 'john@example.com',
      USER_ID: 123,
    }

    const result = keysToCamelCase(input)

    expect(result).toHaveProperty('userName')
    expect(result).toHaveProperty('userEmail')
    expect(result).toHaveProperty('userId')
  })

  it('preserves values', () => {
    const input = {
      array_field: [1, 2, 3],
      object_field: { nested: true },
      null_field: null,
    }

    const result = keysToCamelCase(input)

    expect(result.arrayField).toEqual([1, 2, 3])
    expect(result.objectField).toEqual({ nested: true })
    expect(result.nullField).toBeNull()
  })
})

describe('tryCatchSync', () => {
  it('returns [null, value] on success', () => {
    const [error, value] = tryCatchSync(() => 'success')

    expect(error).toBeNull()
    expect(value).toBe('success')
  })

  it('returns [error, null] on failure', () => {
    const [error, value] = tryCatchSync(() => {
      throw new Error('test error')
    })

    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe('test error')
    expect(value).toBeNull()
  })

  it('handles complex return values', () => {
    const complexValue = { data: [1, 2, 3], nested: { key: 'value' } }
    const [error, value] = tryCatchSync(() => complexValue)

    expect(error).toBeNull()
    expect(value).toEqual(complexValue)
  })
})

describe('tryCatchAsync', () => {
  it('returns [null, value] on success', async () => {
    const [error, value] = await tryCatchAsync(Promise.resolve('success'))

    expect(error).toBeNull()
    expect(value).toBe('success')
  })

  it('returns [error, null] on rejection', async () => {
    const [error, value] = await tryCatchAsync(
      Promise.reject(new Error('async error'))
    )

    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe('async error')
    expect(value).toBeNull()
  })

  it('handles async functions', async () => {
    const asyncFn = async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return { result: 'async data' }
    }

    const [error, value] = await tryCatchAsync(asyncFn())

    expect(error).toBeNull()
    expect(value).toEqual({ result: 'async data' })
  })

  it('catches async function errors', async () => {
    const asyncFn = async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      throw new Error('async failure')
    }

    const [error, value] = await tryCatchAsync(asyncFn())

    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe('async failure')
    expect(value).toBeNull()
  })
})

