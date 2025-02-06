import Fallback from './integration-bank.js';

import { formatPayeeName } from '../../util/payee-name.js';

/** @type {import('./bank.interface.js').IBank} */
export default {
  ...Fallback,

  institutionIds: [
    'SPARNORD_SPNODK22',
    'LAGERNES_BANK_LAPNDKK1',
    'ANDELSKASSEN_FALLESKASSEN_FAELDKK1',
  ],

  /**
   * Banks on the BEC backend only give information regarding the transaction in additionalInformation
   */
  normalizeTransaction(transaction, _booked) {
    // Filter out transactions depending on the current date
    var today = new Date();
    var filterDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    var lastBankDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    if (lastBankDay.getDay() === 5 || lastBankDay.getDay() === 6 || lastBankDay.getDay() === 0) {
      while (lastBankDay.getDay() !== 5) { // 5 represents Friday
          lastBankDay.setDate(lastBankDay.getDate() - 1);
      }
    }

    if (filterDate.getDate() != lastBankDay.getDate() && lastBankDay.getTime() <= today.getTime()) {
        while (filterDate.getDay() !== 1) { 
            filterDate.setDate(filterDate.getDate() + 1);
        }
    } else if (lastBankDay.getTime() <= today.getTime()) {
        filterDate.setDate(filterDate.getDate() + 1);
    } else {
        filterDate.setDate(today.getDate())
    }

    const transactionDate = transaction.bookingDate;
    if (transactionDate > filterDate.toISOString().split('T')[0]) {
      return null;
    }
    // If Payee and notes should be the same the next line should be transaction.remittanceInformationUnstructured =
    transaction.additionalInformation =
      transaction.additionalInformation
        .replace(/^BS /, '')
        .replace(/^Forretning: /, '')
        .replace(/^MobilePay: MobilePay /, '')
        .replace(/^DK-NOTA[A-Za-z0-9]+\s/, '')
        .replace(/.dk$/i, '')
        .trim();
    
    return {
      ...transaction,
      payeeName: formatPayeeName(transaction),
      date: transaction.bookingDate,
    };
  },
};
