import React, { Component } from 'react';
import { Table, Button } from 'antd';
import { adopt } from 'react-adopt';
import { Query, Mutation } from 'react-apollo';
import gql from 'graphql-tag';

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

const UsersQueriesComposed = adopt({
  // addUser,
  // deleteUser,
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
  render() {
    return <UsersQueriesComposed>
    {({
      usersQueryRes: {
        loading: usersLoading,
        error: usersError,
        data: usersData
      },
      deleteUser
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
            return (<Button 
              type="danger"
              onClick={() => deleteUser({ variables: { userId: user.id } })}
            >
              Delete
            </Button>) 
          }
        },
      ];
      

      const usersTableData = users.map(({ id, name }) => ({ 
        id, 
        key: id, 
        name 
      }));

      return <Table
        columns={usersTableColumns}
        expandedRowRender={record => <p style={{ margin: 0 }}>
          {record.description}
        </p>}
        dataSource={usersTableData}
      />
    }}
    </UsersQueriesComposed>;
  }
}

export default Users;
