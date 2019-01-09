import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Input,
  Icon,
  Form,
  Select,
} from 'antd';

import { camelCaseToSentence } from '../../../helpers';

const { Option } = Select;

const FormItem = Form.Item;

function getPropTyping({
  arrayOf,
  shape,
  string,
  func,
}) {
  const user = shape({
    name: string,
    id: string,
  });
  return {
    actions: arrayOf(shape({
      name: string.isRequired,
    })).isRequired,
    users: arrayOf(user).isRequired,
    user: user.isRequired,
    userInState: user,
    onChange: func,
  };
}


export default class UserEditationForm extends Component {
  render() {
    const {
      actions,
      user,
      userInState,
      privileges,
      onChange,
    } = this.props;

    return (
      <Form layout="inline" onSubmit={this.handleSubmit}>
        <FormItem
          label="Name:"
        >
          <Input
            onChange={({ target: { value } }) => onChange('name', user)(value)}
            defaultValue={(user.id !== 'new' && user.name) || ''}
            prefix={(
              <Icon
                type="user"
                style={{ color: 'rgba(0,0,0,.25)' }}
              />)}
            placeholder="Username"
          />
        </FormItem>
        <FormItem
          label="Permitted api actions:"
        >
          <Select
            value={(userInState || user).actionTypes}
            style={{ width: 300 }}
            mode="multiple"
            placeholder="Please select actions"
            onChange={onChange('actionTypes', user)}
          >
            {actions.map(action => (
              <Option
                key={action}
                value={action}
              >
                {camelCaseToSentence(action)}
              </Option>
            ))}
          </Select>
        </FormItem>
        <FormItem
          label="Roles"
        >
          <Select
            value={((userInState || user).privileges || []).map(({ id }) => id)}
            style={{ width: 300 }}
            mode="multiple"
            placeholder="Please select roles"
            onChange={value => onChange('privileges', user)(privileges.filter(({ id }) => value.includes(id)))}
          >
            {privileges.map(privilege => (
              <Option
                key={privilege.id}
                value={privilege.id}
              >
                {privilege.name}
              </Option>
            ))}
          </Select>
        </FormItem>
      </Form>
    );
  }
}

UserEditationForm.propTypes = getPropTyping(PropTypes);
