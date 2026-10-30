import { describe, expect, it } from 'vitest';
import { hasErrors, validateClaimMessage, validateItem, validateLogin, validatePassword, validateRegister } from './validation';
import { excerpt, safeRedirectPath, sortNewest } from './format';

describe('validation', () => {
  it('validates login fields', () => {
    expect(validateLogin({ email: '', password: '' })).toEqual({ email: 'Enter your email address.', password: 'Enter your password.' });
    expect(validateLogin({ email: 'nope', password: 'x' }).email).toMatch(/valid email/);
    expect(hasErrors(validateLogin({ email: 'a@b.co', password: 'x' }))).toBe(false);
  });

  it('enforces password length (8 characters, 72 bytes)', () => {
    expect(validatePassword('short')).not.toBe('');
    expect(validatePassword('longenough')).toBe('');
    expect(validatePassword('é'.repeat(40))).not.toBe(''); // 80 bytes
  });

  it('requires matching passwords on register', () => {
    const errors = validateRegister({ name: 'A', email: 'a@b.co', password: 'password1', confirmPassword: 'password2' });
    expect(errors.confirmPassword).toBeDefined();
    expect(errors.password).toBeUndefined();
  });

  it('validates a reported item', () => {
    const errors = validateItem({ title: ' ', description: '', location: '', status: 'CLAIMED', categoryId: '' });
    expect(Object.keys(errors).sort()).toEqual(['categoryId', 'location', 'status', 'title']);
    expect(hasErrors(validateItem({ title: 'Keys', description: '', location: 'Gym', status: 'LOST', categoryId: '3' }))).toBe(false);
  });

  it('requires a meaningful claim message', () => {
    expect(validateClaimMessage('short')).not.toBe('');
    expect(validateClaimMessage('It has my initials engraved inside')).toBe('');
  });
});

describe('format helpers', () => {
  it('only allows in-app redirects', () => {
    expect(safeRedirectPath('/items/4?x=1')).toBe('/items/4?x=1');
    expect(safeRedirectPath('//evil.com')).toBe('/dashboard');
    expect(safeRedirectPath('https://evil.com')).toBe('/dashboard');
    expect(safeRedirectPath(undefined)).toBe('/dashboard');
  });

  it('sorts newest first without mutating the input', () => {
    const input = [{ d: '2026-01-01T00:00:00' }, { d: '2026-03-01T00:00:00' }];
    expect(sortNewest(input, 'd')[0].d).toBe('2026-03-01T00:00:00');
    expect(input[0].d).toBe('2026-01-01T00:00:00');
  });

  it('shortens long text', () => {
    expect(excerpt('a'.repeat(200), 50)).toHaveLength(51);
    expect(excerpt('short')).toBe('short');
  });
});
