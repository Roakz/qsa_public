class DBAuth < BaseStorage

  def self.set_user_password(user_id, password)
    db[:dbauth].filter(:user_id => user_id).delete
    db[:dbauth].insert(:user_id => user_id,
                       :pwhash => BCrypt::Password.create(password))
  end

  def self.authenticate(email, password)
    hash = db[:user]
             .join(:dbauth, Sequel[:dbauth][:user_id] => Sequel[:user][:id])
             .filter(Sequel[:user][:email] => Users.normalise_email(email))
             .get(Sequel[:dbauth][:pwhash])

    if hash
       BCrypt::Password.new(hash) == password
    else
      false
    end
  end

  def self.authenticate_for_id(user_id, password)
    hash = db[:user]
             .join(:dbauth, Sequel[:dbauth][:user_id] => Sequel[:user][:id])
             .filter(Sequel[:user][:id] => user_id)
             .get(Sequel[:dbauth][:pwhash])

    if hash
      BCrypt::Password.new(hash) == password
    else
      false
    end
  end

  def self.set_recovery_token(user_id)
    token = SecureRandom.hex(64)

    result = db[:dbauth]
      .where(:user_id => user_id)
      .update(
        :recovery_token => token,
        :recovery_token_expiry => DateTime.now.to_s,
      )

    # FIXME remove this log once reset password workflow sends email
    $LOG.info("Email Reset Token: #{token}")

    result
  end

  def self.update_password_from_token(token, password, confirm_password)
    if password != confirm_password
      return {errors: [{message: 'Password must match Confirm Password'}]}
    end

    dbauth_match = db[:user]
      .join(:dbauth, Sequel[:dbauth][:user_id] => Sequel[:user][:id])
      .filter(Sequel[:dbauth][:recovery_token] => token).first

    if dbauth_match.nil? || token.nil?
      result = {:errors => [{message: 'Invalid token'}]}
    else
      recovery_token_expiry = dbauth_match[:recovery_token_expiry]
      # days difference
      time_diff = DateTime.now - DateTime.strptime(recovery_token_expiry)
      if time_diff > 1
        result = {:errors => [{message: 'This token has expired'}]}
      else
        result = {:status => 'updated'} if set_user_password(dbauth_match[:user_id], password)
      end
    end

    result
  end

end
