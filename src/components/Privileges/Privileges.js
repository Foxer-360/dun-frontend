import React, { Component } from 'react';
import { Table, Button, Input, Icon, Form, Select } from 'antd';
import { adopt } from 'react-adopt';
import { Query, Mutation } from 'react-apollo';
import gql from 'graphql-tag';

const { Option } = Select;

const FormItem = Form.Item;

const camelCaseToSentence = (camelCase) => {
  const result = camelCase.replace( /([A-Z])/g, " $1" );
  return result.charAt(0).toUpperCase() + result.slice(1); // capitalize the first letter - as an example.
}

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
  createPrivilege: ({ render }) => <Mutation
    update={(cache, { data: { createPrivilege } }) => {
      const { privileges } = cache.readQuery({ query: GET_PRIVILEGES });

      cache.writeQuery({
        query: GET_PRIVILEGES,
        data: { privileges: [
          ...privileges, 
          ...createPrivilege.privileges.filter(privilege => privileges.some(({ id }) => privilege.id !== id)), 
          createPrivilege
        ]}
      });
    }}
    mutation={CREATE_PRIVILEGE}
  >
    {(data) => render(data)}
  </Mutation>,
  updatePrivilege: ({ render }) => <Mutation
    update={(cache, { data: { updatePrivilege } }) => {
      const { privileges } = cache.readQuery({ query: GET_PRIVILEGES });
      cache.writeQuery({
        query: GET_PRIVILEGES,
        data: { privileges: privileges.map((privilege) => {
          if(privilege.id === updatePrivilege.id) {
            return updatePrivilege;
          } else {
            return privilege;
          }
        })}
      });
    }}
    mutation={UPDATE_PRIVILEGE}
  >
    {(data) => render(data)}
  </Mutation>,
  deletePrivilege: ({ render }) => <Mutation
    update={(cache, { data: { deletePrivilege } }) => {
      const { privileges } = cache.readQuery({ query: GET_PRIVILEGES });
      cache.writeQuery({
        query: GET_PRIVILEGES,
        data: { privileges: privileges.filter(privilege => privilege.id !== deletePrivilege.id) }
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
    {(data) => render(data)}
  </Mutation>,
  // updatePrivilege
  privilegesQueryRes: ({ render }) => <Query 
    query={GET_PRIVILEGES}
  >
    {(data) => render(data)}
  </Query>,
  actionTypesQueryRes: ({ render }) => <Query
    query={ACTION_TYPES}
  >
    {(data) => render(data)}
  </Query>
});


class Privileges extends Component {

  constructor(props) {
    super(props)

    this.state = {
      privilegeFormsData: []
    }

  }

  render() {
    return <PrivilegesQueriesComposed>
    {({
      privilegesQueryRes: {
        loading: privilegesLoading,
        error: privilegesError,
        data: privilegesData
      },
      actionTypesQueryRes: {
        loading: actionTypesLoading,
        error: actionTypesError,
        data: actionTypesData
      },
      deletePrivilege,
      createPrivilege,
      updatePrivilege
    }) => {

      if (privilegesLoading || actionTypesLoading || privilegesLoading) return 'Loading...';

      if (privilegesError || actionTypesError || privilegesError) return 'Error...';

      const {
        privileges
      } = privilegesData;

      const {
        __schema: {
          queryType: {
            fields: queriesTypes
          },
          mutationType: {
            fields: mutationTypes
          }
        }
      } = actionTypesData;

      const privilegesTableColumns = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { 
          title: 'Action', 
          dataIndex: '', 
          key: 'x', 
          render: (...args) => {
            const { 1: privilege } = args;

            const privilegeInState = this.state.privilegeFormsData.find(({ id }) => id === privilege.id);

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
                  onClick={() => updatePrivilege({ variables: { 
                    privilegeId: privilege.id,
                    ...privilege,
                    ...privilegeInState
                  } }).then(() => {
                    const { privilegeFormsData } = this.state;
  
                    this.setState({ privilegeFormsData: privilegeFormsData.filter(privilegeFormData => privilegeFormData.id !== privilege.id) });
                    })}
                >
                  Update
                </Button>

              </>) 
            }



            if(privilegeInState) {
              return (<Button 
                type="primary"
                onClick={() => {
                  createPrivilege({ variables: { ...({ privileges: [], actionTypes: [] }), ...privilegeInState } }).then(() => {
                  const { privilegeFormsData } = this.state;

                  this.setState({ privilegeFormsData: privilegeFormsData.filter(privilegeFormData => privilegeFormData.id !== 'new') });
                  })
                }}
              >
                Create
              </Button>) 
            }

          }
        },
      ];
      

      const privilegesTableData = [
        ...privileges.map((privilege) => ({ 
          key: privilege.id,
          ...privilege 
        })),
        {
          id: 'new',
          key: 'new',
          name: 'Create new privilege'
        }
      ];

      return <Table
        columns={privilegesTableColumns}
        expandedRowRender={(privilege) => {
          const privilegeInState = this.state.privilegeFormsData.find(({ id }) => id === privilege.id);

          return (
            <Form layout="inline" onSubmit={this.handleSubmit}>
              <FormItem
                label={'Name:'}
              >
                <Input 
                  onChange={({ target: { value }}) => this.onChange('name', privilege)(value)}
                  defaultValue={privilege.name}
                  prefix={
                    <Icon 
                      type="privilege" 
                      style={{ color: 'rgba(0,0,0,.25)' }} 
                    />}
                  placeholder="Privilegename" 
                />
              </FormItem>
              <FormItem
                label={'Permitted api actions:'}
              >
                <Select
                  value={(privilegeInState || privilege).actionTypes}
                  style={{ width: 300 }} 
                  mode="multiple" 
                  placeholder="Please select favourite colors"
                  onChange={this.onChange('actionTypes', privilege)}
                >
                  {[...queriesTypes, ...mutationTypes].map(({ name }) => 
                  <Option 
                    key={name}
                    value={name}
                  >
                    {camelCaseToSentence(name)}
                  </Option>)}
                </Select>
              </FormItem>
              <FormItem
                label={'Roles'}
              >
                <Select
                  value={((privilegeInState || privilege).privileges || []).map(({ id }) => id)}
                  style={{ width: 300 }} 
                  mode="multiple" 
                  placeholder="Please select favourite colors"
                  onChange={(value) => this.onChange('privileges', privilege)(privileges.filter(({id}) => value.includes(id)))}
                >
                  {privileges.filter(({ id }) => id !== privilege.id).map((privilege) => 
                  <Option 
                    key={privilege.id}
                    value={privilege.id}
                  >
                    {privilege.name}
                  </Option>)}
                </Select>
              </FormItem>
            </Form>
          );
          }
        }       
        dataSource={privilegesTableData}
      />
    }}
    </PrivilegesQueriesComposed>;
  }

  onChange = (fieldName, privilege) => (value) => {
    const { privilegeFormsData } = this.state;

    if (fieldName === 'privileges') {
      this.handlePrivilegesChange(privilegeFormsData, value, privilege);
      return;
    };
    const existingPrivilegeFormData = privilegeFormsData.find(({ id }) => privilege.id === id);
    console.log(existingPrivilegeFormData);
    if (!existingPrivilegeFormData) {
      this.setState({ privilegeFormsData: [{...(privilege || {}), [fieldName]: value }] });
    } else {
      this.setState({ 
        privilegeFormsData: [...privilegeFormsData.map(privilegeFormData => {
          if(privilegeFormData) {
            return {...(privilege || {}), ...privilegeFormData, [fieldName]: value}
          }

          return privilegeFormsData;
        })]
      });
    }
  }

  handlePrivilegesChange(privilegeFormsData, newPrivileges, privilege) {

    const privilegePrivileges = (privilege && privilege.privileges) || [];

    const {
      privilegesToConnect,
      privilegesToDisconnect
    } = {
      privilegesToConnect: newPrivileges
        .map(({ id }) => id)
        .filter(privilegeId => !privilegePrivileges
        .some(({ id }) => id !== privilegeId ))
        .map((id) => ({ id })),
      privilegesToDisconnect: privilegePrivileges
        .filter(({ id }) => 
          !newPrivileges.map(({ id }) => id)
            .some(id => (privilegePrivileges
              .map(({ id }) => id).includes(id)
            )
        ))
        .map(({ id }) => ({ id }))
    };

    const existingPrivilegeFormData = privilegeFormsData.find(({ id }) => privilege.id === id);
    if (!existingPrivilegeFormData) {
      this.setState({ privilegeFormsData: [
        ...privilegeFormsData, { 
          ...(privilege || {}),
          privilegesToConnect,
          privilegesToDisconnect,
          privileges: newPrivileges
        }] });
    } else {
      this.setState({ 
        privilegeFormsData: [...privilegeFormsData.map(privilegeFormData => {
          if(privilegeFormData) {
            return {
              ...(privilege || {}),
              ...privilegeFormData,
              privilegesToConnect,
              privilegesToDisconnect,
              privileges: newPrivileges
            }
          }

          return privilegeFormsData;
        })]
      });
    }
  }
}

export default Privileges;
