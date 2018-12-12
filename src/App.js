import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import { ApolloProvider } from "react-apollo";
import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { ApolloLink } from 'apollo-link';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { setContext } from 'apollo-link-context';
import Callback from './components/Callback';

import Auth from './services/auth'

import './App.css';
import {
  Users,
  Privileges,
} from './components';

import { 
  Layout, 
  Menu, 
  Icon,
  Button,
  Row,
  Col
} from 'antd';

// @TODO just for mock purposes, so it's necessary to change it to real backend at right time ;-)
const httpLink = new HttpLink({ uri: 'http://localhost:4000' })

const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = localStorage.getItem('access_token')
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : ``
    }
  }
})



const client = new ApolloClient({
  link: ApolloLink.from([authLink, httpLink]),
  cache: new InMemoryCache()
});

const auth = new Auth((result) => console.log('auth result', result), client)

const handleAuthentication = (nextState, replace) => {
  if (/access_token|id_token|error/.test(nextState.location.hash)) {
    auth.handleAuthentication()
  }
}

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
      <ApolloProvider client={client}>
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
                Users
                <Link to="/users"><Icon type="home" />Users</Link>
              </Menu.Item>
              <Menu.Item key="/privileges">
                <Icon type="file-protect" />
                Privileges
                <Link to="/privileges"><Icon type="home" />Privileges</Link>
              </Menu.Item>
            </Menu>
          </Sider>
          <Layout>
            <Header style={{ background: '#fff', padding: 0 }}>
            <Row type="flex" justify="end">
              <Col span={2}>
                {auth.isAuthenticated() ?
                    <Button type={'primary'} onClick={() => auth.logout()}  >Log Out</Button>
                  : <Button type={'primary'} onClick={() => auth.login()} >Login</Button>
                }
              </Col>
            </Row>
              <Icon
                className="trigger"
                type={this.state.collapsed ? 'menu-unfold' : 'menu-fold'}
                onClick={this.toggle}
              />

            </Header>
            <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
                  <Route exact path="/" component={Users} />
                  <Route exact path="/users" component={Users} />
                  <Route exact path="/privileges" component={Privileges} />
                  <Route path='/callback' render={(props) => {
                    handleAuthentication(props)
                    return <Callback {...props} />
                  }}/>
            </Content>
          </Layout>
        </Layout>
      </Router>
    </ApolloProvider>
    );
  }
}

export default App;
