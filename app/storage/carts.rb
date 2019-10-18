class Carts < BaseStorage

  REQUEST_TYPE_READING_ROOM = "READING_ROOM"
  REQUEST_TYPE_DIGITAL_COPY = "DIGITAL_COPY"
  VALID_REQUEST_TYPES = [REQUEST_TYPE_READING_ROOM, REQUEST_TYPE_DIGITAL_COPY]

  def self.get(user_id)
    items = db[:cart_item]
      .filter(user_id: user_id)
      .map do |row|
      {
        id: row[:id],
        item_id: row[:item_id],
        request_type: row[:request_type],
        options: CartItemOptionsDTO.from_row(row),
      }
    end

    documents = Search.get_records_by_ids(items.map{|item| item.fetch(:item_id)})

    items.each do |item|
      item[:record] = documents.fetch(item.fetch(:item_id))
    end

    reading_room_requests = items.select{|item| item[:request_type] == REQUEST_TYPE_READING_ROOM}
    digital_copy_requests = items.select{|item| item[:request_type] == REQUEST_TYPE_DIGITAL_COPY}

    cart = {
      reading_room_requests: {
        total_count: reading_room_requests.count,
        open_records: reading_room_requests.select{|item| item[:record].fetch('rap_access_status') == 'Open Access'},
        closed_records: reading_room_requests.select{|item| item[:record].fetch('rap_access_status') == 'Restricted Access'}.group_by{|item| item[:record].fetch('responsible_agency').fetch('ref')},
        agencies: [],
      },
      digital_copy_requests: {
        total_count: digital_copy_requests.count,
        set_price_records: [], # FIXME need a way to know this
        quotable_records: digital_copy_requests,
      },
    }

    # FIXME filter only fields we need: qsa_id_prefixed, display_string
    cart[:reading_room_requests][:agencies] = Search.get_records_by_uris(cart[:reading_room_requests][:closed_records].keys)

    cart
  end

  def self.update_item(user_id, cart_item_id, cart_item_options)
    db[:cart_item]
      .filter(user_id: user_id)
      .filter(id: cart_item_id)
      .update(cart_item_options.to_hash)
  end

  def self.add_item(user_id, request_type, item_id)
    raise "Request type not supported: #{request_type}" unless VALID_REQUEST_TYPES.include?(request_type)

    begin
      db[:cart_item]
        .insert(user_id: user_id,
                request_type: request_type,
                item_id: item_id)
    rescue Sequel::UniqueConstraintViolation
      # ok it's already in there
    end
  end

  def self.clear(user_id, request_type)
    raise "Request type not supported: #{request_type}" unless VALID_REQUEST_TYPES.include?(request_type)

    db[:cart_item]
      .filter(user_id: user_id)
      .filter(request_type: request_type)
      .delete
  end

  def self.remove_item(user_id, cart_item_id)
    db[:cart_item]
      .filter(user_id: user_id)
      .filter(id: cart_item_id)
      .delete
  end

  def self.handle_open_records(user_id, date_required)
    now = Time.now

    user = Users.get(user_id)
    cart = get(user_id)

    cart[:open_records].each do |item|
      db[:reading_room_request]
        .insert(
          user_id: user_id,
          item_id: item.fetch(:record).fetch('id'),
          item_uri: item.fetch(:record).fetch('uri'),
          status: 'PENDING',
          date_required: date_required ? date_required.to_time.to_i * 1000 : date_required,
          created_by: user.fetch('email'),
          modified_by: user.fetch('email'),
          create_time: now.to_i * 1000,
          modified_time: now.to_i * 1000,
          system_mtime: now,
        )

      remove_item(user_id, item.fetch(:id))
    end
  end

  def self.handle_closed_records(user_id, agency_fields)
    now = Time.now

    user = Users.get(user_id)
    cart = get(user_id)

    cart[:closed_records].each do |agency_uri, closed_items|
      agency_id = "agent_corporate_entity:#{agency_uri.split('/').last}"

      agency_request_id = db[:agency_request]
                            .insert(
                              user_id: user_id,
                              agency_id: agency_id,
                              agency_uri: agency_uri,
                              status: 'PENDING',
                              purpose: agency_fields.fetch(agency_uri).fetch('purpose'),
                              publication_details: agency_fields.fetch(agency_uri).fetch('publication_details'),
                              created_by: user.fetch('email'),
                              modified_by: user.fetch('email'),
                              create_time: now.to_i * 1000,
                              modified_time: now.to_i * 1000,
                              system_mtime: now,
                              )

      closed_items.each do |item|
        db[:agency_request_item]
          .insert(
            agency_request_id: agency_request_id,
            item_id: item.fetch(:record).fetch('id'),
            item_uri: item.fetch(:record).fetch('uri'),
            status: 'PENDING',
            created_by: user.fetch('email'),
            modified_by: user.fetch('email'),
            create_time: now.to_i * 1000,
            modified_time: now.to_i * 1000,
            system_mtime: now,
          )

        db[:reading_room_request]
          .insert(
            agency_request_id: agency_request_id,
            user_id: user_id,
            item_id: item.fetch(:record).fetch('id'),
            item_uri: item.fetch(:record).fetch('uri'),
            status: 'AWAITING_AGENCY_APPROVAL',
            date_required: nil,
            created_by: user.fetch('email'),
            modified_by: user.fetch('email'),
            create_time: now.to_i * 1000,
            modified_time: now.to_i * 1000,
            system_mtime: now,
            )

        remove_item(user_id, item.fetch(:id))
      end
    end
  end

end
