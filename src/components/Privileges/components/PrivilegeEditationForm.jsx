import React, { Component } from 'react';
import {
  arrayOf,
  func,
  shape,
  string,
} from 'prop-types';
import {
  Form,
  Icon,
  Input,
  Select,
} from 'antd';

import {
  camelCaseToSentence,
} from '../../../helpers';

const { Option } = Select;

const FormItem = Form.Item;

const privilegeShape = shape({
  name: string,
  id: string,
});

const propTypes = {
  privileges: arrayOf(privilegeShape).isRequired,
  privilege: privilegeShape.isRequired,
  privilegeInState: privilegeShape,
  actions: arrayOf(shape({
    name: string.isRequired,
  })).isRequired,
  onChange: func.isRequired,
};

export default class PrivilegeEditationForm extends Component {
  render() {
    const {
      privileges,
      privilege,
      privilegeInState,
      actions,
      onChange,
    } = this.props;

    return (
      <Form layout="inline" onSubmit={this.handleSubmit}>
        <FormItem
          label="Name:"
        >
          <Input
            onChange={({ target: { value } }) => onChange('name', privilege)(value)}
            defaultValue={privilege.name}
            prefix={(
              <Icon
                type="privilege"
                style={{ color: 'rgba(0,0,0,.25)' }}
              />
            )}
            placeholder="Privilegename"
          />
        </FormItem>
        <FormItem
          label="Permitted api actions:"
        >
          <Select
            value={(privilegeInState || privilege).actionTypes}
            style={{ width: 300 }}
            mode="multiple"
            placeholder="Please select favourite colors"
            onChange={onChange('actionTypes', privilege)}
          >
            {actions.map(({ name }) => (
              <Option
                key={name}
                value={name}
              >
                {camelCaseToSentence(name)}
              </Option>
            ))}
          </Select>
        </FormItem>
        {
          /**
           * Commented for know, will be uncommented when i will start to resolving priveleges trees on Authorization server
           */
       
          /* <FormItem
          label="Roles"
        >
          <Select
            value={((privilegeInState || privilege).privileges || []).map(({ id }) => id)}
            style={{ width: 300 }}
            mode="multiple"
            placeholder="Please select favourite colors"
            onChange={value => onChange('privileges', privilege)(privileges.filter(({ id }) => value.includes(id)))}
          >
            {privileges.filter(({ id }) => id !== privilege.id).map(privilegeForSelect => (
              <Option
                key={privilegeForSelect.id}
                value={privilegeForSelect.id}
              >
                {privilegeForSelect.name}
              </Option>
            ))}
          </Select>
        </FormItem> */}
      </Form>
    );
  }
}

PrivilegeEditationForm.propTypes = propTypes;
