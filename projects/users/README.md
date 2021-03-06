"tl;dr-style" notes from Stephen Grider's "GraphQL with React" Udemy course. Just enough code and intuition to get up and running!

# To run: `node server.js`

# Dependencies (so far):
```
node, npm
express, express-graphql, graphql
axios OR isomorphic-fetch
nodemon
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
#### `nodemon` to make sure server is always running the latest code ('hot reloading'(?)):
`npm install --save nodemon`
`package.json`:
```
"scripts": {
  "dev": "nodemon server.js"
},
```
##### Then, `npm run dev` to run
Now every change you save will trigger
```
[nodemon] restarting due to changes...
[nodemon] starting `node server.js`
Listening
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
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull
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
5. You can also **name your queries**, enabling reuse! E.g.,
```
query findUser{
  user(id: "23") {
    id,
    firstName,
    age
  }
}
```
6. Similarly, you can **name query results**, enabling multiple instances of the same query *type* within a single query:
```
{
  bill: user(id: "23") {
    id,
    firstName,
    age
  }
  lil: user(id: "24") {
    id,
    firstName,
    age
  }
}
```
Another example (using `CompanyType` from later on):
```
{
  twister: company(id: "1"){
    description
    users {
      age
    }
  }
  sorry: company(id: "2"){
    description
    users {
      age
    }
  }
}
```
7. Optimize with **Query Fragments**:
First, write the fragment like so:
```
fragment companyDetails on Company {
  id
  name
  description
}
```
Then, call the fragment like so:
```
{
  twister: company(id: "1") {
    ...companyDetails
  }
}
```

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

## (8) Relate some data
E.g., a company to a user
`db.json`:
```
{
  "users": [
    { "id": "20", "firstName": "Manders", "age": 20, "companyId": "1" },
    { "id": "40", "firstName": "Anders", "age": 40, "companyId": "1" },
    { "id": "60", "firstName": "Flanders", "age": 42, "companyId": "2" }
  ],
  "companies": [
    { "id": "1", "name": "Twister", "description": "the hot spot" },
    { "id": "2", "name": "Sorry", "description": "not sorry" }
  ]
}
```
Now, `http://localhost:3000/companies/1/users` will bring up all users at company 1, `.../2/users` for all at company 2. This RESTful convention is being set up by `json-server`, b/c of the `"companyId"` field supplied for each user.

Create company type in `schema.js` (define **above** `UserType`):
```
const CompanyType = new GraphQLObjectType({
  name: 'Company',
  fields: {
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString }
  }
});
```
Now, treat the association between `CompanyType` and `UserType` as if it were another field.
- Accordingly, create a new `company` field, of type `CompanyType`, on the `UserType` object.
- Add a `resolve` function, which is required as the `companyId` field on the user *model* (the actual data) is different from the `company` field  on the user *type* (defined in the schema).
```
const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    age: { type: GraphQLInt },
    company: {
      type: CompanyType,
      resolve(parentValue, args) {
        //console.log(parentValue, args); --> good for testing at first
        return axios.get(`http://localhost:3000/companies/${parentValue.companyId}`)
          .then(res => res.data);
      }
    }
  }
});
```
(With `fetch`, as before, you'd just tack on the object to specify `GET` and the `.json()` method instead of `.data`.)
##### "`resolve` takes us from one place on the graph to another place on the graph" -
#### I.e., each edge on the graph is a `resolve` function.

## (9) Implement multiple `RootQuery` entry points
Add a sibling field to `user` the `RootQuery` in `schema.js`:
```
company: {
  type: CompanyType,
  args: { id: { type: GraphQLString } },
  resolve(parentValue, args) {
    return axios.get(`http://localhost:3000/companies/${args.id}`)
      .then(res => res.data);
  }
}
```
Now, GraphiQL, given
```
{
  company(id: "1") {
    name
    description
  }
}
```
can return
```
{
  "data": {
    "company": {
      "name": "Twister",
      "description": "the hot spot"
    }
  }
}
```

## (10) Relate data bidirectionally
E.g., relating users to a company.
How to do this RESTfully, via `json-server`:
`http://localhost:3000/companies/1/users`. However, with GraphQL:
- we add a `users` field to the `CompanyType` in `schema.js`
- we wrap the `fields` object in `CompanyType` in an arrow function, to avoid circular reference errors. Also wrap the `fields` object in `UserType` in an arrow function. This way, the function gets defined but not executed until after the entire JS file has been executed (which will define company and user types). Then, `UserType` and `CompanyType` will be inside the *closure scopes* of their anonymous functions, and so everything will be correctly defined (b/c of how closures work in JS--inner stuff has access to all relative-outer stuff).
```
const CompanyType = new GraphQLObjectType({
  name: 'Company',
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    users: {
      type: new GraphQLList(UserType),
      resolve(parentValue, args) {
        return axios.get(`http://localhost:3000/companies/${parentValue.id}/users`)
          .then(res => res.data);
      }
    }
  })
});
```
Now, in GraphiQL, e.g.,
```
{
  company(id: "1") {
    name
    users {
      id
      firstName
      company {
        name
        users {
          id
        }
      }
      age
    }
  }
}
```
can return
```
{
  "data": {
    "company": {
      "name": "Twister",
      "users": [
        {
          "id": "20",
          "firstName": "Manders",
          "company": {
            "name": "Twister",
            "users": [
              {
                "id": "20"
              },
              {
                "id": "40"
              }
            ]
          },
          "age": 20
        },
        {
          "id": "40",
          "firstName": "Anders",
          "company": {
            "name": "Twister",
            "users": [
              {
                "id": "20"
              },
              {
                "id": "40"
              }
            ]
          },
          "age": 40
        }
      ]
    }
  }
}
```
You can recursively nest as far down in this structure as you so choose!

# Writing Data

## (11) Modify the data store using `mutations`
`schema.js`:
```
const mutation = new GraphQLObjectType({
  name: 'Mutation',  // CrUD
  fields: {  // describe operations
    addUser: {
      type: UserType,
      args: {
        firstName: { type: new GraphQLNonNull(GraphQLString) },
        age: { type: new GraphQLNonNull(GraphQLInt) },
        companyId: { type: GraphQLString }
      },
      resolve(parentValue, { firstName, age }) {
        return axios.post('http://localhost:3000/users', { firstName, age })
          .then(res => res.data);
      }
    },
    deleteUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) }
      },
      resolve(parentValue, { id }) {
        return axios.delete(`http://localhost:3000/users/${id}`)
          .then(res => res.data);
      }
    },
    editUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        companyId: { type: GraphQLString }
      },
      resolve(parentValue, args) {
        return axios.patch(`http://localhost:3000/users/${args.id}`, args)
          .then(res => res.data);
      }
    }
  }
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation
});
```
Then, an `addUser` query
```
mutation {
  addUser(firstName: "Sanders", age: 26) {
    id
    firstName
    age
  }
}
```
yields the following result:
```
{
  "data": {
    "addUser": {
      "id": "O3W58aB",
      "firstName": "Sanders",
      "age": 26
    }
  }
}
```
(`json-server` creates the id automatically.)

`deleteUser`:
```
mutation {
  deleteUser(id: "60") {
    id
  }
}
```
yields:
```
{
  "data": {
    "deleteUser": {
      "id": null
    }
  }
}
```
`editUser`:
```
mutation {
  editUser(id: "40", firstName: "Shmanders", age: 146) {
    id
    firstName
    age
  }
}
```
yields:
```
{
  "data": {
    "editUser": {
      "id": "40",
      "firstName": "Shmanders",
      "age": 146
    }
  }
}
```
