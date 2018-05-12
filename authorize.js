'use strict';

const jwt = require('jsonwebtoken');

module.exports.handler = (event, context, callback) => {
  const token = event.authorizationToken;

  try {
    const user = jwt.verify(token, process.env.tokenSecret);
    const { userId } = user;

    const policyDocument = {
      principalId: userId,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: 'arn:aws:execute-api:*:*:*',
          },
        ],
      },
      context: {
        userId,
      },
    };

    callback(null, policyDocument);
  } catch (err) {
    console.error(err);
    callback('Unauthorized'); // Return a 401 Unauthorized response
  }
};
