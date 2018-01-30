const express = require('express');

// glue or compatibility layer btwn GraphQL & express
const expressGraphQL = require('express-graphql');

const schema = require('./schema/schema');

const app = express();

app.use('/graphql', expressGraphQL({
  schema,  // auto-expanded to `schema: schema`
  graphiql: true
}));

app.listen(4000, () => {
  console.log('Listening');
});
