Dir.chdir(File.dirname(__FILE__))
$LOAD_PATH << Dir.pwd

Dir.glob('../distlibs/gems/gems/bundler-*/lib').each do |bundler_dir|
  # Force the version of bundler we explicitly installed!
  $LOAD_PATH.unshift(bundler_dir)
end

require 'bundler/setup'
Bundler.require

require 'rjack-slf4j'

$LOG = RJack::SLF4J["qsa.public"]

RJack::Logback.configure do
  console = RJack::Logback::ConsoleAppender.new do |a|
    a.target = "System.err"
    a.layout = RJack::Logback::PatternLayout.new do |p|
      p.pattern = "%date [%thread] %-5level %logger{35} - %msg %ex%n"
    end
  end
  RJack::Logback.root.add_appender( console )
  RJack::Logback.root.level = RJack::Logback::INFO
end

require 'savon'

require 'securerandom'
require 'fileutils'
require 'net/http'
require 'digest/sha1'
require 'mime/types'

require 'util/utils'
require 'common/bootstrap'

require 'storage/db_connection'
require 'storage/db'

require 'lib/endpoint'
require 'lib/ctx'
require 'lib/watch_dir_reloader'
require 'lib/solr_indexer'
require 'lib/advanced_search_query'
require 'lib/search'
require 'lib/date_parse'
require 'lib/recaptcha'
require 'lib/rack/qsa_public_logger'

require 'lib/byte_storage'
require 'lib/file_storage'
require 'lib/s3_authenticated_storage'

require 'lib/templates'
require 'views/templates'

require 'lib/oai/oai_provider'

require 'models/dto'
require 'models/user_form_dto'
require 'models/user_dto'
require 'models/paged_results'
require 'models/cart_item_dto'
require 'models/minicart'
require 'models/tag_dto'

require 'storage/stale_record_exception'
require 'storage/base_storage'
require 'storage/users'
require 'storage/sessions'
require 'storage/db_auth'
require 'storage/carts'
require 'storage/requests'
require 'storage/tags'
require 'storage/deferred_tasks'
require 'storage/pages'
require 'storage/saved_searches'

require 'storage/rate_limiter'

require 'endpoints'


class QSAPublic < Sinatra::Base

  configure :development do |config|
    register Sinatra::Reloader
    config.also_reload File.join('**', '*.rb')
  end

  use Rack::Session::Cookie, :key => 'qsa_public.session',
      :path => '/',
      :secret => AppConfig[:session_secret]

  configure do
    # Write our frontend config

    target = if QSAPublic.development?
      File.join(File.dirname(__FILE__), '..', 'qsa-public-spa', 'public', 'AppConfig.js')
    else
      File.join(File.dirname(__FILE__), '..', 'static', 'AppConfig.js')
    end

    exported_properties = [:minicart_base_url,
                           :minicart_css_url,
                           :minicart_contents_url,
                           :minicart_script_url,
                           :recaptcha_url,
                           :recaptcha_params,
                           :recaptcha_site_key].map {|prop| [prop.to_s, AppConfig[prop]]}.to_h

    if AppConfig.has_key?(:google_analytics_tracking_id)
      exported_properties['google_analytics_tracking_id'] = AppConfig[:google_analytics_tracking_id]
    end

    File.open(target, 'w') do |fh|
      fh.write("// AUTO-GENERATED: Do not edit!\n")
      fh.write("window.AppConfig = ")
      fh.write(exported_properties.to_json)
      fh.write(";\n")
    end
  end



  # Add CORS headers
  class CORSHeaders
    def initialize(app)
      @app = app
    end

    def call(env)
      headers = {}
      headers['Access-Control-Allow-Origin'] = '*'
      headers['Access-Control-Allow-Methods'] = '*'
      headers['Access-Control-Allow-Headers'] = '*'

      if env['REQUEST_METHOD'] == 'OPTIONS'
        return [200, headers, []]
      end

      (status, response_headers, body) = @app.call(env)

      [status, headers.merge(response_headers), body]
    end
  end

  if QSAPublic.development?
    use CORSHeaders
  end


  configure do
    $LOG.info("Starting application in #{QSAPublic.environment} mode")
  end

  configure do
    use Rack::QSAPublicLogger, $LOG
  end


  configure do
    Sequel.database_timezone = :utc
    Sequel.typecast_timezone = :utc

    set :show_exceptions, false

    DB.connect

    SolrIndexer.start

    Carts.start_periodic_tasks!
  end

  error do
    $LOG.info("*** Caught unexpected exception: #{$!}")
    $LOG.info($@.join("\n"))
    $LOG.info("=" * 80)
    return [500, {}, {"SERVER_ERROR" => {type: $!.class.to_s, message: $!.to_s}}.to_json]
  end

  private

  def json_response(hash)
    content_type :json
    hash.to_json
  end

end
