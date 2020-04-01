import React, { useState } from 'react';
import { Link, Redirect } from 'react-router-dom';
import Layout from './Layout';
import AspaceAdvancedSearch from '../advancedSearch/AdvancedSearch';
import { AdvancedSearchQuery, Filter } from '../models/AdvancedSearch';
import { Http } from '../utils/http';
import { iconForType, labelForType, uriFor } from '../utils/typeResolver';
import queryString from 'query-string';
import { PageRoute } from '../models/PageRoute';
import {preserveNewLines, rewriteISODates} from "../utils/rendering";
import { DateRangePicker } from './DateRangePicker';


const FACET_LABELS: { [name: string]: string } = {
  mandate_id: 'Mandates',
  function_id: 'Functions',
  parent_id: 'Parent Record',
  resource_id: 'Series',
  creating_agency_id: 'Creating Agency',
  responsible_agency_id: 'Responsible Agency',
  tags_string: 'Tags',
  open_record: 'Access Status',
  formats: 'Format',
};

const ResultsPage: React.FC<PageRoute> = (route: PageRoute) => {
  const [searchResults, setSearchResults] = useState<any | null>(null);
  const [advancedSearchQuery] = useState<AdvancedSearchQuery>(
    AdvancedSearchQuery.fromQueryString(route.location.search)
  );
  const [showCompact, setShowCompact] = useState<boolean>(false);

  const currentPage = Number(queryString.parse(route.location.search).page || 0);

  if (!searchResults) {
    Http.get()
      .fetchResults(advancedSearchQuery, currentPage, advancedSearchQuery.getSort())
      .then((results: any) => {
        setSearchResults(results);
        setShowCompact(true);
      });

    return <Layout skipFooter={true} />;
  } else {
    const stickyFilters = advancedSearchQuery.filters().filter((f: Filter) => f.isSticky);
    const limitedTo = stickyFilters.map((f: Filter, idx: number) => (
      <p key={idx}>
        <small>
          Limited to {FACET_LABELS[f.field]}: {f.label}
        </small>
      </p>
    ));

    return (
      <Layout
        skipFooter={!searchResults}
        aside={searchResults.results.length > 0 && <SearchFacets facets={searchResults.facets} advancedSearchQuery={advancedSearchQuery} />}
      >
        <h1>ArchivesSearch</h1>

        {showCompact ? (
          <CompactSearchSummary
            advancedSearchQuery={advancedSearchQuery}
            limitedTo={limitedTo}
            modifySearch={() => {
              setShowCompact(false);
            }}
          />
        ) : (
          <div className="qg-call-out-box">
            <AspaceAdvancedSearch advancedSearchQuery={advancedSearchQuery} limitedTo={limitedTo} />
          </div>
        )}
        {searchResults && (
          <SearchResults
            searchResults={searchResults}
            currentPage={currentPage}
            advancedSearchQuery={advancedSearchQuery}
            context={route.context}
          />
        )}
      </Layout>
    );
  }
};

export const CompactSearchSummary: React.FC<{
  advancedSearchQuery: AdvancedSearchQuery;
  limitedTo: JSX.Element[];
  modifySearch: () => void;
  summaryOnly?: boolean;
}> = props => {
  const buildAccessLabel = () => {
    const [openOnly, hasDigitalObjects] = [
      props.advancedSearchQuery.isOpenRecordsOnly(),
      props.advancedSearchQuery.hasDigitalObjects()
    ];

    if (openOnly && hasDigitalObjects) {
      return 'open records with digital objects';
    } else if (openOnly) {
      return 'open records';
    } else if (hasDigitalObjects) {
      return 'records with digital objects';
    } else {
      return 'records';
    }
  };

  const buildQuerySummary = () => {
    const clauseSummary: string[] = [];

    props.advancedSearchQuery.getClauses().forEach((clause, idx) => {
      if (clause.target_field && clause.query && clause.boolean_operator) {
        if (idx > 0) {
          clauseSummary.push(clause.boolean_operator);
        }
        clauseSummary.push(`${clause.target_field}:${clause.query}`);
      }
    });

    if (clauseSummary.length === 0) {
      const accessLabel = buildAccessLabel();
      return (
        <>
          <span key={accessLabel}> Showing all {accessLabel}</span>
          {props.limitedTo}
        </>
      );
    } else {
      const queryString = clauseSummary.join(' ');
      return (
        <>
          <span>
            {' '}
            Searching for {buildAccessLabel()} matching <strong>{queryString}</strong>
          </span>
          {props.limitedTo}
        </>
      );
    }
  };

  const buildTypeSummary = () => {
    const limits = props.advancedSearchQuery.getTypeLimits();
    if (limits.length > 0) {
      const labels = limits.map(labelForType);

      let labelString = '';
      if (labels.length > 1) {
        labelString = labels.slice(0, labels.length - 1).join(', ') + ' or ' + labels[labels.length - 1];
      } else {
        labelString = labels[0];
      }

      return (
        <span key={labelString}>
          {' '}
          of type <strong>{labelString}</strong>
        </span>
      );
    }
  };

  const buildDateSummary = () => {
    const [fromDate, toDate] = [props.advancedSearchQuery.getFromDate(), props.advancedSearchQuery.getToDate()];

    if (fromDate && toDate) {
      return (
        <span>
          {' '}
          between dates <strong>{fromDate}</strong> &mdash; <strong>{toDate}</strong>
        </span>
      );
    } else if (fromDate) {
      return (
        <span>
          {' '}
          after date <strong>{fromDate}</strong>
        </span>
      );
    } else if (toDate) {
      return (
        <span>
          {' '}
          before date <strong>{toDate}</strong>
        </span>
      );
    } else {
      return null;
    }
  };

  let clauses = [buildQuerySummary(), buildTypeSummary(), buildDateSummary()].filter(elt => elt);

  if (clauses.length > 2) {
    clauses = clauses.map((clause, idx) =>
      idx > 0 ? <div key={idx} className="query-subclause">{clause}</div> : <div key={idx}>{clause}</div>
    );
  } else {
    clauses = clauses.map((clause, idx) => (<span key={idx}>{clause}</span>));
  }

  if (props.summaryOnly) {
    return <>
      {clauses}
    </>
  }

  return (
    <div className="qg-call-out-box">
      {clauses}
      <div>
        <button onClick={() => props.modifySearch()} className="qg-btn btn-primary btn-xs">
          Modify search
        </button>
      </div>
    </div>
  );
};

const rewriteFacetLabel = (label: string, facet: string): string => {
  if (facet === 'open_record') {
    if (label === 'true') {
      return 'Open';
    } else {
      return 'Restricted';
    }
  }

  return rewriteISODates(label);
}

const SearchFacets: React.FC<{
  facets: any;
  advancedSearchQuery: AdvancedSearchQuery;
}> = props => {
  const [expandedFields, setExpandedFields]: [any, any] = useState([]);
  const [fireNewSearch, setFireNewSearch]: [any, any] = useState(null);

  const expand = (field: string) => {
    const newExpandedFields = expandedFields.slice(0);
    newExpandedFields.push(field);
    setExpandedFields(newExpandedFields);
  };

  const hasFacets = (): boolean => {
    for (const facets of Object.values(props.facets)) {
      if ((facets as any[]).length > 0) {
        return true;
      }
    }

    return false;
  }

  const isExpanded = (field: string) => {
    return expandedFields.indexOf(field) >= 0;
  };

  if (fireNewSearch) {
    return <Redirect to={'/search?' + fireNewSearch.toQueryString()} />;
  }

  return (
    <section className="search-filters">
      {hasFacets() &&
        <>
          <h2>Results facets</h2>
          {props.advancedSearchQuery.filters().length > 0 && (
            <section className="active-filters">
              <h3>Active filters</h3>
              <ul>
                {props.advancedSearchQuery.filters().map((filter: Filter) => {
                  return (
                    <li key={filter.field}>
                      <div className="facet-label">
                        {FACET_LABELS[filter.field]}: {rewriteFacetLabel(filter.label, filter.field)}&nbsp;
                      </div>
                      <div className="facet-count">
                        <Link
                          className="qg-btn btn-link facet-remove-btn"
                          aria-label="Remove this filter"
                          title="Remove this filter"
                          to={{
                            pathname: '/search',
                            search: props.advancedSearchQuery.removeFilter(filter).toQueryString()
                          }}
                        >
                          <i className="fa fa-minus-circle" aria-hidden={true} />
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          {Object.keys(props.facets).map((field: string) => {
            const facets = props.facets[field];
            if (facets.length === 0) {
              return <React.Fragment key={field}></React.Fragment>
            }

            return (
              <section className="available-filters" key={field}>
                <h3>{FACET_LABELS[field]}</h3>
                <ul>
                  {
                    facets
                      .filter((facet: any, idx: number) => {
                        return isExpanded(facet.facet_field) ? true : idx < 5;
                      })
                      .map((facet: any) => {
                        if (props.advancedSearchQuery.hasFilter(facet.facet_field, facet.facet_value)) {
                          return (
                            <li key={facet.facet_field + '_' + facet.facet_label}>
                              <div className="facet-label">{rewriteFacetLabel(facet.facet_label, facet.facet_field)}</div>
                              <div className="facet-count">{facet.facet_count}</div>
                            </li>
                          );
                        } else {
                          return (
                            <li key={facet.facet_field + '_' + facet.facet_label}>
                              <div className="facet-label">
                                <Link
                                  to={{
                                    pathname: '/search',
                                    search: props.advancedSearchQuery
                                                 .addFilter(facet.facet_field, facet.facet_value, facet.facet_label)
                                                 .toQueryString()
                                  }}
                                >
                                  {rewriteFacetLabel(facet.facet_label, facet.facet_field)}
                                </Link>
                              </div>
                              <div className="facet-count">{facet.facet_count}</div>
                            </li>
                          );
                        }
                      }
                      )
                  }
                  {
                    !isExpanded(field) && facets.length > 5 &&
                      <li key={field + '_more'}>
                        <button className="qg-btn btn-link btn-xs"
                                onClick={(e) => expand(field)}>
                          <i aria-hidden="true" className="fa fa-plus"/>&nbsp;
                    Show {facets.length - 5} more...
                        </button>
                      </li>
                  }
                </ul>
              </section>
            );
          })}
        </>}

      <h2>Limit by date</h2>
      <DateRangePicker
        minYear={1800}
        maxYear={new Date().getFullYear()}
        minSelected={props.advancedSearchQuery.getFromDateYear()}
        maxSelected={props.advancedSearchQuery.getToDateYear()}
        onRangeUpdated={(min: number, max: number) => {
          setFireNewSearch(props.advancedSearchQuery
                                .setFromDate('' + min)
                                .setToDate('' + max));
        }}
      />

    </section>
  );
};

const SearchResult: React.FC<{ searchResult: any }> = props => {
  const formatRepresentationCounts = (): any => {
    if (props.searchResult.digital_representation_count > 0 || props.searchResult.physical_representation_count > 0) {
      return (
        <div>
          <small>
            Format:&nbsp;
            {[
              props.searchResult.physical_representation_count > 0 &&
                props.searchResult.physical_representation_count + ' Physical representation(s)',
              props.searchResult.digital_representation_count > 0 &&
                props.searchResult.digital_representation_count + ' Digital representation(s)'
            ]
              .filter((e: string | false) => e)
              .join('; ')}
          </small>
        </div>
      );
    } else {
      return;
    }
  };

  return (
    <li className="list-group-item">
      <div className="d-flex w-100 justify-content-between">
        <h3>
          <Link to={uriFor(props.searchResult.qsa_id_prefixed, props.searchResult.primary_type)}>
            {rewriteISODates(props.searchResult.title)}
          </Link>
        </h3>
        <span className="badge">
          <i className={iconForType(props.searchResult.primary_type)} aria-hidden="true" />
          &nbsp;
          {labelForType(props.searchResult.primary_type)}&nbsp;&nbsp;
          {props.searchResult.qsa_id_prefixed}
        </span>
      </div>
      {props.searchResult.description && props.searchResult.primary_type !== 'resource' ?
      <p dangerouslySetInnerHTML={{__html: preserveNewLines(props.searchResult.description)}}/>
      :
      ""} 
      {props.searchResult.dates_display_string && (
        <div>
          <small>Dates: {rewriteISODates(props.searchResult.dates_display_string)}</small>
        </div>
      )}
      {props.searchResult.primary_type === 'archival_object' && formatRepresentationCounts()}
      <p>
        <Link
          to={uriFor(props.searchResult.qsa_id_prefixed, props.searchResult.primary_type)}
          className="qg-btn btn-primary btn-sm pull-right"
        >
          View {labelForType(props.searchResult.primary_type)}
        </Link>
      </p>
    </li>
  );
};

const SearchResults: React.FC<{
  searchResults: any;
  currentPage: number;
  advancedSearchQuery: AdvancedSearchQuery;
  context: any;
}> = props => {
  const pageUpper = Math.min(
    (props.searchResults.current_page + 1) * props.searchResults.page_size,
    props.searchResults.total_count
  );
  const pageLower = Math.min(pageUpper, props.searchResults.current_page * props.searchResults.page_size + 1);

  const [sort, setSort] = useState(props.advancedSearchQuery.getSort());

  const updateSort = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;

    if (sort !== newSort) {
      setSort(newSort);
    }
  };

  if (sort !== props.advancedSearchQuery.getSort()) {
    // Show results with the new sort order
    return <Redirect to={'/search?' + props.advancedSearchQuery.setSort(sort).toQueryString()} />;
  }

  if (props.searchResults.results.length === 0) {
    return <section className="qg-results">
      <SaveYourSearch query={props.advancedSearchQuery} context={props.context} />
      <h2>No results found</h2>

      <p>Your search did not match any results.</p>
    </section>;
  }

  const number_of_pages_to_show = 10;
  const first_page_to_show = Math.max(props.searchResults.current_page - number_of_pages_to_show / 2, 0);
  const last_page = Math.ceil(props.searchResults.total_count / props.searchResults.page_size) - 1;
  const last_page_to_show = Math.min(first_page_to_show + number_of_pages_to_show, last_page);

  return (
    <section className="qg-results">
      <SaveYourSearch query={props.advancedSearchQuery} context={props.context} />
      <h2>Your search results</h2>

      <div className="row">
        <div className="col-sm-12">
          <div className="pull-right">
            <small>
            <label htmlFor={"select-results-sort"}>Sort by&nbsp;</label>
              <select id="select-results-sort" onChange={ (e) => { updateSort(e) } } value={props.advancedSearchQuery.getSort()}>
                <option value="relevance">Relevance (default)</option>
                <option value="recent_desc">Recently opened</option>
                <option value="popular_desc">Most popular</option>
                <option value="title_asc">Title (A-Z)</option>
                <option value="date_desc">New records (newest to oldest)</option>
                <option value="date_asc">New records (oldest to newest)</option>
              </select>
            </small>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-sm-12">
          <div className="pull-right">
            <small>
              Showing {pageLower} - {pageUpper} of {props.searchResults.total_count} Results
            </small>
          </div>
        </div>
      </div>

      <ul className="list-group">
        {props.searchResults.results.length > 0 &&
          props.searchResults.results.map((result: any) => {
            return <SearchResult searchResult={result} key={result.id} />;
          })}
      </ul>

      <nav>
        <div className="text-center">
          <ul className="pagination">
            <li className={'page-item ' + (props.currentPage === 0 ? 'disabled' : '')}>
              <Link
                  to={'/search?' + props.advancedSearchQuery.toQueryString() + '&page=0'}
                  className="page-link"
              >First</Link>
            </li>
            {
              [...Array(number_of_pages_to_show)].map((e, i) => {
                const pageToShow = first_page_to_show + i;
                return pageToShow <= last_page_to_show &&
                  <li key={i} className={'page-item ' + (props.currentPage === pageToShow ? 'active' : '')}>
                    <Link
                        to={'/search?' + props.advancedSearchQuery.toQueryString() + '&page=' + pageToShow}
                        className="page-link"
                    >{pageToShow + 1}</Link>
                  </li>;
              })
            }
            <li className={'page-item ' + (props.currentPage >= last_page ? 'disabled' : '')}>
              <Link
                  to={'/search?' + props.advancedSearchQuery.toQueryString() + '&page=' + last_page}
                  className="page-link"
              >Last</Link>
            </li>
          </ul>
        </div>
      </nav>
    </section>
  );
};


const SaveYourSearch: React.FC<any> = props => {
  const [saved, setSaved] = useState(false);

  const saveSearch = () => {
    Http.get()
        .createSavedSearch(props.query.toQueryString())
        .then(() => {
          setSaved(true);
        });
  };

  if (!props.context || !props.context.user) {
    return <></>;
  }

  return(
    <div className="pull-right">
      {saved && <div className="text-success">Search saved to <Link to="/my-searches">My searches</Link>!</div>}
      {!saved && <button onClick={() => saveSearch()} className="qg-btn btn-secondary btn-xs">Save Search</button>}
    </div>
  )
}

export default ResultsPage;
