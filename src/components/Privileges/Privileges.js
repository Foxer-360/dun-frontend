import React, { Component } from 'react';
import { Table, Button, Input, Icon, Form, Select } from 'antd';
import { adopt } from 'react-adopt';
import { Query, Mutation } from 'react-apollo';
import gql from 'graphql-tag';

const { Option } = Select;

const FormItem = Form.Item;

const PRIVELEGE_FRAMENT = `
  fragment PrivilegeParts on Privilege {
    id
    name
    privileges {
      id
      name
    }
  }
`;

const GET_PRIVELEGES = gql`
  {
    privileges {
      ...PrivilegeParts
    }
  }
  ${PRIVELEGE_FRAMENT}
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

const camelCaseToSentence = (camelCase) => {
  const result = camelCase.replace( /([A-Z])/g, " $1" );
  return result.charAt(0).toUpperCase() + result.slice(1); // capitalize the first letter - as an example.
}

const CREATE_PRIVELEGE = gql`
${PRIVELEGE_FRAMENT}
mutation (
    $name: String!
    $actionTypes: [String!]!
) {
  createPrivilege(data: { name: $name, actionTypes: { set: $actionTypes } }) {
    ...PrivilegeParts
  }
}
`;

const PrivilegesQueriesComposed = adopt({
  createPrivilege: ({ render }) => <Mutation
    update={(cache, { data: { createPrivilege } }) => {
      const { privileges } = cache.readQuery({ query: GET_PRIVELEGES });

      cache.writeQuery({
        query: GET_PRIVELEGES,
        data: { privileges: privileges.concat(createPrivilege)}
      });
    }}
    mutation={CREATE_PRIVELEGE}
  >
    {(data) => render(data)}
  </Mutation>,
  deletePrivilege: ({ render }) => <Mutation
    update={(cache, { data: { deletePrivilege } }) => {
      const { privileges } = cache.readQuery({ query: GET_PRIVELEGES });
      cache.writeQuery({
        query: GET_PRIVELEGES,
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
  // updatePrivilege,
  // getPrivileges
  privilegesQueryRes: ({ render }) => <Query 
    query={GET_PRIVELEGES}
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
    }) => {

      if (privilegesLoading || actionTypesLoading) return 'Loading...';

      if (privilegesError || actionTypesError) return 'Error...';

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
            if (privilege.id !== 'new') {
              return (<Button 
                type="danger"
                onClick={() => deletePrivilege({ variables: { privilegeId: privilege.id } })}
              >
                Delete
              </Button>) 
            }

            const privilegeInState = this.state.privilegeFormsData.find(({ id }) => id === privilege.id);

            if(privilegeInState) {
              return (<Button 
                type="primary"
                onClick={() => {
                  createPrivilege({ variables: { name: privilegeInState.name, actionTypes: privilegeInState.actionTypes } }).then(() => {
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
        ...privileges.map(({ id, name }) => ({ 
          id, 
          key: id, 
          name 
        })),
        {
          id: 'new',
          key: 'new',
          name: 'Create new privilege'
        }
      ];

      return <Table
        columns={privilegesTableColumns}
        expandedRowRender={({ id: privilegeId }) => {
          if (privilegeId === 'new') {
          return (
            <Form layout="inline" onSubmit={this.handleSubmit}>
              <FormItem
                label={'Name:'}
              >
                <Input 
                  onChange={({ target: { value }}) => this.onChange(privilegeId, 'name')(value)}
                  defaultValue={''}
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
                  style={{ width: 300 }} 
                  mode="multiple" 
                  placeholder="Please select favourite colors"
                  onChange={this.onChange(privilegeId, 'actionTypes')}
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
            </Form>
          );
          }
        }}
        dataSource={privilegesTableData}
      />
    }}
    </PrivilegesQueriesComposed>;
  }

  onChange = (privilegeId, fieldName) => (value) => {
    const { privilegeFormsData } = this.state;

    const existingPrivilegeFormData = privilegeFormsData.find(({ id }) => privilegeId === id);
    console.log(existingPrivilegeFormData, privilegeFormsData);
    if (!existingPrivilegeFormData) {
      this.setState({ privilegeFormsData: [...privilegeFormsData, { id: privilegeId, [fieldName]: value }] });
    } else {
      this.setState({ 
        privilegeFormsData: [...privilegeFormsData.map(privilegeFormData => {
          if(privilegeFormData) {
            return {...privilegeFormData, [fieldName]: value}
          }

          return privilegeFormsData;
        })]
      });
    }
  }
}

export default Privileges;
