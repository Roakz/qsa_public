class Sessions < BaseStorage

  class SessionNotFoundError < StandardError
  end

  class SessionTimeout < StandardError
  end

  class Session
    attr_reader :id, :user_id, :create_time, :data

    def initialize(id, user_id, create_time, data)
      @id = id
      @user_id = user_id
      @create_time = create_time
      @data = data

      @dirty = false
    end

    def [](key)
      self.data[key.to_s]
    end

    def []=(key, value)
      self.data[key.to_s] = value
      @dirty = true
    end

    def dirty?
      @dirty
    end
  end


  # Returns session ID
  def self.create_session(user_id)
    session_id = SecureRandom.hex
    db[:session].insert(:session_id => session_id,
                        :user_id => user_id,
                        :create_time => java.lang.System.currentTimeMillis,
                        :last_used_time => java.lang.System.currentTimeMillis,
                        :session_data => "{}")

    session_id
  end


  def self.get_session(session_id)
    row = db[:session][:session_id => session_id]

    if row
      if (java.lang.System.currentTimeMillis - row[:last_used_time]) > (AppConfig[:session_expire_after_seconds] * 1000)
        delete_session(session_id)

        raise SessionTimeout.new
      end

      Session.new(row[:session_id], row[:user_id], row[:create_time], JSON.parse(row[:session_data]))
    else
      raise SessionNotFoundError.new
    end
  end

  def self.save_session(session)
    if session.dirty?
      delete_session(session.id)

      db[:session].insert(:session_id => session.id,
                          :user_id => session.user_id,
                          :create_time => session.create_time,
                          :last_used_time => java.lang.System.currentTimeMillis,
                          :session_data => JSON.dump(session.data))
    else
      begin
        db[:session].filter(:session_id => session.id).update(:last_used_time => java.lang.System.currentTimeMillis)
      rescue Sequel::DatabaseError
        nil
      end
    end
  end

  def self.delete_session(session_id)
    db[:session].filter(:session_id => session_id).delete
  end

end
