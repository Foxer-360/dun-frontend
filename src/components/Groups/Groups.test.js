import React from 'react';
import { shallow } from 'enzyme';
import Groups from './Groups';

describe('<Groups />', () => {
  test('renders', () => {
    const wrapper = shallow(<Groups />);
    expect(wrapper).toMatchSnapshot();
  });
});
