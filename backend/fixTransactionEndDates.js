// Script to fix transactions with missing endDate
const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
require('dotenv').config();

const fixTransactionEndDates = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/paranaque');
    console.log('Connected to MongoDB');

    // Find all transactions without endDate
    const transactionsWithoutEndDate = await Transaction.find({
      $or: [
        { endDate: null },
        { endDate: undefined }
      ]
    });

    console.log(`Found ${transactionsWithoutEndDate.length} transactions without endDate`);

    if (transactionsWithoutEndDate.length === 0) {
      console.log('No transactions need fixing');
      await mongoose.disconnect();
      return;
    }

    // Update all of them
    for (const transaction of transactionsWithoutEndDate) {
      // Set endDate to 7 days from startDate (or now if startDate doesn't exist)
      const baseDate = transaction.startDate || new Date();
      transaction.endDate = new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      await transaction.save();
      console.log(`Fixed transaction ${transaction._id}: set endDate to ${transaction.endDate}`);
    }

    console.log(`Successfully fixed ${transactionsWithoutEndDate.length} transactions`);
    
    // Verify the fix
    const stillMissing = await Transaction.find({
      $or: [
        { endDate: null },
        { endDate: undefined }
      ]
    });
    
    if (stillMissing.length === 0) {
      console.log('✅ All transactions now have endDate');
    } else {
      console.log(`⚠️ ${stillMissing.length} transactions still missing endDate`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error fixing transactions:', error);
    process.exit(1);
  }
};

fixTransactionEndDates();
