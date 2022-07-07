# Auto-Proxy-CF
**一個適用於 CF Workers 的自動按網域代理的脚本！**

## 使用方法: 
1. 例如, 您要通過代理訪問: example.org , 且您的 Auto-Proxy-CF 網域是 foo.example.workers.dev .
2. 那麽您應該訪問的網域是: example-x-org.foo.example.workers.dev
2. 也就是說，您應該將要訪問的域名中的每個 "." 替換為 "-x-" .

## 限制:

- 您的 CF Workers 付費計劃是 FREE: 每日100,000請求 && 每十分鐘1,000請求；
- 您的 CF Workers 付費計劃是 按需付費: 沒有限制，除了您的錢包。

## 部署

1. 登錄您的 CF Dashboard.

2. 轉到右側的 "Workers" 選項卡.

3. 點擊 "建立服務" 按鈕.

4. 服務名稱自行決定，例如 bypass-firewall (您應該在 *第 5 步* 將代碼中 DomainReplaceKey 變量的值為 ["bypass-firewall"] ).

5. 編輯 Workers 中的代碼為 index.js 中的代碼.

6. Workers 的子域最近遭到污染, 所以您需要爲其分配子域.

7. 記錄下您的 Workers 子域, 轉到 DNS 設定処, 將其添加為您的子域名的真實名稱記錄. 例如您的域名是 example.org, Workers 子域為 bypass-firewall.example.workers.dev , 要添加的子域為 bypass.example.org, 那麽您應該如下設定記錄: 

   | 名稱                 | 記錄類型 | 啓用 CF CDN | 記錄值                              |
   | -------------------- | -------- | ----------- | ----------------------------------- |
   | bypass.example.org   | CNAME    | √           | bypass-firewall.example.workers.dev |
   | *.bypass.example.org | CNAME    | √           | bypass-firewall.example.workers.dev |

8. 在您的 Workers 的管理頁面的 "觸發程序" 選項卡中的 "路由" 処添加兩條記錄: 

   ```
   bypass.example.org/*
   *bypass.example.org/*
   ```

9. 然後在您的 Workers 中的代碼修改 DomainReplaceKey 變量的值為 `["bypass-firewall","bypass"]` .

10. 訪問您的自訂子域看看!

## 給個 STAR 吧秋梨膏! 
