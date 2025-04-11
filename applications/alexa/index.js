const Alexa = require("ask-sdk-core");
const axios = require("axios");

// スキル起動時
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest"
    );
  },
  handle(handlerInput) {
    const speakOutput =
      "ホニャララについて教えて、またはホニャララを翻訳して と言ってください。";

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

// 質問処理（一般的な質問）
const GetApiDataIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "GetApiDataIntent"
    );
  },
  async handle(handlerInput) {
    // スロットから質問を取得
    const query = Alexa.getSlotValue(handlerInput.requestEnvelope, "query");

    if (!query) {
      return handlerInput.responseBuilder
        .speak("質問を聞き取れませんでした。もう一度お願いします。")
        .reprompt("何について知りたいですか？")
        .getResponse();
    }
    try {
      // APIを呼び出し（type: "question"を指定）
      const result = await callExternalApi(query, "question");
      return handlerInput.responseBuilder
        .speak(`結果は次の通りです: ${result}`)
        .reprompt("他に質問はありますか？")
        .getResponse();
    } catch (error) {
      console.error("API呼び出しエラー:", error);
      return handlerInput.responseBuilder
        .speak(
          "すみません、情報の取得に失敗しました。後でもう一度お試しください。"
        )
        .reprompt("他の質問はありますか？")
        .getResponse();
    }
  },
};

// 翻訳処理
const TranslationIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "TranslationIntent"
    );
  },
  async handle(handlerInput) {
    // スロットから翻訳対象テキストを取得
    const query = Alexa.getSlotValue(handlerInput.requestEnvelope, "query");
    if (!query) {
      return handlerInput.responseBuilder
        .speak("翻訳したい文章を聞き取れませんでした。もう一度お願いします。")
        .reprompt("翻訳したい文章を教えてください。")
        .getResponse();
    }
    try {
      // APIを呼び出し（type: "translation"を指定）
      const result = await callExternalApi(query, "translation");
      return handlerInput.responseBuilder
        .speak(`翻訳結果は次の通りです: ${result}`)
        .reprompt("他に翻訳したい文章はありますか？")
        .getResponse();
    } catch (error) {
      return handlerInput.responseBuilder
        .speak("すみません、翻訳に失敗しました。後でもう一度お試しください。")
        .reprompt("他に翻訳したい文章はありますか？")
        .getResponse();
    }
  },
};

// 外部APIを呼び出す関数 - typeパラメータを追加
async function callExternalApi(query, type) {
  try {
    const apiUrl = "https://api.example.com/endpoint"; // 実際のAPIエンドポイントに置き換えてください
    const postData = {
      userQuery: query,
      type: type,
      token: "dummy_token", // 実際のトークンに置き換えてください
    };

    const response = await axios.post(apiUrl, postData, {
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    });

    // レスポンスの構造を確認して必要なデータを抽出
    let extractedText = "データを取得できませんでした";
    try {
      if (response.data && response.data.data) {
        if (response.data.data.moderationResult !== undefined) {
          extractedText =
            response.data.data.prompt || "結果を取得できませんでした。";
          return extractedText;
        }
      }
    } catch (parseError) {
      console.error("データ解析エラー:", parseError);
      extractedText = "データ構造の解析に失敗しました";
    }

    return extractedText;
  } catch (error) {
    console.error("API呼び出しエラー:", error);
    return "API呼び出し中にエラーが発生しました";
  }
}

// ヘルプインテント
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const speakOutput =
      "このスキルではAIに質問したり、文章を翻訳したりできます。質問するときは「ホニャララについて教えて」と言ってください。翻訳したいときは「ホニャララを翻訳して」と言ってください。";

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

// キャンセル・終了インテント
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.CancelIntent" ||
        Alexa.getIntentName(handlerInput.requestEnvelope) ===
          "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    const speakOutput =
      "ご利用ありがとうございました。また何か知りたいことがあればお気軽に聞いてください。";

    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  },
};

// フォールバックインテント
const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.FallbackIntent"
    );
  },
  handle(handlerInput) {
    const speakOutput =
      "すみません、理解できませんでした。質問や「ホニャララを翻訳して」と言ってみてください。";

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

// セッション終了
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) ===
      "SessionEndedRequest"
    );
  },
  handle(handlerInput) {
    console.log(
      `セッション終了: ${JSON.stringify(handlerInput.requestEnvelope)}`
    );
    return handlerInput.responseBuilder.getResponse();
  },
};

// インテントリフレクタ - デバッグ用
const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
    );
  },
  handle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    const speakOutput = `${intentName}を実行しました。`;
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt("他に何かお手伝いできることはありますか？")
      .getResponse();
  },
};

// エラーハンドラー
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`エラー発生: ${JSON.stringify(error)}`);
    const speakOutput =
      "すみません、処理中に問題が発生しました。もう一度お試しください。";

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

// スキルのエクスポート
exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    GetApiDataIntentHandler, // 一般的な質問
    TranslationIntentHandler, // 翻訳処理
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler,
    IntentReflectorHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .withCustomUserAgent("ai-skill/v1.0")
  .lambda();
