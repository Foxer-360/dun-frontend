import React, { Component } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Link,
  Redirect,
} from 'react-router-dom';
import { ApolloProvider } from 'react-apollo';
import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { ApolloLink } from 'apollo-link';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { setContext } from 'apollo-link-context';
import { onError } from "apollo-link-error";
import {
  Layout,
  Menu,
  Icon,
  Button,
  Row,
  Col,
  message
} from 'antd';

import Callback from './components/Callback';

import Auth from './services/auth';

import './App.css';
import {
  Users,
  Privileges,
} from './components';

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.map(({ message: errorMessage, locations, path }) => {
      console.log(
        `[GraphQL error]: Message: ${errorMessage}, Location: ${locations}, Path: ${path}`
      );
      message.warning(errorMessage, 10);

    });
  if (networkError) console.log(`[Network error]: ${networkError}`);
});

const httpLink = new HttpLink({ uri: process.env.REACT_APP_AUTHORIZATION_API_ADDRESS });

const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  // eslint-disable-next-line no-undef
  const token = typeof window !== 'undefined' && localStorage.getItem('access_token');
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
});


const client = new ApolloClient({
  link: ApolloLink.from([authLink, errorLink, httpLink]),
  cache: new InMemoryCache(),
});

const auth = new Auth(result => console.log('auth result', result), client);

const handleAuthentication = (nextState) => {
  if (/access_token|id_token|error/.test(nextState.location.hash)) {
    auth.handleAuthentication();
  }
};

const { Header, Sider, Content } = Layout;

const PrivateRoute = ({ component: InjectedComponent, ...rest }) => (
  <Route
    {...rest}
    render={props => (
      auth.isAuthenticated() === true
        ? <InjectedComponent {...props} />
        : <Redirect to="/login" />
    )
    }
  />
);


class App extends Component {
  state = {
    collapsed: false,
  };

  toggle = () => {
    const { collapsed } = this.state;
    this.setState({
      collapsed: !collapsed,
    });
  }

  componentDidMount() {
    if (!auth.isAuthenticated()) {
      auth.showLogin();
    }
  }

  render() {
    const { collapsed } = this.state;

    return (
      <ApolloProvider client={client}>
        <Router>
          <Layout>
            <Sider
              trigger={null}
              collapsible
              collapsed={collapsed}
            >
              <div className="logo" />
              {auth.isAuthenticated() && (
                <Menu
                  theme="dark"
                  mode="inline"
                  defaultSelectedKeys={['/users']}
                >
                  <Menu.Item key="/users">
                    <Icon type="user" />
                    Users
                    <Link to="/users">
                      <Icon type="home" />
                      Users
                    </Link>
                  </Menu.Item>
                  <Menu.Item key="/privileges">
                    <Icon type="file-protect" />
                    Privileges
                    <Link to="/privileges">
                      <Icon type="home" />
                      Privileges
                    </Link>
                  </Menu.Item>
                </Menu>)
              }
            </Sider>
            <Layout>
              <Header style={{ background: '#fff', padding: 0 }}>
                <Row type="flex" justify="end">
                  <Col span={2}>
                    {auth.isAuthenticated()
                      ? <Button type="primary" onClick={() => auth.logout()}>Log Out</Button>
                      : <Button type="primary" onClick={() => auth.login()}>Login</Button>
                    }
                  </Col>
                </Row>
              </Header>
              <Content style={{
                margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280,
              }}
              >
                <Route exact path="/login" component={() => <div />} />
                <PrivateRoute exact path="/users" component={Users} />
                <PrivateRoute exact path="/" component={Users} />
                <PrivateRoute exact path="/privileges" component={Privileges} />
                <Route
                  path="/callback"
                  render={(props) => {
                    handleAuthentication(props);
                    return <Callback {...props} />;
                  }}
                />
              </Content>
            </Layout>
          </Layout>
        </Router>
      </ApolloProvider>
    );
  }
}

export default App;
