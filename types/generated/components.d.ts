import type { Schema, Struct } from '@strapi/strapi';

export interface BasicBlockquote extends Struct.ComponentSchema {
  collectionName: 'components_basic_blockquotes';
  info: {
    displayName: 'Blockquote';
    icon: 'envelop';
  };
  attributes: {
    blockquote_content: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface BasicClientQuote extends Struct.ComponentSchema {
  collectionName: 'components_basic_client_quotes';
  info: {
    displayName: 'Client Quote';
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
    displayName: 'Faq Item';
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
    displayName: 'Image Row';
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
    displayName: 'Table';
    icon: 'grid';
  };
  attributes: {
    row_header: Schema.Attribute.String & Schema.Attribute.Required;
    row_value: Schema.Attribute.String;
  };
}

export interface BasicWorkshopContent extends Struct.ComponentSchema {
  collectionName: 'components_basic_workshop_contents';
  info: {
    displayName: 'workshop_content';
  };
  attributes: {};
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'basic.blockquote': BasicBlockquote;
      'basic.client-quote': BasicClientQuote;
      'basic.faq-item': BasicFaqItem;
      'basic.image-row': BasicImageRow;
      'basic.table': BasicTable;
      'basic.workshop-content': BasicWorkshopContent;
    }
  }
}
