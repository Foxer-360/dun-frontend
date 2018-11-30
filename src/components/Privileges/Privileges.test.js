import React from 'react';
import { shallow } from 'enzyme';
import Priveleges from './Privileges';

describe('<Priveleges />', () => {
  test('renders', () => {
    const wrapper = shallow(<Priveleges />);
    expect(wrapper).toMatchSnapshot();
  });
});
