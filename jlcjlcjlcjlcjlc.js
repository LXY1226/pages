// ==UserScript==
// @name         JLCJLCJLCJLCJLC
// @namespace    http://tampermonkey.net/
// @version      2024-08-31
// @description  上立创整点LDO
// @author       You
// @match        https://www.szlcsc.com/huodong.html*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @license      GPLv3
// @downloadURL https://update.greasyfork.org/scripts/492123/JLCJLCJLCJLCJLC.user.js
// @updateURL https://update.greasyfork.org/scripts/492123/JLCJLCJLCJLCJLC.meta.js
// ==/UserScript==

(function() {
    const style = `
#ext-root {
    position: fixed;
    top: 111px;
    right: 20px;
    width: 370px;
    max-height: 80vh;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: larger;
}`
    'use strict';
    const sleep = v => new Promise(r => setTimeout(r, v))
    const rootElem = document.createElement("div")
    rootElem.id = "ext-root"
    GM_addStyle(style)
    let coupons = [];
    let brands = [];
    let receive = 0
    , used = 0;
    let money = 0;
    document.querySelectorAll(".coupon-item").forEach(v => {
        let conditionElem = v.querySelector(".condition");
        if (!conditionElem)
            conditionElem = v.querySelector(".condition-disable");
        // if (!conditionElem) debugger;
        let thisMoney = 0;
        if (((conditionElem.innerText === "满16可用" ? thisMoney = 16 : false) ||
             (conditionElem.innerText === "满26可用" ? thisMoney = 26 : false)) &&
            !v.querySelector(".coupon-item-name").innerText.startsWith("<新人专享>")) {
            if (v.classList.contains("receive"))
                receive++;
            if (v.classList.contains("used"))
                used++;
            else
                money += thisMoney;
            let elem = v.querySelector(".coupon-item-btn-text")
            let firstElem = v.firstElementChild
            let url = firstElem.getAttribute("data-url")
            let title = firstElem.getAttribute("data-name")
            coupons.push({
                root: v,
                button: elem,
                url: url,
            })
            brands.push([title.substring(3, title.length - 4), url.substring(30, url.length - 5)])
        }
    }
                                                     )
    console.log(JSON.stringify(brands))
    const span = document.createElement("span");
    const baseText = `共找到${coupons.length}张优惠券,已领${receive}张,已用${used}张,剩余总价${money}元`
    span.innerText = baseText
    rootElem.appendChild(span)
    const button = document.createElement("button")
    button.innerText = "开始领取&预览页面"

    async function getCoupon() {
        for (let i = 0; i < coupons.length; i++) {
            const v = coupons[i];
            if (v.button.innerText === "立即抢券") {
                v.button.click();
                await sleep(1500)
            }
            span.innerText = baseText + `\n已抢${i + 1}张优惠券`
        }
        span.innerText = baseText + "\n抢完了"
        localStorage.setItem("coupon_todo", JSON.stringify(coupons.filter(v => !v.root.classList.contains('used')).map(v => v.url)))
    }

    button.onclick = async () => {
        button.onclick = undefined
        console.log("clicked")
        getCoupon()
        // no await
        const parser = new DOMParser();
        const newWindow = window.open("", "_blank").document.body
        newWindow.classList.add("page-brand")
        const brandCss = document.createElement("link")
        brandCss.rel = "stylesheet"
        brandCss.href = "https://static.szlcsc.com/ecp/public/css/page/list/brand/brand.02b0b6e2.css"
        const custonCSS = document.createElement("style")
        custonCSS.innerHTML = `
        body {
            padding-top: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .block-brand {
            width: 1200px;
        }
        `
        newWindow.appendChild(custonCSS)
        newWindow.appendChild(brandCss)
        for (let i = 0; i < coupons.length; i++) {
            const coupon = coupons[i]
            if (coupon.root.classList.contains("used")) continue;
            await new Promise(r => {
                console.log(coupon.url)
                GM_xmlhttpRequest({
                    method: "GET",
                    url: coupon.url,
                    onload: function(response) {
                        const doc = parser.parseFromString(response.responseText, "text/html");
                        const blk = document.createElement("div")
                        blk.classList.add("block-brand")
                        const description = doc.querySelector("meta[name=description]").getAttribute("content")
                        const a = document.createElement("a")
                        a.href = coupon.url
                        a.target = "_blank"
                        a.innerText = description
                        blk.appendChild(a)
                        const brand_info = doc.querySelector(".brand-info")
                        blk.appendChild(brand_info)
                        const det_screen = doc.querySelector(".det-screen-wrapper")
                        try {
                            let i = response.responseText.indexOf("window.filterData = ")
                            let j = response.responseText.indexOf("};", i)
                            const text = response.responseText.slice(i + 19, j + 1)
                            let data = eval("(" + text + ")")
                            let cateList = det_screen.querySelector("#CategoryList")
                            cateList.parentElement.classList.add("det-screen-height")
                            cateList.style.height = 'auto'
                            cateList.innerHTML = ""
                            for (const cate of data.category_list) {
                                let elem = document.createElement("div")
                                elem.style.height = '18px';
                                let span = document.createElement("span")
                                span.innerText = cate.label
                                elem.appendChild(span)
                                cateList.appendChild(elem)
                            }

                            let standardList = det_screen.querySelector("#standardList")
                            standardList.parentElement.classList.add("det-screen-height")
                            standardList.style.height = 'auto'
                            standardList.innerHTML = ""
                            for (const cate of data.standard_list) {
                                let elem = document.createElement("div")
                                elem.style.height = '18px';
                                let span = document.createElement("span")
                                span.innerText = cate.label
                                elem.appendChild(span)
                                standardList.appendChild(elem)
                            }
                        } catch (e) {
                            console.error(e)
                        }
                        blk.appendChild(det_screen)
                        newWindow.appendChild(blk)
                        r()
                    }
                });
            }
                             );
        }
    }
    rootElem.appendChild(button)
    document.body.appendChild(rootElem)
})();
