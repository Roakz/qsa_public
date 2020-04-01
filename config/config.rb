# create database qsa_public character set UTF8mb4 collate utf8mb4_bin;
# grant all on qsa_public.* to 'qsa'@'localhost' identified by 'qsa123';

# AppConfig[:db_url] = "jdbc:mysql://localhost:3306/qsa_public?useUnicode=true&characterEncoding=UTF-8&user=qsa&password=qsa123&serverTimezone=UTC"

# AppConfig[:session_secret] = "randomly_generated_token"

AppConfig[:indexer_interval_seconds] = 5
AppConfig[:solr_url] = "http://localhost:9384/solr/qsapublic/"
AppConfig[:solr_indexer_state_file] = File.join(File.dirname(__FILE__), "..", "data/solr_indexer_state.dat")
AppConfig[:page_size] = 10

# As a long term average you can try one login every 10 seconds
AppConfig[:dbauth_seconds_per_login] = 10

# But you can try 10 in quick succession before we start limiting
AppConfig[:dbauth_max_login_burst] = 10

AppConfig[:oai_repository_url] = 'http://dishevelled.net:3333/oai'
AppConfig[:qsa_public_base_url] = 'http://localhost:3009'
AppConfig[:oai_repository_name] = 'Queensland State Archives'
AppConfig[:oai_contact_email] = 'mark@dishevelled.net'
AppConfig[:oai_repository_identifier] = 'archives.qld.gov.au'
AppConfig[:oai_sample_identifier] = proc {
  ['oai', AppConfig[:oai_repository_identifier], '/repositories/2/resources/1'].join(':')
}


# FIXME: Disable this in production
AppConfig[:enable_debug_cart_endpoint] = true

AppConfig[:page_content_cache_seconds] = 30

AppConfig[:session_expire_after_seconds] = 3600

begin
  load File.join(File.dirname(__FILE__), "/config.local.rb")
rescue LoadError
end
