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
        // Just have to return raw JSON or js object,
        // and GraphQL takes care of it from there.
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


## (6) Test query in GraphiQL
Query:
```
{
  user(id: "23") {
    id,
    firstName,
    age
  }
}
```
Result:
```
{
  "data": {
    "user": {
      "id": "23",
      "firstName": "Bill",
      "age": 30
    }
  }
}
```
(Types show up as they've been marked in the schema.)
Note that:
1. `id` can be any id, and corresponding user info is fetched
2. You completely specify what fields you want return. (E.g., just `firstName` or just `age`.) This prevents over-fetching (a problem with RESTful routing).
3. If no record found, `null` user is returned:
```
{
  "data": {
    "user": null
  }
}
```
4. No arg provided, get error (no "Name" provided error)

## (7) Build and serve data in the GraphQL application
#### (7a) Make a separate server to act as an outside API via `json-server`:
```
npm install --save json-server
```
`db.json`: data you want your server to serve up
```
{
  "users": [
    { "id": "20", "firstName": "Manders", "age": 20 },
    { "id": "40", "firstName": "Anders", "age": 40 }
  ]
}
```
`package.json`: start server up (separately from the GraphQL server)
```
"scripts": {
  "json:server": "json-server --watch db.json"
},
```
`npm run json:server` to test
###### `json-server` is great for running some fake data in a development environment!

#### (7b) Implement an async data request for the `resolve` function
Via `axios`:
`npm install --save axios`
`schema.js`:
```
return axios.get(`http://localhost:3000/users/${args.id}`)
  .then(response => response.data);
```
Via `fetch`:
`npm install --save isomorphic-fetch`
`schema.js`:
```
return fetch(`http://localhost:3000/users/${args.id}`, { method: 'GET' })
  .then(response => response.json());
```
