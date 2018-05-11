'use strict';

const uuidv1 = require('uuid/v1');
const { DynamoDB } = require('aws-sdk');

const docClient = new DynamoDB.DocumentClient({
  region: 'eu-west-3',
});

module.exports.getUser = async (event, context, callback) => {
  if (!event.pathParameters) {
    const response = {
      statusCode: 404,
      body: JSON.stringify({
        message: 'Missing userId',
      }),
    };

    return callback(null, response);
  }

  const { id } = event.pathParameters;
  const params = {
    TableName: 'users',
    Key: {
      id,
    },
  };

  const user = await docClient.get(params).promise();
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      user,
    }),
  };

  return callback(null, response);
};

module.exports.postUser = async (event, context, callback) => {
  const payload = JSON.parse(event.body);
  const id = uuidv1();
  const { firstname, lastname, email } = payload;
  const user = {
    TableName: 'users',
    Item: {
      id,
      firstname,
      lastname,
      email,
    },
  };

  try {
    await docClient.put(user).promise();
    const response = {
      statusCode: 200,
      body: JSON.stringify(user),
    };

    return callback(null, response);
  } catch (err) {
    const response = {
      statusCode: err.statusCode,
      body: JSON.stringify(err),
    };

    return callback(null, response);
  }
};
