'use strict';

const uuidv1 = require('uuid/v1');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { DynamoDB } = require('aws-sdk');

const docClient = new DynamoDB.DocumentClient({
  region: 'eu-west-3',
});

module.exports.getUser = async (event, context, callback) => {
  try {
    if (!event.pathParameters || !event.pathParameters.id) {
      const error = {
        statusCode: 400,
        message: 'missing parameter',
      };

      throw error;
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
  } catch (err) {
    const response = {
      statusCode: err.statusCode,
      body: JSON.stringify(err),
    };

    return callback(null, response);
  }
};

module.exports.signIn = async (event, context, callback) => {
  const { email, password } = JSON.parse(event.body);
  const hashPassword = crypto.createHash('md5').update(password).digest('hex');
  const params = {
    TableName: 'users',
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :hkey',
    ExpressionAttributeValues: {
      ':hkey': email,
    },
  };

  try {
    const user = await docClient.query(params).promise();
    if (user.Count === 0) {
      const error = {
        statusCode: 400,
        message: 'email unknown',
      };

      throw error;
    }

    if (user.Items[0].password !== hashPassword) {
      const err = {
        statusCode: 401,
        message: 'wrong pasword',
      };

      throw err;
    }

    const token = jwt.sign({
      userId: user.Items[0].id,
    }, process.env.tokenSecret);

    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        token,
      }),
    };

    return callback(null, response);
  } catch (err) {
    const response = {
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: err.message,
      }),
    };

    return callback(null, response);
  }
};

module.exports.signUp = async (event, context, callback) => {
  const payload = JSON.parse(event.body);
  const id = uuidv1();
  const {
    firstname, lastname, email, password,
  } = payload;
  const hashPassword = crypto.createHash('md5').update(password).digest('hex');
  const user = {
    TableName: 'users',
    Item: {
      password: hashPassword,
      id,
      firstname,
      lastname,
      email,
    },
  };

  const queryParams = {
    TableName: 'users',
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :hkey',
    ExpressionAttributeValues: {
      ':hkey': email,
    },
  };

  try {
    const { Count } = await docClient.query(queryParams).promise();
    if (Count > 0) {
      const error = {
        statusCode: 400,
        message: 'email already taken',
      };

      throw error;
    }

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
