type StudioLocation = "brno-stankova" | "brno-kera-mini" | "praha-veletrzni";
type Membership = "none" | "by-depozit" | "by-reservation";

interface TableRow {
  header: string;
  body: string;
  note?: string; // multiline text
} // component

interface StrapiImage {
  // Strapi's builtin media image
}

interface Video {
  videoId: string; // Probably youtubea a video ID
} // component

interface USP {
  icon: StrapiImage; // svg icon
  text: string;
} // component

type PremadeProduct = {
  internalDisplayName: string; // is possible to generate smth like: product.name + " – " + location?
  product: Product;
  price: Price;
  stockCount: number;
  location: StudioLocation;
}; // collection PremadeProducts
interface StrapiRichtext { } // h1, h2, h3, ul, ol, p only
type MediaRow = StrapiImage[] | Video[]; // length 1 or 2
type Content = StrapiRichtext | MediaRow | PremadeProduct[]; // dynamic zone

interface Price {
  prefix?: string;
  amount: number; // add note for currency being in CZK
  currency: string; // default CZK
  withVat: boolean;
  suffix?: string;
} // component

interface Product {
  coverPhoto: StrapiImage;
  title: string;
  slug: string;
} // collection Products

interface ClientQuote {
  name: string;
  quote: string; // multiline text
} // collection ClientQuotes

type Gallery = {
  internalDisplayName: string;
  images: StrapiImage[];
}; // collection Galleries

interface Activity {
  internalDisplayName: string;
  slug: string; // based on title
  title: string;
  cover: StrapiImage;
  description: string; // multiline text
  table?: TableRow[];
  price: Price;
  additionalInfo?: string[];
  membership: Membership;
  usps?: USP[];
  content: Content;
  quote?: ClientQuote;
  gallery?: Gallery;
} // component?

interface GroupActivityLesson {
  internalDisplayName: string;
  coverPhoto: StrapiImage;
  title: string;
  slug: string;
  description: string; // multiline
  details: TableRow;
  price: Price;
} // collection

interface GroupActivity extends Activity {
  groupActivityLessons: GroupActivityLesson[];
} // collection

interface WorkshopActivity extends Activity {
  dates: string[];
} // collection

interface SelfserviceActivity extends Activity {
  withPremadeProducts: boolean; // default to false
} // collection
