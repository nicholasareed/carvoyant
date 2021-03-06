/**
 * Tests for lib/client.js.
 *
 * NOTE: These tests are live tests and as such can be somewhat brittle.  Some of the APIs we use to write new data to
 *       Carvoyant do not have equivalent delete APIs so we cannot cleanup what we create.  This being said, try to use
 *       a set of Carvoyant credentials that you can fill with test data without concern.  You should be able to clean
 *       up your vehicle list from the Carvoyant Dashboard.
 */

'use strict';

var _ = {
    contains: require('lodash.contains'),
    each: require('lodash.foreach'),
    find: require('lodash.find'),
    isArray: require('lodash.isarray'),
    isBoolean: require('lodash.isboolean'),
    isNumber: require('lodash.isnumber'),
    isObject: require('lodash.isobject'),
    isUndefined: require('lodash.isundefined'),
    map: require('lodash.map')
  }
  , Carvoyant = require('../lib/carvoyant')
  , realConfig = require('./client_config')
  , Client = Carvoyant.Client
  , createdVehicle // This will be created once to avoid unnecessary cleanup
  , createdEventSubscription;

if (!realConfig.accessToken && !(realConfig.apiKey && realConfig.securityToken)) {
  console.log('Your client_config.js is missing either an accessToken.');
  console.log('Please view the project documentation on how to obtain these: https://github.com/whitlockjc/carvoyant');
  throw new Error('Invalid test/client_config.js.');
}

/**
 * By default, the Carvoyant APIs are throttled so sleep to avoid issue.
 */
exports.tearDown = function (cb) {
  setTimeout(function () {
    cb();
  }, 1000);
};

/**
 * Test that an empty {@link Client} constructor throws an error.
 */
exports.testEmptyClientOptions = function (test) {

  try {
    new Client();
    test.fail('Creating a Client without an accessToken should fail.');
  } catch (err) {
    test.strictEqual('options.accessToken or both options.apiKey and options.securityToken are required.',
                     err.message);
  }

  // Obligatory nodeunit completion signal
  test.done();

};

/**
 * Test creating a new {@link Client}.
 */
exports.testNewClient = function (test) {

  var fakeConfig = {
      apiKey: 'fakeAPIKey',
      securityToken: 'fakeSecurityToken'
    }
    , client = new Client(fakeConfig);

  test.strictEqual(client.apiKey, fakeConfig.apiKey);
  test.strictEqual(client.securityToken, fakeConfig.securityToken);
  test.ok(!client.accessToken);
  // TODO: Rewrite this to access the exposed default URL
  test.strictEqual(client.apiUrl, 'https://dash.carvoyant.com/api');

  // Obligatory nodeunit completion signal
  test.done();

};

/**
 * Test creating a new {@link Client} with accessToken.
 */
exports.testNewOAuthClient = function (test) {

  var fakeConfig = {
      accessToken: 'fakeAccessToken'
    }
    , client = new Client(fakeConfig);

  test.strictEqual(client.accessToken, fakeConfig.accessToken);
  test.ok(!client.apiKey);
  test.ok(!client.securityToken);
  // TODO: Rewrite this to access the exposed default URL
  test.strictEqual(client.apiUrl, 'https://api.carvoyant.com/v1/api');

  // Obligatory nodeunit completion signal
  test.done();

};

/**
 * Test creating a new {@link Client} with an overloaded baseUrl.
 */
exports.testNewClientWithCustomApiUrl = function (test) {

  var fakeConfig = {
      accessToken: 'fakeAccessToken',
      apiUrl: 'https://api.carvoyant.com/v2/api'
    }
    , client = new Client(fakeConfig);

  test.strictEqual(client.accessToken, fakeConfig.accessToken);
  test.strictEqual(client.apiUrl, fakeConfig.apiUrl);

  // Obligatory nodeunit completion signal
  test.done();

};

/**
 * Test {@link Client#accounts} works as expected.
 */
exports.testListAccounts = function (test) {

  var client = new Client(realConfig);

  client.accounts(function (res) {

    test.strictEqual(200, res.status);
    test.ok(_.isArray(res.body.account));

    // Obligatory nodeunit completion signal
    test.done();

  });

};

/**
 * Test {@link Client#accountDetails} works as expected.
 */
exports.testGetAccountDetails = function (test) {

  var client = new Client(realConfig);

  client.accounts(function (res) {

    client.accountDetails(res.body.account[0].id, function (res2) {

      test.strictEqual(200, res2.status);
      test.ok(_.isObject(res2.body.account));

      // Obligatory nodeunit completion signal
      test.done();

    });

  });

};

/**
 * Test {@link Client#createVehicle} works as expected.
 *
 * Note: This test *must* run successfully for the remaining tests to run
 */
exports.testCreateVehicle = function (test) {

  var client = new Client(realConfig)
    , timestamp = new Date().getTime();

  try {
    client.createVehicle();

    test.fail('Creating a Vehicle without vehicleData should fail.');
  } catch (err) {
    test.ok(err instanceof TypeError);
    test.strictEqual('vehicleData must be defined.', err.message);
  }

  client.createVehicle({
    label: 'Test Vehicle ' + timestamp,
    mileage: 1
  }, function (res) {

    test.strictEqual(200, res.status);
    createdVehicle = res.body.vehicle;

    // Obligatory nodeunit completion signal
    test.done();

  });

};

/**
 * Test {@link Client#updateVehicle} works as expected.
 */
exports.testUpdateVehicle = function (test) {

  var client = new Client(realConfig);

  try {
    client.updateVehicle();

    test.fail('Updating a Vehicle without vehicleData should fail.');
  } catch (err) {
    test.ok(err instanceof TypeError);
    test.strictEqual('vehicleData must be defined.', err.message);
  }

  try {
    client.updateVehicle({label: 'Testing'});

    test.fail('Creating a Vehicle without vehicleData.vehicleId should fail.');
  } catch (err) {
    test.ok(err instanceof TypeError);
    test.strictEqual('vehicleData.vehicleId must be defined.', err.message);
  }

  createdVehicle.mileage += 1;

  client.updateVehicle(createdVehicle, function (res) {

    test.strictEqual(200, res.status);
    test.strictEqual(createdVehicle.mileage, res.body.vehicle.mileage);

    createdVehicle = res.body.vehicle;

    // Obligatory nodeunit completion signal
    test.done();

  });

};

/**
 * Test {@link Client#vehicles} works as expected.
 */
exports.testListVehicles = function (test) {

  var client = new Client(realConfig);

  client.vehicles(function (res) {

    test.strictEqual(200, res.status);
    test.ok(_.isArray(res.body.vehicle));

    // Obligatory nodeunit completion signal
    test.done();

  });

};

/**
 * Test {@link Client#vehicle} works as expected.
 */
exports.testGetVehicleById = function (test) {

  var client = new Client(realConfig);

  client.vehicle(createdVehicle.vehicleId, function (res) {

    test.strictEqual(200, res.status);
    test.ok(_.isObject(res.body.vehicle));
    test.strictEqual(createdVehicle.label, res.body.vehicle.label);

    // Obligatory nodeunit completion signal
    test.done();

  });

};

/**
 * Test that invalid values passed to {@link Client#vehicleTrips} throw the proper error.
 */
exports.testListTripsInvalidArguments = function (test) {

  var client = new Client(realConfig)
    , invalidValues = [
      {
        key: 'includeData',
        value: 'NotBoolean',
        message: 'includeData must be a Boolean.'
      },
      {
        key: 'startTime',
        value: 'NotDate',
        message: 'startTime must be a Date.'
      },
      {
        key: 'endTime',
        value: 'NotDate',
        message: 'endTime must be a Date.'
      }
    ];

  _.each(invalidValues, function (invalidValue) {

    var query = {};

    try {
      query[invalidValue.key] = invalidValue.value;

      client.vehicleTrips('Fake', null, query);

      test.fail('Listing Vehicle trips with invalid request should fail.');
    } catch (err) {
      test.ok(err instanceof TypeError);
      test.strictEqual(invalidValue.message, err.message);
    }

  });

  // Obligatory nodeunit completion signal
  test.done();

};

/**
 * Test {@link Client#vehicleTrips} works as expected.
 */
exports.testListTrips = function (test) {

  var client = new Client(realConfig);

  client.vehicleTrips(createdVehicle.vehicleId, function (res) {

    test.strictEqual(200, res.status);
    test.ok(_.isArray(res.body.trip));
    test.ok(_.isNumber(res.body.totalRecords));
    test.ok(_.isArray(res.body.actions));

    // Obligatory nodeunit completion signal
    test.done();

  });

};

/**
 * Test that invalid values passed to {@link Client#makeRequest} throw the proper error.
 */
exports.testMakeRequestInvalidArgument = function (test) {

  var client = new Client(realConfig)
    , invalidValues = [
      {
        key: 'searchLimit',
        value: 'NotNumber',
        message: 'searchLimit must be a Number.'
      },
      {
        key: 'searchOffset',
        value: 'NotNumber',
        message: 'searchOffset must be a Number.'
      },
      {
        key: 'sortOrder',
        value: 'NotValid',
        message: 'sortOrder must be one of the following: asc, desc'
      }
    ];

  _.each(invalidValues, function (invalidValue) {

    var query = {};

    try {
      query[invalidValue.key] = invalidValue.value;

      client.vehicleTrips('Fake', null, query);

      test.fail('Listing Vehicle trips with invalid request should fail.');
    } catch (err) {
      test.ok(err instanceof TypeError);
      test.strictEqual(invalidValue.message, err.message);
    }

  });

  // Obligatory nodeunit completion signal
  test.done();

};

/**
 * Test that invalid values passed to {@link Client#vehicleData} throw the proper error.
 */
exports.testVehicleDataInvalidArgument = function (test) {

  var client = new Client(realConfig)
    , invalidValues = [
      {
        key: 'mostRecentOnly',
        value: 'NotBoolean',
        message: 'mostRecentOnly must be a Boolean.'
      }
    ];

  _.each(invalidValues, function (invalidValue) {

    var query = {};

    try {
      query[invalidValue.key] = invalidValue.value;

      client.vehicleData('Fake', null, query);

      test.fail('Getting Vehicle data with invalid request should fail.');
    } catch (err) {
      test.ok(err instanceof TypeError);
      test.strictEqual(invalidValue.message, err.message);
    }

  });

  // Obligatory nodeunit completion signal
  test.done();

};

/**
 * Test that calls to {@link Client#vehicleData} work as expected.
 */
exports.testVehicleData = function (test) {

  var client = new Client(realConfig);

  try {
    client.vehicleData();

    test.fail('Getting Vehicle data without vehicleId should fail.');
  } catch (err) {
    test.ok(err instanceof TypeError);
    test.strictEqual('vehicleId must be defined.', err.message);
  }

  client.vehicleData(createdVehicle.vehicleId, function (res) {

    test.strictEqual(200, res.status);
    test.strictEqual(-1, (_.isUndefined(res.req.path) ? res.req.url : res.req.path).indexOf('mostRecentOnly'));
    test.ok(_.isArray(res.body.data));

    // Obligatory nodeunit completion signal
    test.done();

  }, {
    mostRecentOnly: false
  });

};

/**
 * Test that calls to {@link Client#vehicleDataSet} work as expected.
 */
exports.testVehicleDataSet = function (test) {

  var client = new Client(realConfig);

  try {
    client.vehicleDataSet();

    test.fail('Getting Vehicle data set without vehicleId should fail.');
  } catch (err) {
    test.ok(err instanceof TypeError);
    test.strictEqual('vehicleId must be defined.', err.message);
  }

  client.vehicleDataSet(createdVehicle.vehicleId, function (res) {

    test.strictEqual(200, res.status);
    test.ok(_.isArray(res.body.dataSet));

    // Obligatory nodeunit completion signal
    test.done();

  });

};

/**
 * Test that calls to {@link Client#createEventSubscription} works as expected.
 *
 * Note: This must succeed for further event subscription tests to pass.
 */
exports.testCreateEventSubscription = function (test) {

  var client = new Client(realConfig);

  try {
    client.createEventSubscription();

    test.fail('Creating Event subscription without vehicleId should fail.');
  } catch (err) {
    test.ok(err instanceof TypeError);
    test.strictEqual('vehicleId must be defined.', err.message);
  }

  try {
    client.createEventSubscription(createdVehicle.vehicleId);

    test.fail('Creating Event subscription without eventType should fail.');
  } catch (err) {
    test.ok(err instanceof TypeError);
    test.strictEqual('eventType must be defined.', err.message);
  }

  try {
    client.createEventSubscription(createdVehicle.vehicleId, 'lowBattery');

    test.fail('Creating Event subscription without eventSubscription should fail.');
  } catch (err) {
    test.ok(err instanceof TypeError);
    test.strictEqual('eventSubscription must be defined.', err.message);
  }

  client.createEventSubscription(createdVehicle.vehicleId, 'lowBattery', {
    minimumTime: 20,
    postUrl: 'https://consumer.org/receive',
    notificationPeriod: 'ONETIME'
  }, function (res) {

    test.strictEqual(200, res.status);
    test.strictEqual('https://consumer.org/receive',  res.body.subscription.postUrl);

    createdEventSubscription = res.body.subscription;

    // Obligatory nodeunit completion signal
    test.done();

  });
};

/**
 * Test that calls to {@link Client#eventSubscriptions} works as expected when there is no event type.
 */
exports.testEventSubscriptionsWithoutType = function (test) {

  var client = new Client(realConfig);

  try {
    client.eventSubscriptions();

    test.fail('Getting Event subscription without vehicleId should fail.');
  } catch (err) {
    test.ok(err instanceof TypeError);
    test.strictEqual('vehicleId must be defined.', err.message);
  }

  client.eventSubscriptions(createdVehicle.vehicleId, function (res) {

    test.strictEqual(200, res.status);

    test.ok(_.isArray(res.body.subscriptions));

    // Obligatory nodeunit completion signal
    test.done();

  });

};

/**
 * Test that calls to {@link Client#eventSubscriptions} works as expected when there is no event type.
 */
exports.testEventSubscriptionsWithType = function (test) {

  var client = new Client(realConfig);

  client.eventSubscriptions(createdVehicle.vehicleId, function (res) {

    test.strictEqual(200, res.status);

    test.ok(_.isArray(res.body.subscriptions));

    // Obligatory nodeunit completion signal
    test.done();

  }, Carvoyant.Utilities.externalizeEventType(createdEventSubscription._type));

};

/**
 * Test that calls to {@link Client#eventSubscriptionDetails} works as expected when there is no event type.
 */
exports.testEventSubscriptionDetailsWithoutType = function (test) {

  var client = new Client(realConfig);

  try {
    client.eventSubscriptionDetails();

    test.fail('Getting Event subscription details without vehicleId should fail.');
  } catch (err) {
    test.ok(err instanceof TypeError);
    test.strictEqual('vehicleId must be defined.', err.message);
  }

  try {
    client.eventSubscriptionDetails(createdVehicle.vehicleId);

    test.fail('Getting Event subscription details without eventSubscriptionId should fail.');
  } catch (err) {
    test.ok(err instanceof TypeError);
    test.strictEqual('eventSubscriptionId must be defined.', err.message);
  }

  client.eventSubscriptionDetails(createdVehicle.vehicleId, createdEventSubscription.id, function (res) {

    test.strictEqual(200, res.status);
    test.strictEqual(createdEventSubscription.id, res.body.subscription.id);

    // Obligatory nodeunit completion signal
    test.done();

  });

};

/**
 * Test that calls to {@link Client#eventSubscriptionDetails} works as expected when there is an event type.
 */
exports.testEventSubscriptionDetailsWithType = function (test) {

  var client = new Client(realConfig);

  client.eventSubscriptionDetails(createdVehicle.vehicleId, createdEventSubscription.id, function (res) {

    test.strictEqual(200, res.status);
    test.strictEqual(createdEventSubscription.id, res.body.subscription.id);

    // Obligatory nodeunit completion signal
    test.done();

  }, Carvoyant.Utilities.externalizeEventType(createdEventSubscription._type));

};

/**
 * Test that calls to {@link Client#updateEventSubscription} works as expected when there is an event type.
 */
exports.testUpdateEventSubscriptionWithoutType = function (test) {

  var client = new Client(realConfig);

  try {
    client.updateEventSubscription();

    test.fail('Updating Event subscription without vehicleId should fail.');
  } catch (err) {
    test.ok(err instanceof TypeError);
    test.strictEqual('vehicleId must be defined.', err.message);
  }

  try {
    client.updateEventSubscription(createdVehicle.vehicleId);

    test.fail('Updating Event subscription without eventSubscription should fail.');
  } catch (err) {
    test.ok(err instanceof TypeError);
    test.strictEqual('eventSubscription must be defined.', err.message);
  }

  createdEventSubscription.minimumTime += 1;

  client.updateEventSubscription(createdVehicle.vehicleId, createdEventSubscription, function (res) {

    test.strictEqual(200, res.status);
    test.strictEqual(createdEventSubscription.minimumTime, res.body.subscription.minimumTime);

    createdEventSubscription = res.body.subscription;

    // Obligatory nodeunit completion signal
    test.done();

  });

};

/**
 * Test that calls to {@link Client#updateEventSubscription} works as expected when there is an event type.
 */
exports.testUpdateEventSubscriptionWithType = function (test) {

  var client = new Client(realConfig);

  createdEventSubscription.minimumTime += 1;

  client.updateEventSubscription(createdVehicle.vehicleId, createdEventSubscription, function (res) {

    test.strictEqual(200, res.status);
    test.strictEqual(createdEventSubscription.minimumTime, res.body.subscription.minimumTime);

    createdEventSubscription = res.body.subscription;

    // Obligatory nodeunit completion signal
    test.done();

  }, Carvoyant.Utilities.externalizeEventType(createdEventSubscription._type));

};

/**
 * Test that calls to {@link Client#deleteEventSubscription} works as expected when there is no event type.
 */
exports.testDeleteEventSubscriptionWithoutType = function (test) {

  var client = new Client(realConfig);

  try {
    client.deleteEventSubscription();

    test.fail('Deleting Event subscription without vehicleId should fail.');
  } catch (err) {
    test.ok(err instanceof TypeError);
    test.strictEqual('vehicleId must be defined.', err.message);
  }

  try {
    client.deleteEventSubscription(createdVehicle.vehicleId);

    test.fail('Getting Event subscription without eventSubscriptionId should fail.');
  } catch (err) {
    test.ok(err instanceof TypeError);
    test.strictEqual('eventSubscriptionId must be defined.', err.message);
  }

  client.createEventSubscription(createdVehicle.vehicleId, 'troubleCode', {
    minimumTime: 20,
    postUrl: 'https://consumer.org/receive',
    notificationPeriod: 'ONETIME'
  }, function (res) {

    var subscription = res.body.subscription;

    client.deleteEventSubscription(createdVehicle.vehicleId, subscription.id, function (res2) {

      test.strictEqual(200, res2.status);

      // Obligatory nodeunit completion signal
      test.done();

    });

  });

};

/**
 * Test that calls to {@link Client#deleteEventSubscription} works as expected when there is an event type.
 */
exports.testDeleteEventSubscriptionWithType = function (test) {

  var client = new Client(realConfig)
    , eventType = Carvoyant.Utilities.externalizeEventType(createdEventSubscription._type);

  client.deleteEventSubscription(createdVehicle.vehicleId, createdEventSubscription.id, function (res) {

    test.strictEqual(200, res.status);

    // Obligatory nodeunit completion signal
    test.done();

  }, eventType);

};

/** All tests below this point have parts that are skipped if the required configuration is missing. **/

/**
 * Test that calls to {@link Client#tripDetails} work as expected.
 *
 * Note: Skipped if your client_config.js is missing the vehicleIdWithTripData option.
 */
exports.testTripDetails = function (test) {

  var client = new Client(realConfig);

  if (realConfig.vehicleIdWithTripData) {
    client.vehicleTrips(realConfig.vehicleIdWithTripData, function (res) {

      var trip = res.body.trip[0];

      client.tripDetails(realConfig.vehicleIdWithTripData, trip.id, function (res2) {

        test.strictEqual(trip.id, res2.body.trip.id);

        // Obligatory nodeunit completion signal
        test.done();

      });

    }, {
      searchLimit: 1
    });
  } else {
    // Obligatory nodeunit completion signal
    test.done();
  }

};

/**
 * Test that calls to {@link Client#vehicleConstraints} work as expected.
 */
exports.testVehicleConstraints = function (test) {

  var client = new Client(realConfig);

  try {
    client.vehicleConstraints();

    test.fail('Getting Vehicle constraints without vehicleId should fail.');
  } catch (err) {
    test.ok(err instanceof TypeError);
    test.strictEqual('vehicleId must be defined.', err.message);
  }

  if (realConfig.vehicleIdWithConstraints) {
    client.vehicleConstraints(realConfig.vehicleIdWithConstraints, function (res) {

      test.strictEqual(200, res.status);
      test.ok(_.isArray(res.body.constraints));

      // Obligatory nodeunit completion signal
      test.done();

    });
  } else {
    // Obligatory nodeunit completion signal
    test.done();
  }

};

/**
 * Test that calls to {@link Client#constraintDetails} work as expected.
 */
exports.testConstraintDetails = function (test) {

  var client = new Client(realConfig);

  try {
    client.vehicleConstraints();

    test.fail('Getting Vehicle constraint details without vehicleId should fail.');
  } catch (err) {
    test.ok(err instanceof TypeError);
    test.strictEqual('vehicleId must be defined.', err.message);
  }

  try {
    client.vehicleConstraints(realConfig.vehicleIdWithConstraints, function (res) {

      // Should never happen, here just to make the test fail when it does
      test.ok(res.status === 0);

    }, {
      activeOnly: 123
    });

    test.fail('Getting Vehicle constraint with invalid request should fail.');
  } catch (err) {
    test.ok(err instanceof TypeError);
    test.strictEqual('activeOnly must be a Boolean.', err.message);
  }

  if (realConfig.vehicleIdWithConstraints) {
    client.vehicleConstraints(realConfig.vehicleIdWithConstraints, function (res) {

      client.constraintDetails(realConfig.vehicleIdWithConstraints, res.body.constraints[0].id, function (res2) {

        test.strictEqual(200, res2.status);
        test.ok(_.isBoolean(res2.body.constraint.active));

        // Obligatory nodeunit completion signal
        test.done();

      });

    });
  } else {
    // Obligatory nodeunit completion signal
    test.done();
  }

};

/**
 * Test that calls to {@link Client#nextPage} and {@link Client#prevPage} work as expected.
 *
 * Note: Skipped if your client_config.js is missing the vehicleIdWithTripData option.
 */
exports.testNextPageAndPrevPage = function (test) {

  var client = new Client(realConfig);

  if (realConfig.vehicleIdWithTripData) {
    client.vehicleTrips(realConfig.vehicleIdWithTripData, function (res) {

      test.strictEqual(1, res.body.trip.length);
      test.ok(!_.contains(_.map(res.body.actions, function (action) { return action.name; }), 'previous'));

      client.nextPage(res, function (res2) {

        var actions = _.map(res2.body.actions, function (action) { return action.name; });

        test.strictEqual(1, res2.body.trip.length);
        test.ok(_.contains(actions, 'previous'));
        test.ok(_.contains(actions, 'next'));

        client.prevPage(res2, function (res3) {

          test.ok(!_.contains(_.map(res3.body.actions, function (action) { return action.name; }), 'previous'));

          // Obligatory nodeunit completion signal
          test.done();

        });

      });

    }, {
      searchLimit: 1
    });
  } else {
    // Obligatory nodeunit completion signal
    test.done();
  }

};

/**
 * Test that calls to {@link Client#eventNotifications} works as expected when there is no event type.
 *
 * Note: Skipped if your client_config.js is missing the vehicleIdWithNotifications option.
 */
exports.testEventNotificationsWithoutType = function (test) {

  var client = new Client(realConfig);

  try {
    client.eventNotifications();

    test.fail('Getting Event notifications without vehicleId should fail.');
  } catch (err) {
    test.ok(err instanceof TypeError);
    test.strictEqual('vehicleId must be defined.', err.message);
  }

  if (realConfig.vehicleIdWithNotifications) {
    client.eventNotifications(createdVehicle.vehicleId, function (res) {

      test.strictEqual(200, res.status);

      test.ok(_.isArray(res.body.notification));

      // Obligatory nodeunit completion signal
      test.done();

    });
  } else {
    // Obligatory nodeunit completion signal
    test.done();
  }

};

/**
 * Test that calls to {@link Client#eventNotifications} works as expected when there is no event type.
 *
 * Note: Skipped if your client_config.js is missing the vehicleIdWithNotifications option.
 */
exports.testEventNotificationsWithType = function (test) {

  var client = new Client(realConfig);

  if (realConfig.vehicleIdWithNotifications) {
    // Since we cannot create notifications, get the first one in the list

    client.eventNotifications(createdVehicle.vehicleId, function (res) {

      client.eventNotifications(createdVehicle.vehicleId, function (res2) {

        test.strictEqual(200, res2.status);

        test.ok(_.isArray(res2.body.notifications));

        // Obligatory nodeunit completion signal
        test.done();

      }, Carvoyant.Utilities.externalizeEventType(res.body.notifications[0]._type));

    });
  } else {
    // Obligatory nodeunit completion signal
    test.done();
  }

};

/**
 * Test that calls to {@link Client#eventNotificationDetails} works as expected when there is no event type.
 *
 * Note: Skipped if your client_config.js is missing the vehicleIdWithNotifications option.
 */
exports.testEventNotificationDetailsWithoutType = function (test) {

  var client = new Client(realConfig);

  try {
    client.eventNotificationDetails();

    test.fail('Getting Event notification details without vehicleId should fail.');
  } catch (err) {
    test.ok(err instanceof TypeError);
    test.strictEqual('vehicleId must be defined.', err.message);
  }

  try {
    client.eventNotificationDetails(createdVehicle.vehicleId);

    test.fail('Getting Event notifications without eventNotificationId should fail.');
  } catch (err) {
    test.ok(err instanceof TypeError);
    test.strictEqual('eventNotificationId must be defined.', err.message);
  }

  if (realConfig.vehicleIdWithNotifications) {
    client.eventNotifications(createdVehicle.vehicleId, function (res) {

      client.eventNotificationDetails(createdVehicle.vehicleId, res.body.notifications[0].id, function (res2) {

        test.strictEqual(200, res2.status);
        test.strictEqual(res.body.notifications[0].id, res2.body.notification.id);

        // Obligatory nodeunit completion signal
        test.done();

      });

    });
  } else {
    // Obligatory nodeunit completion signal
    test.done();
  }

};

/**
 * Test that calls to {@link Client#eventNotificationDetails} works as expected when there is an event type.
 *
 * Note: Skipped if your client_config.js is missing the vehicleIdWithNotifications option.
 */
exports.testEventNotificationDetailsWithType = function (test) {

  var client = new Client(realConfig);

  try {
    client.eventNotificationDetails(createdVehicle.vehicleId);

    test.fail('Getting Event notification details without eventNotificationId should fail.');
  } catch (err) {
    test.ok(err instanceof TypeError);
    test.strictEqual('eventNotificationId must be defined.', err.message);
  }

  if (realConfig.vehicleIdWithNotifications) {
    client.eventNotifications(createdVehicle.vehicleId, function (res) {

      var notification = res.body.notifications[0];

      client.eventNotificationDetails(createdVehicle.vehicleId, notification.id, function (res2) {

        test.strictEqual(200, res2.status);
        test.strictEqual(notification.id, res2.body.notification.id);

        // Obligatory nodeunit completion signal
        test.done();

      }, Carvoyant.Utilities.externalizeEventType(notification._type));

    });
  } else {
    // Obligatory nodeunit completion signal
    test.done();
  }

};

/**
 * Test that calls to {@link Client#deleteVehicle} works as expected.
 */
exports.testDeleteVehicle = function (test) {
  var client = new Client(realConfig);

  try {
    client.deleteVehicle();

    test.fail('Deleting a Vehicle without vehicleId should fail.');
  } catch (err) {
    test.ok(err instanceof TypeError);
    test.strictEqual('vehicleId must be defined.', err.message);
  }

  client.deleteVehicle(createdVehicle.vehicleId, function (res) {
    // Right now, deleting a vehicle that has any kind of data associated with it, which our test vehicles will, will
    // not work.  This test is written based on that fact and while it's not ideal, the API call itself isn't broken.

    test.strictEqual(400, res.status);
    test.strictEqual('Could not delete. Validation errors.', res.body.error.detail);

    // Obligatory nodeunit completion signal
    test.done();
  });
};
