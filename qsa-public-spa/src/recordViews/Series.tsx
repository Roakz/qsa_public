import React, {useEffect, useState} from 'react';
import { Redirect } from 'react-router';
import { Http } from '../utils/http';
import Layout from './Layout';
import { iconForType, labelForType } from '../utils/typeResolver';
import { Note, RecordDisplay } from '../models/RecordDisplay';
import {
  AccordionPanel,
  CoreInformationDateDisplay,
  MaybeLink,
  NoteDisplay,
  RecordContext,
  Relationship
} from './Helpers';
import {Tagger} from "./Tagger";
import { PageRoute } from '../models/PageRoute';


const SeriesPage: React.FC<PageRoute> = (route: PageRoute) => {
  const [series, setCurrentSeries] = useState<any | null>(null);
  const [showAccordions, setShowAccordions] = useState(true);
  const [notFoundRedirect, setNotFoundRedirect] = useState(false);
  const qsaId: string = route.match.params.qsaId;

  /* FIXME: probably want a definition file of types to QSA prefixes here */
  if (!series) {
    Http.get()
      .fetchByQSAID(qsaId, 'resource')
      .then((json: any) => {
        if (json) {
          setCurrentSeries(new RecordDisplay(json));
        } else {
          setNotFoundRedirect(true);
        }
      })
      .catch((exception: Error) => {
        console.error(exception);
        setNotFoundRedirect(true);
      });
  }

  useEffect(() => {
    if (series) {
      const accordionEl = document.getElementById('accordion');
      if (accordionEl) {
        const parent = accordionEl.parentNode;
        if (parent) {
          if (parent.childNodes.length === 1) {
            setShowAccordions(false);
          }
        }
      }
    }
  }, [series]);

  if (notFoundRedirect) {
    return <Redirect to="/404" push={true} />;
  } else if (!series) {
    return <Layout skipFooter={true} />;
  } else {
    route.setPageTitle(`Series: ${series.get('title')}`);
    route.triggerPageViewTracker();

    return (
      <Layout aside={<RecordContext qsaId={qsaId} recordType="resource" />}>
        <div className="row">
          <div className="col-sm-12">
            <h1>
              {series.get('title')}
              <div>
                <div className="badge">
                  <small>
                    <strong>
                      <i className={iconForType('resource')} aria-hidden="true" />
                      &nbsp;{labelForType('resource')}
                    </strong>
                  </small>
                </div>
              </div>
            </h1>

            <section className="core-information">
              <h2 className="sr-only">Basic information</h2>

              <ul className="list-group list-group-horizontal-md">
                <li className="list-group-item">
                  <span className="small">ID</span>
                  <br />
                  {series.get('qsa_id_prefixed')}
                </li>
                <CoreInformationDateDisplay date={series.getArray('dates')[0]} />
              </ul>

              {series.getFirst('dates', (date: any) => {
                return date.date_notes && <p className="footer small">Date notes: {date.date_notes}</p>;
              })}

              <h3 className="sr-only">Series descriptive metadata</h3>

              <ul className="list-group list-group-flush">
                
              <li className="list-group-item list-group-item-action">
                  <div className="d-flex w-100 justify-content-between">
                    <h4 className="mb-1">Access Status Summary <a href="/pages/restricted-access" rel="noopener noreferrer" target="_blank" aria-label="Information about restricted access"><i className="fa fa-question-circle" title="Information about restricted access" /></a></h4>
                  </div>
                  <div className="text-success">{(series.get('access_status_summary')['Open Access'] || 0)} Open Items</div>
                  <div>
                    <span className="text-danger">{(series.get('access_status_summary')['Restricted Access'] || 0)} Restricted Items</span>&nbsp;
                    <a href="/pages/how-do-i-order-restricted-records" rel="noopener noreferrer" target="_blank" aria-label="How to order restricted records"><i className="fa fa-question-circle" title="How to order restricted records" /></a>
                  </div>
                </li>
                {[
                  ['repository_processing_note', 'Previous System Identifiers'],
                  ['sensitivity_label', 'Sensitivity Statement'],
                  ['copyright_status', 'Copyright status'],
                  // ['information_sources', 'Information sources']
                ].map(([fieldName, fieldLabel]) => {
                  return series.getMaybe(fieldName, (value: any) => {
                    return (
                      <li key={fieldLabel} className="list-group-item list-group-item-action">
                        <div className="d-flex w-100 justify-content-between">
                          <h4 className="mb-1">{fieldLabel}</h4>
                        </div>
                        <p className="mb-1">
                          {
                            (Array.isArray(value) ? value.join('; ') : value)
                          }
                        </p>
                      </li>
                    );
                  });
                })}
              </ul>
            </section>
            
            <Tagger recordId={series.get('id')} context={route.context}/>

            {
              showAccordions &&
              <section className="qg-accordion qg-dark-accordion" aria-label="Accordion Label">
                <h2 id="accordion">Detailed information</h2>

                {/*<input type="radio" name="control" id="collapse" className="controls collapse" value="collapse" role="radio"/>*/}
                {/*<label htmlFor="collapse" className="controls">Collapse details</label>*/}
                {/*<span className="controls">&#124;</span>*/}
                {/*<input type="radio" name="control" id="expand" className="controls expand" value="expand" role="radio"/>*/}
                {/*<label htmlFor="expand" className="controls">Show details</label>*/}

                {series.getNotes('description', null, (notes: Note[]) => (
                    <AccordionPanel
                        id={series.generateId()}
                        title="Description"
                        children={notes.map((note: Note, idx: number) => (
                            <NoteDisplay note={note} key={idx} />
                        ))}
                    />
                ))}

                {series.getNotes('how_to_use', null, (notes: Note[]) => (
                    <AccordionPanel
                        id={series.generateId()}
                        title="How to Use"
                        children={notes.map((note: Note, idx: number) => (
                            <NoteDisplay note={note} key={idx} />
                        ))}
                    />
                ))}


                {series.getExternalDocuments(['Helpful Resources'], (docs: any) => (
                    <AccordionPanel
                        id={series.generateId()}
                        title="Helpful Resources"
                        children={docs.map((doc: any, idx: number) => (
                            <div key="{idx}"><MaybeLink location={doc.location} label={doc.location} /></div>
                        ))}
                    />
                ))}

                {series.getNotes('odd', 'Remarks', (notes: Note[]) => (
                    <AccordionPanel
                        id={series.generateId()}
                        title="Remarks"
                        children={notes.map((note: Note, idx: number) => (
                            <NoteDisplay note={note} key={idx} />
                        ))}
                    />
                ))}

                {series.getNotes('remarks', null, (notes: Note[]) => (
                    <AccordionPanel
                        id={series.generateId()}
                        title="Remarks"
                        children={notes.map((note: Note, idx: number) => (
                            <NoteDisplay note={note} key={idx} />
                        ))}
                    />
                ))}

                {series.getNotes('preferred_citation', null, (notes: Note[]) => (
                    <AccordionPanel
                        id={series.generateId()}
                        title="Citation"
                        children={notes.map((note: Note, idx: number) => (
                            <NoteDisplay key={idx} note={note} />
                        ))}
                    />
                ))}


                {series.getNotes('prefercite', null, (notes: Note[]) => (
                    <AccordionPanel
                        id={series.generateId()}
                        title="Citation"
                        children={notes.map((note: Note, idx: number) => (
                            <NoteDisplay key={idx} note={note} />
                        ))}
                    />
                ))}


                {series.getNotes('agency_control_number', null, (notes: Note[]) => (
                    <AccordionPanel
                        id={series.generateId()}
                        title="Agency Control Number"
                        children={notes.map((note: Note, idx: number) => (
                            <NoteDisplay note={note} key={idx} />
                        ))}
                    />
                ))}

                {series.getNotes('system_of_arrangement', null, (notes: Note[]) => (
                    <AccordionPanel
                        id={series.generateId()}
                        title="System of Arrangement"
                        children={notes.map((note: Note, idx: number) => (
                            <NoteDisplay note={note} key={idx} />
                        ))}
                    />
                ))}

                {series.getNotes('arrangement', null, (notes: Note[]) => (
                    <AccordionPanel
                        id={series.generateId()}
                        title="System of Arrangement"
                        children={notes.map((note: Note, idx: number) => (
                            <NoteDisplay note={note} key={idx} />
                        ))}
                    />
                ))}

                {series.getNotes('information_sources', null, (notes: Note[]) => (
                    <AccordionPanel
                        id={series.generateId()}
                        title="Information Sources"
                        children={notes.map((note: Note, idx: number) => (
                            <NoteDisplay note={note} key={idx} />
                        ))}
                    />
                ))}


              </section>
            }

            <section>
              <h2>Relationships</h2>

              {series.getArray('agent_relationships').length > 0 && <h3>Related agencies</h3>}
              <ul className="list-group list-group-flush">
                {series.getArray('agent_relationships').map((rlshp: any, idx: number) => {
                  return (
                    <li key={idx} className="list-group-item">
                      {<Relationship relationship={rlshp} />}
                    </li>
                  );
                })}
              </ul>

              {series.getArray('series_relationships').length > 0 && <h3>Related series</h3>}
              <ul className="list-group list-group-flush">
                {series.getArray('series_relationships').map((rlshp: any, idx: number) => {
                  return (
                    <li key={idx} className="list-group-item">
                      {<Relationship relationship={rlshp} />}
                    </li>
                  );
                })}
              </ul>

              {series.getArray('function_relationships').length > 0 && <h3>Related functions</h3>}
              <ul className="list-group list-group-flush">
                {series.getArray('function_relationships').map((rlshp: any, idx: number) => {
                  return (
                    <li key={idx} className="list-group-item">
                      {<Relationship relationship={rlshp} />}
                    </li>
                  );
                })}
              </ul>
              
              {series.getArray('mandate_relationships').length > 0 && <h3>Related mandates</h3>}
              <ul className="list-group list-group-flush">
                {series.getArray('mandate_relationships').map((rlshp: any, idx: number) => {
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

export default SeriesPage;
