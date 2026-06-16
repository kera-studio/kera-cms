import type { Schema, Struct } from '@strapi/strapi';

export interface ActivityBase extends Struct.ComponentSchema {
  collectionName: 'components_activity_bases';
  info: {
    description: 'Shared fields for all activity types (group, workshop, self-service).';
    displayName: 'Activity Base';
    icon: 'apps';
  };
  attributes: {
    additionalInfo: Schema.Attribute.Component<'shared.list-item', true>;
    cover: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    gallery: Schema.Attribute.Relation<'oneToOne', 'api::gallery.gallery'>;
    membership: Schema.Attribute.Enumeration<
      ['none', 'by-depozit', 'by-reservation']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'none'>;
    price: Schema.Attribute.Component<'shared.price', false> &
      Schema.Attribute.Required;
    quote: Schema.Attribute.Relation<
      'oneToOne',
      'api::client-quote.client-quote'
    >;
    table: Schema.Attribute.Component<'shared.table-row', true>;
    unique_selling_points: Schema.Attribute.Relation<
      'oneToMany',
      'api::unique-selling-point.unique-selling-point'
    >;
  };
}

export interface BasicBlockquote extends Struct.ComponentSchema {
  collectionName: 'components_basic_blockquotes';
  info: {
    displayName: 'Deprecated \u2013 Blockquote';
    icon: 'envelop';
  };
  attributes: {
    blockquote_content: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface BasicClientQuote extends Struct.ComponentSchema {
  collectionName: 'components_basic_client_quotes';
  info: {
    displayName: 'Deprecated \u2013 Client Quote';
    icon: 'feather';
  };
  attributes: {
    client_name: Schema.Attribute.String & Schema.Attribute.Required;
    client_quote: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface BasicFaqItem extends Struct.ComponentSchema {
  collectionName: 'components_basic_faq_items';
  info: {
    displayName: 'Deprecated \u2013 Faq Item';
    icon: 'earth';
  };
  attributes: {
    faq_answer: Schema.Attribute.Text & Schema.Attribute.Required;
    faq_question: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BasicImageRow extends Struct.ComponentSchema {
  collectionName: 'components_basic_image_rows';
  info: {
    description: '';
    displayName: 'Deprecated \u2013 Image Row';
    icon: 'alien';
  };
  attributes: {
    first_image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    second_image: Schema.Attribute.Media<'images'>;
  };
}

export interface BasicTable extends Struct.ComponentSchema {
  collectionName: 'components_basic_tables';
  info: {
    description: '';
    displayName: 'Deprecated \u2013 Table';
    icon: 'grid';
  };
  attributes: {
    row_header: Schema.Attribute.String & Schema.Attribute.Required;
    row_value: Schema.Attribute.String;
  };
}

export interface ContentMediaRow extends Struct.ComponentSchema {
  collectionName: 'components_content_media_rows';
  info: {
    description: 'A row of one or two images.';
    displayName: 'Media Row';
    icon: 'landscape';
  };
  attributes: {
    imageOne: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    imageTwo: Schema.Attribute.Media<'images'>;
  };
}

export interface ContentPremadeProducts extends Struct.ComponentSchema {
  collectionName: 'components_content_premade_products';
  info: {
    description: 'A content block listing one or more premade products.';
    displayName: 'Premade Products';
    icon: 'store';
  };
  attributes: {
    showPremadeProducts: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
  };
}

export interface ContentRichtext extends Struct.ComponentSchema {
  collectionName: 'components_content_richtexts';
  info: {
    description: 'Rich text block. Intended for h1-h3, ul, ol and p only.';
    displayName: 'Rich Text';
    icon: 'bold';
  };
  attributes: {
    body: Schema.Attribute.Blocks & Schema.Attribute.Required;
  };
}

export interface ContentVideo extends Struct.ComponentSchema {
  collectionName: 'components_content_videos';
  info: {
    description: 'External video reference (e.g. YouTube video ID), with a title for editor orientation.';
    displayName: 'Video';
    icon: 'play';
  };
  attributes: {
    title: Schema.Attribute.String;
    videoId: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedEventDate extends Struct.ComponentSchema {
  collectionName: 'components_shared_event_dates';
  info: {
    description: 'A single scheduled date/time, optionally labelled.';
    displayName: 'Event Date';
    icon: 'calendar';
  };
  attributes: {
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    endTime: Schema.Attribute.Time;
    startTime: Schema.Attribute.Time;
  };
}

export interface SharedListItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_list_items';
  info: {
    description: 'A single text line, used for string-array fields (e.g. additionalInfo).';
    displayName: 'List Item';
    icon: 'bulletList';
  };
  attributes: {
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedPrice extends Struct.ComponentSchema {
  collectionName: 'components_shared_prices';
  info: {
    description: 'Monetary amount. Note: amounts are stored in CZK.';
    displayName: 'Price';
    icon: 'shoppingCart';
  };
  attributes: {
    amount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    currency: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'CZK'>;
    prefix: Schema.Attribute.String;
    suffix: Schema.Attribute.String;
    withVat: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<true>;
  };
}

export interface SharedTableRow extends Struct.ComponentSchema {
  collectionName: 'components_shared_table_rows';
  info: {
    description: 'A header/body pair with an optional note.';
    displayName: 'Table Row';
    icon: 'bulletList';
  };
  attributes: {
    body: Schema.Attribute.String & Schema.Attribute.Required;
    header: Schema.Attribute.String & Schema.Attribute.Required;
    note: Schema.Attribute.Text;
  };
}

export interface SharedUsp extends Struct.ComponentSchema {
  collectionName: 'components_shared_usps';
  info: {
    description: 'Unique selling point: an icon and a short text.';
    displayName: 'USP';
    icon: 'check';
  };
  attributes: {
    icon: Schema.Attribute.Media<'images' | 'files'> &
      Schema.Attribute.Required;
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'activity.base': ActivityBase;
      'basic.blockquote': BasicBlockquote;
      'basic.client-quote': BasicClientQuote;
      'basic.faq-item': BasicFaqItem;
      'basic.image-row': BasicImageRow;
      'basic.table': BasicTable;
      'content.media-row': ContentMediaRow;
      'content.premade-products': ContentPremadeProducts;
      'content.richtext': ContentRichtext;
      'content.video': ContentVideo;
      'shared.event-date': SharedEventDate;
      'shared.list-item': SharedListItem;
      'shared.price': SharedPrice;
      'shared.table-row': SharedTableRow;
      'shared.usp': SharedUsp;
    }
  }
}
