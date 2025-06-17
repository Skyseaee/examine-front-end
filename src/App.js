import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import PrivateRoute from './utils/PrivateRoute';
import Login from './pages/Login';
import FirstRoundReview from './pages/FirstRoundReview';
import SecondRoundReview from './pages/SecondRoundReview';
import FinalReview from './pages/FinalReview';
import MainLayout from './components/MainLayout';
import ProfilePage from './pages/ProfilePage';

const App = () => (
  <Switch>
    {/* 登录页不显示布局 */}
    <Route path="/login" component={Login} />
    
    {/* 其他页面使用带导航栏的布局 */}
    <Route path="/">
      <MainLayout>
        <Switch>
          <PrivateRoute 
            exact 
            path="/" 
            component={FirstRoundReview} 
            requiredPrivilege={2} 
          />
          <PrivateRoute 
            path="/second-review" 
            component={SecondRoundReview} 
            requiredPrivilege={3} 
          />
          <PrivateRoute 
            path="/final-review" 
            component={FinalReview} 
            requiredPrivilege={4} 
          />
          <PrivateRoute 
            path="/self-home" 
            component={ProfilePage} 
            requiredPrivilege={1}
          />
          <Redirect to="/" />
        </Switch>
      </MainLayout>
    </Route>
    
    {/* 默认重定向到登录页 */}
    <Redirect from="*" to="/login" />
  </Switch>
);

export default App;