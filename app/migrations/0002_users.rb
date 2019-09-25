Sequel.migration do
  up do

    create_table(:user) do
      primary_key :id

      String :email, null: false, unique: true, size: 190

      String :first_name, null: true
      String :last_name, null: true

      Integer :admin, null: false, default: 0
      Integer :inactive, null: false, default: 0
      Integer :verified, null: false, default: 0

      Integer :lock_version, null: false, default: 0

      Bignum :create_time, null: false
      Bignum :modified_time, null: false
    end

    create_table(:dbauth) do
      primary_key :id

      foreign_key :user_id, :user, :unique => true
      String :pwhash, null: false
    end

    create_table(:session) do
      primary_key :id

      String :session_id, :unique => true, :null => false, size: 64
      foreign_key :user_id, :user, :unique => true

      Bignum :create_time, null: false
      Bignum :last_used_time, null: false

      String :session_data, :null => true, :text => true
    end

  end
end
