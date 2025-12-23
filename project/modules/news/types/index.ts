// News-related type definitions

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    id: string;
    name: string;
  };
  category?: string;
  readTime?: string;
}

export interface VideoContent {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  views: string;
  publishedAt: string;
  source: string;
  videoUrl?: string;
  category:
    | "highlights"
    | "analysis"
    | "interview"
    | "documentary"
    | "funny"
    | "live";
}

export interface FIFAContent {
  id: string;
  title: string;
  description: string;
  image: string;
  publishedAt: string;
  category: "official" | "tournaments" | "regulations" | "awards";
  importance: "high" | "medium" | "low";
  tags: string[];
}

export interface RichNewsContent {
  articleId: string;
  fullText: string;
  videos: VideoContent[];
  images: string[];
  relatedArticles: NewsArticle[];
  author: {
    name: string;
    bio?: string;
    avatar?: string;
  };
  tags: string[];
  readingTime: number;
  lastUpdated: string;
}

export interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: Array<{
    source: {
      id: string | null;
      name: string;
    };
    author: string | null;
    title: string;
    description: string | null;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string | null;
  }>;
}

export interface NewsCategory {
  id: string;
  label: string;
  icon: any;
}

export interface NewsFilterTabProps {
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  categories?: NewsCategory[];
}

export interface NewsNotificationsProps {
  notificationCount?: number;
  showBadge?: boolean;
}

export interface NewsRearrangeFilterTabsProps {
  visible: boolean;
  onClose: () => void;
  currentActiveCategories: string[];
  onSaveArrangement: (
    activeCategories: string[],
    hiddenCategories: string[],
  ) => void;
}

// Content component props
export interface NewsRecentProps {}

export interface NewsHotProps {}

export interface NewsFollowedMatchesProps {
  followsNews: NewsArticle[];
  onRefresh: () => Promise<void>;
}

export interface NewsAllSportsProps {
  headlines: NewsArticle[];
  sportsNews: NewsArticle[];
}

export interface NewsFifaProps {
  fifaNews: FIFAContent[];
}

export interface NewsUgandaSportsProps {
  ugandaNews: NewsArticle[];
}

export interface NewsAfconProps {
  afconNews: NewsArticle[];
}

export interface NewsVideosProps {
  videoContent: VideoContent[];
}

export interface NewsFootballProps {}

export interface NewsBasketballProps {}

export interface NewsRugbyProps {}
