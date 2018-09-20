import {
  TRANSACTIONS_CREATE_REQUEST,
  TRANSACTIONS_READ_REQUEST,
  TRANSACTIONS_UPDATE_REQUEST,
  TRANSACTIONS_DELETE_REQUEST,
  TRANSACTIONS_EXPORT,
  DB_NAME,
  DB_VERSION,
} from '../constants';

import axios from 'axios';
import encryption from '../encryption';

var firstRating = new Map();
var cachedChain = null;

onmessage = function(event) {
  // Action object is the on generated in action object
  const action = event.data;

  switch (action.type) {
  case TRANSACTIONS_CREATE_REQUEST: {

    encryption.key(action.cypher).then(() => {
      cachedChain = null;

      let transaction = action.transaction;
      const blob = {};

      blob.name = transaction.name;
      const { date } = transaction;
      blob.date = `${date.getFullYear()}-${('0' + (date.getMonth()+1) ).slice(-2)}-${('0' + date.getDate()).slice(-2)}`;
      if (transaction.category) {
        blob.category = transaction.category;
      }
      blob.local_amount = transaction.local_amount;
      blob.local_currency = transaction.local_currency;

      encryption.encrypt(blob).then((json) => {

        transaction.blob = json;

        delete transaction.name;
        delete transaction.date;
        delete transaction.category;
        delete transaction.local_amount;
        delete transaction.local_currency;

        axios({
          url: action.url + '/api/v1/debitscredits',
          method: 'POST',
          headers: {
            Authorization: 'Token ' + action.token,
          },
          data: transaction,
        })
          .then(response => {

            let response_transaction = Object.assign({}, response.data, blob);
            delete response_transaction.blob;

            // Populate data for indexedb indexes
            const year = response_transaction.date.slice(0, 4);
            const month = response_transaction.date.slice(5, 7);
            const day = response_transaction.date.slice(8, 10);
            response_transaction.date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

            getChangeChain(response.data.account).then(chain => {
              // Connect to indexedDB
              let connectDB = indexedDB.open(DB_NAME, DB_VERSION);
              connectDB.onsuccess = function(event) {
                var customerObjectStore = event.target.result
                  .transaction('transactions', 'readwrite')
                  .objectStore('transactions');

                // Save new transaction
                var request = customerObjectStore.put(response_transaction);

                request.onsuccess = function(event) {
                  let transaction = {
                    id: response_transaction.id,
                    user: response_transaction.user,
                    account: response_transaction.account,
                    name: response_transaction.name,
                    date: response_transaction.date,
                    originalAmount: response_transaction.local_amount,
                    originalCurrency: response_transaction.local_currency,
                    category: response_transaction.category,
                    // Calculated value
                    isConversionAccurate: true, // Define is exchange rate is exact or estimated
                    isConversionFromFuturChange: false, // If we used future change to make calculation
                    isSecondDegreeRate: false, // If we used future change to make calculation
                    amount: response_transaction.local_amount,
                    currency: response_transaction.local_currency,
                  };
                  convertTo(
                    transaction,
                    action.currency,
                    response.data.account,
                  ).then(() => {
                    postMessage({
                      type: action.type,
                      transaction: transaction,
                    });
                  });
                };
                request.onerror = function(event) {
                  console.error(event);
                };
              };
              connectDB.onerror = function(event) {
                console.error(event);
              };
            });
          })
          .catch(exception => {
            postMessage({
              type: action.type,
              exception: exception.response ? exception.response.data : null,
            });
          });
      });
    });
    break;
  }
  case TRANSACTIONS_READ_REQUEST: {
    cachedChain = null;

    retrieveTransactions(
      action.account,
      action.currency,
    ).then((transactions) => {
      postMessage({
        type: TRANSACTIONS_READ_REQUEST,
        transactions
      });
    }).catch((e) => {
      console.error(e);
    });

    break;
  }
  case TRANSACTIONS_EXPORT: {
    exportTransactions(action.account).then((transactions) => {
      postMessage({
        type: TRANSACTIONS_EXPORT,
        transactions
      });
    }).catch((exception) => {
      postMessage({
        type: TRANSACTIONS_EXPORT,
        exception
      });
    });

    break;
  }
  case TRANSACTIONS_UPDATE_REQUEST: {


    encryption.key(action.cypher).then(() => {

      let transaction = action.transaction;
      const blob = {};

      blob.name = transaction.name;
      const { date } = transaction;
      blob.date = `${date.getFullYear()}-${('0' + (date.getMonth()+1) ).slice(-2)}-${('0' + date.getDate()).slice(-2)}`;
      if (transaction.category) {
        blob.category = transaction.category;
      }
      blob.local_amount = transaction.local_amount;
      blob.local_currency = transaction.local_currency;

      encryption.key(action.cypher).then((json) => {

        transaction.blob = json;

        delete transaction.name;
        delete transaction.date;
        delete transaction.local_amount;
        delete transaction.local_currency;

        // API return 400 if catery = null
        if (!transaction.category) {
          delete transaction.category;
        }

        axios({
          url: action.url + '/api/v1/debitscredits/' + transaction.id,
          method: 'PUT',
          headers: {
            Authorization: 'Token ' + action.token,
          },
          data: transaction,
        })
          .then(response => {

            try {

              let response_transaction = Object.assign({}, response.data, blob);
              delete response_transaction.blob;

              // Populate data for indexedb indexes
              const year = response_transaction.date.slice(0, 4);
              const month = response_transaction.date.slice(5, 7);
              const day = response_transaction.date.slice(8, 10);
              response_transaction.date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

              // Connect to indexedDB
              let connectDB = indexedDB.open(DB_NAME, DB_VERSION);
              connectDB.onsuccess = function(event) {
                var customerObjectStore = event.target.result
                  .transaction('transactions', 'readwrite')
                  .objectStore('transactions');

                // Save new transaction
                var request = customerObjectStore.put(response_transaction);

                request.onsuccess = function(event) {
                  const transaction = {
                    id: response_transaction.id,
                    user: response_transaction.user,
                    account: response_transaction.account,
                    name: response_transaction.name,
                    date: response_transaction.date,
                    originalAmount: response_transaction.local_amount,
                    originalCurrency: response_transaction.local_currency,
                    category: response_transaction.category,
                    // Calculated value
                    isConversionAccurate: true, // Define is exchange rate is exact or estimated
                    isConversionFromFuturChange: false, // If we used future change to make calculation
                    isSecondDegreeRate: false, // If we used future change to make calculation
                    amount: response_transaction.local_amount,
                    currency: response_transaction.local_currency,
                  };

                  convertTo(
                    transaction,
                    action.currency,
                    transaction.account,
                  ).then(() => {
                    postMessage({
                      type: action.type,
                      transaction: transaction,
                    });
                  });
                };
                request.onerror = function(event) {
                  console.error(event);
                };
              };
              connectDB.onerror = function(event) {
                console.error(event);
              };

            } catch (exception) {
              console.error(exception);
            }
          })
          .catch(exception => {
            postMessage({
              type: action.type,
              exception: exception.response ? exception.response.data : null,
            });
          });
      });
    });
    break;
  }
  case TRANSACTIONS_DELETE_REQUEST:
    axios({
      url: action.url + '/api/v1/debitscredits/' + action.transaction.id,
      method: 'DELETE',
      headers: {
        Authorization: 'Token ' + action.token,
      },
    })
      .then(response => {
        // Connect to indexedDB
        let connectDB = indexedDB.open(DB_NAME, DB_VERSION);
        connectDB.onsuccess = function(event) {
          var customerObjectStore = event.target.result
            .transaction('transactions', 'readwrite')
            .objectStore('transactions');

          // Save new transaction
          var request = customerObjectStore.delete(action.transaction.id);

          request.onsuccess = function(event) {
            postMessage({
              type: action.type,
              id: action.transaction.id,
            });
          };
          request.onerror = function(event) {
            console.error(event);
          };
        };
      })
      .catch(exception => {
        postMessage({
          type: action.type,
          exception: exception.response ? exception.response.data : null,
        });
      });
    break;

  default:
    return;
  }
};


// Connect to IndexedDB to retrieve a list of transaction for account and converted in currency
function retrieveTransactions(account, currency) {
  let transactions = []; // Set object of Transaction

  return new Promise((resolve, reject) => {
    let connectDB = indexedDB.open(DB_NAME, DB_VERSION);

    connectDB.onsuccess = function(event) {
      let cursor = event.target.result
        .transaction('transactions')
        .objectStore('transactions')
        .index('account')
        .openCursor(IDBKeyRange.only(parseInt(account)));

      cursor.onsuccess = function(event) {
        var cursor = event.target.result;
        // If cursor.continue() still have data to parse.
        if (cursor) {
          if (cursor.value.account === account) {
            transactions.push({
              id: cursor.value.id,
              user: cursor.value.user,
              account: cursor.value.account,
              name: cursor.value.name,
              date: cursor.value.date,
              originalAmount: cursor.value.local_amount,
              originalCurrency: cursor.value.local_currency,
              category: cursor.value.category,
              // Calculated value
              isConversionAccurate: true, // Define is exchange rate is exact or estimated
              isConversionFromFuturChange: false, // If we used future change to make calculation
              isSecondDegreeRate: false, // If we used future change to make calculation
              amount: cursor.value.local_amount,
              currency: cursor.value.local_currency,
            });
          }
          cursor.continue();
        } else {
          /* At this point, we have a list of transaction.
             We need to convert to currency in params */
          if (transactions.length === 0) {
            return resolve(transactions);
          }

          let promises = [];
          let counter = 0;

          getChangeChain(account).then(chain => {
            transactions.forEach(transaction => {
              promises.push(convertTo(transaction, currency, account));
              counter++;
              // If last transaction to convert we send nessage back.
              if (counter === transactions.length) {
                Promise.all(promises).then(() => {
                  resolve(transactions);
                });
              }
            });
          });
        }
      };
      cursor.onerror = function(event) {
        reject(event);
      };
    };
    connectDB.onerror = function(event) {
      reject(event);
    };
  });
}


// Convert a transation to a specific currencyId
function convertTo(transaction, currencyId, accountId) {
  return new Promise((resolve, reject) => {
    try {
      if (currencyId === transaction.originalCurrency) {
        transaction.isConversionAccurate = true;
        transaction.amount = transaction.originalAmount;
        resolve();
      } else {
        getChangeChain(accountId)
          .then(chain => {
            const result = chain.find(item => {
              return item.date <= transaction.date;
            });

            transaction.currency = currencyId;
            transaction.isConversionAccurate = false;
            transaction.isConversionFromFuturChange = false;
            transaction.isSecondDegreeRate = false;
            if (result) {
              var change = result;
              // If exchange rate exist, we calculate exact change rate
              if (
                change.rates.has(transaction.originalCurrency) &&
                change.rates.get(transaction.originalCurrency).has(currencyId)
              ) {
                transaction.isConversionAccurate = true;
                transaction.amount =
                  transaction.originalAmount *
                  change.rates
                    .get(transaction.originalCurrency)
                    .get(currencyId);
              } else {
                // We take first Rating is available
                if (
                  change.secondDegree.has(transaction.originalCurrency) &&
                  change.secondDegree
                    .get(transaction.originalCurrency)
                    .has(currencyId)
                ) {
                  transaction.isSecondDegreeRate = true;
                  transaction.amount =
                    transaction.originalAmount *
                    change.secondDegree
                      .get(transaction.originalCurrency)
                      .get(currencyId);
                } else {
                  // We take secondDegree transaction if possible
                  if (
                    firstRating.has(transaction.originalCurrency) &&
                    firstRating
                      .get(transaction.originalCurrency)
                      .has(currencyId)
                  ) {
                    transaction.isConversionFromFuturChange = true;
                    transaction.amount =
                      transaction.originalAmount *
                      firstRating
                        .get(transaction.originalCurrency)
                        .get(currencyId);
                  } else {
                    // There is no transaciton, and no second degree.
                    // Right now, we do not check third degree.
                    transaction.amount = null;
                  }
                }
              }
              resolve();
            } else {
              transaction.amount = null;
              resolve();
            }
          })
          .catch(exception => {
            console.error(exception);
            reject(exception);
          });
      }
    } catch (exception) {
      console.error(exception);
      reject(exception);
    }
  });
}

// Duplicate in Change worker
function getChangeChain(accountId) {
  return new Promise((resolve, reject) => {
    var chain = [];
    var lastItem = {};
    var changes = [];

    if (cachedChain) {
      resolve(cachedChain);
    } else {
      let connectDB = indexedDB.open(DB_NAME, DB_VERSION);
      connectDB.onsuccess = function(event) {
        var index = event.target.result
          .transaction('changes')
          .objectStore('changes')
          .index('account');

        var keyRange = IDBKeyRange.only(parseInt(accountId));
        let cursor = index.openCursor(keyRange);

        cursor.onsuccess = function(event) {
          var cursor = event.target.result;
          if (cursor) {
            let change = event.target.result.value;
            change.exchange_rate = parseFloat(change.new_amount) / parseFloat(change.local_amount);
            changes.push(change);
            cursor.continue();
          } else {
            changes = changes.sort((a, b) => {
              return a.date > b.date ? 1 : -1;
            });

            for (var i in changes) {
              var item = {
                id: changes[i].id,
                account: changes[i].account,
                date: new Date(changes[i].date),
                rates: new Map(lastItem.rates),
                secondDegree: new Map(lastItem.secondDegree),
              };

              // GENERATE FIRST RATING
              // If first time using this localCurrency
              if (item.rates.get(changes[i]['local_currency']) === undefined) {
                firstRating.set(changes[i]['local_currency'], new Map());
              }
              if (
                firstRating
                  .get(changes[i]['local_currency'])
                  .get(changes[i]['new_currency']) === undefined
              ) {
                firstRating
                  .get(changes[i]['local_currency'])
                  .set(changes[i]['new_currency'], changes[i]['exchange_rate']);
              }

              // If first time using this new Currency
              if (item.rates.get(changes[i]['new_currency']) === undefined) {
                firstRating.set(changes[i]['new_currency'], new Map());
              }
              if (
                firstRating
                  .get(changes[i]['new_currency'])
                  .get(changes[i]['local_currency']) === undefined
              ) {
                firstRating
                  .get(changes[i]['new_currency'])
                  .set(
                    changes[i]['local_currency'],
                    1 / changes[i]['exchange_rate'],
                  );
              }

              // GENERERATE CHAIN ITEM
              item.rates.set(
                changes[i]['local_currency'],
                new Map(item.rates.get(changes[i]['local_currency'])),
              );
              item.rates
                .get(changes[i]['local_currency'])
                .set(changes[i]['new_currency'], changes[i]['exchange_rate']);

              item.rates.set(
                changes[i]['new_currency'],
                new Map(item.rates.get(changes[i]['new_currency'])),
              );
              item.rates
                .get(changes[i]['new_currency'])
                .set(
                  changes[i]['local_currency'],
                  1 / changes[i]['exchange_rate'],
                );

              // CALCULATE CROSS REFERENCE RATE WITH MULTI CURRENCY VALUES
              //
              // console.log('rates');
              // console.log(JSON.stringify(item.rates));
              // We take
              //
              // Algo:
              //  1 -> 2 -> 3
              //    x    y
              //  1 is changes[i]['local_currency']
              //  2 is changes[i]['new_currency']
              //  x is exchange rate between 1 and 2
              //  we need to calculate y and save it as 1 -> 3
              item.rates
                .get(changes[i]['local_currency'])
                .forEach((value, key) => {
                  if (key !== changes[i]['new_currency']) {
                    item.rates.get(key);
                    // console.log('local to key');
                    // console.log(changes[i]['local_currency'] + ' > ' + key + ' > ' + changes[i]['new_currency'] );
                    // console.log(changes[i]['local_currency'] + ' > ' + changes[i]['new_currency'] + ' : ' + changes[i]['exchange_rate'] );
                    // console.log(changes[i]['local_currency'] + ' > ' + key + ' : ' + item.rates.get(changes[i]['local_currency']).get(key) );
                    // console.log(key + ' > ' + changes[i]['new_currency'] + ' : ' + changes[i]['exchange_rate'] / value );
                    // console.log(changes[i]['new_currency'] + ' > ' + key + ' : ' + 1/(changes[i]['exchange_rate'] / value));

                    if (item.secondDegree.get(key) === undefined) {
                      item.secondDegree.set(key, new Map());
                    }
                    item.secondDegree
                      .get(key)
                      .set(
                        changes[i]['new_currency'],
                        changes[i]['exchange_rate'] / value,
                      );

                    if (
                      item.secondDegree.get(changes[i]['new_currency']) ===
                      undefined
                    ) {
                      item.secondDegree.set(
                        changes[i]['new_currency'],
                        new Map(),
                      );
                    }
                    item.secondDegree
                      .get(changes[i]['new_currency'])
                      .set(key, 1 / (changes[i]['exchange_rate'] / value));

                    // We also need to update firstRate with this new value ... sad :(
                    if (firstRating.get(key) === undefined) {
                      firstRating.set(key, new Map());
                    }
                    if (
                      firstRating.get(key).get(changes[i]['new_currency']) ===
                      undefined
                    ) {
                      firstRating
                        .get(key)
                        .set(
                          changes[i]['new_currency'],
                          changes[i]['exchange_rate'] / value,
                        );
                    }

                    if (
                      firstRating.get(changes[i]['new_currency']) === undefined
                    ) {
                      firstRating.set(changes[i]['new_currency'], new Map());
                    }
                    if (
                      firstRating.get(changes[i]['new_currency']).get(key) ===
                      undefined
                    ) {
                      firstRating
                        .get(changes[i]['new_currency'])
                        .set(key, 1 / (changes[i]['exchange_rate'] / value));
                    }

                    // console.log('secondDegree');
                    // console.log(JSON.stringify(item.secondDegree));
                  }
                  // item.secondDegree = item.secondDegree;
                });

              chain.push(item);
              lastItem = item;
            }

            chain = chain.sort((a, b) => {
              return a.date < b.date ? 1 : -1;
            });
            cachedChain = chain;
            resolve(chain);
          }
        };
      }; // end connectDB.onsuccess
      connectDB.onerror = function(event) {
        console.error(event);
      };
    }
  });
}

function exportTransactions(account) {
  let transactions = []; // Set object of Transaction

  return new Promise((resolve, reject) => {
    let connectDB = indexedDB.open(DB_NAME, DB_VERSION);

    connectDB.onsuccess = function(event) {
      let cursor = event.target.result
        .transaction('transactions')
        .objectStore('transactions')
        .index('account')
        .openCursor(IDBKeyRange.only(parseInt(account)));

      cursor.onsuccess = function(event) {
        var cursor = event.target.result;
        // If cursor.continue() still have data to parse.
        if (cursor) {
          if (cursor.value.account === account) {
            transactions.push({
              id: cursor.value.id,
              name: cursor.value.name,
              date: cursor.value.date,
              local_amount: cursor.value.local_amount,
              local_currency: cursor.value.local_currency,
              category: cursor.value.category,
            });
          }
          cursor.continue();
        } else {
          resolve(transactions);
        }
      };
      cursor.onerror = function(event) {
        reject(event);
      };
    };
    connectDB.onerror = function(event) {
      reject(event);
    };
  });
}