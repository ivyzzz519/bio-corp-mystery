// Centralized game content database (data-driven)
const gameData = {
  meta: {
    gameId: "immersive-deduction-web",
    initialPageId: "000"
  },
  pages: {
    "000": {
      id: "000",
      title: "序章",
      subtitle: "开场页",
      nextPageId: "001"
    },
    "001": {
      id: "001",
      title: "OA 办公系统",
      subtitle: "初识测试关卡"
    },
    "002": {
      id: "002",
      title: "公司要闻详情",
      subtitle: "新闻详情页"
    },
    "003": {
      id: "003",
      title: "员工活动公告详情",
      subtitle: "通知详情页"
    },
    "004": {
      id: "004",
      title: "技术专报",
      subtitle: "骨粉提取技术档案"
    },
    "005": {
      id: "005",
      title: "区域调查档案",
      subtitle: "湖山县关联资料"
    },
    "006": {
      id: "006",
      title: "人物专访",
      subtitle: "陈文人物报道"
    },
    "007": {
      id: "007",
      title: "账号恢复结果页",
      subtitle: "密码找回"
    },
    "008": {
      id: "008",
      title: "文件销毁异议申请",
      subtitle: "驳回详情页"
    },
    "009": {
      id: "009",
      title: "无忧云笔记登录",
      subtitle: "无忧云笔记登录"
    },
    "010": {
      id: "010",
      title: "广告邮件详情",
      subtitle: "广告邮件详情"
    },
    "012": {
      id: "012",
      title: "工作台（张弛）",
      subtitle: "受限权限账号"
    },
    "018": {
      id: "018",
      title: "常高市长调研要闻",
      subtitle: "A城日报 · OA 检索"
    }
  },
  newsArticles: {
    "002": {
      title: "《无限生物科技有限公司高层调研湖山县工业园，深耕生物新材料产业》",
      source: "【来源：A城日报】",
      blocks: [
        {
          type: "paragraph",
          text: "本报讯（记者 孙建平） 昨日上午，无限生物科技有限公司首席CEO<strong>陈文</strong>一行，深入我市湖山县高新工业园进行实地调研。"
        },
        {
          type: "image",
          imageSrc: "./images/news1.png",
          alt: "无限生物科技有限公司调研组在湖山县高新工业园参观",
          caption: "调研组在<strong>湖山县</strong>高新工业园实地调研"
        },
        {
          type: "paragraph",
          text: "调研组一行先后参观了工业园内的生物材料研发中心与无菌加工车间。在座谈会上，总裁陈文详细汇报了无限生物科技有限公司在第一季度的产能突破。他指出，无限生物科技有限公司将继续依托湖山县优越的地理区位与产业集群优势，全面扩大“高纯度牙科种植体”及相关生物质原料的生产规模。"
        },
        {
          type: "paragraph",
          text: "陈文对湖山县营商环境给予了高度评价。他强调，无限生物科技有限公司始终秉持“科技敬畏生命”的理念，未来将进一步加大在湖山县的投资力度，推动上下游产业链的深度融合，助力地方经济高质量发展。"
        },
        {
          type: "paragraph",
          text: "据悉，无限生物科技有限公司作为深耕辅助生殖和种植牙的技术多年的业内小巨人，已奔赴C国，谋求IPO上市。"
        }
      ]
    },
    "003": {
      title: "《关于开展第一届员工水上救生知识培训的通知》",
      source: "",
      blocks: [
        {
          type: "paragraph",
          text: "致全体员工："
        },
        {
          type: "paragraph",
          text: "近日，我司辅助生殖中心员工林岚（工号：160423）在休假期间，于湖山县不幸发生意外溺水事件，经抢救无效离世。公司对此表示沉痛哀悼，并已第一时间向其家属提供了人道主义慰问。"
        },
        {
          type: "paragraph",
          text: "生命无价，安全警钟长鸣。为进一步提升全体员工在工作及业余生活中的安全防范意识与自救能力，经总经办紧急决议，行政部于昨日圆满完成了“无限生物科技有限公司第一届水上救生与突发急救知识培训”。"
        },
        {
          type: "paragraph",
          text: "望全体同仁以此次痛心的意外为鉴，切实注意个人八小时之外的人身安全。逝者已矣，生者如斯，请各部门主管做好员工的情绪安抚工作，保障业务系统的平稳运行。"
        },
        {
          type: "signature",
          text: "无限生物科技有限公司行政人事部"
        }
      ]
    },
    "016": {
      title: "关于规范使用辅助生殖中心HIS系统账号权限的通知",
      source: "【行政人事部】",
      blocks: [
        {
          type: "paragraph",
          text: "各部门、各外包支撑同事："
        },
        {
          type: "paragraph",
          text: "为保障患者隐私与医疗数据安全，辅助生殖中心HIS系统实行分级授权与最小权限原则。即日起，请全体有权限账号的使用者遵守下列要求（草案）：① 禁止共用账号、代他人登录或向无关人员泄露口令；② 调岗、离职或外包项目结束时，须由部门负责人在三个工作日内发起权限回收或变更流程；③ 仅可在院内指定终端与受控网络环境下访问HIS，禁止在私人设备或未备案存储介质中留存患者可识别信息；④ 发现异常登录、越权访问或系统提示时，请立即联系信息中心值班并保留操作日志。"
        },
        {
          type: "paragraph",
          text: "信息中心将联合辅助生殖中心开展抽查与权限审计，违规情形将按《员工信息安全守则》与外包合同相关条款处理。正式修订版另行发布。"
        },
        {
          type: "signature",
          text: "无限生物科技有限公司行政人事部（代拟）"
        }
      ]
    },
    "017": {
      title: "巨象科技来访调研及汇报材料征集通知",
      source: "【总经办】",
      blocks: [
        {
          type: "paragraph",
          text: "全体员工："
        },
        {
          type: "paragraph",
          text: "我司重要战略合作伙伴、核心股东——巨象科技（创始人兼 CEO <strong>李宏辉</strong>先生及其随行专家团）将于下月（2025年5月）莅临我司湖山县研发中心及生产基地进行实地调研。"
        },
        {
          type: "paragraph",
          text: "巨象科技作为我司数字化底层架构的唯一供应商，此次调研旨在评估\"生命数据安全堡垒\"二期工程的进展，请各部门拟定汇报材料，于本周三（2026年4月15日）汇总至总经办。"
        }
      ]
    },
    "018": {
      title: "《常高市长调研无限生物科技有限公司，强调打造生命科学产业高地》",
      source: "【来源：A城日报】",
      blocks: [
        {
          type: "paragraph",
          text: "本报讯（记者 综合稿）昨日，O市市长<strong>常高</strong>一行深入高新区，对省级重点项目——无限生物科技有限公司进行实地调研。西川电子总经理<strong>周照</strong>作为战略合作伙伴代表全程陪同。"
        },
        {
          type: "image",
          imageSrc: "./images/news_changgao_visit.png",
          alt: "常高市长一行在无限生物科技有限公司调研合影",
          caption: "陈文（最左）、常高（中间）、周照（最右）"
        },
        {
          type: "paragraph",
          text: "在无限生物科技有限公司<strong>陈文</strong>引导下，常高市长一行参观了位于呈豫科技园的「生物质纳米材料提取中心」。常高市长详细询问了「永恒之基」系列产品的技术突破及市场应用情况，并对无限生物在辅助生殖与仿生材料领域取得的成就给予了高度评价。"
        }
      ]
    }
  },
  deniedKeywords: {
    "同种骨": "404 NOT FOUND",
    "B-09": "404 NOT FOUND"
  },
  // 用户输入别名 → searchIndex 中的正式键（去重与解锁按正式键计）
  searchKeywordAliases: {
    湖山: "湖山县",
    周照: "常高",
    "常高 周照": "常高"
  },
  searchIndex: {
    常高: {
      resultCount: 1,
      results: [
        {
          id: "p018-changgao",
          title: "《常高市长调研无限生物科技有限公司，强调打造生命科学产业高地》",
          summary: "A城日报 · 外联与合作要闻",
          targetPage: "./018-news-mayor-inspection.html",
          unlockNewPage: false,
          unlockedPageId: null
        }
      ]
    },
    "林岚": {
      resultCount: 1,
      results: [
        {
          id: "p003",
          title: "《关于开展第一届员工水上救生知识培训的通知》",
          summary: "员工活动公告详情页",
          targetPage: "./003-notice-lifeguard-training.html",
          unlockNewPage: false,
          unlockedPageId: null
        }
      ]
    },
    "王安": {
      resultCount: 1,
      results: [
        {
          id: "p004",
          title: "《陈文技术专报：新一代骨粉提取工艺》",
          summary: "技术专报页",
          targetPage: "./004-report-bone-extraction.html",
          unlockNewPage: false,
          unlockedPageId: null
        }
      ]
    },
    "陈文": {
      resultCount: 2,
      results: [
        {
          id: "p002-chen",
          title: "《无限生物科技有限公司高层调研湖山县工业园，深耕生物新材料产业》",
          summary: "公司要闻详情页",
          targetPage: "./002-news-industrial-visit.html",
          unlockNewPage: false,
          unlockedPageId: null
        },
        {
          id: "p006",
          title:
            "《心匠手，重塑生命之基——<strong class=\"font-bold text-slate-900\">陈文</strong>人物专访》",
          summary: "人物专访页",
          targetPage: "./006-news-doctor-profile.html",
          unlockNewPage: false,
          unlockedPageId: null
        }
      ]
    },
    "张弛": {
      resultCount: 1,
      results: [
        {
          id: "p005-zhangchi",
          title: "《锦旗传谢意：无限生物科技有限公司助力中年夫妇圆「父母梦」》",
          summary: "",
          targetPage: "./005-news-couple-story.html",
          unlockNewPage: false,
          unlockedPageId: null
        }
      ]
    },
    "湖山县": {
      resultCount: 2,
      results: [
        {
          id: "p004-hushan",
          title: "《湖山县区情概览：依山傍水的产业新城》",
          summary: "湖山县区情介绍",
          targetPage: "./004-report-bone-extraction.html",
          unlockNewPage: false,
          unlockedPageId: null
        },
        {
          id: "p002-c",
          title: "《无限生物科技有限公司高层调研湖山县工业园，深耕生物新材料产业》",
          summary: "公司要闻详情页",
          targetPage: "./002-news-industrial-visit.html",
          unlockNewPage: false,
          unlockedPageId: null
        }
      ]
    }
  }
};

