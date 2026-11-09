import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import UnderConstruction from './screens/UnderConstructionScreen';
import ErrorBoundary from './components/ErrorBoundary';
import { dismissBootSplash } from './lib/bootSplash';

// Public site is the construction splash until the beta opens.
// The player still lives in App.jsx — mount that here to bring it back.
const root = ReactDOM.createRoot(document.getElementById('root'));
dismissBootSplash();
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <UnderConstruction />
    </ErrorBoundary>
  </React.StrictMode>
);
