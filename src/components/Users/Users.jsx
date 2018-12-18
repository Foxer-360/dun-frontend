import React, { Component } from 'react';
import {
  Table,
  Button,
} from 'antd';

import {
  UserEditationForm,
  UsersQueriesComposed,
} from './components';

class Users extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userFormsData: [],
    };
  }

  render() {
    const { userFormsData } = this.state;
    return (
      <UsersQueriesComposed>
        {({
          users,
          privileges,
          queriesTypes,
          mutationTypes,
          createUser,
          updateUser,
          deleteUser,
        }) => (
          <Table
            columns={this.getUsersTableColumns(
              createUser,
              updateUser,
              deleteUser,
            )}
            expandedRowRender={(user) => {
              const userInState = userFormsData.find(({ id }) => id === user.id);
              return (
                <UserEditationForm
                  userInState={userInState}
                  user={user}
                  privileges={privileges}
                  availableActions={[...queriesTypes, ...mutationTypes]}
                  onChange={this.onChange}
                />);
            }}
            dataSource={this.getUsersTableData(users)}
          />
        )}
      </UsersQueriesComposed>
    );
  }

  getUsersTableColumns = (createUser, updateUser, deleteUser) => {
    const { userFormsData } = this.state;
    return [
      { title: 'Name', dataIndex: 'name', key: 'name' },
      {
        title: 'Action',
        dataIndex: '',
        key: 'x',
        render: (...args) => {
          const { 1: user } = args;

          const userInState = userFormsData.find(({ id }) => id === user.id);

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
                onClick={() => updateUser({
                  variables: {
                    userId: user.id,
                    ...user,
                    ...userInState,
                  },
                }).then(() => {
                  this.setState({
                    userFormsData: userFormsData
                      .filter(userFormData => userFormData.id !== user.id),
                  });
                })}
              >
                Update
              </Button>
            </>);
          }


          if (userInState) {
            return (
              <Button
                type="primary"
                onClick={() => {
                  createUser({
                    variables: {
                      ...({
                        privileges: [],
                        actionTypes: [],
                      }),
                      ...userInState,
                    },
                  }).then(() => this.setState({
                    userFormsData: userFormsData
                      .filter(userFormData => userFormData.id !== 'new'),
                  }));
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

  static getUsersTableData(users) {
    return ([
      ...users.map(user => ({
        key: user.id,
        ...user,
      })),
      {
        id: 'new',
        key: 'new',
        name: 'Create new user',
      },
    ]);
  }

  onChange = (fieldName, user) => (value) => {
    const { userFormsData } = this.state;

    if (fieldName === 'privileges') {
      this.handlePrivilegesChange(userFormsData, value, user);
      return;
    }
    const existingUserFormData = userFormsData.find(({ id }) => user.id === id);

    if (!existingUserFormData) {
      this.setState({ userFormsData: [{ ...(user || {}), [fieldName]: value }] });
    } else {
      this.setState({
        userFormsData: [...userFormsData.map((userFormData) => {
          if (userFormData) {
            return { ...(user || {}), ...userFormData, [fieldName]: value };
          }

          return userFormsData;
        })],
      });
    }
  }

  handlePrivilegesChange(userFormsData, newPrivileges, user) {
    const userPrivileges = (user && user.privileges) || [];

    const {
      privilegesToConnect,
      privilegesToDisconnect,
    } = {
      privilegesToConnect: newPrivileges
        .map(({ id }) => id)
        .filter(privilegeId => !userPrivileges
          .some(({ id }) => id !== privilegeId))
        .map(id => ({ id })),
      privilegesToDisconnect: userPrivileges
        .filter(({ id }) => !newPrivileges.map(({ id }) => id)
          .some(id => (userPrivileges
            .map(({ id }) => id).includes(id)
          )))
        .map(({ id }) => ({ id })),
    };

    const existingUserFormData = userFormsData.find(({ id }) => user.id === id);
    if (!existingUserFormData) {
      this.setState({
        userFormsData: [
          ...userFormsData, {
            ...(user || {}),
            privilegesToConnect,
            privilegesToDisconnect,
            privileges: newPrivileges,
          }],
      });
    } else {
      this.setState({
        userFormsData: [...userFormsData.map((userFormData) => {
          if (userFormData) {
            return {
              ...(user || {}),
              ...userFormData,
              privilegesToConnect,
              privilegesToDisconnect,
              privileges: newPrivileges,
            };
          }

          return userFormsData;
        })],
      });
    }
  }
}

export default Users;
