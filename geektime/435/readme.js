// index.html是通用的，数据在info.js里

// 课程id -> 章节列表
POST https://time.geekbang.org/serv/v1/chapters
{"cid":435}

// 课程信息
POST https://time.geekbang.org/serv/v3/column/info
{"product_id":435,"with_recommend_article":true}

// 章节列表 -> 文章列表
POST https://time.geekbang.org/serv/v1/column/articles
{"cid":435,"size":100,"prev":0,"order":"earliest","sample":false,"chapter_ids":["2231","2232","2234","2249","2250","2251","2252","2253"]}

// 文章id -> 文章
POST https://time.geekbang.org/serv/v1/article
{"id":408400,"include_neighbors":true,"is_freelyread":true}

// 每次等10s的fetch包装，好像写错了(

    async function fetchClass(cid) {

    function fetchUrl(url, body) {
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }).then(r => r.json());
    }
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    let data = {}
    data.chapters = (await fetchUrl("https://time.geekbang.org/serv/v1/chapters", {cid: cid})).data;
    let chapter_ids = data.chapters.map(c => c.id);
    data.articles = (await fetchUrl("https://time.geekbang.org/serv/v1/column/articles", {
        "cid": cid,
        "size": 500,
        "prev": 0,
        "order": "earliest",
        "sample": false,
        "chapter_ids": chapter_ids
    })).data.list;
    while (true) {
        try {
            for (const i in data.articles) {
                if (data.articles[i].data)
                    continue;
                data.articles[i] = await fetchUrl("https://time.geekbang.org/serv/v1/article", {
                    "id": data.articles[i].id,
                    "include_neighbors": true,
                    "is_freelyread": true
                });
                await sleep(15*1000)
            }
            let d = {}
            data.articles.forEach(a => {
                if (a.data) {
                    d[a.data.id] = a.data;
                }
            });
            console.log(JSON.stringify(d))
            break
        } catch (e) {
            // console.log(e)
            await sleep(60*1000)
        }
    }
}

