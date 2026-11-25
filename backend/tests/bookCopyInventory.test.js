const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateStockChange,
  formatCopyNumber
} = require('../utils/bookCopyInventory');

test('adding stock creates only the delta and preserves borrowed count', () => {
  assert.deepEqual(calculateStockChange(5, 3, 7), {
    borrowedCount: 2,
    availableStock: 5,
    delta: 2
  });
});

test('copy numbers use the catalog book ID and a separate sequence', () => {
  assert.equal(formatCopyNumber({ bookId: 'BK-0042' }, 3), 'BK-0042-C003');
  assert.equal(formatCopyNumber({ bookId: 'BK-0042' }, 1000), 'BK-0042-C1000');
});

test('stock cannot be reduced below the number of copies on loan', () => {
  assert.throws(
    () => calculateStockChange(5, 3, 1),
    { message: 'Stock cannot be reduced below the number of copies currently on loan.', status: 400 }
  );
});
