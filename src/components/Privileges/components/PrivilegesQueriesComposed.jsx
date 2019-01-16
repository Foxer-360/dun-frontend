import React from 'react';
import { adopt } from 'react-adopt';
import { Query, Mutation } from 'react-apollo';
import gql from 'graphql-tag';

const PRIVILEGE_FRAMENT = `
  fragment PrivilegeParts on Privilege {
    id
    name
    privileges {
      id
      name
    }
    actionTypes
  }
`;

const GET_PRIVILEGES = gql`
  {
    privileges {
      ...PrivilegeParts
    }
  }
  ${PRIVILEGE_FRAMENT}
`;

const ACTION_TYPES = gql`
  {
    actionTypes {
      authorizationApiTypes
      externalApiTypes
    }
  }
`;

const CREATE_PRIVILEGE = gql`
${PRIVILEGE_FRAMENT}
mutation (
    $name: String!
    $actionTypes: [String!]!
    $privilegesToConnect: [PrivilegeWhereUniqueInput!]
) {
  createPrivilege(data: { 
    name: $name,
    actionTypes: { set: $actionTypes },
    privileges: { connect: $privilegesToConnect }
  }) {
    ...PrivilegeParts
  }
}
`;

const UPDATE_PRIVILEGE = gql`
${PRIVILEGE_FRAMENT}
mutation (
    $name: String!
    $actionTypes: [String!]!
    $privilegeId: ID!
    $privilegesToConnect: [PrivilegeWhereUniqueInput!]
    $privilegesToDisconnect: [PrivilegeWhereUniqueInput!]
) {
  updatePrivilege(data: { 
    name: $name,
    actionTypes: { 
      set: $actionTypes 
    },
    privileges: { connect: $privilegesToConnect, disconnect: $privilegesToDisconnect}
  } where: { id: $privilegeId }) {
    ...PrivilegeParts
  }
}
`;

export default adopt({
  createPrivilege: ({ render }) => (
    <Mutation
      update={(cache, { data: { createPrivilege } }) => {
        const { privileges } = cache.readQuery({ query: GET_PRIVILEGES });

        cache.writeQuery({
          query: GET_PRIVILEGES,
          data: {
            privileges: [
              ...privileges,
              ...createPrivilege.privileges
                .filter(privilege => privileges.some(({ id }) => privilege.id !== id)),
              createPrivilege,
            ],
          },
        });
      }}
      mutation={CREATE_PRIVILEGE}
    >
      {data => render(data)}
    </Mutation>
  ),
  updatePrivilege: ({ render }) => (
    <Mutation
      update={(cache, { data: { updatePrivilege } }) => {
        const { privileges } = cache.readQuery({ query: GET_PRIVILEGES });
        cache.writeQuery({
          query: GET_PRIVILEGES,
          data: {
            privileges: privileges.map((privilege) => {
              if (privilege.id === updatePrivilege.id) {
                return updatePrivilege;
              }
              return privilege;
            }),
          },
        });
      }}
      mutation={UPDATE_PRIVILEGE}
    >
      {data => render(data)}
    </Mutation>
  ),
  deletePrivilege: ({ render }) => (
    <Mutation
      update={(cache, { data: { deletePrivilege } }) => {
        const { privileges } = cache.readQuery({ query: GET_PRIVILEGES });
        cache.writeQuery({
          query: GET_PRIVILEGES,
          data: { privileges: privileges.filter(privilege => privilege.id !== deletePrivilege.id) },
        });
      }}
      mutation={
          gql`
            mutation ($privilegeId: ID!) {
              deletePrivilege(where: {id: $privilegeId}) {
                id
              }
            }
          `
        }
    >
      {data => render(data)}
    </Mutation>
  ),
  privilegesQueryRes: ({ render }) => (
    <Query
      query={GET_PRIVILEGES}
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
  data: ({
    privilegesQueryRes: {
      loading: privilegesLoading,
      error: privilegesError,
      data: privilegesData,
    },
    actionTypesQueryRes: {
      loading: actionTypesLoading,
      error: actionTypesError,
      data: actionTypesData,
    },
    createPrivilege,
    updatePrivilege,
    deletePrivilege,
    render,
  }) => {
    if (privilegesLoading || actionTypesLoading || privilegesLoading) return 'Loading...';

    if (privilegesError || actionTypesError) return `${privilegesError || ''} ${actionTypesError || ''}`;

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
      privileges,
      actionTypes: [
        ...authorizationApiTypes,
        ...externalApiTypes,
      ],
      createPrivilege,
      updatePrivilege,
      deletePrivilege,
    });
  },
});
