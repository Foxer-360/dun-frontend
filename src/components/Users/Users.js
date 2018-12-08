import React, { Component } from 'react';
import { Table } from 'antd';
import { adopt } from 'react-adopt';
import { Query } from 'react-apollo';
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

const UsersQueriesComposed = adopt({
  // addUser,
  // deleteUser,
  // updateUser,
  // getUsers
  usersQueryRes: ({ render }) => <Query 
    query={
      gql`
        ${USER_FRAMENT}
        query {
          users {
            ...UserParts
          }
        }
      `
    }
  >
    {(data) => render(data)}
  </Query>
});

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Action', dataIndex: '', key: 'x', render: () => <a href="javascript:;">Delete</a> },
];



class Users extends Component {
  render() {
    return <UsersQueriesComposed>
    {({
      usersQueryRes: {
        loading: usersLoading,
        error: usersError,
        data: usersData
      }
    }) => {

      if (usersLoading) return 'Loading...';

      if (usersError) return 'Error...';

      const {
        users
      } = usersData;

      const usersTableData = users.map(({ id, name }) => ({ 
        id, 
        key: id, 
        name 
      }));

      return <Table
        columns={columns}
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
