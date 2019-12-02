require 'json'
require 'date'

class AdvancedSearchQuery
  attr_reader :query_string, :filter_start_date,
              :filters,
              :filter_end_date, :filter_types

  attr_accessor :filter_open_records_only, :filter_linked_digital_objects_only

  # These fields will be rewritten into queries that target multiple underlying Solr fields with specified weights
  EXPANDED_FIELDS = {
    'keywords' => [
      {'field' => 'keywords', 'weight' => 2},
      {'field' => 'keywords_stemmed', 'weight' => 1},
    ],
    'title' => [
      {'field' => 'title', 'weight' => 2},
      {'field' => 'title_stemmed', 'weight' => 1},
    ]
  }


  # space and double quote are also meaningful, but let those through for now
  SOLR_CHARS = '+-&|!(){}[]^~*?:\\/'

  def self.parse(json)
    new(JSON.parse(json))
  end

  def initialize(query)
    @query_string = parse_query(query)

    @filters = query['filters']

    @filter_start_date = to_solr_start_date(query['filter_start_date']) || '0000-01-01T00:00:00Z'
    @filter_end_date = to_solr_end_date(query['filter_end_date']) || '9999-12-31T23:59:59Z'

    @filter_types = query['filter_types']
    @filter_open_records_only = !!query['filter_open_records_only']
    @filter_linked_digital_objects_only = !!query['filter_linked_digital_objects_only']
  end

  private

  def to_solr_start_date(s)
    return if s.nil?

    date = DateParse.date_parse_down(s)

    return if date.nil?

    "#{date.iso8601}T00:00:00Z"
  end

  def to_solr_end_date(s)
    return if s.nil?

    date = DateParse.date_parse_up(s)

    return if date.nil?

    "#{date.iso8601}T23:59:59Z"
  end

  def solr_escape(s)
    pattern = Regexp.quote(SOLR_CHARS)
    s.gsub(/([#{pattern}])/, '\\\\\1')
  end

  def combine_left_associative(clauses)
    if clauses.length < 3
      clauses.join(' ')
    else
      first_group = clauses.take(3).join(' ')
      remaining_groups = clauses.drop(3)

      remaining_groups.each_slice(2).reduce(first_group) do |result, (operator, clause)|
        "(%s) %s %s" % [result, operator, clause]
      end
    end
  end

  def parse_query(query)
    query['clauses'] = Array(query['clauses']).reject {|clause| clause['query'].to_s.empty?}

    if query['clauses'].empty?
      # No query/queries given
      return ''
    end

    clauses = query['clauses'].each_with_index.map {|clause, idx|
      operator = clause.fetch('operator')
      negated = false

      if operator == 'NOT'
        # NOT isn't really a boolean operator--really means AND NOT.  We're not
        # judging.
        operator = 'AND'
        negated = true
      end

      target_field = clause.fetch('field')
      [
        # combining operator if we're not on the first clause
        "%s (%s)" % [
          (idx == 0) ? '' : operator,
          EXPANDED_FIELDS.fetch(target_field, [{'field' => target_field, 'weight' => 1}]).map {|fieldspec|
            "%s%s:(%s)^%d" % [
              negated ? '-' : '',
              fieldspec.fetch('field'),
              solr_escape(clause.fetch('query')),
              fieldspec.fetch('weight'),
            ]
          }.join(' OR ')
        ]
      ]
    }.flatten.reject(&:empty?)

    combine_left_associative(clauses)
  end

  def self.endpoint_doc
    sample_doc = <<EOS
     {
         "filter_start_date": "2000-01-01",
         "filter_end_date": "2016-06-01",
         "filter_types": ["resource", "archival_object", "agent_corporate_entity"],
         "filter_open_records_only": false,
         "filter_linked_digital_objects_only": true,
         "clauses": [
             {
                 "field": "keywords",
                 "operator": "",
                 "query": "record"
             },
             {
                 "field": "keywords",
                 "operator": "OR",
                 "query": "pears cherries \\"kiwi fruits\\""
             },
             {
                 "field": "qsa_id",
                 "operator": "AND",
                 "query": "S123"
             },
             {
                 "field": "previous_system_ids",
                 "operator": "NOT",
                 "query": "ZZZ999"
             }
         ]
     }
EOS

    {:sample_query => JSON.parse(sample_doc.strip)}
  end

end
