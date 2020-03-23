import React, { useState } from 'react';
import { Redirect } from 'react-router';
import { Note } from '../models/RecordDisplay';
import { iconForType, labelForRelator, uriFor } from '../utils/typeResolver';
import { Link } from 'react-router-dom';
import { Http } from '../utils/http';
import { AdvancedSearchQuery } from '../models/AdvancedSearch';
import {rewriteISODates} from "../utils/rendering";

export const NoteDisplay: React.FC<{ note: Note }> = ({ note }) => {
  switch (note.kind) {
    case 'text':
      return (
        <div>
          {' '}
          {note.text.map((content: string, idx: number) => (
            <p key={idx}>{content}</p>
          ))}
        </div>
      );
    case 'orderedlist':
      return (
        <div>
          <p>{note.title}</p>
          <ol>
            {note.items.map((item: string, idx: number) => (
              <li key={idx}>{item}</li>
            ))}
          </ol>
        </div>
      );
    case 'definedlist':
      return (
        <div>
          <p>{note.title}</p>
          <dl>
            {note.items.map(({ label, value }, idx: number) => {
              return (
                <React.Fragment key={idx}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </React.Fragment>
              );
            })}
          </dl>
        </div>
      );
    case 'chronology':
      return (
        <div>
          <p>{note.title}</p>
          <dl>
            {note.items.map(({ event_date, events }, idx: number) => {
              return (
                <React.Fragment key={idx}>
                  <dt>{event_date}</dt>
                  {events.map((event: string) => {
                    return <dd>{event}</dd>;
                  })}
                </React.Fragment>
              );
            })}
          </dl>
        </div>
      );
  }
};

export const Relationship: React.FC<{ relationship: any }> = ({ relationship }) => {
  return (
    <>
      <i className={iconForType(relationship._resolved.jsonmodel_type)} aria-hidden="true" />
      &nbsp;
      {labelForRelator(relationship.relator)}:
      &nbsp;
      <Link to={uriFor(relationship._resolved.qsa_id_prefixed, relationship._resolved.jsonmodel_type)}>
        {relationship._resolved.display_string}
      </Link>
      <br />
      {rewriteISODates(relationship.start_date)}&nbsp; to &nbsp;{rewriteISODates(relationship.end_date)}
    </>
  );
};

export const AccordionPanel: React.FC<{
  id: string;
  anchor?: string;
  title: string;
  children: any;
}> = ({ id, anchor, title, children }) => {
  return (
    <article id={anchor}>
      <input
        id={id}
        type="checkbox"
        name="tabs"
        aria-controls={`${id}-content`}
      />
      <h3 className="acc-heading">
        <label htmlFor={id}>
          {title}{' '}
          <span className="arrow">
            {' '}
            <i />
          </span>
        </label>
      </h3>
      <div className="collapsing-section" aria-hidden="true" id={`${id}-content`}>
        {children}
      </div>
    </article>
  );
};

export const MaybeLink: React.FC<{ location: string; label: string }> = ({ location, label }) => {
  if (/^http/i.test(location)) {
    return (
      <a href={location} target="_blank" rel="noopener noreferrer">
      {label}
      </a>
    );
  } else if (/http/i.test(location)) {
    let address = `${location.match(/(?:www|https?)[^\s]*/)}`
    return <span>{location.split(address)[0]}<a href={address}>{address}</a>{location.split(address)[1]}</span>
  } else {
    if (label === location) {
      return <span>{location}</span>
    } else {
      return (
        <span>
          {label}: {location}
        </span>
      );
    };
  };
};

interface Context {
  current_uri: string;
  path_to_root: any[];
  siblings: any[];
  children: any[];
  siblings_count: number;
  children_count: number;
}

export const formatRecordDisplayString = (record: any): string => {
  return rewriteISODates(record.display_string || record.title);
};

const RecordContextSiblings: React.FC<{ context: Context }> = ({ context }) => {
  let siblingsQuery: AdvancedSearchQuery | null = null;
  let childrenQuery: AdvancedSearchQuery | null = null;

  if (context.siblings_count > context.siblings.length) {
    const parent: any = context.path_to_root[context.path_to_root.length - 1];
    siblingsQuery = AdvancedSearchQuery.emptyQuery().addStickyFilter('parent_id', parent.id, parent.display_string);
  }

  if (context.children_count > context.children.length) {
    const current: any = context.siblings.find((record: any) => record.uri === context.current_uri);
    childrenQuery = AdvancedSearchQuery.emptyQuery().addStickyFilter('parent_id', current.id, current.display_string);
  }

  return (
    <ul>
      {context.siblings[0].position && context.siblings[0].position > 0 ? <li>&hellip;</li> : <></>}
      {context.siblings.map((sibling: any) => {
        const isCurrent = context.current_uri === sibling.uri;

        return (
          <li key={sibling.id} className={isCurrent ? 'current' : ''}>
            {sibling.children_count > 0 ? (
              <span className="fa-stack" style={{ width: '1em', height: '1em', lineHeight: '1em' }}>
                <i className={'fa-stack-1x ' + iconForType(sibling.jsonmodel_type)} aria-hidden="true" />
                <i
                  className="fa fa-stack-1x fa-plus fa-inverse"
                  aria-hidden="true"
                  style={{ fontSize: '50%', marginTop: '2px' }}
                />
              </span>
            ) : (
              <i className={iconForType(sibling.jsonmodel_type)} aria-hidden="true" />
            )}
            &nbsp;
            {isCurrent ? (
              <span>{formatRecordDisplayString(sibling)}</span>
            ) : (
              <Link to={uriFor(sibling.qsa_id_prefixed, sibling.jsonmodel_type)}>{formatRecordDisplayString(sibling)}</Link>
            )}
            {isCurrent && context.children.length > 0 && (
              <ul>
                {context.children.map((child: any) => {
                  return (
                    <li key={child.id}>
                      {child.children_count > 0 ? (
                        <span
                          className="fa-stack"
                          style={{
                            width: '1em',
                            height: '1em',
                            lineHeight: '1em'
                          }}
                        >
                          <i className={'fa-stack-1x ' + iconForType(child.jsonmodel_type)} aria-hidden="true" />
                          <i
                            className="fa fa-stack-1x fa-plus fa-inverse"
                            aria-hidden="true"
                            style={{ fontSize: '50%', marginTop: '2px' }}
                          />
                        </span>
                      ) : (
                        <i className={iconForType(child.jsonmodel_type)} aria-hidden="true" />
                      )}
                      &nbsp;
                      <Link to={uriFor(child.qsa_id_prefixed, child.jsonmodel_type)}>{child.display_string}</Link>
                    </li>
                  );
                })}
                {childrenQuery && (
                  <li>
                    <Link
                      className="qg-btn btn-link btn-xs"
                      to={{
                        pathname: '/search',
                        search: childrenQuery.toQueryString()
                      }}
                    >
                      Browse all {context.children_count} child records
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </li>
        );
      })}
      {context.siblings[context.siblings.length - 1].position &&
      context.siblings[context.siblings.length - 1].position < context.siblings_count - 1 ? (
        <li>&hellip;</li>
      ) : (
        <></>
      )}
      {siblingsQuery && (
        <li>
          <Link
            className="qg-btn btn-link btn-xs"
            to={{
              pathname: '/search',
              search: siblingsQuery.toQueryString()
            }}
          >
            Browse all {context.siblings_count} sibling records
          </Link>
        </li>
      )}
    </ul>
  );
};

export const RecordContext: React.FC<{
  qsaId: string;
  recordType: string;
}> = ({ qsaId, recordType }) => {
  const [context, setContext] = useState<Context | null>(null);
  const [notFoundRedirect, setNotFoundRedirect] = useState(false);

  if (!context) {
    Http.get()
      .fetchContextByQSAID(qsaId, recordType)
      .then((json: any) => {
        setContext(json);
      })
      .catch((exception: Error) => {
        console.error(exception);
        setNotFoundRedirect(true);
      });
  }

  if (notFoundRedirect) {
    return <Redirect to="/404" push={true} />;
  } else if (!context) {
    return <></>;
  } else {
    const series: any = context.path_to_root.length > 0 ? context.path_to_root[0] : context.siblings[0];
    const seriesQuery = AdvancedSearchQuery.emptyQuery().addStickyFilter(
      'resource_id',
      series.id,
      series.display_string
    );

    return (
      <div className="record-context">
        <h2>Record Context</h2>

        {context.path_to_root.length === 0 ? (
          <RecordContextSiblings context={context} />
        ) : (
          context.path_to_root.reduce(
            (nested_lists, next_ancestor) => (
              <ul>
                <li key={next_ancestor.id}>
                  <i className={iconForType(next_ancestor.jsonmodel_type)} aria-hidden="true" />
                  &nbsp;
                  <Link to={uriFor(next_ancestor.qsa_id_prefixed, next_ancestor.jsonmodel_type)}>
                    {next_ancestor.title}
                  </Link>
                  {nested_lists}
                </li>
              </ul>
            ),
            <RecordContextSiblings context={context} />
          )
        )}
        {
          <p>
            <Link
              className="qg-btn btn-primary btn-xs"
              to={{
                pathname: '/search',
                search: seriesQuery.toQueryString()
              }}
            >
              Browse all items in series
            </Link>
          </p>
        }
      </div>
    );
  }
};

export const CoreInformationDateDisplay: React.FC<{date: any}> = ({ date }) => {
  return (
      <>
        <li className="list-group-item">
          <span className="small">START DATE</span>
          <br />
          {
            (function() {
              if (date && date.begin) {
                return `${rewriteISODates(date.begin)}` + (date.certainty ? ` (${date.certainty})` : '');
              } else {
                return '-';
              }
            })()
          }
        </li>
        <li className="list-group-item">
          <span className="small">END DATE</span>
          <br />
          {
            (function() {
              if (date && date.end) {
                return `${rewriteISODates(date.end)}` + (date.certainty_end ? ` (${date.certainty_end})` : '');
              } else {
                return '-';
              }
            })()
          }
        </li>
      </>
  );
}
