import React from 'react';
import Layout from './Layout';
import AspaceAdvancedSearch from '../advancedSearch/AdvancedSearch';
import { AdvancedSearchQuery } from '../models/AdvancedSearch';
import {PageSnippet} from './PageViewPage';
import {PageRoute} from "../models/PageRoute";

const HomePage: React.FC<PageRoute> = (route: PageRoute) => {
  return (
    <Layout>
      <h1>ArchivesSearch</h1>

      <PageSnippet slug="welcome" />
      <div className="qg-call-out-box">
        <AspaceAdvancedSearch advancedSearchQuery={AdvancedSearchQuery.emptyQuery()} />
      </div>
    </Layout>
  );
};

export default HomePage;
