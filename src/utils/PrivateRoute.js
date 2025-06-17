import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ 
  component: Component, 
  requiredPrivilege, 
  ...rest 
}) => {
  const { user } = useAuth();

  return (
    <Route
      {...rest}
      render={props =>
        user ? (
          user.privilege >= requiredPrivilege ? (
            <Component {...props} />
          ) : (
            <div style={{ padding: 24 }}>
              <h1>403 权限不足</h1>
              <p>需要权限级别: {requiredPrivilege}</p>
            </div>
          )
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

export default PrivateRoute;