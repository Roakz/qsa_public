import React, { useState } from 'react';
import { Redirect } from 'react-router';
import { Link } from 'react-router-dom';
import { Http } from '../utils/http';
import Layout from './Layout';
import { Note, RecordDisplay } from '../models/RecordDisplay';
import { iconForType, labelForType } from '../utils/typeResolver';
import {
  AccordionPanel,
  CoreInformationDateDisplay,
  MaybeLink,
  NoteDisplay,
  Relationship
} from './Helpers';
import { AdvancedSearchQuery } from '../models/AdvancedSearch';
import { PageRoute } from '../models/PageRoute';
import {preserveNewLines, rewriteISODates} from "../utils/rendering";


const AgencyPage: React.FC<PageRoute> = (route: PageRoute) => {
  const [agency, setCurrentAgency] = useState<any | null>(null);
  const [notFoundRedirect, setNotFoundRedirect] = useState(false);
  const qsaId: string = route.match.params.qsaId;

  if (!agency) {
    Http.get()
      .fetchByQSAID(qsaId, 'agent_corporate_entity')
      .then((json: any) => {
        if (json) {
          setCurrentAgency(new RecordDisplay(json));
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
  } else if (!agency) {
    return <Layout skipFooter={true} />;
  } else {
    route.setPageTitle(`Agency: ${agency.get('display_string')}`);
    route.triggerPageViewTracker();

    const controlledRecordsQuery = AdvancedSearchQuery.emptyQuery().addStickyFilter(
      'responsible_agency_id',
      agency.get('id'),
      agency.get('display_string')
    ).setType('resource', true);
    const createdRecordsQuery = AdvancedSearchQuery.emptyQuery().addStickyFilter(
      'creating_agency_id',
      agency.get('id'),
      agency.get('display_string')
    ).setType('resource', true);

    return (
      <Layout>
        <div className="row">
          <div className="col-sm-12">
            <h1>
              {agency.get('display_string')}
              <div>
                <div className="badge">
                  <small>
                    <strong>
                      <i className={iconForType('agent_corporate_entity')} aria-hidden="true" />
                      &nbsp;{labelForType('agent_corporate_entity')}
                    </strong>
                  </small>
                </div>
              </div>
            </h1>

            <section className="core-information">
              <h2 className="sr-only">Basic information</h2>
              <p className="lead">{agency.get('agency_note')}</p>

              <ul className="list-group list-group-horizontal-md">
                <li className="list-group-item">
                  <span className="small">ID</span>
                  <br />
                  {agency.get('qsa_id_prefixed')}
                </li>
                <CoreInformationDateDisplay date={agency.getArray('dates')[0]} />
              </ul>

              {agency.getFirst('dates', (date: any) => {
                return date.date_notes && <p className="footer small">Date notes: {date.date_notes}</p>;
              })}
            </section>

            <section className="qg-accordion qg-dark-accordion" aria-label="Accordion Label">
              <h2 id="accordion">Detailed information</h2>

              <ul className="list-group list-group-flush">
                {
                  agency.getArray('alternative_names').length > 0 &&
                  <li className="list-group-item list-group-item-action">
                    <div className="d-flex w-100 justify-content-between">
                      <h4 className="mb-1">Alternative names</h4>
                    </div>
                    <p className="mb-1">
                      {
                        agency.getArray('alternative_names').map((name: string) => (
                            <>
                              {name}<br/>
                            </>
                        ))
                      }
                    </p>
                  </li>
                }
                {agency.getMaybe('agency_category', () => {
                  return (
                      <li className="list-group-item list-group-item-action">
                        <div className="d-flex w-100 justify-content-between">
                          <h4 className="mb-1">Agency Category</h4>
                        </div>
                        <p className="mb-1">{agency.get('agency_category_label') || agency.get('agency_category')}</p>
                      </li>
                  );
                })}
              </ul>

              {agency.getNotes('description', null, (notes: Note[]) => (
                <AccordionPanel id={agency.generateId()} title="Description">
                  {notes.map((note: Note, noteIndex: number) => (
                    <NoteDisplay key={noteIndex} note={note} />
                  ))}
                </AccordionPanel>
              ))}

              {agency.getExternalDocuments(['Helpful Resources'], (docs: any) => (
                <AccordionPanel id={agency.generateId()} title="Helpful Resources">
                  {docs.map((doc: any) => (
                      <div><MaybeLink location={doc.location} label={doc.location} /></div>
                  ))}
                </AccordionPanel>
              ))}

              {agency.getNotes('remarks', null, (notes: Note[]) => (
                <AccordionPanel id={agency.generateId()} title="Remarks">
                  {notes.map((note: Note) => (
                    <NoteDisplay note={note} />
                  ))}
                </AccordionPanel>
              ))}

              {agency.getNotes('preferred_citation', null, (notes: Note[]) => (
                <AccordionPanel id={agency.generateId()} title="Citation">
                  {notes.map((note: Note) => (
                    <NoteDisplay note={note} />
                  ))}
                </AccordionPanel>
              ))}

              {agency.getNotes('legislation_establish', null, (notes: Note[]) => (
                <AccordionPanel id={agency.generateId()} title="Legislation Establishing">
                  {notes.map((note: Note) => (
                    <NoteDisplay note={note} />
                  ))}
                </AccordionPanel>
              ))}

              {agency.getNotes('legislation_abolish', null, (notes: Note[]) => (
                <AccordionPanel id={agency.generateId()} title="Legislation Abolishing">
                  {notes.map((note: Note) => (
                    <NoteDisplay note={note} />
                  ))}
                </AccordionPanel>
              ))}

              {agency.getNotes('legislation_administered', null, (notes: Note[]) => (
                <AccordionPanel id={agency.generateId()} title="Legislation Administering">
                  {notes.map((note: Note) => (
                    <NoteDisplay note={note} />
                  ))}
                </AccordionPanel>
              ))}

              {agency.getNotes('information_sources', null, (notes: Note[]) => (
                <AccordionPanel id={agency.generateId()} title="Information Sources">
                  {notes.map((note: Note) => (
                    <NoteDisplay note={note} />
                  ))}
                </AccordionPanel>
              ))}

            </section>

            <section>
              <h2>Relationships</h2>
              {
                <Link to={`/search?` + controlledRecordsQuery.toQueryString()} className="qg-btn btn-primary btn-sm">
                  Browse Controlled Records
                </Link>
              }
              &nbsp;
              {
                <Link to={`/search?` + createdRecordsQuery.toQueryString()} className="qg-btn btn-primary btn-sm">
                  Browse Created Records
                </Link>
              }
              {agency.getArray('agent_relationships').length > 0 && <h3>Related agencies</h3>}
              <ul className="list-group list-group-flush">
                {agency.getArray('agent_relationships').map((rlshp: any, idx: number) => {
                  return (
                    <li key={idx} className="list-group-item">
                      {<Relationship relationship={rlshp} />}
                    </li>
                  );
                })}
              </ul>
              {agency.getArray('function_relationships').length > 0 && <h3>Related functions</h3>}
              <ul className="list-group list-group-flush">
                {agency.getArray('function_relationships').map((rlshp: any, idx: number) => {
                  return (
                    <li key={idx} className="list-group-item">
                      {<Relationship relationship={rlshp} />}
                    </li>
                  );
                })}
              </ul>
              {agency.getArray('mandate_relationships').length > 0 && <h3>Related mandates</h3>}
              <ul className="list-group list-group-flush">
                {agency.getArray('mandate_relationships').map((rlshp: any, idx: number) => {
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

export default AgencyPage;
