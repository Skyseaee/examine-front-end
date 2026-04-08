import React from 'react';
import { Switch, Route, useLocation } from 'react-router-dom';
import { Layout } from 'antd';
import Login from './pages/Login'
import HomePage from './pages/HomePage'
import FirstRoundReview from './pages/FirstRoundReview'
import SecondRoundReview from './pages/SecondRoundReview'
import FinalReview from './pages/FinalReview'
import AdminExerciseManagement from './pages/AdminExerciseManagement'
import PrivateRoute from './utils/PrivateRoute'
import AppHeader from './components/Header'
import { useAuth } from './contexts/AuthContext'

const { Content } = Layout;

function App() {
  const { user } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isLoginPage && user && <AppHeader />}
      <Content style={{ padding: isLoginPage ? 0 : '0 50px', marginTop: isLoginPage || !user ? 0 : 16 }}>
        <Switch>
          <Route exact path="/login" component={Login} />
          <PrivateRoute exact path="/home" component={HomePage} />
          <PrivateRoute exact path="/" component={FirstRoundReview} />
          <PrivateRoute path="/second-review" component={SecondRoundReview} />
          <PrivateRoute path="/final-review" component={FinalReview} />
          <PrivateRoute path="/admin/exercises" component={AdminExerciseManagement} />
        </Switch>
      </Content>
    </Layout>
  )
}

export default App;