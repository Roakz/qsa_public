import React, { useState } from 'react';
import { Redirect } from 'react-router';
import { Link } from 'react-router-dom';
import { Http } from '../utils/http';
import Layout from './Layout';
import { RecordDisplay } from '../models/RecordDisplay';
import { iconForType, labelForType } from '../utils/typeResolver';
import {CoreInformationDateDisplay, Relationship} from './Helpers';
import { AdvancedSearchQuery } from '../models/AdvancedSearch';
import { PageRoute } from '../models/PageRoute';


const FunctionPage: React.FC<PageRoute> = (route: PageRoute) => {
  const [currentFunction, setCurrentFunction] = useState<any | null>(null);
  const [notFoundRedirect, setNotFoundRedirect] = useState(false);
  const qsaId: string = route.match.params.qsaId;

  if (!currentFunction) {
    Http.get()
      .fetchByQSAID(qsaId, 'function')
      .then((json: any) => {
        if (json) {
          setCurrentFunction(new RecordDisplay(json));
        } else {
          setNotFoundRedirect(true);
        }
      })
      .catch((exception: Error) => {
        console.error(exception);
        setNotFoundRedirect(true);
      });
  }

  if (notFoundRedirect) {
    return <Redirect to="/404" push={true} />;
  } else if (!currentFunction) {
    return <Layout skipFooter={true} />;
  } else {
    route.setPageTitle(`Function: ${currentFunction.get('title')}`);
    route.triggerPageViewTracker();

    const relatedQuery = AdvancedSearchQuery.emptyQuery().addStickyFilter(
      'function_id',
      currentFunction.get('id'),
      currentFunction.get('title')
    );

    return (
      <Layout>
        <div className="row">
          <div className="col-sm-12">
            <h1>
              {currentFunction.get('title')}
              <div>
                <div className="badge">
                  <small>
                    <strong>
                      <i className={iconForType('function')} aria-hidden="true" />
                      &nbsp;{labelForType('function')}
                    </strong>
                  </small>
                </div>
              </div>
            </h1>

            <section className="core-information">
              <h2 className="sr-only">Basic information</h2>
              <p className="lead">{currentFunction.get('note')}</p>

              <ul className="list-group list-group-horizontal-md">
                <li className="list-group-item">
                  <span className="small">ID</span>
                  <br />
                  {currentFunction.get('qsa_id_prefixed')}
                </li>
                <CoreInformationDateDisplay date={currentFunction.getArray('date')[0]} />
              </ul>

              {currentFunction.getFirst('date', (date: any) => {
                return date.date_notes && <p className="footer small">Date notes: {date.date_notes}</p>;
              })}

              <h3 className="sr-only">Function descriptive metadata</h3>

              <ul className="list-group list-group-flush">
                {currentFunction.getMaybe('source', (value: any) => {
                  return (
                      <li className="list-group-item list-group-item-action">
                        <div className="d-flex w-100 justify-content-between">
                          <h4 className="mb-1">Source</h4>
                        </div>
                        <p className="mb-1">{value}</p>
                      </li>
                  );
                })}
                {currentFunction.getArray('non_preferred_names').length > 0 &&
                  <li className="list-group-item list-group-item-action">
                    <div className="d-flex w-100 justify-content-between">
                      <h4 className="mb-1">Non Preferred Names</h4>
                    </div>
                    <div className="mb-1">
                      {currentFunction.getArray('non_preferred_names').join('; ')}
                    </div>
                  </li>
                }
              </ul>
            </section>

            <section>
              <h2>Relationships</h2>

              {
                <Link to={`/search?` + relatedQuery.toQueryString()} className="qg-btn btn-primary btn-sm">
                  Browse Related Series
                </Link>
              }

              {currentFunction.getArray('agent_relationships').length > 0 && <h3>Related agencies</h3>}
              <ul className="list-group list-group-flush">
                {currentFunction.getArray('agent_relationships').map((rlshp: any, idx: number) => {
                  return (
                    <li key={idx} className="list-group-item">
                      {<Relationship relationship={rlshp} />}
                    </li>
                  );
                })}
              </ul>
              
              {currentFunction.getArray('function_relationships').length > 0 && <h3>Related functions</h3>}
              <ul className="list-group list-group-flush">
                {currentFunction.getArray('function_relationships').map((rlshp: any, idx: number) => {
                  return (
                    <li key={idx} className="list-group-item">
                      {<Relationship relationship={rlshp} />}
                    </li>
                  );
                })}
              </ul>

              {currentFunction.getArray('mandate_relationships').length > 0 && <h3>Related mandates</h3>}
              <ul className="list-group list-group-flush">
                {currentFunction.getArray('mandate_relationships').map((rlshp: any, idx: number) => {
                  return (
                    <li key={idx} className="list-group-item">
                      {<Relationship relationship={rlshp} />}
                    </li>
                  );
                })}
              </ul>

            </section>
          </div>
        </div>
      </Layout>
    );
  }
};

export default FunctionPage;
