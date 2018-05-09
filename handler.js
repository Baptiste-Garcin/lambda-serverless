'use strict';

const { DynamoDB } = require('aws-sdk');

const docClient = new DynamoDB.DocumentClient({
  region: 'eu-west-3',
});

module.exports.hello = (event, context, callback) => {
  const response = {
    statusCode: 200,
  };

  if (event.httpMethod === 'POST') {
    const payload = JSON.parse(event.body);
    const movie = {
      TableName: 'movies',
      Item: {
        title: payload.title,
        year: payload.year,
      },
    };

    docClient.put(movie)
      .promise()
      .then(() => {
        response.body = JSON.stringify({
          success: true,
        });

        return callback(null, response);
      })
      .catch((err) => {
        response.statusCode = 500;
        response.body = JSON.stringify({
          success: false,
          err,
        });

        callback(null, response);
      });
  } else if (event.queryStringParameters && event.queryStringParameters.name) {
    const { name } = event.queryStringParameters;
    response.body = JSON.stringify({
      message: `Hello ${name} !`,
    });
  }
};
