const graphql = require('graphql');
const axios = require('axios');
//const fetch = require('isomorphic-fetch');


const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema  // I: root query; O: GraphQL schema instance
} = graphql;

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    age: { type: GraphQLInt }
  }
});

// "If you're looking for a user, and you give me an ID, I will give you back a user."
const rootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    user: {
      type: UserType,
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        // - resolve() is what actually gets the data. Fetch any piece of data we'd possibly want.
        // - 'args' is whatever arguments were called with the root query.
        // - `resolve` will nearly always return a promise, as data fetching in a Node app will be asynchronous.

        // via `axios`:
        return axios.get(`http://localhost:3000/users/${args.id}`)
          .then(response => response.data);

        // via `fetch`:
        // return fetch(`http://localhost:3000/users/${args.id}`, { method: 'GET' })
        //   .then(response => response.json());

        // Just have to return raw JSON or js object, and GraphQL takes care of it from there.
      }
    }
  }
});

module.exports = new GraphQLSchema({
  query: rootQuery
});
