import React, { Component } from 'react';
import {
  Table, Button,
} from 'antd';
import { adopt } from 'react-adopt';
import { Query, Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import PrivilegeEditationForm from './components/PrivilegeEditationForm';

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
    __schema {
      queryType {
        name
        fields {
          name
        }
      }
      mutationType {
        name
        fields {
          name
        }
      }
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

const PrivilegesQueriesComposed = adopt({
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

});


class Privileges extends Component {
  constructor(props) {
    super(props);

    this.state = {
      privilegeFormsData: [],
    };
  }

  render() {
    const { privilegeFormsData } = this.state;
    return (
      <PrivilegesQueriesComposed>
        {({
          privileges,
          queriesTypes,
          mutationTypes,
          createPrivilege,
          updatePrivilege,
          deletePrivilege,
        }) => (
          <Table
            columns={this.getPrivilegesTableColumns(
              createPrivilege,
              updatePrivilege,
              deletePrivilege,
            )}
            expandedRowRender={(privilege) => {
              const privilegeInState = privilegeFormsData.find(({ id }) => id === privilege.id);

              return (
                <PrivilegeEditationForm
                  privileges={privileges}
                  privilege={privilege}
                  privilegeInState={privilegeInState}
                  actions={[...queriesTypes, ...mutationTypes]}
                  onchange={this.onChange}
                />
              );
            }}
            dataSource={this.getPrivilegesTableData()}
          />)
        }
      </PrivilegesQueriesComposed>
    );
  }

  getPrivilegesTableColumns(createPrivilege, updatePrivilege, deletePrivilege) {
    const { privilegeFormsData } = this.state;

    return [
      { title: 'Name', dataIndex: 'name', key: 'name' },
      {
        title: 'Action',
        dataIndex: '',
        key: 'x',
        render: (...args) => {
          const { 1: privilege } = args;

          const privilegeInState = privilegeFormsData.find(({ id }) => id === privilege.id);

          if (privilege.id !== 'new') {
            return (<>
              <Button
                type="danger"
                onClick={() => deletePrivilege({ variables: { privilegeId: privilege.id } })}
              >
                  Delete
              </Button>
              <Button
                disabled={!privilegeInState}
                style={{ marginLeft: 10 }}
                type="primary"
                onClick={() => updatePrivilege({
                  variables: {
                    privilegeId: privilege.id,
                    ...privilege,
                    ...privilegeInState,
                  },
                }).then(() => {
                  this.setState({
                    privilegeFormsData: privilegeFormsData
                      .filter(privilegeFormData => privilegeFormData.id !== privilege.id) 
                  });
                })}
              >
                Update
              </Button>
            </>);
          }


          if (privilegeInState) {
            return (
              <Button
                type="primary"
                onClick={() => {
                  createPrivilege({
                    variables: {
                      ...({
                        privileges: [],
                        actionTypes: [],
                      }),
                      ...privilegeInState,
                    },
                  }).then(() => {
                    this.setState({ privilegeFormsData: privilegeFormsData.filter(privilegeFormData => privilegeFormData.id !== 'new') });
                  });
                }}
              >
                Create
              </Button>
            );
          }

          return (<></>);
        },
      },
    ];
  }

  static getPrivilegesTableData(privileges) {
    return [
      ...privileges.map(privilege => ({
        key: privilege.id,
        ...privilege,
      })),
      {
        id: 'new',
        key: 'new',
        name: 'Create new privilege',
      },
    ];
  }

  onChange = (fieldName, privilege) => (value) => {
    const { privilegeFormsData } = this.state;

    if (fieldName === 'privileges') {
      this.handlePrivilegesChange(privilegeFormsData, value, privilege);
      return;
    }
    const existingPrivilegeFormData = privilegeFormsData.find(({ id }) => privilege.id === id);
    if (!existingPrivilegeFormData) {
      this.setState({ privilegeFormsData: [{ ...(privilege || {}), [fieldName]: value }] });
    } else {
      this.setState({
        privilegeFormsData: [...privilegeFormsData.map((privilegeFormData) => {
          if (privilegeFormData) {
            return { ...(privilege || {}), ...privilegeFormData, [fieldName]: value };
          }

          return privilegeFormsData;
        })],
      });
    }
  }

  handlePrivilegesChange(privilegeFormsData, newPrivileges, privilege) {
    const privilegePrivileges = (privilege && privilege.privileges) || [];

    const {
      privilegesToConnect,
      privilegesToDisconnect,
    } = {
      privilegesToConnect: newPrivileges
        .map(({ id }) => id)
        .filter(privilegeId => !privilegePrivileges
          .some(({ id }) => id !== privilegeId))
        .map(id => ({ id })),
      privilegesToDisconnect: privilegePrivileges
        .filter(({ id }) => !newPrivileges.map(({ id }) => id)
          .some(id => (privilegePrivileges
            .map(({ id }) => id).includes(id)
          )))
        .map(({ id }) => ({ id })),
    };

    const existingPrivilegeFormData = privilegeFormsData.find(({ id }) => privilege.id === id);
    if (!existingPrivilegeFormData) {
      this.setState({
        privilegeFormsData: [
          ...privilegeFormsData, {
            ...(privilege || {}),
            privilegesToConnect,
            privilegesToDisconnect,
            privileges: newPrivileges,
          }],
      });
    } else {
      this.setState({
        privilegeFormsData: [...privilegeFormsData.map((privilegeFormData) => {
          if (privilegeFormData) {
            return {
              ...(privilege || {}),
              ...privilegeFormData,
              privilegesToConnect,
              privilegesToDisconnect,
              privileges: newPrivileges,
            };
          }

          return privilegeFormsData;
        })],
      });
    }
  }
}

export default Privileges;
