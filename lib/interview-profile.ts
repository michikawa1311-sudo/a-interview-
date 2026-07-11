// インタビュー前の基本情報アンケートの項目定義。
// クライアント(フォーム表示)とサーバー(検証・プロンプト生成)の両方から使う。

export type ProfileField = {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
};

const STORE_PROFILE_FIELDS: ProfileField[] = [
  { key: "name", label: "お名前", placeholder: "例: 田中 花子", required: true },
  { key: "salon_name", label: "店舗名", placeholder: "例: DogSalon はなまる", required: true },
  { key: "address", label: "住所", placeholder: "例: 東京都世田谷区○○ 1-2-3", required: false },
  { key: "phone_number", label: "電話番号", placeholder: "例: 03-1234-5678", required: false },
  { key: "reservation_method", label: "予約方法", placeholder: "例: 電話 / 公式サイト / InstagramのDM", required: false },
  { key: "website_url", label: "公式サイト・予約ページのURL", placeholder: "https://...", required: false },
  { key: "sns_url", label: "SNS(Instagram等)のURL", placeholder: "https://www.instagram.com/...", required: false },
  { key: "business_hours", label: "営業時間・定休日", placeholder: "例: 10:00〜18:00 / 水曜定休", required: false },
  { key: "comment", label: "お客様への一言", placeholder: "例: わんちゃんのペースに合わせた優しいトリミングを心がけています", required: false },
];

const PERSONAL_PROFILE_FIELDS: ProfileField[] = [
  { key: "name", label: "お名前", placeholder: "例: 山田 太郎", required: true },
  { key: "title", label: "肩書き・ご活動", placeholder: "例: トリマー歴10年 / ○○サロン店長", required: false },
  { key: "website_url", label: "公式サイトのURL", placeholder: "https://...", required: false },
  { key: "sns_url", label: "SNSのURL", placeholder: "https://...", required: false },
  { key: "comment", label: "読者への一言", placeholder: "例: よろしくお願いします!", required: false },
];

const DEFAULT_PROFILE_FIELDS: ProfileField[] = [
  { key: "name", label: "お名前(ニックネーム可)", placeholder: "例: はなちゃんママ", required: true },
  { key: "comment", label: "一言(任意)", placeholder: "例: よろしくお願いします!", required: false },
];

const PROFILE_FIELDS_BY_TYPE: Record<string, ProfileField[]> = {
  店舗紹介: STORE_PROFILE_FIELDS,
  個人インタビュー: PERSONAL_PROFILE_FIELDS,
};

export function getProfileFields(articleType: string): ProfileField[] {
  return PROFILE_FIELDS_BY_TYPE[articleType] ?? DEFAULT_PROFILE_FIELDS;
}
