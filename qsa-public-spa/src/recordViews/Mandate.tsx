import React, { useState } from 'react';
import { Redirect } from 'react-router';
import { Link } from 'react-router-dom';
import { Http } from '../utils/http';
import Layout from './Layout';
import { RecordDisplay } from '../models/RecordDisplay';
import { iconForType, labelForMandateType, labelForType } from '../utils/typeResolver';
import {CoreInformationDateDisplay, Relationship} from './Helpers';
import { AdvancedSearchQuery } from '../models/AdvancedSearch';
import { PageRoute } from '../models/PageRoute';
import {preserveNewLines, rewriteISODates} from "../utils/rendering";


const MandatePage: React.FC<PageRoute> = (route: PageRoute) => {
  const [currentMandate, setCurrentMandate] = useState<any | null>(null);
  const [notFoundRedirect, setNotFoundRedirect] = useState(false);
  const qsaId: string = route.match.params.qsaId;

  if (!currentMandate) {
    Http.get()
      .fetchByQSAID(qsaId, 'mandate')
      .then((json: any) => {
        if (json) {
          setCurrentMandate(new RecordDisplay(json));
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
  } else if (!currentMandate) {
    return <Layout skipFooter={true} />;
  } else {
    route.setPageTitle(`Mandate: ${currentMandate.get('title')}`);
    route.triggerPageViewTracker();

    const relatedQuery = AdvancedSearchQuery.emptyQuery().addStickyFilter(
      'mandate_id',
      currentMandate.get('id'),
      currentMandate.get('title')
    );

    return (
      <Layout>
        <div className="row">
          <div className="col-sm-12">
            <h1>
              {currentMandate.get('title')}
              <div>
                <div className="badge">
                  <small>
                    <strong>
                      <i className={iconForType('mandate')} aria-hidden="true" />
                      &nbsp;{labelForType('mandate')}
                    </strong>
                  </small>
                </div>
              </div>
            </h1>

            <section className="core-information">
              <h2 className="sr-only">Basic information</h2>
              <p className="lead">{currentMandate.get('note')}</p>

              <ul className="list-group list-group-horizontal-md">
                <li className="list-group-item">
                  <span className="small">ID</span>
                  <br />
                  {currentMandate.get('qsa_id_prefixed')}
                </li>
                <CoreInformationDateDisplay date={currentMandate.getArray('date')[0]} />
              </ul>

              {currentMandate.getFirst('date', (date: any) => {
                return date.date_notes && <p className="footer small">Date notes: {date.date_notes}</p>;
              })}

              <h3 className="sr-only">Mandate descriptive metadata</h3>

              <ul className="list-group list-group-flush">
                {currentMandate.getMaybe('mandate_type', (value: any) => {
                  return (
                    <li className="list-group-item list-group-item-action">
                      <div className="d-flex w-100 justify-content-between">
                        <h4 className="mb-1">Type</h4>
                      </div>
                      <p className="mb-1">{labelForMandateType(value)}</p>
                    </li>
                  );
                })}
                {currentMandate.getMaybe('reference_number', (value: any) => {
                  return (
                    <li className="list-group-item list-group-item-action">
                      <div className="d-flex w-100 justify-content-between">
                        <h4 className="mb-1">Reference Number</h4>
                      </div>
                      <p className="mb-1">{value}</p>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section>
              <h2>Relationships</h2>

              {
                <Link to={`/search?` + relatedQuery.toQueryString()} className="qg-btn btn-primary btn-sm">
                  Browse Related Series
                </Link>
              }

              {currentMandate.getArray('function_relationships').length > 0 && <h3>Related functions</h3>}
              <ul className="list-group list-group-flush">
                {currentMandate.getArray('function_relationships').map((rlshp: any, idx: number) => {
                  return (
                    <li key={idx} className="list-group-item">
                      {<Relationship relationship={rlshp} />}
                    </li>
                  );
                })}
              </ul>

              {currentMandate.getArray('agent_relationships').length > 0 && <h3>Related agencies</h3>}
              <ul className="list-group list-group-flush">
                {currentMandate.getArray('agent_relationships').map((rlshp: any, idx: number) => {
                  return (
                    <li key={idx} className="list-group-item">
                      {<Relationship relationship={rlshp} />}
                    </li>
                  );
                })}
              </ul>

              {currentMandate.getArray('mandate_relationships').length > 0 && <h3>Related mandates</h3>}
              <ul className="list-group list-group-flush">
                {currentMandate.getArray('mandate_relationships').map((rlshp: any, idx: number) => {
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

export default MandatePage;
