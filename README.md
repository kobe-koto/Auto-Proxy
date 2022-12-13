# Auto-Proxy

**一個適用於 CF Workers 的自動按網域代理的脚本！**

## 附加条款:

1. 當您僅在 Auto-Proxy 原始碼中定義 `password` 常量字段時, 可以不公開原始碼. 若您在 Auto-Proxy 原始碼中定義 `password` 常量字段時還修改了程式的其他部分, 請公開您修改過的原始碼, 並將 `password` 常量字段定義爲 `null`.

## 使用方法: 

1. 例如, 您要通過代理訪問: example.org , 且您的 Auto-Proxy-CF 網域是 foo.example.org .

2. 那麽您應該訪問的網域是: example.org.foo.example.org.

3. 也就是說，您應該將要訪問的域名後面加上您的 Auto-Proxy-CF 網域.

4. 當然您也可以將要訪問的域名中的每個 "." 替換為 "-x-" , 然後再在後面加上您的 Auto-Proxy-CF 網域 (這是個 feature, 也是一個歷史遺留問題 (?) ).

## 限制:

- 您的 CF Workers 付費計劃是 FREE: 每日100,000請求 && 每十分鐘1,000請求;

- 您的 CF Workers 付費計劃是 按需付費: 沒有限制，除了您的錢包.

## 部署

### 請注意: 要部署該 Workers 服務, 您爲其必須綁定您自己的域名. 因爲:  1. Workers子域遭污染; 2. Workers 不支持匹配點部署到多個服務子域的子域上.

### TLDR版

1. 部署 index.js 到 Cloudflare Workers.

2. 綁定一個 KV 到這個 Workers 上, 變量名爲 `AutoProxySpace` .

3. 添加打開橙色雲的通配符 DNS 記錄和路由.

4. 訪問自訂子域, 您將被重新導向到 Panel 頁面來配置 Auto-Proxy.

### 稍微長一點 版

1. 登錄您的 CF Dashboard.

2. 轉到右側的 "Workers" 選項卡.

3. 點擊 "建立服務" 按鈕.

4. 服務名稱自行決定，例如 bypass-firewall.

5. 編輯 Workers 中的代碼為 index.js 中的代碼.

6. 綁定一個 KV 到這個 Workers 上, 變量名爲 `AutoProxySpace` .

7. Workers 的子域最近遭到污染, 所以您需要爲其分配子域.

8. 記錄下您的 Workers 子域, 轉到 DNS 設定処, 將其添加為您的子域名的真實名稱記錄. 例如您的域名是 example.org, Workers 子域為 bypass-firewall.example.workers.dev , 要添加的子域為 bypass.example.org, 那麽您應該如下設定記錄: 

   | 名稱                 | 記錄類型 | 啓用 CF CDN | 記錄值                              |
   | -------------------- | -------- | ----------- | ----------------------------------- |
   | bypass.example.org   | CNAME    | √           | bypass-firewall.example.workers.dev |
   | *.bypass.example.org | CNAME    | √           | bypass-firewall.example.workers.dev |

9. 在您的 Workers 的管理頁面的 "觸發程序" 選項卡中的 "路由" 処添加兩條記錄: 

   ```
   bypass.example.org/*
   *bypass.example.org/*
   ```

10. 訪問您的自訂子域, 您將被重新導向到 Panel 頁面來配置 Auto-Proxy.

## 給個 STAR 吧秋梨膏! 
