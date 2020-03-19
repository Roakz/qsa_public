import React from 'react';
import Layout from './Layout';
import {PageRoute} from "../models/PageRoute";

const NotFound: React.FC<PageRoute> = (route: PageRoute) => {
  return <Layout noindex={true}>Sorry, page not found.</Layout>;
};

export default NotFound;
