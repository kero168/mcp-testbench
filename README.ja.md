# mcp-testbench

> どんな言語で書かれたMCPサーバーでも、コマンド一発でテスト。

[English README](./README.md)

[![CI](https://github.com/kero168/mcp-testbench/actions/workflows/ci.yml/badge.svg)](https://github.com/kero168/mcp-testbench/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/mcp-testbench)](https://www.npmjs.com/package/mcp-testbench)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

世の中には **2万以上のMCPサーバー** が公開されていますが、それを標準的にテストする方法はありません。
ユニットテストフレームワークは自分の言語の中しか見えません。`mcp-testbench` は
**本物のMCPクライアントとして** サーバーに接続し、プロトコルそのものを検証します。
そのため TypeScript・Python・Go・Rust など、実装言語を問わず動作します。

## クイックスタート

```bash
# インストール不要：任意のstdio MCPサーバーを指定するだけ
npx mcp-testbench run --server "npx -y @modelcontextprotocol/server-everything"

# プロジェクトに追加する場合
npm i -D mcp-testbench
npx mcp-testbench init     # mcptest.config.yaml を生成
npx mcp-testbench run
```

## 何をチェックするか

**組み込みの適合性チェック**（設定不要）:

| ID   | チェック内容 |
| ---- | ------------ |
| C000 | サーバーが起動し、MCP `initialize` ハンドシェイクが完了する |
| C001 | ハンドシェイクがサーバー名とバージョンを公開している |
| C002 | サーバーがcapabilitiesを宣言している |
| C010 | `tools/list` が有効なツール一覧を返す |
| C011 | 全ツールに意味のある説明がある |
| C012 | 全ツールがobject型の入力JSON Schemaを宣言している |
| C013 | ツール名が安全な文字のみを使用している |
| C020 | 必須引数の欠落が適切に拒否される |
| C030 | 宣言されている場合 `resources/list` が動作する |
| C040 | 宣言されている場合 `prompts/list` が動作する |

**独自のテストケース** はYAMLで宣言的に書けます:

```yaml
# mcptest.config.yaml
server:
  command: "node dist/index.js"

suites:
  - name: search tool
    tool: search
    cases:
      - args: { query: "hello" }
        expect:
          ok: true
          result.contains: "hello"
      - args: {}
        expect:
          error: true    # 必須引数の欠落は正しく失敗すべき
```

対応している期待値: `ok`, `error`, `result.contains`, `result.matches`（正規表現）, `result.equals`, `maxDurationMs`

## セキュリティ・品質監査（`audit`）

`mcp-testbench audit` は、サーバーが宣言するツールをセキュリティ・品質の観点で
検査します。解析はすべてローカルで完結し、LLMも外部ネットワークも不要です。

```bash
npx mcp-testbench audit --server "node dist/index.js"
npx mcp-testbench audit --url "http://localhost:3000/mcp" --reporter json
```

| ID   | 監査内容 | severity |
| ---- | -------- | -------- |
| A001 | ツール説明が十分な長さで、注入系文言（「ignore previous instructions」等）を含まない | warn |
| A002 | 破壊的・実行系ツール（delete/exec/shell系）の説明に確認（confirmation）や安全性の記述がある | warn |
| A003 | 任意のコマンド・パス・URLを受け取る無制約のstring引数がない | info |
| A010 | ツール/スキーマ説明に不可視・制御Unicode文字が隠されていない | error |

検出結果は警告（終了コード0）として報告されるため、段階的に導入できます。
`--strict` を付けると警告があった時点で終了コード1になります。
詳細は [docs/audit.md](./docs/audit.md) を参照してください。

## CIで使う

```yaml
# .github/workflows/mcp.yml
- uses: kero168/mcp-testbench@main
  with:
    server: "node dist/index.js"
```

または直接:

```yaml
- run: npx mcp-testbench run --reporter github
```

`github` レポーターは失敗ごとにGitHub Actionsアノテーションを出力します。
チェックが1つでも失敗すると終了コードは `1` になり、パイプラインも失敗します。
その他のCI向けに `json` レポーターも利用できます。

## トランスポート

| トランスポート  | 設定 |
| --------------- | ---- |
| stdio           | `server.command: "node dist/index.js"` |
| Streamable HTTP | `server.url: "http://localhost:3000/mcp"` |

## なぜプロトコルレベルのテストか

言語レベルのユニットテストでは、実際にMCPクライアントを壊す問題を検出できません。
不正なツールスキーマ、capability宣言の欠落、無効な引数によるクラッシュ、
ハンドシェイクのリグレッションなど。`mcp-testbench` は、実際のクライアント
（Claude、ChatGPT、Cursor、その他のMCPホスト）が目にするものを正確に検証します。

## ロードマップ

[ROADMAP.md](./ROADMAP.md) を参照してください。

## コントリビューション

IssueもPRも歓迎です。[CONTRIBUTING.md](./CONTRIBUTING.md) をご覧ください。
`examples/sample-server` にはテストスイートで使用する最小構成のサーバーが
含まれており、CLIをローカルで試すためのリファレンスにもなります。

## ライセンス

[MIT](./LICENSE)
