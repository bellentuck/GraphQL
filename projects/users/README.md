"tl;dr-style" notes from Stephen Grider's "GraphQL with React" Udemy course. Just enough code and intuition to get up and running!

# To run: `node server.js`

#Dependencies (so far):
```
node, npm
express, express-graphql, graphql
lodash
```

#To build:

##(1) Init the project
```
npm init -y
npm install --save express express-graphql graphql lodash
```
##(2) Init an Express server
`server.js`:
```
const express = require('express');

const app = express();

app.listen(4000, () => {
  console.log('Listening');
});
```

##(3) Hook up GraphQL to Express
`server.js`:
```
// glue or compatibility layer btwn GraphQL & express
const expressGraphQL = require('express-graphql');

app.use('/graphql', expressGraphQL({
  graphiql: true
}));
```
Test via `node server.js`
- Should get immediate `Listening` response
- `localhost:4000/graphql` should throw `{"errors":[{"message":"GraphQL middleware options must contain a schema."}]}`

##(4) Init a **schema**
Inform GraphQL how data is arranged, and how it can be accessed. What type of data? How do relations play out between different pieces of data?
- What properties does each object have?
- What are relations between objects?
```
mkdir schema && touch schema/schema.js
```
In `schema/schema.js`:
```
const graphql = require('graphql');
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt
} = graphql;

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    age: { type: GraphQLInt }
  }
});
```
