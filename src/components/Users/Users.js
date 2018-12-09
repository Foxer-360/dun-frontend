import React, { Component } from 'react';
import { Table, Button, Input, Icon, Form } from 'antd';
import { adopt } from 'react-adopt';
import { Query, Mutation } from 'react-apollo';
import gql from 'graphql-tag';

const FormItem = Form.Item;

const USER_FRAMENT = `
  fragment UserParts on User {
    id
    name
    privileges {
      id
      name
    }
    groups {
      id
      name
    }
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

const CREATE_USER = gql`
${USER_FRAMENT}
mutation (
    $name: String!
) {
  createUser(data: { name: $name}) {
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
  // updateUser,
  // getUsers
  usersQueryRes: ({ render }) => <Query 
    query={GET_USERS}
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
      deleteUser,
      createUser
    }) => {

      if (usersLoading) return 'Loading...';

      if (usersError) return 'Error...';

      const {
        users
      } = usersData;

      const usersTableColumns = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { 
          title: 'Action', 
          dataIndex: '', 
          key: 'x', 
          render: (...args) => {
            const { 1: user } = args;
            if (user.id !== 'new') {
              return (<Button 
                type="danger"
                onClick={() => deleteUser({ variables: { userId: user.id } })}
              >
                Delete
              </Button>) 
            }

            const userInState = this.state.userFormsData.find(({ id }) => id === user.id);

            if(userInState) {
              return (<Button 
                type="primary"
                onClick={() => createUser({ variables: { name: userInState.name } }).then(() => {
                  console.log('here');
                  const { userFormsData } = this.state;
                  this.setState({ userFormsData: userFormsData.filter(userFormData => userFormData.id !== 'new') });
                })}
              >
                Create
              </Button>) 
            }

          }
        },
      ];
      

      const usersTableData = [
        ...users.map(({ id, name }) => ({ 
          id, 
          key: id, 
          name 
        })),
        {
          id: 'new',
          key: 'new',
          name: 'Create new user'
        }
      ];

      return <Table
        columns={usersTableColumns}
        expandedRowRender={({ id: userId }) => {
          if (userId === 'new') {
          return (
            <Form layout="inline" onSubmit={this.handleSubmit}>
              <FormItem
              >
                <Input 
                  onChange={this.onChange(userId, 'name')}
                  defaultValue={''}
                  prefix={
                    <Icon 
                      type="user" 
                      style={{ color: 'rgba(0,0,0,.25)' }} 
                    />} 
                  placeholder="Username" 
                />
              </FormItem>
            </Form>
          );
          }
        }}
        dataSource={usersTableData}
      />
    }}
    </UsersQueriesComposed>;
  }

  onChange = (userId, fieldName) => ({ target: { value } }) => {
    const { userFormsData } = this.state;

    const existingUserFormData = userFormsData.find(({ id }) => userId === id);
    console.log(existingUserFormData, userFormsData);
    if (!existingUserFormData) {
      this.setState({ userFormsData: [...userFormsData, { id: userId, [fieldName]: value }] });
    } else {
      this.setState({ 
        userFormsData: [...userFormsData.map(userFormData => {
          if(userFormData) {
            return {...userFormData, [fieldName]: value}
          }

          return userFormsData;
        })]
      });
    }
  }
}

export default Users;
