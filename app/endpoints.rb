class QSAPublic < Sinatra::Base

  Endpoint.get('/favicon.ico') do
    send_file File.absolute_path('favicon.ico')
  end

  Endpoint.get('/') do
    Templates.emit_with_layout(:home,
                               {},
                               :layout,
                               {
                                 title: "QSA Public"
                               })
  end

  Endpoint.get('/feed/series')
    .param(:sort, String, "Sort string", optional: true)
    .param(:page, Integer, "Page to return", optional: true) do
    json_response(Search.for_type('resource', params[:page] || 0, params[:sort] || 'relevance'))
  end

  Endpoint.get('/feed/series/:qsa_id_prefixed')
    .param(:qsa_id_prefixed, String, "Record QSA ID with prefix") do
    json_response(Search.get_record_by_qsa_id('resource', params[:qsa_id_prefixed]))
  end

  Endpoint.get('/feed/items')
    .param(:sort, String, "Sort string", optional: true)
    .param(:page, Integer, "Page to return", optional: true) do
    json_response(Search.for_type('archival_object', params[:page] || 0, params[:sort] || 'relevance'))
  end

  Endpoint.get('/feed/items/:qsa_id_prefixed')
    .param(:qsa_id_prefixed, String, "Record QSA ID with prefix") do
    json_response(Search.get_record_by_qsa_id('archival_object', params[:qsa_id_prefixed]))
  end

  Endpoint.get('/feed/agencies')
    .param(:sort, String, "Sort string", optional: true)
    .param(:page, Integer, "Page to return", optional: true) do
    json_response(Search.for_type('agent_corporate_entity', params[:page] || 0, params[:sort] || 'relevance'))
  end

  Endpoint.get('/feed/agencies/:qsa_id_prefixed')
    .param(:qsa_id_prefixed, String, "Record QSA ID with prefix") do
    json_response(Search.get_record_by_qsa_id('agent_corporate_entity', params[:qsa_id_prefixed]))
  end

  Endpoint.get('/feed/subjects')
    .param(:sort, String, "Sort string", optional: true)
    .param(:page, Integer, "Page to return", optional: true) do
    json_response(Search.for_type('subject', params[:page] || 0, params[:sort] || 'relevance'))
  end

  Endpoint.get('/feed/digital_representations')
    .param(:sort, String, "Sort string", optional: true)
    .param(:page, Integer, "Page to return", optional: true) do
    json_response(Search.for_type('digital_representation', params[:page] || 0, params[:sort] || 'relevance'))
  end

  Endpoint.get('/feed/digital_representations/:qsa_id_prefixed')
    .param(:qsa_id_prefixed, String, "Record QSA ID with prefix") do
    json_response(Search.get_record_by_qsa_id('digital_representation', params[:qsa_id_prefixed]))
  end

  Endpoint.get('/feed/physical_representations')
    .param(:sort, String, "Sort string", optional: true)
    .param(:page, Integer, "Page to return", optional: true) do
    json_response(Search.for_type('physical_representation', params[:page] || 0, params[:sort] || 'relevance'))
  end

  Endpoint.get('/feed/physical_representations/:qsa_id_prefixed')
    .param(:qsa_id_prefixed, String, "Record QSA ID with prefix") do
    json_response(Search.get_record_by_qsa_id('physical_representation', params[:qsa_id_prefixed]))
  end
end