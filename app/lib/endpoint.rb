class Endpoint

  attr_reader :uri, :method, :valid_params

  def initialize(method, uri, opts)
    @method = method
    @uri = uri
    @valid_params = {'splat' => ParamDef.new(String, 'Rest of URL', {:optional => true})}
    @opts = opts
    @needs_session = opts.fetch(:needs_session, false)
  end

  def self.post(uri, opts = {}, &block)
    e = new(:post, uri, opts)
    register(e)
    block ? e.finish(&block) : e
  end

  def self.get(uri, opts = {}, &block)
    e = new(:get, uri, opts)
    register(e)
    block ? e.finish(&block) : e
  end

  def self.get_or_post(uri, opts = {}, &block)
    e = new(:get_or_post, uri, opts)
    register(e)
    block ? e.finish(&block) : e
  end


  ParamDef ||= Struct.new(:type, :description, :options)

  def needs_session?
    @needs_session
  end

  def param(name, type, description, opts = {}, &block)
    name = name.to_s
    raise "Can't name a parameter 'captures', sorry" if name == 'captures'

    @valid_params[name] = ParamDef.new(type, description, opts)
    block ? self.finish(&block) : self
  end

  def check_params(params)
    params.delete('captures')
    # Any parameters not in our list are not allowed
    params.each do |p, v|
      unless @valid_params[p]
        raise "Unrecognised parameter: #{p} for endpoint #{@method} #{@uri}"
      end
    end

    # Missing parameters are bad too
    @valid_params.select {|k, v| !v.options[:optional]}.each do |param, _|
      unless params[param]
        raise "Missing value for required parameter: #{param}"
      end
    end

    # Finally, apply our type checks
    params.keys.each do |param|
      type = @valid_params[param].type

      params[param] = if type.is_a?(Class) && Kernel.respond_to?(type.name.intern)
                        # Integer, String and friends
                        Kernel.send(type.name.intern, params[param])
                      elsif type.is_a?(Array)
                        if params[param] && !params[param].is_a?(Array)
                          raise "Parameter #{param} must be an array.  Please send as #{param}[]"
                        else
                          if type[0].is_a?(Class) && Kernel.respond_to?(type[0].name.intern)
                            Array(params[param]).map {|val| Kernel.send(type[0].name.intern, val)}
                          elsif type[0].included_modules.include?(DTO)
                            Array(params[param]).map {|val| type[0].from_json(val)}
                          else
                            Array(params[param]).map {|val| type[0].parse(val)}
                          end
                        end
                      elsif type.included_modules.include?(DTO)
                        type.from_json(params[param])
                      elsif type.respond_to?(:parse)
                        type.parse(params[param])
                      else
                        raise "Don't know how to deal with type #{type}"
                      end
    end
  end

  def finish(&block)
    opts = @opts
    endpoint = self

    methods = (@method == :get_or_post) ? [:get, :post] : [@method]

    # Delete any matching route from a previous reload
    if QSAPublic.development?
      QSAPublic.instance_eval do
        new_uri = compile(endpoint.uri)

        # NOTE: These arrays will be mutated, so we can't copy them here.
        method_routes = methods.map {|method|
          @routes.fetch(method.to_s.upcase, [])
        }

        routes_to_replace = method_routes.flatten(1).select do |route_def|
          uri = route_def[0]
          uri.safe_string == new_uri.safe_string
        end

        # Destructively modify the internal Sinatra array to knock out the
        # previous version of this route.
        method_routes.each do |routes|
          routes_to_replace.each do |victim|
            routes.delete(victim)
          end
        end
      end
    end

    methods.each do |method|
      QSAPublic.send(method, @uri) do
        in_time = Time.now
        begin
          endpoint.check_params(params)
        rescue
          $LOG.error($!.to_s)
          return [400, {}, $!.to_s]
        end

        # Within Sinatra's handle block, self is bound to the application instance
        # (which is what we want).
        #
        # However, the block passed in was created in the context of the
        # application class (not in the instance), which won't give us access to
        # things like ERB helper methods.
        #
        # So, use instance_eval to evaluate the block in the right context.
        app_instance = self

        Ctx.open({}, session) do
          if session_id = env['HTTP_X_ARCHIVESSEARCH_SESSION']
            begin
              Ctx.get.session = Sessions.get_session(session_id)
            rescue Sessions::SessionTimeout
              # Session expired due to inactivity
              app_instance.headers('X-ArchivesSearch-Session-Gone' => 'true')
            rescue Sessions::SessionNotFoundError
              # No such session
            end
          end

          if endpoint.needs_session? && Ctx.get.session.nil?
            return [403, {}, {"SERVER_ERROR" => {type: "Sessions::SessionNotFoundError", message: "A session is required to access this endpoint"}}.to_json]
          end

          response = app_instance.instance_eval(&block)

          app_instance.headers('Access-Control-Expose-Headers' => 'X-ArchivesSearch-Session-Gone')

          response
        end
      end
    end
  end

  # Capture registered endpoints so we can report on them
  # FIXME can drop once dev has settled
  def self.endpoints
    @endpoints
  end

  def self.register(e)
    @endpoints ||= {}
    @endpoints[e.method] ||= {}
    @endpoints[e.method][e.uri] ||= {}
    @endpoints[e.method][e.uri] = e
  end
end
