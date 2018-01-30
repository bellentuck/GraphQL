const graphql = require('graphql');
//const _ = require('lodash');

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema  // I: root query; O: GraphQL schema instance
} = graphql;

const users = [
  { id: '23', firstName: 'Bill', age: 30 },
  { id: '24', firstName: 'Samantha', age: 31 }
];

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
      resolve(parentValue, args) {   // resolve() is what actually gets the data
        // 'args' is whatever arguments were called with the root query.
        return users.find(u => u.id === args.id);
        //return _.find(users, { id: args.id });
      }
    }
  }
});

module.exports = new GraphQLSchema({
  query: rootQuery
});
