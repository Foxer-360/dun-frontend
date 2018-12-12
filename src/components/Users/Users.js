import React, { Component } from 'react';
import { 
  Table,
  Button,
  Input,
  Icon,
  Form,
  Select,
  Card,
  Avatar
} from 'antd';
import { adopt } from 'react-adopt';
import { Query, Mutation } from 'react-apollo';
import gql from 'graphql-tag';

const { Meta } = Card;

const { Option } = Select;

const FormItem = Form.Item;

const camelCaseToSentence = (camelCase) => {
  const result = camelCase.replace( /([A-Z])/g, " $1" );
  return result.charAt(0).toUpperCase() + result.slice(1); // capitalize the first letter - as an example.
}

const USER_FRAMENT = `
  fragment UserParts on User {
    id
    name
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

const CREATE_USER = gql`
${USER_FRAMENT}
mutation (
    $name: String!
    $actionTypes: [String!]!
    $privilegesToConnect: [PrivilegeWhereUniqueInput!]
) {
  createUser(data: { 
    name: $name,
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
    $name: String!
    $actionTypes: [String!]!
    $userId: ID!
    $privilegesToConnect: [PrivilegeWhereUniqueInput!]
    $privilegesToDisconnect: [PrivilegeWhereUniqueInput!]
) {
  updateUser(data: { 
    name: $name,
    actionTypes: { 
      set: $actionTypes 
    },
    privileges: { connect: $privilegesToConnect, disconnect: $privilegesToDisconnect}
  } where: { id: $userId }) {
    ...UserParts
  }
}
`;

const UsersQueriesComposed = adopt({
  createUser: ({ render }) => <Mutation
    update={(cache, { data: { createUser } }) => {
      const { users } = cache.readQuery({ query: GET_USERS });

      cache.writeQuery({
        query: GET_USERS,
        data: { users: users.concat(createUser)}
      });
    }}
    mutation={CREATE_USER}
  >
    {(data) => render(data)}
  </Mutation>,
  updateUser: ({ render }) => <Mutation
    update={(cache, { data: { updateUser } }) => {
      const { users } = cache.readQuery({ query: GET_USERS });
      cache.writeQuery({
        query: GET_USERS,
        data: { users: users.map((user) => {
          if(user.id === updateUser.id) {
            return updateUser;
          } else {
            return user;
          }
        })}
      });
    }}
    mutation={UPDATE_USER}
  >
    {(data) => render(data)}
  </Mutation>,
  deleteUser: ({ render }) => <Mutation
    update={(cache, { data: { deleteUser } }) => {
      const { users } = cache.readQuery({ query: GET_USERS });
      cache.writeQuery({
        query: GET_USERS,
        data: { users: users.filter(user => user.id !== deleteUser.id) }
      });
    }}
    mutation={
      gql`
        mutation ($userId: ID!) {
          deleteUser(where: {id: $userId}) {
            id
          }
        }
      `
    }
  >
    {(data) => render(data)}
  </Mutation>,
  // updateUser
  usersQueryRes: ({ render }) => <Query 
    query={GET_USERS}
  >
    {(data) => render(data)}
  </Query>,
  actionTypesQueryRes: ({ render }) => <Query
    query={ACTION_TYPES}
  >
    {(data) => render(data)}
  </Query>,
  privilegesQueryRes: ({ render }) => <Query
    query={GET_PRIVILEGES}
  >
    {(data) => render(data)}
  </Query>
});


class Users extends Component {

  constructor(props) {
    super(props)

    this.state = {
      userFormsData: []
    }

  }

  render() {
    return <UsersQueriesComposed>
    {({
      usersQueryRes: {
        loading: usersLoading,
        error: usersError,
        data: usersData
      },
      actionTypesQueryRes: {
        loading: actionTypesLoading,
        error: actionTypesError,
        data: actionTypesData
      },
      privilegesQueryRes: {
        loading: privilegesLoading,
        error: privilegesError,
        data: privilegesData
      },
      deleteUser,
      createUser,
      updateUser
    }) => {

      if (usersLoading || actionTypesLoading || privilegesLoading) return 'Loading...';

      if (usersError || actionTypesError || privilegesError) return 'Error...';

      const {
        users
      } = usersData;

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

      const usersTableColumns = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { 
          title: 'Action', 
          dataIndex: '', 
          key: 'x', 
          render: (...args) => {
            const { 1: user } = args;

            const userInState = this.state.userFormsData.find(({ id }) => id === user.id);

            if (user.id !== 'new') {
              return (<>
                <Button 
                  type="danger"
                  onClick={() => deleteUser({ variables: { userId: user.id } })}
                >
                  Delete
                </Button>
                <Button
                  disabled={!userInState} 
                  style={{ marginLeft: 10 }}
                  type="primary"
                  onClick={() => updateUser({ variables: { 
                    userId: user.id,
                    ...user,
                    ...userInState
                  } }).then(() => {
                    const { userFormsData } = this.state;
  
                    this.setState({ userFormsData: userFormsData.filter(userFormData => userFormData.id !== user.id) });
                    })}
                >
                  Update
                </Button>

              </>) 
            }



            if(userInState) {
              return (<Button 
                type="primary"
                onClick={() => {

                  createUser({ variables: { ...({ privileges: [], actionTypes: [] }), ...userInState } }).then(() => {
                  const { userFormsData } = this.state;

                  this.setState({ userFormsData: userFormsData.filter(userFormData => userFormData.id !== 'new') });
                  })
                }}
              >
                Create
              </Button>) 
            }

          }
        },
      ];
      

      const usersTableData = [
        ...users.map((user) => ({ 
          key: user.id,
          ...user 
        })),
        {
          id: 'new',
          key: 'new',
          name: 'Create new user'
        }
      ];

      return <Table
        columns={usersTableColumns}
        expandedRowRender={(user) => {
          const userInState = this.state.userFormsData.find(({ id }) => id === user.id);

          return (
            <Form layout="inline" onSubmit={this.handleSubmit}>
              <FormItem
                label={'Name:'}
              >
                <Input 
                  onChange={({ target: { value }}) => this.onChange('name', user)(value)}
                  defaultValue={(user.id !== 'new' && user.name) || ""}
                  prefix={
                    <Icon 
                      type="user" 
                      style={{ color: 'rgba(0,0,0,.25)' }} 
                    />}
                  placeholder="Username" 
                />
              </FormItem>
              <FormItem
                label={'Permitted api actions:'}
              >
                <Select
                  value={(userInState || user).actionTypes}
                  style={{ width: 300 }} 
                  mode="multiple" 
                  placeholder="Please select actions"
                  onChange={this.onChange('actionTypes', user)}
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
                  value={((userInState || user).privileges || []).map(({ id }) => id)}
                  style={{ width: 300 }} 
                  mode="multiple" 
                  placeholder="Please select roles"
                  onChange={(value) => this.onChange('privileges', user)(privileges.filter(({id}) => value.includes(id)))}
                >
                  {privileges.map((privilege) => 
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
        dataSource={usersTableData}
      />
    }}
    </UsersQueriesComposed>;
  }

  onChange = (fieldName, user) => (value) => {
    const { userFormsData } = this.state;

    if (fieldName === 'privileges') {
      this.handlePrivilegesChange(userFormsData, value, user);
      return;
    };
    const existingUserFormData = userFormsData.find(({ id }) => user.id === id);

    if (!existingUserFormData) {
      this.setState({ userFormsData: [{...(user || {}), [fieldName]: value }] });
    } else {
      this.setState({ 
        userFormsData: [...userFormsData.map(userFormData => {
          if(userFormData) {
            return {...(user || {}), ...userFormData, [fieldName]: value}
          }

          return userFormsData;
        })]
      });
    }
  }

  handlePrivilegesChange(userFormsData, newPrivileges, user) {

    const userPrivileges = (user && user.privileges) || [];

    const {
      privilegesToConnect,
      privilegesToDisconnect
    } = {
      privilegesToConnect: newPrivileges
        .map(({ id }) => id)
        .filter(privilegeId => !userPrivileges
        .some(({ id }) => id !== privilegeId ))
        .map((id) => ({ id })),
      privilegesToDisconnect: userPrivileges
        .filter(({ id }) => 
          !newPrivileges.map(({ id }) => id)
            .some(id => (userPrivileges
              .map(({ id }) => id).includes(id)
            )
        ))
        .map(({ id }) => ({ id }))
    };

    const existingUserFormData = userFormsData.find(({ id }) => user.id === id);
    if (!existingUserFormData) {
      this.setState({ userFormsData: [
        ...userFormsData, { 
          ...(user || {}),
          privilegesToConnect,
          privilegesToDisconnect,
          privileges: newPrivileges
        }] });
    } else {
      this.setState({ 
        userFormsData: [...userFormsData.map(userFormData => {
          if(userFormData) {
            return {
              ...(user || {}),
              ...userFormData,
              privilegesToConnect,
              privilegesToDisconnect,
              privileges: newPrivileges
            }
          }

          return userFormsData;
        })]
      });
    }
  }
}

export default Users;
