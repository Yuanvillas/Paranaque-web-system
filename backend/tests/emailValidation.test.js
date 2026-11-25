const test = require('node:test');
const assert = require('node:assert/strict');
const {
  emailLookupRegex,
  isValidEmail,
  normalizeEmail
} = require('../utils/emailValidation');

test('accepts standard provider and custom-domain email addresses', () => {
  for (const email of [
    'a@gmail.com',
    'User.Name+tag@yahoo.com',
    'first_last@outlook.co.uk',
    'user@custom-domain.org',
    'user@xn--bcher-kva.example',
    'user@custom-domain.xn--p1ai'
  ]) {
    assert.equal(isValidEmail(email), true, email);
  }
});

test('rejects malformed addresses without requiring a multi-character username', () => {
  for (const email of [
    'plainaddress',
    'user@localhost',
    'user@@example.com',
    '@example.com',
    'user@.com',
    'user..name@example.com',
    'user@example..com',
    'user@-example.com',
    'user@example-.com',
    'user name@example.com',
    'user@example .com',
    '.user@example.com',
    'user.@example.com'
  ]) {
    assert.equal(isValidEmail(email), false, email);
  }

  assert.equal(isValidEmail('a@example.com'), true);
});

test('normalizes registrations and creates safe case-insensitive lookup patterns', () => {
  assert.equal(normalizeEmail('  User@Example.COM  '), 'user@example.com');
  assert.equal(emailLookupRegex('user+tag@example.com').test('USER+TAG@EXAMPLE.COM'), true);
  assert.equal(emailLookupRegex('user+tag@example.com').test('userXtag@example.com'), false);
});
