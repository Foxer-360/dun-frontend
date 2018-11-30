import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';


import './App.css';
import {
  Users,
  Groups,
  Privileges,
} from './components';

import { Layout, Menu, Icon } from 'antd';

const { Header, Sider, Content } = Layout;


class App extends Component {

  state = {
    collapsed: false,
  };

  toggle = () => {
    this.setState({
      collapsed: !this.state.collapsed,
    });
  }

  render() {
    return (
      <Router>
        <Layout>
        <Sider
          trigger={null}
          collapsible
          collapsed={this.state.collapsed}
        >
          <div className="logo" />
          <Menu 
            theme="dark" 
            mode="inline" 
            defaultSelectedKeys={['/users']}
          >
            <Menu.Item key="/users">
              <Icon type="user" />
              <Link to="/users"><Icon type="home" />Users</Link>
            </Menu.Item>
            <Menu.Item key="/groups">
              <Icon type="team" />
              <Link to="/groups"><Icon type="home" />Groups</Link>
            </Menu.Item>
            <Menu.Item key="/privileges">
              <Icon type="file-protect" />
              <Link to="/privileges"><Icon type="home" />Privileges</Link>
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout>
          <Header style={{ background: '#fff', padding: 0 }}>
            <Icon
              className="trigger"
              type={this.state.collapsed ? 'menu-unfold' : 'menu-fold'}
              onClick={this.toggle}
            />
          </Header>
          <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
                <Route exact path="/" component={Users} />
                <Route exact path="/users" component={Users} />
                <Route exact path="/groups" component={Groups} />
                <Route exact path="/privileges" component={Privileges} />
          </Content>
        </Layout>
      </Layout>
    </Router>
    );
  }
}

export default App;
