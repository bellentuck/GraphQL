"tl;dr-style" notes from Stephen Grider's "GraphQL with React" Udemy course. Just enough code and intuition to get up and running!

# To run: `node server.js`

# Dependencies (so far):
```
node, npm
express, express-graphql, graphql
lodash
```

# To build:

## (1) Init the project
```
npm init -y
npm install --save express express-graphql graphql lodash
```
## (2) Init an Express server
`server.js`:
```
const express = require('express');

const app = express();

app.listen(4000, () => {
  console.log('Listening');
});
```

## (3) Hook up GraphQL to Express
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

## (4) Init a **schema**
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
  GraphQLInt,
  GraphQLSchema
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


## (5) Establish a **root query**
A root query is an entry point into our data. A root query allows GraphQL to "jump into" a graph of data.
`schema.js`:
```
// "If you're looking for a user, and you give me an ID, I will give you back a user."
const rootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    user: {
      type: UserType,
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {   // resolve() is what actually gets the data
        // 'args' is whatever arguments were called with the root query.
        return users.find(u => u.id === args.id);
      }
    }
  }
});

module.exports = new GraphQLSchema({
  query: rootQuery
});
```
`server.js`:
```
const schema = require('./schema/schema');

app.use('/graphql', expressGraphQL({
  schema,  // auto-expanded to `schema: schema`
  graphiql: true
}));
```
Restart server, test - `node server.js` - and the app will load up inside the GraphiQL GUI app!
