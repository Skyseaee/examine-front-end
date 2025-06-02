import React from 'react';
import { Layout } from 'antd';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import PrivateRoute from './utils/PrivateRoute';
import Login from './pages/Login';
import FirstRoundReview from './pages/FirstRoundReview';
import SecondRoundReview from './pages/SecondRoundReview';
import FinalReview from './pages/FinalReview';

const { Content } = Layout;

function App() {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Header />
        <Content style={{ padding: '24px' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute requiredPrivilege={2}>
                  <FirstRoundReview />
                </PrivateRoute>
              }
            />
            <Route
              path="/second-review"
              element={
                <PrivateRoute requiredPrivilege={3}>
                  <SecondRoundReview />
                </PrivateRoute>
              }
            />
            <Route
              path="/final-review"
              element={
                <PrivateRoute requiredPrivilege={4}>
                  <FinalReview />
                </PrivateRoute>
              }
            />
          </Routes>
        </Content>
      </Layout>
    </Router>
  );
}

export default App;