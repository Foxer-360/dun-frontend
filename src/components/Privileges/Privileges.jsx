import React, { Component } from 'react';
import {
  Table, Button,
} from 'antd';
import {
  PrivilegeEditationForm,
  PrivilegesQueriesComposed,
} from './components';


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
          data: {
            privileges,
            actionTypes,
            createPrivilege,
            updatePrivilege,
            deletePrivilege,
          },
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
                  actions={actionTypes}
                  onChange={this.onChange}
                />
              );
            }}
            dataSource={Privileges.getPrivilegesTableData(privileges)}
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
                      .filter(privilegeFormData => privilegeFormData.id !== privilege.id),
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
