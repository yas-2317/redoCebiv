# Phase A: 法的ページ整備 ハンドオフ

## 概要

redoCebiv を公開する前に必要な法的整備フェーズ。
特商法表示ページの新規作成、既存の利用規約・PPの不備修正、サインアップ画面への同意導線追加、nav リンク整備の5タスク。

**前提方針（重要）:**
Stripe は未実装のため、**現在は無料プランのみ稼働中**として公開する。
terms.html の「有料プランは自動更新」「サブスクリプション管理からキャンセル可能」の記述は「近日提供予定」に差し替え、tokusho.html も無料プランのみの記載で作成する。

## スコープ

| # | タスク | 対象ファイル | 種別 |
|---|---|---|---|
| 1 | 特商法表示ページ作成 | `quiet-tools-web/redoCebiv/tokusho.html` | 新規作成 |
| 2 | 利用規約の修正（有料プラン節・クレジット節・免責条項） | `quiet-tools-web/redoCebiv/terms.html` | 修正 |
| 3 | PPに個人情報の開示・削除請求を明記 | `quiet-tools-web/redoCebiv/privacy.html` | 修正 |
| 4 | サインアップ画面に利用規約・PPへの同意文言追加 | `src/app/(auth)/signup/page.tsx` | 修正 |
| 5 | nav に tokusho リンクを追加 | `terms.html` / `privacy.html` / `support.html` | 修正 |

---

## タスク詳細

### 1. 特商法表示ページ（tokusho.html）

新規作成。既存の `terms.html` / `privacy.html` と同じデザインシステム（CSS 変数・nav・footer 構成）を使う。

**必須記載項目（消費者庁ガイダンスに基づく）:**

| 項目 | 記載内容 |
|---|---|
| 事業者の氏名 | 「お問い合わせいただいた場合に遅滞なく開示します」 |
| 住所 | 同上 |
| 電話番号 | 同上 |
| お問い合わせ | support.html のフォームを案内 |
| 販売価格 | Wanderer（無料）のみ現在提供中。有料プランは近日提供予定 |
| 支払方法 | 現在は無料プランのみのため該当なし。有料プラン開始時に更新 |
| 支払時期 | 同上 |
| サービス提供時期 | 登録後即時利用可能 |
| 返品・キャンセル | 無料プランはキャンセル不要。有料プラン開始時に更新 |
| 動作環境 | 最新版の Chrome / Safari / Firefox / Edge が動作するデスクトップ環境を推奨 |

**「請求があれば開示」の運用要件:**
氏名・住所・電話番号を省略するには、実際に問い合わせが来たときに開示できる準備が必要。
完了条件にその確認を含める。

**ナビへの追加:**
- リンクテキスト（JP）: 「特定商取引法に基づく表示」
- リンクテキスト（EN）: 「Legal Notice」

---

### 2. 利用規約（terms.html）修正

**A. 有料プラン節を「現在は無料プランのみ」に差し替える**

対象箇所（現 line 141〜149 JP / line 208〜215 EN）:

現在の記述:
> 有料プランは自動更新サブスクリプションです。（中略）キャンセルはアカウント設定の「サブスクリプション管理」から行えます。

変更後（JP）:
> 現在は Wanderer（無料プラン）のみ提供しています。有料プランは近日提供予定です。提供開始時に本ページを更新し、サービス内でもお知らせします。

変更後（EN）:
> Currently, only the Wanderer (free plan) is available. Paid plans are coming soon. This page will be updated and users will be notified within the Service when paid plans launch.

**B. クレジット節に「サービス終了時の有償残高」を追記する**

Top-up 機能が実装された際の備えとして追加。「クレジット制について」セクションに追記:

（JP）: サービスを終了する場合は、終了予定日の30日前までにお知らせします。有償で購入されたクレジットの未使用残高については、サポートへお問い合わせいただければ個別に対応します。

（EN）: If the Service is to be discontinued, we will provide at least 30 days' notice. Unused credits purchased with real money will be handled on a case-by-case basis — please contact support.

**C. 免責条項を「全部免責」から「重過失を除く」形式に修正する**

対象箇所（現 line 160〜161 JP / line 228 EN の免責条項）:

変更後（JP）:
> 本サービスは「現状のまま」提供されます。開発者の**故意または重大な過失**によるものを除き、本サービスの利用によって生じた損害について責任を負いません。

変更後（EN）:
> The Service is provided "as is". To the extent permitted by applicable law, the developer shall not be liable for any damages arising from the use of the Service, except in cases of willful misconduct or gross negligence.

---

### 3. プライバシーポリシー（privacy.html）修正

「お問い合わせ」セクションの直前に新しい節を追加:

**JP:**
> **個人情報に関するご要望**
> ご自身のアカウント情報（メールアドレス・利用履歴・クレジット残高など）の開示・訂正・削除・利用停止をご希望の場合は、サポートページのお問い合わせフォームよりお申し出ください。ご本人確認の上、合理的な期間内に対応します。

**EN:**
> **Your Data Rights**
> To access, correct, delete, or restrict the use of your personal information (such as your email address, usage history, or credit balance), please contact us via the support page. We will verify your identity and respond within a reasonable time.

---

### 4. サインアップ画面（signup/page.tsx）

**同意文言の配置方針:**
Google OAuth はボタン押下で認証が完了するため、Sign up ボタン直前だけでは Google 導線をカバーできない。
`CardContent` の**一番下（「Already have an account?」リンクの後）に常設**することで、Email / Google 両導線から視認可能にする。

対象箇所（現 line 128〜133）の `<p>Already have an account...</p>` の後に追加:

```tsx
<p className="text-center text-xs text-gray-400 pt-1">
  By continuing, you agree to our{' '}
  <a
    href="https://yas-2317.github.io/redoCebiv/terms.html"
    target="_blank"
    rel="noopener noreferrer"
    className="underline"
  >
    Terms of Service
  </a>
  {' '}and{' '}
  <a
    href="https://yas-2317.github.io/redoCebiv/privacy.html"
    target="_blank"
    rel="noopener noreferrer"
    className="underline"
  >
    Privacy Policy
  </a>
  .
</p>
```

「By continuing」とすることで Google / Email どちらの導線にも対応する。

---

### 5. nav への tokusho リンク追加

以下の3ファイルの nav に追加:
- `quiet-tools-web/redoCebiv/terms.html`
- `quiet-tools-web/redoCebiv/privacy.html`
- `quiet-tools-web/redoCebiv/support.html`

追加位置: `.nav-links` 内の既存リンクの末尾

```html
<a href="tokusho.html">
  <span class="lang-ja">特定商取引法に基づく表示</span>
  <span class="lang-en">Legal Notice</span>
</a>
```

---

## 依存関係・影響範囲

| ファイル | 変更内容 | デプロイ先 |
|---|---|---|
| `quiet-tools-web/redoCebiv/tokusho.html` | 新規作成 | GitHub Pages |
| `quiet-tools-web/redoCebiv/terms.html` | nav 追加・有料プラン節・免責条項修正 | GitHub Pages |
| `quiet-tools-web/redoCebiv/privacy.html` | nav 追加・個人情報請求節追加 | GitHub Pages |
| `quiet-tools-web/redoCebiv/support.html` | nav 追加のみ | GitHub Pages |
| `src/app/(auth)/signup/page.tsx` | 同意文言追加 | Vercel |

---

## 完了条件

- [ ] `tokusho.html` が GitHub Pages で閲覧できる
- [ ] tokusho に「請求があれば氏名・住所・電話番号を開示する」旨が記載されている
- [ ] 実際に問い合わせが来たとき開示できる準備が整っている（運用確認）
- [ ] `terms.html` の有料プラン節が「現在は無料プランのみ」に更新されている
- [ ] `terms.html` の免責条項が「重過失を除く」形式になっている
- [ ] `privacy.html` に個人情報の開示・削除請求への対応が明記されている
- [ ] `terms.html` / `privacy.html` / `support.html` の nav に tokusho リンクがある
- [ ] `signup/page.tsx` の CardContent 末尾に同意文言とリンクがある（Google / Email 両導線から視認可能）
- [ ] `npm run build` が通る
