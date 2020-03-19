import React from 'react';
import queryString from 'query-string';
import Layout from './Layout';
import { PageRoute } from "../models/PageRoute";

const GenericErrorPage: React.FC<PageRoute> = (route: PageRoute) => {
  const props = queryString.parse(route.location.search);

  console.error("GENERIC ERROR: " + props.msg);

  return <Layout noindex={true}>Sorry!  An error occurred while processing your request.</Layout>;
};

export default GenericErrorPage;
