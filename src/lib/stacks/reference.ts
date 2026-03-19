export type StackEntry = {
  label: string
  slug: string
  role: string
  description: string
  bestFor: string
  alternatives: Array<{
    label: string
    slug: string
    vs: string
  }>
}

export const STACK_REFERENCE: StackEntry[] = [
  // ── Meta frameworks ──────────────────────────────────────────
  {
    label: 'Next.js',
    slug: 'nextjs',
    role: 'Meta framework',
    description:
      'Reactをベースにしたフルスタックフレームワーク。ページルーティング、SSR（サーバーサイドレンダリング）、APIルートをひとつのリポジトリで管理できる。App Router（v13以降）によりサーバーコンポーネントとクライアントコンポーネントを使い分けられる。',
    bestFor:
      'SEOが重要なWebアプリ、フロントエンドとバックエンドを同一リポジトリで管理したい場合、Reactエコシステムを使いながらSSRが必要なとき。',
    alternatives: [
      {
        label: 'Remix',
        slug: 'remix',
        vs: '同じくフルスタックReactフレームワーク。Web標準（fetch/FormData）に忠実で、フォーム処理やローディング状態の管理が得意。Next.jsより学習コストが低いと言われる。',
      },
      {
        label: 'Vite',
        slug: 'vite',
        vs: 'ビルドツール。SSRなしのSPA（シングルページアプリ）を作るなら設定が少なくシンプル。サーバーサイドの機能は自前で用意する必要がある。',
      },
    ],
  },
  {
    label: 'Nuxt',
    slug: 'nuxt',
    role: 'Meta framework',
    description:
      'Vueをベースにしたフルスタックフレームワーク。Next.jsのVue版に相当し、ファイルベースルーティング、SSR、APIルートを提供する。Nitroエンジンにより様々なホスティング環境にデプロイできる。',
    bestFor:
      'Vueを使いながらSSRやフルスタック開発をしたい場合。Vueエコシステムに慣れているチーム。',
    alternatives: [
      {
        label: 'Vue',
        slug: 'vue',
        vs: 'NuxtはVue上に構築されている。SSRや規約が不要でSPAのみ作りたいならVue単体の方がシンプル。',
      },
    ],
  },
  {
    label: 'SvelteKit',
    slug: 'sveltekit',
    role: 'Meta framework',
    description:
      'Svelteをベースにしたフルスタックフレームワーク。仮想DOMを使わないSvelteの特性により、バンドルサイズが小さくランタイムパフォーマンスが高い。ファイルベースルーティングとSSRをサポート。',
    bestFor:
      'パフォーマンスを重視したい場合、仮想DOMのオーバーヘッドを避けたい場合。ReactやVueより学習コストが低い。',
    alternatives: [
      {
        label: 'Next.js',
        slug: 'nextjs',
        vs: 'ReactベースでエコシステムとサードパーティライブラリはNext.jsの方が圧倒的に豊富。SvelteKitはバンドルサイズと書きやすさに強み。',
      },
    ],
  },
  {
    label: 'Remix',
    slug: 'remix',
    role: 'Meta framework',
    description:
      'Web標準（fetch API、FormData、HTTP）に忠実なReactフレームワーク。ローダー（データ取得）とアクション（データ送信）の分離が明確で、フォーム処理とエラーハンドリングが得意。',
    bestFor:
      'フォームが多いアプリ、Web標準を重視したい場合、ネスト構造のルーティングを活用したい場合。',
    alternatives: [
      {
        label: 'Next.js',
        slug: 'nextjs',
        vs: 'Next.jsの方がエコシステムが大きく情報も多い。RemixはWeb標準への準拠とデータフローの明確さに強み。',
      },
    ],
  },
  {
    label: 'Astro',
    slug: 'astro',
    role: 'Meta framework',
    description:
      'コンテンツ重視のWebサイト向けフレームワーク。デフォルトでJavaScriptを最小化し（Islands Architecture）、静的HTMLを多く出力するためページ表示が非常に速い。React/Vue/Svelteコンポーネントを混在させられる。',
    bestFor:
      'ブログ、ドキュメントサイト、マーケティングページなどコンテンツ中心のサイト。SEOとパフォーマンスを最優先したい場合。',
    alternatives: [
      {
        label: 'Next.js',
        slug: 'nextjs',
        vs: 'Next.jsはインタラクティブなアプリ向け。Astroは静的コンテンツ中心でJSを極力使わないサイトに向く。',
      },
    ],
  },
  // ── UI libraries ─────────────────────────────────────────────
  {
    label: 'React',
    slug: 'react',
    role: 'UI library',
    description:
      'MetaのオープンソースUIライブラリ。コンポーネントベースでUIを構築し、状態管理とレンダリングを担う。Next.js/Remix/React Nativeなどのフレームワークの土台として使われることが多い。',
    bestFor:
      '豊富なエコシステムを活用したい場合。チームにReact経験者がいる場合。フレームワークを選ばず素のReactで作りたい場合。',
    alternatives: [
      {
        label: 'Vue',
        slug: 'vue',
        vs: 'VueはHTMLテンプレート構文に近く学習コストが低い。Reactはより「JavaScript的」な書き方。',
      },
      {
        label: 'Svelte',
        slug: 'svelte',
        vs: 'Svelteはコンパイル時に最適化されるため仮想DOMがなく、バンドルサイズが小さい。Reactはエコシステムが圧倒的に大きい。',
      },
    ],
  },
  {
    label: 'Vue',
    slug: 'vue',
    role: 'UI library',
    description:
      'プログレッシブなUIフレームワーク。HTMLテンプレート構文と単一ファイルコンポーネント（.vue）が特徴で、HTMLとCSSとJavaScriptを1ファイルにまとめて書ける。学習コストが低く段階的に導入しやすい。',
    bestFor:
      'HTML/CSS中心のバックグラウンドを持つ開発者、既存のHTMLページに段階的にインタラクティブ性を追加したい場合。',
    alternatives: [
      {
        label: 'React',
        slug: 'react',
        vs: 'Reactはより大きなエコシステムと求人数を持つ。Vueはシンプルな構文と公式ドキュメントの質の高さが強み。',
      },
    ],
  },
  {
    label: 'Svelte',
    slug: 'svelte',
    role: 'UI library',
    description:
      '仮想DOMを持たないUIフレームワーク。ビルド時にコンパイルして最小限のJavaScriptを出力するため、ランタイムが軽い。テンプレート構文がシンプルでボイラープレートが少ない。',
    bestFor:
      'バンドルサイズとパフォーマンスを重視する場合。小〜中規模のプロジェクト。書き方のシンプルさを求める場合。',
    alternatives: [
      {
        label: 'React',
        slug: 'react',
        vs: 'Reactはエコシステムと求人が圧倒的に多い。Svelteはコード量が少なくパフォーマンスに優れる。',
      },
    ],
  },
  {
    label: 'Angular',
    slug: 'angular',
    role: 'UI framework',
    description:
      'Googleが開発するフルスタックフロントエンドフレームワーク。DI（依存性注入）、ルーティング、フォーム、HTTPクライアントが標準で含まれる。TypeScriptが必須で、大規模アプリ向けに設計されている。',
    bestFor:
      '大規模エンタープライズアプリ、強い規約と標準化を求めるチーム、Java/C#バックグラウンドの開発者。',
    alternatives: [
      {
        label: 'React',
        slug: 'react',
        vs: 'ReactはUIのみに集中したライブラリで自由度が高い。Angularはフレームワーク全体が統合されており規約が強い。',
      },
    ],
  },
  // ── Mobile ───────────────────────────────────────────────────
  {
    label: 'React Native',
    slug: 'react-native',
    role: 'Mobile framework',
    description:
      'ReactでiOS/Androidアプリを構築するフレームワーク。JavaScriptでネイティブUIコンポーネントを操作し、Webビューではなく本物のネイティブUIを出力する。Expoと組み合わせて使うことが多い。',
    bestFor:
      'Reactの知識を活かしてモバイルアプリを作りたい場合、iOS/Androidを同一コードでカバーしたい場合。',
    alternatives: [
      {
        label: 'Flutter',
        slug: 'flutter',
        vs: 'DartというGoogleの言語を使い、独自レンダリングエンジンで描画するためUIの一貫性が高い。React Nativeより細かいUIカスタマイズがしやすい。',
      },
      {
        label: 'Swift',
        slug: 'swift',
        vs: 'iOSネイティブ開発。パフォーマンスとAppleエコシステムへの統合が最高だが、iOS専用。',
      },
    ],
  },
  {
    label: 'Flutter',
    slug: 'flutter',
    role: 'Mobile framework',
    description:
      'GoogleのDart言語を使いiOS/Android/Web/デスクトップアプリを構築するフレームワーク。独自レンダリングエンジン（Skia/Impeller）によりプラットフォームに依存しない一貫したUIを実現する。',
    bestFor:
      'iOS/Androidで見た目を完全に統一したい場合、UI表現力を重視する場合、モバイル以外（Web/デスクトップ）にも展開したい場合。',
    alternatives: [
      {
        label: 'React Native',
        slug: 'react-native',
        vs: 'JavaScript/Reactの知識が活かせる。ネイティブコンポーネントを使うためOSのUIに自然に馴染む。Flutterより既存のJS資産を活用しやすい。',
      },
    ],
  },
  {
    label: 'Swift',
    slug: 'swift',
    role: 'iOS/macOS language',
    description:
      'Appleが開発するiOS/macOS/watchOS向けのプログラミング言語。Objective-Cの後継で、型安全・高速・モダンな構文が特徴。SwiftUIフレームワークと組み合わせることで宣言的UIを構築できる。',
    bestFor:
      'iOSアプリをAppleの最新機能（ARKit、Core ML、WidgetKit等）と完全に統合したい場合。パフォーマンスが最重要なiOSアプリ。',
    alternatives: [
      {
        label: 'React Native',
        slug: 'react-native',
        vs: 'iOS/Androidクロスプラットフォームが可能。JavaScriptエコシステムを活用できる。SwiftよりApple固有機能へのアクセスは制限される。',
      },
      {
        label: 'Flutter',
        slug: 'flutter',
        vs: 'iOS/Androidクロスプラットフォームかつ独自UIレンダリング。SwiftよりApple APIへのアクセスは間接的。',
      },
    ],
  },
  // ── Language / Runtime ───────────────────────────────────────
  {
    label: 'TypeScript',
    slug: 'typescript',
    role: 'Language',
    description:
      'JavaScriptに静的型システムを追加したMicrosoftの言語。コンパイル時に型エラーを検出できるため、バグの早期発見とIDEの補完が大幅に向上する。最終的にJavaScriptにコンパイルされる。',
    bestFor:
      '中〜大規模プロジェクト、チーム開発、長期保守が必要なプロジェクト。AIコード生成との相性が特に良い（型情報がAIの補完精度を上げる）。',
    alternatives: [
      {
        label: 'JavaScript',
        slug: 'javascript',
        vs: '型定義なしで素早く書けるが、大規模になると型安全性の欠如がバグを増やす。プロトタイプや小規模スクリプトには十分。',
      },
    ],
  },
  {
    label: 'Python',
    slug: 'python',
    role: 'Language',
    description:
      '可読性の高い汎用プログラミング言語。Webバックエンド（Django/FastAPI）、データサイエンス、機械学習、スクリプトなど幅広い用途に使われる。AIエコシステムのデファクトスタンダード。',
    bestFor:
      'AI/MLプロジェクト、データ処理、バックエンドAPI（FastAPI/Django）、プロトタイピング。',
    alternatives: [
      {
        label: 'TypeScript',
        slug: 'typescript',
        vs: 'WebフロントエンドはTypeScriptの独壇場。バックエンドAPIはNode.js(TypeScript)とPythonどちらも選択肢になる。PythonはAI/MLライブラリが圧倒的に豊富。',
      },
    ],
  },
  {
    label: 'Ruby on Rails',
    slug: 'ruby-on-rails',
    role: 'Web framework',
    description:
      'Rubyで書かれたフルスタックWebフレームワーク。「設定より規約」の哲学により少ないコードで多くの機能を実現できる。MVC構造、ORM（ActiveRecord）、マイグレーションが統合されている。',
    bestFor:
      '素早いプロトタイピングとMVP開発、CRUD中心のWebアプリ、スタートアップの初期プロダクト。',
    alternatives: [
      {
        label: 'Next.js',
        slug: 'nextjs',
        vs: 'TypeScript/JavaScriptエコシステムを使いたい場合はNext.js+APIルートで同様のフルスタック開発が可能。RailsはRubyの資産と規約の強さが強み。',
      },
    ],
  },
  // ── CSS ──────────────────────────────────────────────────────
  {
    label: 'Tailwind',
    slug: 'tailwind',
    role: 'CSS framework',
    description:
      'ユーティリティファーストのCSSフレームワーク。`flex`, `pt-4`, `text-gray-700`のような小さなクラスをHTMLに直接書いてスタイリングする。カスタムCSSを書く量が減り、デザインの一貫性が保ちやすい。',
    bestFor:
      'コンポーネントベースのUIフレームワーク（React/Vue）との相性が良い。デザインシステムを柔軟にカスタマイズしたい場合。AIコード生成との相性が特に良い。',
    alternatives: [
      {
        label: 'CSS Modules',
        slug: 'css-modules',
        vs: 'コンポーネントごとにスコープされたCSSを書く方式。クラス名の衝突がなく、通常のCSS構文をそのまま使える。Tailwindより記述量は多い。',
      },
    ],
  },
  // ── Build tools ──────────────────────────────────────────────
  {
    label: 'Vite',
    slug: 'vite',
    role: 'Build tool',
    description:
      'ES Modulesを活用した高速なフロントエンドビルドツール。開発サーバーの起動が非常に速く、HMR（ホットモジュールリロード）もほぼ瞬時。React/Vue/Svelteなど主要フレームワークのテンプレートが用意されている。',
    bestFor:
      'SSRが不要なSPA開発、Next.js等のメタフレームワークを使わずReact/Vueだけで作りたい場合、高速な開発体験を求める場合。',
    alternatives: [
      {
        label: 'Next.js',
        slug: 'nextjs',
        vs: 'Next.jsはSSR/SSG/APIルートを含む統合フレームワーク。ViteはSSRなしのSPAに特化した軽量ビルドツール。',
      },
    ],
  },
  // ── Backend ──────────────────────────────────────────────────
  {
    label: 'Express',
    slug: 'express',
    role: 'Backend framework',
    description:
      'Node.jsの最も有名なWebフレームワーク。最小限の構造のみを提供し、ミドルウェアを積み重ねてAPIやWebサーバーを構築する。シンプルで自由度が高いが、大規模では構造化が必要。',
    bestFor:
      '軽量なAPIサーバー、既存のExpressコードベースのメンテナンス、Node.jsを自由にコントロールしたい場合。',
    alternatives: [
      {
        label: 'Hono',
        slug: 'hono',
        vs: 'ExpressよりモダンなAPIを持ち、Edge Runtime（Cloudflare Workers等）でも動作する。型安全性が高くTypeScriptとの相性が良い。',
      },
      {
        label: 'NestJS',
        slug: 'nestjs',
        vs: 'Angularライクなデコレータ構文で大規模アプリを構造化できる。Expressより規約が強くチーム開発向き。',
      },
    ],
  },
  {
    label: 'Hono',
    slug: 'hono',
    role: 'Backend framework',
    description:
      '軽量・高速なWebフレームワーク。Cloudflare Workers、Deno、Bun、Node.jsなど多くのランタイムで動作する。TypeScript型安全なルーティングとミドルウェアを提供し、バンドルサイズが非常に小さい。',
    bestFor:
      'Edge Runtime（Cloudflare Workers/Vercel Edge）でのAPI、軽量なAPIが必要な場合、TypeScriptとの完全な型安全性を求める場合。',
    alternatives: [
      {
        label: 'Express',
        slug: 'express',
        vs: 'Expressは長年の実績とエコシステムの広さが強み。HonoはモダンなAPI・Edge対応・高速さが強み。',
      },
    ],
  },
  {
    label: 'NestJS',
    slug: 'nestjs',
    role: 'Backend framework',
    description:
      'TypeScriptファーストのNode.jsフレームワーク。AngularにインスパイアされたDI（依存性注入）とデコレータ構文を採用し、大規模アプリのコード構造を統一できる。内部でExpressまたはFastifyを使う。',
    bestFor:
      '大規模バックエンドAPI、チーム開発で規約を統一したい場合、マイクロサービス構成、Javaのようなエンタープライズ設計を求める場合。',
    alternatives: [
      {
        label: 'Express',
        slug: 'express',
        vs: 'Expressはシンプルで自由度が高い。NestJSは構造と規約が強く、大規模でも見通しが良い反面、学習コストが高い。',
      },
    ],
  },
  {
    label: 'Fastify',
    slug: 'fastify',
    role: 'Backend framework',
    description:
      'Node.jsの高速WebフレームワークでExpressの後継として設計された。JSON SchemaによるリクエストのバリデーションとシリアライゼーションでExpressより大幅に高速。TypeScriptサポートも良好。',
    bestFor:
      'パフォーマンスを重視するAPIサーバー、型安全なバリデーションが必要な場合、Expressからの移行先。',
    alternatives: [
      {
        label: 'Express',
        slug: 'express',
        vs: 'Expressは学習リソースが豊富でミドルウェアのエコシステムが広い。FastifyはExpressより2〜4倍高速で型安全性も高い。',
      },
    ],
  },
  // ── ORM / DB ─────────────────────────────────────────────────
  {
    label: 'Prisma',
    slug: 'prisma',
    role: 'ORM',
    description:
      '型安全なNode.js/TypeScript向けORM。`schema.prisma`ファイルでDBスキーマを定義すると、TypeScriptの型と`PrismaClient`が自動生成される。マイグレーション管理も担う。',
    bestFor:
      'TypeScriptプロジェクトでDBアクセスに型安全性が欲しい場合、スキーマファーストでDB設計をしたい場合、マイグレーションをコードで管理したい場合。',
    alternatives: [
      {
        label: 'Drizzle',
        slug: 'drizzle',
        vs: 'PrismaよりSQL寄りの書き方で軽量。バンドルサイズが小さくEdge Runtimeでも動く。Prismaより柔軟なクエリが書けるがスキーマ定義は冗長になりやすい。',
      },
      {
        label: 'Supabase',
        slug: 'supabase',
        vs: 'SupabaseはBaaS（Backend as a Service）でORMではない。DB管理・認証・ストレージが統合されており設定なしで始められる。Prismaより抽象度が高くカスタマイズ性は低い。',
      },
    ],
  },
  {
    label: 'Drizzle',
    slug: 'drizzle',
    role: 'ORM',
    description:
      'TypeScriptファーストの軽量ORM。SQLに近い構文でクエリを書けるため、生SQLを知っている人には馴染みやすい。バンドルサイズが小さくCloudflare WorkersなどEdge Runtimeでも動作する。',
    bestFor:
      'SQLに慣れていてORMに過度な抽象化を求めない場合、Edge Runtime（Cloudflare Workers等）でのDB接続、Prismaより軽量なソリューションを求める場合。',
    alternatives: [
      {
        label: 'Prisma',
        slug: 'prisma',
        vs: 'Prismaはスキーマファイルからの型自動生成とマイグレーション管理が強力。DrizzleよりDevExが洗練されているが、バンドルサイズが大きくEdge非対応。',
      },
    ],
  },
  {
    label: 'Supabase',
    slug: 'supabase',
    role: 'BaaS (Backend as a Service)',
    description:
      'PostgreSQLをベースにしたオープンソースのBaaS。DB・認証・ストレージ・リアルタイム・Edge Functionsが統合されており、バックエンドをほぼ自前で書かずに構築できる。Firebase のオープンソース代替として知られる。',
    bestFor:
      'バックエンドコードを最小化したい場合、認証とDBを素早くセットアップしたい場合、リアルタイム機能が必要な場合。AIコード生成との相性が良い。',
    alternatives: [
      {
        label: 'Prisma',
        slug: 'prisma',
        vs: 'PrismaはORM専用で自前のDBサーバーと組み合わせて使う。Supabaseより柔軟なDB構成が可能だがインフラ管理が必要。',
      },
      {
        label: 'Drizzle',
        slug: 'drizzle',
        vs: 'DrizzleもSupabaseのDBに接続して使えるため組み合わせることも多い。SupabaseはDB以外のBaaS機能（認証・ストレージ）が一体化している点が違い。',
      },
    ],
  },
]

export function getStackEntry(slug: string): StackEntry | undefined {
  return STACK_REFERENCE.find(s => s.slug === slug)
}

export function labelToSlug(label: string): string {
  return label.toLowerCase().replace(/\./g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export function getStackByLabel(label: string): StackEntry | undefined {
  return STACK_REFERENCE.find(s => s.label === label)
}
