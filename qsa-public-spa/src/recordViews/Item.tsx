import React, {useEffect, useState} from 'react';
import { Redirect } from 'react-router';
import {baseURL, Http} from '../utils/http';
import Layout from './Layout';
import {
  iconForType,
  labelForAvailability,
  labelForType
} from '../utils/typeResolver';
import { Note, RecordDisplay } from '../models/RecordDisplay';
import {
  AccordionPanel,
  CoreInformationDateDisplay,
  MaybeLink,
  NoteDisplay,
  RecordContext,
  Relationship
} from './Helpers';
import AppContext from '../context/AppContext';
import {Tagger} from "./Tagger";
import { IAppContext } from '../context/AppContext';
import { PageRoute } from '../models/PageRoute';
import {preserveNewLines, rewriteISODates} from "../utils/rendering";
import ReactGA from "react-ga";

declare var AppConfig: any;

const PhysicalRepresentation: React.FC<{
  representation: any;
  item: RecordDisplay;
  context: IAppContext;
}> = ({ representation, item, context }) => {
  representation = new RecordDisplay(representation);

  const classForAvailability = (availability: string) => {
    if (availability === 'available') {
      return 'badge-primary';
    } else if (REQUESTABLE_AVAILABILITIES.indexOf(availability) >= 0) {
      return 'badge-warning';
    } else {
      return 'badge-danger';
    }
  };

  return (
    <>
      {
        isRepresentationAvailableForRequest(representation) &&
        <div className="pull-right text-right">
          {
            isRepresentationAvailableForReadingRoomRequest(representation) &&
            <div style={{marginBottom: 10}}><AddToReadingRoomRequestCartButton itemId={representation.get('id')} /></div>
          }
          {
            isRepresentationAvailableForDigitalCopyRequest(representation) &&
            <AddToDigitalCopyRequestCartButton
                itemId={representation.get('id')}/>
          }
        </div>
      }
      <dl>
        <dt>ID</dt>
        <dd>{representation.get('qsa_id_prefixed')}</dd>
        <dt>Title</dt>
        <dd>{representation.get('title')}</dd>

        <dt>Access status <a href="/pages/restricted-access" rel="noopener noreferrer" target="_blank" aria-label="Information about restricted access"><i className="fa fa-question-circle" title="Information about restricted access" /></a></dt>
        {
          representation.get('rap_access_status') === 'Open Access' ?
            <dd className="text-success">Open</dd> :
            <>
              <dd className="text-danger">Restricted</dd>
              <dd>
                {!representation.get('rap_expiration').expires && "No expiry"}
                {representation.get('rap_expiration').expires &&
                  <>
                    {representation.get('rap_expiration').expired ? "Expired: " : "Expires: "}
                    {rewriteISODates(representation.get('rap_expiration').expiry_date)}
                  </>
                }
              </dd>
            </>
        }

        <dt>Availability</dt>
        <dd>
          <span className={`badge badge-pill ${classForAvailability(representation.get('availability'))}`}>{labelForAvailability(representation.get('availability'))}</span>
        </dd>

        {representation.getArray('previous_system_ids').length > 0 &&
          <>
            <dt>Previous System Identifier</dt>
            <dd>{representation.getArray('previous_system_ids').join('; ')}</dd>
          </>
        }

        {representation.getMaybe('agency_assigned_id', (value: string) => (
          <>
            <dt>Agency Control Number</dt>
            <dd>{value}</dd>
          </>
        ))}

        {representation.getMaybe('description', (value: string) => (
            <>
              <dt>Description</dt>
              <dd style={{whiteSpace: 'pre'}}>{value}</dd>
            </>
        ))}

        <dt>Format</dt>
        <dd>{representation.get('format')}</dd>
        {representation.getMaybe('intended_use', (value: string) => (
            <>
              <dt>Intended Use</dt>
              <dd>{value}</dd>
            </>
        ))}

        {representation.getMaybe('processing_handling_notes', (value: string) => (
            <>
              <dt>Processing/Handling Notes</dt>
              <dd>{value}</dd>
            </>
        ))}
        
        {representation.getMaybe('remarks', (value: string) => (
            <>
              <dt>Remarks</dt>
              <dd>{value}</dd>
            </>
        ))}
       
        {representation.getMaybe('preferred_citation', (value: string) => (
            <>
              <dt>Citation</dt>
              <dd>{value}</dd>
            </>
        ))}
       
      </dl>
    </>
  );
};

const DownloadDigitalRepresentations: React.FC<{
  representations: any;
  triggerDownloadTracker: (path: string, repesentation: RecordDisplay) => void;
}> = ({representations, triggerDownloadTracker}) => {
  if (representations.length == 0) {
    return <></>;
  }

  return <>
    <div className="dropdown">
      <button className="qg-btn btn-warning dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        <i className="fa fa-download" aria-hidden="true"></i>&nbsp;
        View Digital Copy
      </button>
      <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
        {
          representations.map((r: any, idx: number) => {
            let representation = new RecordDisplay(r);
            return <a href={baseURL + '/api/download_file/' + representation.get('qsa_id_prefixed')}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {triggerDownloadTracker((e.target as HTMLAnchorElement).href, representation); return true}}
                      className="dropdown-item"
                      key={idx}>
              {representation.get('qsa_id_prefixed')} {representation.get('title')}
            </a>;
          })
        }
      </div>
    </div>
  </>;
};

const DigitalRepresentation: React.FC<{
  representation: any;
  item: RecordDisplay;
  context: IAppContext;
  triggerDownloadTracker: (path: string, repesentation: RecordDisplay) => void;
}> = ({ representation, item, context, triggerDownloadTracker }) => {
  representation = new RecordDisplay(representation);

  return (
    <>
      {
        isRepresentationAvailableForRequest(representation) &&
        <div className="pull-right text-right">
          {
            isRepresentationAvailableForReadingRoomRequest(representation) &&
            <div style={{marginBottom: 10}}><AddToReadingRoomRequestCartButton itemId={representation.get('id')} /></div>
          }
          {
            isRepresentationAvailableForDigitalCopyRequest(representation) &&
            <AddToDigitalCopyRequestCartButton
                itemId={representation.get('id')}/>
          }
        </div>
      }
      <dl>
        {
          representation.get('representation_file') &&
          <>
            <dt>Download File</dt>
            <dd>
              <a href={baseURL + '/api/download_file/' + representation.get('qsa_id_prefixed')}
                 target="_blank"
                 rel="noopener noreferrer"
                 onClick={(e) => {triggerDownloadTracker((e.target as HTMLAnchorElement).href, representation); return true}}>
                Link to download
              </a>
            </dd>
          </>
        }
        <dt>ID</dt>
        <dd>{representation.get('qsa_id_prefixed')}</dd>
        <dt>Title</dt>
        <dd>{representation.get('title')}</dd>

        <dt>Access status <a href="/pages/restricted-access" rel="noopener noreferrer" target="_blank" aria-label="Information about restricted access"><i className="fa fa-question-circle" title="Information about restricted access" /></a></dt>
        
        {representation.get('rap_access_status') === 'Open Access' ?
            <dd className="text-success">Open</dd> :
            <>
              <dd className="text-danger">Restricted</dd>
              <dd>
                {!representation.get('rap_expiration').expires && "No expiry"}
                {representation.get('rap_expiration').expires &&
                  <>
                    {representation.get('rap_expiration').expired ? "Expired: " : "Expires: "}
                    {rewriteISODates(representation.get('rap_expiration').expiry_date)}
                  </>
                }
              </dd>
            </>
        }

        {representation.getArray('previous_system_ids').length > 0 &&
          <>
            <dt>Previous System Identifier</dt>
            <dd>{representation.getArray('previous_system_ids').join('; ')}</dd>
          </>
        }

        {representation.getMaybe('agency_assigned_id', (value: string) => (
          <>
            <dt>Agency Control Number</dt>
            <dd>{value}</dd>
          </>
        ))}
       
        {representation.getMaybe('description', (value: string) => (
            <>
              <dt>Description</dt>
              <dd style={{whiteSpace: 'pre'}}>{value}</dd>
            </>
        ))}
        
        {representation.getMaybe('file_type', (value: string) => (
          <>
            <dt>Format</dt>
            <dd>{value}</dd>
          </>
        ))}

        {representation.getMaybe('intended_use', (value: string) => (
            <>
              <dt>Intended Use</dt>
              <dd>{value}</dd>
            </>
        ))}

        {representation.getMaybe('processing_handling_notes', (value: string) => (
            <>
              <dt>Processing/Handling Notes</dt>
              <dd>{value}</dd>
            </>
        ))}

        {representation.getMaybe('remarks', (value: string) => (
            <>
              <dt>Remarks</dt>
              <dd>{value}</dd>
            </>
        ))}

        {representation.getMaybe('preferred_citation', (value: string) => (
            <>
              <dt>Citation</dt>
              <dd>{value}</dd>
            </>
        ))}

      </dl>
    </>
  );
};

const AddToDigitalCopyRequestCartButton: React.FC<any> = ({ itemId }) => {
  const requestItem = (item_id: string, request_type: string, context: IAppContext) => {
    Http.get()
        .addToCart(item_id, request_type)
        .then((json: any) => {
          context.refreshCart();
        })
        .catch((exception: Error) => {
          console.error(exception);
        });
  };

  const inCart = (cart: any, itemId: string) => {
    let result = false;

    cart.digital_copy_requests.set_price_records.concat(cart.digital_copy_requests.quotable_records).forEach((cartItem: any) => {
      if (cartItem.item_id === itemId) {
        result = true
      }
    });

    return result;
  };

  return (
      <AppContext.Consumer>
        {(context: IAppContext): React.ReactElement => {
          if (!context.user) {
            return (
              <div className={"request-button-no-login"}>
                <button className="qg-btn btn-default disabled">
                  <i className="fa fa-copy" aria-hidden="true"/>&nbsp;
                  Request digital copy
                </button>
                <div>
                  <small className="text-muted">Log in to access your cart</small>
                </div>
              </div>
            );
          } else if (context.user && context.cart && inCart(context.cart, itemId)) {
            return (
              <>
                <button className="qg-btn btn-default disabled">
                  <i className="fa fa-copy" aria-hidden="true"/>&nbsp;
                  Added to cart
                </button>
              </>
            );
          } else {
            return (
              <button className="qg-btn btn-secondary" onClick={() => requestItem(itemId, 'DIGITAL_COPY', context)}>
                <i className="fa fa-copy" aria-hidden="true"/>&nbsp;
              Request digital copy
              </button>
            );
          }
        }
        }
      </AppContext.Consumer>
  );
};

const AddToReadingRoomRequestCartButton: React.FC<any> = ({ itemId }) => {
  const requestItem = (item_id: string, request_type: string, context: IAppContext) => {
    Http.get()
      .addToCart(item_id, request_type)
      .then((json: any) => {
        context.refreshCart();
      })
      .catch((exception: Error) => {
        console.error(exception);
      });
  };

  const inCart = (cart: any, itemId: string) => {
    let result = false;

    if (cart.reading_room_requests.open_records) {
      cart.reading_room_requests.open_records.forEach((cartItem: any) => {
        if (cartItem.item_id === itemId) {
          result = true;
        }
      });
    }

    if (result) {
      return true;
    }

    if (cart.reading_room_requests.closed_records) {
      Object.keys(cart.reading_room_requests.closed_records).forEach((agency_uri: string) => {
        cart.reading_room_requests.closed_records[agency_uri].forEach((cartItem: any) => {
          if (cartItem.item_id === itemId) {
            result = true;
          }
        });
      });
    }

    return result;
  };

  return (
    <AppContext.Consumer>
      {(context: IAppContext): React.ReactElement => (
        <>
        {
          !context.user &&
          <>
            <button className="qg-btn btn-default disabled">
              <i className="fa fa-institution" aria-hidden="true"/>&nbsp;
              Request to view in Reading Room
            </button>
            <div>
              <small className="text-muted">Log in to access your cart</small>
            </div>
          </>
        }
        {
          context.user && context.cart && (inCart(context.cart, itemId) ? (
            <>
              <button className="qg-btn btn-default disabled">
                <i className="fa fa-institution" aria-hidden="true"/>&nbsp;
                Added to cart
              </button>
            </>
          ) : (
            <button className="qg-btn btn-primary"
                    onClick={() => requestItem(itemId, 'READING_ROOM', context)}>
              <i className="fa fa-institution" aria-hidden="true"/>&nbsp;
              Request to view in Reading Room
            </button>
          ))
        }
      </>)}
    </AppContext.Consumer>
  );
};

const RequestActions: React.FC<any> = ({ item, route }) => {
  return (
    <div className="row">
      <div className="col-sm-12 record-top-request-buttons">
        <div className={"top-request-button"}><ReadingRoomRequestAction item={item}/></div>
        <div className={"top-request-button"}><DigitalCopyRequestAction item={item}/></div>
        <div className={"top-request-button"}><DownloadDigitalRepresentations representations={item.getArray('digital_representations')} triggerDownloadTracker={route.triggerDownloadTracker}/></div>
      </div>
    </div>
  )
}

const REQUESTABLE_AVAILABILITIES = ['available',
                                    'unavailable_due_to_conservation',
                                    'unavailable_due_to_date_range',
                                    'unavailable_contact_qsa'];

const isRepresentationAvailableForRequest = (representation: RecordDisplay) => {
  return isRepresentationAvailableForReadingRoomRequest(representation)
    ||  isRepresentationAvailableForDigitalCopyRequest(representation);
};

const isRepresentationAvailableForReadingRoomRequest = (representation: RecordDisplay) => {
  if (representation.get('jsonmodel_type') === 'physical_representation') {
    return REQUESTABLE_AVAILABILITIES.indexOf(representation.get('availability')) >= 0;
  } else if (representation.get('jsonmodel_type') === 'digital_representation') {
    // Open Access will have a download link!
    // Restricted Access will need to be requested through the reading room
    return representation.get('rap_access_status') === 'Restricted Access';
  } else {
    return false;
  }
};

const isRepresentationAvailableForDigitalCopyRequest = (representation: RecordDisplay) => {
  if (representation.get('jsonmodel_type') === 'physical_representation') {
    return representation.get('rap_access_status') === 'Open Access';
  } else if (representation.get('jsonmodel_type') === 'digital_representation') {
    return false;
  } else {
    return false;
  }
};

const DigitalCopyRequestAction: React.FC<any> = ({ item }) => {
  const requestableRepresentations: any[] = item.getArray('physical_representations').filter((representation: any) => {
    return isRepresentationAvailableForDigitalCopyRequest(new RecordDisplay(representation));
  });

  if (requestableRepresentations.length === 0) {
    return <></>;
  }

  if (requestableRepresentations.length > 1) {
    const scrollToRepresentations = () => {
      const target = document.getElementById('physical_representations');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        const checkbox = target.querySelector('input[type=checkbox]') as HTMLInputElement;
        if (checkbox && !checkbox.checked) {
          checkbox.click();
        }
      }
    };

    return (
      <AppContext.Consumer>
        {(context: IAppContext): React.ReactElement => {
          if (context.user) {
            return (
              <button className="qg-btn btn-secondary"
                      onClick={() => scrollToRepresentations()}>
                <i className="fa fa-copy" aria-hidden="true"/>&nbsp;
                Request digital copy&nbsp;
                <span className="fa fa-chevron-circle-down" aria-hidden="true"/>
              </button>
            );
          } else {
            return (
              <>
                <button className="qg-btn btn-default disabled"
                        onClick={() => scrollToRepresentations()}>
                  <i className="fa fa-copy" aria-hidden="true"/>&nbsp;
                  Request digital copy&nbsp;
                  <span className="fa fa-chevron-circle-down" aria-hidden="true"/>
                </button>
                <div>
                  <small className="text-muted">Log in to access your cart</small>
                </div>
              </>
            );
          }
        }}
      </AppContext.Consumer>
    );
  }

  const itemIdToRequest = requestableRepresentations[0].id;

  return <AddToDigitalCopyRequestCartButton itemId={itemIdToRequest} />;
};

const ReadingRoomRequestAction: React.FC<any> = ({ item }) => {
  const allRepresentations: any[] = item.getArray('physical_representations').concat(item.getArray('digital_representations'));
  const requestableRepresentations: any[] = allRepresentations.filter((representation: any) => {
    return isRepresentationAvailableForReadingRoomRequest(new RecordDisplay(representation));
  });

  if (requestableRepresentations.length === 0) {
    return <></>;
  }

  if (requestableRepresentations.length > 1) {
    const scrollToRepresentations = () => {
      const physicalSection = document.getElementById('physical_representations');
      const digitalSection = document.getElementById('digital_representations');

      if (physicalSection) {
        physicalSection.scrollIntoView({ behavior: 'smooth' });
        const checkbox = physicalSection.querySelector('input[type=checkbox]') as HTMLInputElement;
        if (checkbox && !checkbox.checked) {
          checkbox.click();
        }
      }

      if (digitalSection) {
        if (!physicalSection) {
          digitalSection.scrollIntoView({ behavior: 'smooth' });
        }
        const checkbox = digitalSection.querySelector('input[type=checkbox]') as HTMLInputElement;
        if (checkbox && !checkbox.checked) {
          checkbox.click();
        }
      }
    };

    return (
      <AppContext.Consumer>
        {(context: IAppContext): React.ReactElement => (
          context.user ?
            <button className="qg-btn btn-primary"
                    onClick={() => scrollToRepresentations()}>
              <i className="fa fa-institution" aria-hidden="true"/>&nbsp;
              Request to view in Reading Room&nbsp;
              <span className="fa fa-chevron-circle-down" aria-hidden="true"/>
            </button> :
            <>
              <button className="qg-btn btn-default disabled"
                      onClick={() => scrollToRepresentations()}>
                <i className="fa fa-institution" aria-hidden="true"/>&nbsp;
                Request to view in Reading Room&nbsp;
                <span className="fa fa-chevron-circle-down" aria-hidden="true"/>
              </button>
              <div>
                <small className="text-muted">Log in to access your
                  cart</small>
              </div>
            </>
        )}
      </AppContext.Consumer>
    );
  }

  const itemIdToRequest = requestableRepresentations[0].id;

  return <AddToReadingRoomRequestCartButton itemId={itemIdToRequest} />;
};

const ItemPage: React.FC<PageRoute> = (route: PageRoute) => {
  const [item, setCurrentItem] = useState<any | null>(null);
  const [showAccordions, setShowAccordions] = useState(true);
  const [notFoundRedirect, setNotFoundRedirect] = useState(false);
  const qsaId: string = route.match.params.qsaId;

  if (!item) {
    Http.get()
      .fetchByQSAID(qsaId, 'archival_object')
      .then((json: any) => {
        if (json) {
          setCurrentItem(new RecordDisplay(json));
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
    if (item) {
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
  }, [item]);

  if (notFoundRedirect) {
    return <Redirect to="/404" push={true} />;
  } else if (!item) {
    return <Layout skipFooter={true} />;
  } else {
    route.setPageTitle(`Item: ${item.get('title') || item.get('display_string')}`);
    route.triggerPageViewTracker();

    return (
      <Layout aside={<RecordContext qsaId={qsaId} recordType="archival_object" />}>
        <div className="row">
          <div className="col-sm-12">
            <h1>
              {item.get('title') || item.get('display_string')}
              <div>
                <div className="badge">
                  <small>
                    <strong>
                      <i className={iconForType('archival_object')} aria-hidden="true" />
                      &nbsp;{labelForType('archival_object')}
                    </strong>
                  </small>
                </div>
              </div>
            </h1>

            <RequestActions item={item} route={route} />
     
            <section className="core-information">
              <h2 className="sr-only">Basic information</h2>
              <ul className="list-group list-group-horizontal-md">
                <li className="list-group-item">
                  <span className="small">ID</span>
                  <br />
                  {item.get('qsa_id_prefixed')}
                </li>
                <CoreInformationDateDisplay date={item.getArray('dates')[0]} />
              </ul>

              {item.getFirst('dates', (date: any) => {
                return date.date_notes && <p className="footer small">Date notes: {date.date_notes}</p>;
              })}

              <h3 className="sr-only">Item descriptive metadata</h3>

              <ul className="list-group list-group-flush">

              {item.getMaybe('rap_applied', (rap: any) => {
                  return (
                    <li className="list-group-item list-group-item-action">
                      <div className="d-flex w-100 justify-content-between">
                        <h4 className="mb-1">Access Status Summary <a href="/pages/restricted-access" rel="noopener noreferrer" target="_blank" aria-label="Information about restricted access"><i className="fa fa-question-circle" title="Information about restricted access" /></a></h4>
                      </div>
                      <div className="mb-1">
                        {
                          item.get('rap_access_status') === 'Open Access' ?
                            <div className="text-success">Open</div> :
                            <>
                              <div className="text-danger">Restricted</div>
                              <div>
                                {!item.get('rap_expiration').expires && "No expiry"}
                                {item.get('rap_expiration').expires &&
                                  <>
                                    {item.get('rap_expiration').expired ? "Expired: " : "Expires: "}
                                    {rewriteISODates(item.get('rap_expiration').expiry_date)}
                                  </>
                                }
                              </div>
                            </>
                        }
                      </div>
                    </li>
                  );
                })}

                {
                  item.getArray('previous_system_ids').length > 0 &&
                    <li className="list-group-item list-group-item-action">
                      <div className="d-flex w-100 justify-content-between">
                        <h4 className="mb-1">Previous System Identifiers</h4>
                      </div>
                      <p className="mb-1">{item.getArray('previous_system_ids').join('; ')}</p>
                    </li>
                }

                {item.getMaybe('agency_assigned_id', (value: any) => {
                  return (
                    <li className="list-group-item list-group-item-action">
                      <div className="d-flex w-100 justify-content-between">
                        <h4 className="mb-1">Agency Control Number</h4>
                      </div>
                      <p className="mb-1">{value}</p>
                    </li>
                  );
                })}
                {item.getMaybe('description', (value: any) => {
                  return (
                      <li className="list-group-item list-group-item-action">
                        <div className="d-flex w-100 justify-content-between">
                          <h4 className="mb-1">Description</h4>
                        </div>
                        <p className="mb-1">{value}</p>
                      </li>
                  );
                })}
                {
                  item.getArray('subjects').length > 0 &&
                  <li className="list-group-item list-group-item-action">
                    <div className="d-flex w-100 justify-content-between">
                      <h4 className="mb-1">Subjects</h4>
                    </div>
                    <p className="mb-1">{item.getArray('subjects').join('; ')}</p>
                  </li>
                }
                {item.getMaybe('sensitivity_label', (value: any) => {
                  return (
                      <li className="list-group-item list-group-item-action">
                        <div className="d-flex w-100 justify-content-between">
                          <h4 className="mb-1">Sensitivity Statement</h4>
                        </div>
                        <p className="mb-1">{value}</p>
                      </li>
                  );
                })}
                {item.getMaybe('copyright_status', (value: any) => {
                  return (
                      <li className="list-group-item list-group-item-action">
                        <div className="d-flex w-100 justify-content-between">
                          <h4 className="mb-1">Copyright Status</h4>
                        </div>
                        <p className="mb-1">{value}</p>
                      </li>
                  );
                })}
              </ul>
            </section>
            <Tagger recordId={item.get('id')} context={route.context}/>
            {
              showAccordions &&
              <section className="qg-accordion qg-dark-accordion" aria-label="Item Details">
                <h2 id="accordion">Item details</h2>

                {/*<input type="radio" name="control" id="collapse" className="controls collapse" value="collapse" role="radio"/>*/}
                {/*<label htmlFor="collapse" className="controls">Collapse details</label>*/}
                {/*<span className="controls">&#124;</span>*/}
                {/*<input type="radio" name="control" id="expand" className="controls expand" value="expand" role="radio"/>*/}
                {/*<label htmlFor="expand" className="controls">Show details</label>*/}
                {item.getExternalDocuments(['Helpful Resources'], (docs: any) => (
                    <AccordionPanel
                        id={item.generateId()}
                        title="Helpful Resources"
                        children={docs.map((doc: any, idx: number) => (
                            <div><MaybeLink location={doc.location} label={doc.location} key={idx} /></div>
                        ))}
                    />
                ))}
              {item.getNotes('odd', 'Remarks', (notes: Note[]) => (
                    <AccordionPanel
                        id={item.generateId()}
                        title="Remarks"
                        children={notes.map((note: Note, idx: number) => (
                            <NoteDisplay key={idx} note={note} />
                        ))}
                    />
                ))}
                {item.getNotes('remarks', null, (notes: Note[]) => (
                    <AccordionPanel
                        id={item.generateId()}
                        title="Remarks"
                        children={notes.map((note: Note, idx: number) => (
                            <NoteDisplay key={idx} note={note} />
                        ))}
                    />
                ))}
                {item.getNotes('prefercite', null, (notes: Note[]) => (
                    <AccordionPanel
                        id={item.generateId()}
                        title="Citation"
                        children={notes.map((note: Note, idx: number) => (
                            <NoteDisplay key={idx} note={note} />
                        ))}
                    />
                ))}

                {item.getArray('physical_representations').length > 0 && (
                    <AccordionPanel
                        id={item.generateId()}
                        anchor="physical_representations"
                        title="Physical representations"
                        children={
                          <ul className="list-group list-group-flush">
                            {item.getArray('physical_representations').map((representation: any) => (
                                <li key={representation.qsa_id} className="list-group-item">
                                  <PhysicalRepresentation representation={representation} item={item} context={route.context} />
                                </li>
                            ))}
                          </ul>
                        }
                    />
                )}

                {item.getArray('digital_representations').length > 0 && (
                    <AccordionPanel
                        id={item.generateId()}
                        anchor="digital_representations"
                        title="Digital representations"
                        children={
                          <ul className="list-group list-group-flush">
                            {item.getArray('digital_representations').map((representation: any) => (
                                <li key={representation.qsa_id} className="list-group-item">
                                  <DigitalRepresentation representation={representation} item={item} context={route.context} triggerDownloadTracker={route.triggerDownloadTracker} />
                                </li>
                            ))}
                          </ul>
                        }
                    />
                )}
              </section>
            }

            {item.getArray('agent_relationships').length > 0 && (
              <section>
                <h2>Relationships</h2>

                {item.getArray('agent_relationships').length > 0 && <h3>Related agencies</h3>}
                <ul className="list-group list-group-flush">
                  {item.getArray('agent_relationships').map((rlshp: any, idx: number) => {
                    return (
                      <li key={idx} className="list-group-item">
                        {<Relationship relationship={rlshp} />}
                      </li>
                    );
                  })}
                </ul>

                {item.getArray('item_relationships').length > 0 && <h3>Related items</h3>}
                <ul className="list-group list-group-flush">
                  {item.getArray('item_relationships').map((rlshp: any, idx: number) => {
                    return (
                        <li key={idx} className="list-group-item">
                          {<Relationship relationship={rlshp} />}
                        </li>
                    );
                  })}
                </ul>
              </section>
            )}

          </div>
        </div>
      </Layout>
    );
  }
};

export default ItemPage;
