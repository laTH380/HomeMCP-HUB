# HomeMCP-HUB

HomeMCP-HUB は、自作のMCPツールを追加して、一つの統合MCP サーバーとして動かすためのテンプレです。

MCP SDK のボイラープレートを毎回記述する代わりに、このリポジトリをベース（またはフォーク）として、プラグインの形で任意のツールや機能を実装・追加することを目的としています。ツールの登録、名前空間の管理（例: `plugin_name.tool_name`）、リクエストのルーティングといった共通処理は HomeMCP-HUB が担うため、開発者はツール固有のロジックに集中できます。

[English README](./README.md)

## 特徴

- プラグイン単位で MCP ツール、リソース、リソーステンプレート、プロンプトを提供
- `clock.now` や `memory.search_notes` のような名前空間付き機能
- stdio JSON-RPC の MCP サーバー
- 共通設定によるプラグインの有効・無効切り替え
- `clock` と `memory` のサンプル内蔵プラグイン
- TypeScript ベースのプラグインインターフェース

## 必要環境

- Node.js 22 以上
- npm

## クイックスタート

```bash
npm install
npm run build
npm test
npm start
```

`npm start` は、改行区切り JSON-RPC の stdio サーバーを起動します。

リクエスト例:

```json
{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
```

## 設定

HomeMCP-HUB はデフォルトで `config/homemcp.json` を読み込みます。別の設定ファイルを使う場合は `HOMEMCP_CONFIG` を指定してください。設定ファイルが無い場合は、組み込みのデフォルト設定で起動します。

```json
{
  "plugins": {
    "clock": {
      "enabled": true,
      "config": {
        "timezone": "UTC"
      }
    },
    "memory": {
      "enabled": false,
      "config": {}
    }
  }
}
```

`enabled` を `false` にすると、そのプラグインは登録、初期化、MCP への公開が行われません。

詳細は [Configuration](./docs/configuration.md) を参照してください。

## 内蔵プラグイン

### `clock`

- ツール: `clock.now`
- リソース: `homemcp://clock/config`

### `memory`

- ツール: `memory.add_note`, `memory.search_notes`
- リソーステンプレート: `homemcp://memory/notes/{note_id}`
- プロンプト: `memory.summarize_notes`

## プラグイン開発

プラグインは `HomeMcpPlugin` を実装します。ツール、リソース、リソーステンプレート、プロンプト、ヘルスチェックを任意で提供できます。

```ts
interface HomeMcpPlugin {
  id: string;
  name: string;
  version: string;
  initialize(context: PluginContext): Promise<void>;
  tools?: ToolProvider;
  resources?: ResourceProvider;
  prompts?: PromptProvider;
  healthCheck?(): Promise<PluginHealth>;
}
```

プラグインは `search_issues` のようなローカル名を返し、HomeMCP-HUB は `github.search_issues` のような名前空間付き MCP 名として公開します。

詳しくは [Plugin Development](./docs/plugin-development.md) を参照してください。

## アーキテクチャ

```text
MCP Client / Agent
        |
        | MCP JSON-RPC
        v
HomeMCP-HUB
  - homemcp.* core tools/resources
  - namespacing
  - dispatch
  - policy/logging/secrets
        |
        +--> clock plugin   -> clock.now, homemcp://clock/config
        +--> memory plugin  -> memory.add_note, memory.search_notes
        +--> future plugins -> github.*, rss.*, calendar.*, filesystem.*
```

## コントリビュート

コントリビュート歓迎です。詳細は [CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。

## ライセンス

MIT です。詳細は [LICENSE](./LICENSE) を参照してください。
