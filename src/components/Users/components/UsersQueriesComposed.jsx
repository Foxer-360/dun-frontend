import React from 'react';
import { adopt } from 'react-adopt';
import { Query, Mutation } from 'react-apollo';
import gql from 'graphql-tag';


const USER_FRAMENT = `
  fragment UserParts on User {
    id
    username
    email
    privileges {
      id
      name
    }
    actionTypes
    avatar
  }
`;

const GET_USERS = gql`
  {
    users {
      ...UserParts
    }
  }
  ${USER_FRAMENT}
`;

const GET_PRIVILEGES = gql`
  {
    privileges {
      id
      name
    }
  }
`;

const ACTION_TYPES = gql`
  {
    actionTypes {
      authorizationApiTypes
      externalApiTypes
    }
  }
`;

const CREATE_USER = gql`
${USER_FRAMENT}
mutation (
    $username: String!
    $email: String!
    $password: String!
    $actionTypes: [String!]!
    $privilegesToConnect: [PrivilegeWhereUniqueInput!]
) {
  createUser(data: { 
    username: $username,
    email: $email,
    password: $password,
    actionTypes: { set: $actionTypes },
    privileges: { connect: $privilegesToConnect }
  }) {
    ...UserParts
  }
}
`;

const UPDATE_USER = gql`
${USER_FRAMENT}
mutation (
    $username: String!
    $actionTypes: [String!]!
    $userId: ID!
    $privilegesToConnect: [PrivilegeWhereUniqueInput!]
    $privilegesToDisconnect: [PrivilegeWhereUniqueInput!]
) {
  updateUser(data: { 
    username: $username,
    actionTypes: { 
      set: $actionTypes 
    },
    privileges: { connect: $privilegesToConnect, disconnect: $privilegesToDisconnect}
  } where: { id: $userId }) {
    ...UserParts
  }
}
`;

export default adopt({
  createUser: ({ render }) => (
    <Mutation
      update={(cache, { data: { createUser } }) => {
        const { users } = cache.readQuery({ query: GET_USERS });

        cache.writeQuery({
          query: GET_USERS,
          data: { users: users.concat(createUser) },
        });
      }}
      mutation={CREATE_USER}
    >
      {data => render(data)}
    </Mutation>
  ),
  updateUser: ({ render }) => (
    <Mutation
      update={(cache, { data: { updateUser } }) => {
        const { users } = cache.readQuery({ query: GET_USERS });
        cache.writeQuery({
          query: GET_USERS,
          data: {
            users: users.map((user) => {
              if (user.id === updateUser.id) {
                return updateUser;
              }
              return user;
            }),
          },
        });
      }}
      mutation={UPDATE_USER}
    >
      {data => render(data)}
    </Mutation>
  ),
  deleteUser: ({ render }) => (
    <Mutation
      update={(cache, { data: { deleteUser } }) => {
        const { users } = cache.readQuery({ query: GET_USERS });
        cache.writeQuery({
          query: GET_USERS,
          data: { users: users.filter(user => user.id !== deleteUser.id) },
        });
      }}
      mutation={
      gql`
        mutation ($userId: ID!) {
          deleteUser(id: $userId) {
            id
          }
        }
      `
    }
    >
      {data => render(data)}
    </Mutation>
  ),
  usersQueryRes: ({ render }) => (
    <Query
      query={GET_USERS}
    >
      {data => render(data)}
    </Query>
  ),
  actionTypesQueryRes: ({ render }) => (
    <Query
      query={ACTION_TYPES}
    >
      {data => render(data)}
    </Query>
  ),
  privilegesQueryRes: ({ render }) => (
    <Query
      query={GET_PRIVILEGES}
    >
      {data => render(data)}
    </Query>
  ),
  data: ({
    render,
    usersQueryRes: {
      loading: usersLoading,
      error: usersError,
      data: usersData,
    },
    actionTypesQueryRes: {
      loading: actionTypesLoading,
      error: actionTypesError,
      data: actionTypesData,
    },
    privilegesQueryRes: {
      loading: privilegesLoading,
      error: privilegesError,
      data: privilegesData,
    },
    createUser,
    updateUser,
    deleteUser,
  }) => {
    if (usersLoading || actionTypesLoading || privilegesLoading) return 'Loading...';
    if (usersError || actionTypesError || privilegesError) return 'Error...';

    const {
      users,
    } = usersData;

    const {
      privileges,
    } = privilegesData;

    const {
      actionTypes: {
        authorizationApiTypes,
        externalApiTypes,
      },
    } = actionTypesData;

    return render({
      users,
      privileges,
      actionTypes: [
        ...authorizationApiTypes,
        ...externalApiTypes,
      ],
      createUser,
      updateUser,
      deleteUser,
    });
  },
});
